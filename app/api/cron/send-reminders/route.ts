import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase/admin";
import { sendTemplate } from "@/lib/email";
import { formatDate, formatTime } from "@/lib/format";

/**
 * Phase 8 §8.5 — emails patients whose confirmed appointment is tomorrow.
 * Runs daily at 08:30 IST. Uses the service-role client (no user session in a
 * cron); builds each email from ref/date/time/dentist/locality only — never a
 * clinical or patient note. Failures are absorbed by the mailer and never
 * affect the DB read.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  // Calendar day after today (UTC) — the job runs at 03:00 UTC, so "tomorrow"
  // in IST is one UTC day ahead.
  const tomorrowUtc = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const tomorrowStart = new Date(`${tomorrowUtc}T00:00:00Z`);
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000);

  const { data: appts, error } = await admin
    .from("appointments")
    .select("id, reference_code, patient_id, dentist_id, scheduled_for")
    .eq("status", "confirmed")
    .gte("scheduled_for", tomorrowStart.toISOString())
    .lt("scheduled_for", tomorrowEnd.toISOString());

  if (error) return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });

  const apptList = appts ?? [];
  const patientIds = Array.from(new Set(apptList.map((a) => a.patient_id)));
  const dentistIds = Array.from(new Set(apptList.map((a) => a.dentist_id).filter((d): d is string => !!d)));

  const [patientsRes, dentistsRes] = await Promise.all([
    admin.from("profiles").select("id, email, full_name").in("id", patientIds.length ? patientIds : [""]),
    admin.from("dentists").select("profile_id, display_name, locality").in("profile_id", dentistIds.length ? dentistIds : [""]),
  ]);
  const patientBy = new Map((patientsRes.data ?? []).map((p) => [p.id, p]));
  const dentistBy = new Map((dentistsRes.data ?? []).map((d) => [d.profile_id, d]));

  let attempted = 0;
  let delivered = 0;
  for (const a of apptList) {
    const email = patientBy.get(a.patient_id)?.email;
    if (!email || !a.scheduled_for) continue;
    const dentist = a.dentist_id ? dentistBy.get(a.dentist_id) : null;
    attempted++;
    const res = await sendTemplate("reminder_24h", email, {
      ref: a.reference_code,
      dentist: dentist?.display_name ?? "a Smile Please dentist",
      locality: dentist?.locality ?? null,
      date: formatDate(a.scheduled_for),
      time: formatTime(a.scheduled_for),
    });
    if (res.ok) delivered++;
  }

  return NextResponse.json({ ok: true, attempted, delivered });
}
