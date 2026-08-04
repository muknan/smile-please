"use server";

import { createClient } from "@/lib/supabase/server";
import { requestBookingSchema } from "@/lib/schemas";
import { checkHuman, withinRateLimit, clientIp } from "@/lib/antispam";

export type RequestState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "success"; ref: string }
  | { status: "guardian" };

const RATE_LIMIT_MSG =
  "You've sent several messages recently. Please wait an hour, or call us on the number at the bottom of this page.";

/**
 * Path A booking request (Phase 5 §5.4). Runs the three anti-spam layers
 * (honeypot, 3s minimum fill, 5/hour/IP), then saves through the
 * create_booking_request RPC — the booking is never conditional on email: no
 * magic link or confirmation email blocks it.
 */
export async function submitCareRequest(
  _prev: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const human = checkHuman(formData);
  if (!human.ok) {
    // Honeypot-filled or faster than a human: drop the data with a
    // normal-looking success — never tell a bot it failed. Real people cannot
    // trip either layer (the honeypot is hidden and a 9-field form takes
    // longer than three seconds to fill).
    return { status: "success", ref: `SP-${Math.floor(Math.random() * 9000 + 1000)}` };
  }

  const ip = await clientIp();
  if (!(await withinRateLimit("care-request", ip))) {
    return { status: "error", error: RATE_LIMIT_MSG };
  }

  const raw: Record<string, unknown> = {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    ageBand: String(formData.get("ageBand") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    note: String(formData.get("note") ?? ""),
    locality: String(formData.get("locality") ?? ""),
    pincode: String(formData.get("pincode") ?? ""),
    preferredDays: formData.getAll("preferredDays"),
    preferredTimes: formData.getAll("preferredTimes"),
    consentBooking: formData.get("consentBooking") === "on",
    consentUpdates: formData.get("consentUpdates") === "on",
    forMinor: formData.get("forMinor") === "on",
  };

  const parsed = requestBookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const data = parsed.data;

  if (data.forMinor) {
    return {
      status: "guardian",
    };
  }

  const supabase = await createClient();
  const { data: booking, error } = await supabase.rpc("create_booking_request", {
    p_email: data.email,
    p_full_name: data.fullName,
    p_phone: data.phone,
    p_age_band: data.ageBand,
    p_reason_category: data.reason,
    p_patient_note: data.note || null,
    p_preferred_locality: data.locality,
    p_preferred_window: {
      days: data.preferredDays,
      times: data.preferredTimes,
    },
    p_consent_updates: data.consentUpdates,
  });

  if (error || !booking) {
    return {
      status: "error",
      error: "We couldn't save your request just now. Please try again in a moment.",
    };
  }

  // Best effort only: if a magic link can be sent, send it; if the mailer is
  // down the request is already saved and the patient tracks via ref + phone.
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

  return { status: "success", ref: booking.reference_code };
}
