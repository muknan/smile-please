"use server";

import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { HOLD_COOKIE, verifyHoldCapability } from "@/lib/booking-server";
import { bookSlotSchema } from "@/lib/schemas";
import { checkHuman, withinRateLimit, clientIp } from "@/lib/antispam";
import { notify } from "@/lib/email";
import { formatDate, formatTime } from "@/lib/format";
import { CONTACT_PHONE_DISPLAY } from "@/lib/contact-info";

import { issuesFromZod, type FieldError } from "@/lib/form-errors";

export type BookState =
  | { status: "idle" }
  | { status: "error"; error: string; issues?: FieldError[] }
  | { status: "success"; ref: string; isReschedule: boolean };

export type BookDetails = {
  slotId: string;
  dentistName: string;
  dentistLocality: string;
  startsAt: string;
  locationType: string;
  campName: string | null;
  rescheduleAppointmentId?: string;
  /** Signed form-render timestamp for the 3-second minimum fill time. */
  renderedAt: string;
};

/**
 * Confirms a held slot (Phase 5 §5.8). Race safety lives in confirm_booking:
 * whoever commits first books the slot; the second confirm sees
 * booked_count >= capacity and gets SLOT_TAKEN.
 */
export async function confirmSlotBooking(
  details: BookDetails,
  _prev: BookState,
  formData: FormData,
): Promise<BookState> {
  const human = checkHuman(formData);
  if (!human.ok) return { status: "error", error: human.error };

  const ip = await clientIp();
  if (!(await withinRateLimit("care-book", ip))) {
    return {
      status: "error",
      error: `You've made a few requests recently. Please wait about an hour, or call ${CONTACT_PHONE_DISPLAY}.`,
    };
  }

  const raw: Record<string, unknown> = {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    ageBand: String(formData.get("ageBand") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    note: String(formData.get("note") ?? ""),
    pincode: String(formData.get("pincode") ?? ""),
    consentBooking: formData.get("consentBooking") === "on",
    consentUpdates: formData.get("consentUpdates") === "on",
  };
  const parsed = bookSlotSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = issuesFromZod(parsed.error);
    return { status: "error", error: issues[0]?.message ?? "Check the form.", issues };
  }
  const data = parsed.data;

  const cookieStore = await cookies();
  if (!verifyHoldCapability(cookieStore.get(HOLD_COOKIE)?.value, details.slotId)) {
    return { status: "error", error: "Your slot hold has expired. Go back and choose a time again." };
  }

  // Under-18s cannot self-book until a verifiable parental-consent flow exists
  // (D-11); this mirrors Path A and blocks the age band server-side.
  if (data.ageBand === "under_12" || data.ageBand === "12_17") {
    return {
      status: "error",
      error: `Someone under 18 needs a parent or guardian to arrange care. Please ask an adult to make this booking, or call ${CONTACT_PHONE_DISPLAY}.`,
    };
  }

  const sessionClient = await createClient();
  const { data: userData } = await sessionClient.auth.getUser();
  const actorId = userData.user?.id ?? null;
  if (details.rescheduleAppointmentId && !actorId) {
    return { status: "error", error: "Please sign in to change an existing appointment." };
  }
  const { data: priorAppointment } = details.rescheduleAppointmentId
    ? await sessionClient
        .from("appointments")
        .select("scheduled_for")
        .eq("id", details.rescheduleAppointmentId)
        .maybeSingle()
    : { data: null };
  const { data: booking, error } = await admin.rpc("confirm_booking", {
    p_slot_id: details.slotId,
    p_email: data.email,
    p_full_name: data.fullName,
    p_phone: data.phone,
    p_age_band: data.ageBand,
    p_locality: details.dentistLocality,
    p_pincode: data.pincode || null,
    p_reason_category: data.reason,
    p_patient_note: data.note || null,
    p_consent_updates: data.consentUpdates,
    p_reschedule_appointment_id: details.rescheduleAppointmentId ?? null,
    p_actor_id: actorId,
  });

  if (error || !booking) {
    const msg = error?.message ?? "";
    if (msg.includes("SLOT_TAKEN")) {
      return {
        status: "error",
        error: "Someone just booked this slot. Go back and pick another time.",
      };
    }
    if (msg.includes("RESCHEDULE_TOO_LATE")) {
      return {
        status: "error",
        error: "Appointments can only be changed up to 24 hours before. Call our team to reschedule.",
      };
    }
    if (msg.includes("EMAIL_IN_USE")) {
      return { status: "error", error: "That email already has an account. Sign in before booking with it." };
    }
    return {
      status: "error",
      error: "We couldn't save the booking just now. Please try again in a moment.",
    };
  }

  // The capability is single-use from the browser's perspective. Clearing it
  // after the transactional write prevents a successful hold from authorising
  // a stale replay attempt during the remainder of its ten-minute lifetime.
  cookieStore.delete(HOLD_COOKIE);

  if (data.email) {
    try {
      await sessionClient.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/account`,
        },
      });
    } catch {
      // non-blocking by design
    }
    // Best-effort confirmation email after the DB write (Phase 6 §6.3);
    // a failed mailer never affects the saved booking.
    if (typeof booking === "object" && booking && "scheduled_for" in booking && booking.scheduled_for) {
      const when = {
        date: formatDate(booking.scheduled_for as string),
        time: formatTime(booking.scheduled_for as string),
      };
      if (details.rescheduleAppointmentId) {
        if (priorAppointment?.scheduled_for) {
          await notify("appointment_rescheduled", data.email, {
            fromDate: formatDate(priorAppointment.scheduled_for),
            fromTime: formatTime(priorAppointment.scheduled_for),
            toDate: when.date,
            toTime: when.time,
            dentist: details.dentistName,
            locality: details.dentistLocality || null,
            ref: String(booking.reference_code ?? ""),
          });
        }
      } else {
        await notify("appointment_confirmed", data.email, {
          ...when,
          dentist: details.dentistName,
          locality: details.dentistLocality || null,
          ref: String(booking.reference_code ?? ""),
        });
      }
    }
  }

  if (booking && typeof booking === "object" && "reference_code" in booking) {
    return {
      status: "success",
      ref: String(booking.reference_code),
      isReschedule: Boolean(details.rescheduleAppointmentId),
    };
  }
  return {
    status: "error",
    error: "We couldn't save the booking just now. Please try again in a moment.",
  };
}
