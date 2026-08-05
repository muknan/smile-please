import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import { notify, type EmailKind } from "@/lib/email";
import { formatDate, formatTime } from "@/lib/format";

/**
 * Maps a completed status transition to the transactional emails the master
 * template table requires. Every call is fire-and-forget (notify -> void):
 * a failed or unconfigured mailer never affects the DB write that already
 * happened. Emails carry only ref, date, time, dentist display name and
 * locality — never clinical notes, patient notes, or addresses.
 */

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Status = Appointment["status"];

const PATIENT_MAIL: Partial<Record<Status, EmailKind>> = {
  confirmed: "appointment_confirmed",
  cancelled_by_patient: "appointment_cancelled",
  cancelled_by_dentist: "appointment_cancelled",
  cancelled_by_admin: "appointment_cancelled",
};

function isCancelled(status: Status): boolean {
  return status.startsWith("cancelled_by_");
}

export async function notifyAppointmentTransition(
  supabase: SupabaseClient<Database>,
  appointment: Appointment,
  fromStatus: Status,
  toStatus: Status,
): Promise<void> {
  if (!appointment.scheduled_for && !isCancelled(toStatus)) return;

  const patientEmail = await patientEmailFor(supabase, appointment.patient_id);
  const dentist = await dentistFor(supabase, appointment.dentist_id);

  const when = appointment.scheduled_for
    ? { date: formatDate(appointment.scheduled_for), time: formatTime(appointment.scheduled_for) }
    : null;

  const common = {
    ref: appointment.reference_code,
    dentist: dentist?.name ?? "a Smile Please dentist",
    locality: dentist?.locality ?? null,
    ...(when ?? {}),
  };

  if (toStatus === "confirmed" && fromStatus !== toStatus) {
    // Path-B self-book or dentist/admin confirm of an assigned appointment.
    if (patientEmail) await notify("appointment_confirmed", patientEmail, common);
    return;
  }

  if (fromStatus === "confirmed" && toStatus === "confirmed") {
    // Reschedule keeps status confirmed; date/time moved.
    if (patientEmail) await notify("appointment_rescheduled", patientEmail, common);
    return;
  }

  if (toStatus === "assigned") {
    if (patientEmail) await notify("appointment_assigned", patientEmail, common);
    if (dentist && appointment.scheduled_for) {
      const patientName = await nameFor(supabase, appointment.patient_id);
      const dentistEmail = await dentistProfileEmail(supabase, dentist.profileId);
      if (dentistEmail) {
        await notify("new_assignment_dentist", dentistEmail, {
          patientName,
          date: when?.date ?? "",
          time: when?.time ?? "",
          locality: dentist.locality ?? null,
        });
      }
    }
    return;
  }

  const mail = PATIENT_MAIL[toStatus];
  if (mail && patientEmail && appointment.scheduled_for) {
    await notify(mail, patientEmail, common);
  }
}

async function patientEmailFor(supabase: SupabaseClient<Database>, profileId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .maybeSingle();
  return data?.email ?? null;
}

async function nameFor(supabase: SupabaseClient<Database>, profileId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", profileId)
    .maybeSingle();
  return data?.full_name ?? "A patient";
}

async function dentistFor(
  supabase: SupabaseClient<Database>,
  dentistId: string | null,
): Promise<{ name: string; locality: string | null; profileId: string } | null> {
  if (!dentistId) return null;
  const { data } = await supabase
    .from("dentists")
    .select("profile_id, display_name, locality")
    .eq("profile_id", dentistId)
    .maybeSingle();
  if (!data) return null;
  return { name: data.display_name, locality: data.locality, profileId: data.profile_id };
}

async function dentistProfileEmail(
  supabase: SupabaseClient<Database>,
  profileId: string,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .maybeSingle();
  return data?.email ?? "";
}
