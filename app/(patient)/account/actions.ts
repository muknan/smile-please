"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileEditSchema } from "@/lib/schemas";
import { CHANGE_WINDOW_MSG } from "@/lib/booking";
import { notifyAppointmentTransition } from "@/lib/notifications";

export type AccountState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "ok"; message: string };

/**
 * Patient cancels an own appointment (Phase 5 §5.10). Legal transitions only
 * (cancelled_by_patient); the 24-hour window maps to the exact message.
 */
export async function cancelAppointment(
  appointmentId: string,
  reason: string,
): Promise<AccountState> {
  const supabase = await createClient();
  const { data: before } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .maybeSingle();
  const { data: updated, error } = await supabase.rpc("transition_appointment", {
    p_appointment_id: appointmentId,
    p_to: "cancelled_by_patient",
    p_reason: reason.trim() || "Cancelled by patient",
  });
  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("RESCHEDULE_TOO_LATE")) {
      return { status: "error", error: CHANGE_WINDOW_MSG };
    }
    if (msg.includes("ILLEGAL_TRANSITION")) {
      return { status: "error", error: "That appointment can't be cancelled from its current state." };
    }
    return { status: "error", error: "We couldn't cancel it just now. Try again in a moment." };
  }
  // Best-effort confirmation email; the cancel is already saved.
  if (updated && typeof updated === "object") {
    void notifyAppointmentTransition(supabase, updated, before?.status ?? "confirmed", "cancelled_by_patient");
  }
  revalidatePath("/account");
  return { status: "ok", message: "Appointment cancelled." };
}

/**
 * Withdraws one granted purpose. awareness_updates is immediate; booking
 * cancels pending appointments first (the privacy notice promises this).
 */
export async function withdrawConsent(
  purpose: "booking" | "awareness_updates",
): Promise<AccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Sign in again." };

  if (purpose === "booking") {
    const { data: pending } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("patient_id", user.id)
      .in("status", ["requested", "assigned", "confirmed"]);
    for (const appointment of pending ?? []) {
      await supabase.rpc("transition_appointment", {
        p_appointment_id: appointment.id,
        p_to: "cancelled_by_patient",
        p_reason: "Consent withdrawn",
      });
    }
  }

  const { error } = await supabase
    .from("consents")
    .update({ withdrawn_at: new Date().toISOString() })
    .eq("subject_type", "profile")
    .eq("subject_id", user.id)
    .eq("purpose", purpose)
    .is("withdrawn_at", null);

  if (error) {
    return { status: "error", error: "We couldn't record the withdrawal. Try again." };
  }
  revalidatePath("/account");
  return {
    status: "ok",
    message:
      purpose === "booking"
        ? "Booking consent withdrawn. Pending appointments were cancelled."
        : "Updates consent withdrawn — you won't hear from us about awareness posts.",
  };
}

/** Patient edits own name, phone, locality, age band. */
export async function updateProfile(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const parsed = profileEditSchema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    locality: String(formData.get("locality") ?? ""),
    ageBand: String(formData.get("ageBand") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Sign in again." };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone })
    .eq("id", user.id);
  if (profileError) {
    return { status: "error", error: "We couldn't save your details. Try again." };
  }

  const { error: patientError } = await supabase
    .from("patients")
    .upsert(
      {
        profile_id: user.id,
        age_band: parsed.data.ageBand,
        locality: parsed.data.locality,
      },
      { onConflict: "profile_id" },
    );
  if (patientError) {
    return { status: "error", error: "We couldn't save your details. Try again." };
  }

  revalidatePath("/account");
  return { status: "ok", message: "Details saved." };
}
