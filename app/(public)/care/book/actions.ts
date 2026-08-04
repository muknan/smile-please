"use server";

import { createClient } from "@/lib/supabase/server";
import { bookSlotSchema } from "@/lib/schemas";
import { checkHuman, withinRateLimit, clientIp } from "@/lib/antispam";

export type BookState =
  | { status: "idle" }
  | { status: "error"; error: string }
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
  if (!human.ok) {
    return { status: "success", ref: `SP-${Math.floor(Math.random() * 9000 + 1000)}`, isReschedule: false };
  }

  const ip = await clientIp();
  if (!(await withinRateLimit("care-book", ip))) {
    return {
      status: "error",
      error: "You've sent several messages recently. Please wait an hour, or call us on the number at the bottom of this page.",
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
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const { data: booking, error } = await supabase.rpc("confirm_booking", {
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
    return {
      status: "error",
      error: "We couldn't save the booking just now. Please try again in a moment.",
    };
  }

  if (data.email) {
    try {
      await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/account`,
        },
      });
    } catch {
      // non-blocking by design
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
