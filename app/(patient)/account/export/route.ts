import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Privacy-notice data export (Phase 5 §5.10): everything held about the
 * signed-in patient, as JSON. Uses the ANON client with the patient's own
 * session — RLS limits every query to their own rows, so this route can never
 * leak another person's data even if the code changes.
 * Clinical notes are intentionally absent: patients never receive them.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to export your data." }, { status: 401 });
  }

  const [profile, patient, appointments, consents, events] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("patients").select("*").eq("profile_id", user.id).maybeSingle(),
    supabase
      .from("appointments")
      .select("id, reference_code, status, source, reason_category, patient_note, scheduled_for, cancelled_reason, created_at, updated_at")
      .eq("patient_id", user.id)
      .order("created_at"),
    supabase
      .from("consents")
      .select("purpose, notice_version, granted_at, withdrawn_at, method")
      .eq("subject_type", "profile")
      .eq("subject_id", user.id)
      .order("granted_at"),
    supabase
      .from("appointment_events")
      .select("appointment_id, from_status, to_status, actor_role, reason, created_at")
      .order("created_at"),
  ]);

  const exportedAt = new Date().toISOString();
  const payload = {
    exported_at: exportedAt,
    notice_message:
      "This is the personal data Smile Please holds about you. Clinical notes are never included.",
    profile: profile.data,
    patient: patient.data,
    appointments: appointments.data,
    consents: consents.data,
    events: events.data,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="smile-please-my-data-${exportedAt.slice(0, 10)}.json"`,
    },
  });
}
