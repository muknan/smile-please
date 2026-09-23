import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase/admin";
import { sendTemplate } from "@/lib/email";
import { formatDate, formatTime } from "@/lib/format";
import { delhiDayBounds } from "@/lib/delhi-time";

// Vercel terminates this invocation before the five-minute database sending
// lease expires, even if an SMTP relay keeps the socket active indefinitely.
export const maxDuration = 240;

type ReminderClaim = {
  claim_token: string;
  scheduled_for: string;
};

type ReminderSend = {
  email: string;
  dentist: string;
  locality: string | null;
};

function isReminderClaim(value: unknown): value is ReminderClaim {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.claim_token === "string"
    && typeof candidate.scheduled_for === "string";
}

function isReminderSend(value: unknown): value is ReminderSend {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.email === "string"
    && typeof candidate.dentist === "string"
    && (typeof candidate.locality === "string" || candidate.locality === null);
}

/**
 * Phase 8 §8.5 — emails patients whose confirmed appointment is tomorrow.
 * Runs daily at 08:30 IST. Uses the service-role client (no user session in a
 * cron); builds each email from ref/date/time/dentist/locality only — never a
 * clinical or patient note. Each occurrence is claimed from its current,
 * locked appointment row before sending.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const tomorrow = delhiDayBounds(1);

  const { data: appts, error } = await admin
    .from("appointments")
    .select("id, reference_code, patient_id")
    .eq("status", "confirmed")
    .gte("scheduled_for", tomorrow.start)
    .lt("scheduled_for", tomorrow.end);

  if (error) return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });

  const apptList = appts ?? [];
  const patientIds = Array.from(new Set(apptList.map((a) => a.patient_id)));
  const patientsRes = patientIds.length > 0
    ? await admin.from("profiles").select("id, email").in("id", patientIds)
    : { data: [], error: null };
  if (patientsRes.error) return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  const patientBy = new Map((patientsRes.data ?? []).map((p) => [p.id, p]));

  let attempted = 0;
  let delivered = 0;
  let failed = 0;
  let skippedNoEmail = 0;
  let databaseFailures = 0;
  for (const a of apptList) {
    const email = patientBy.get(a.patient_id)?.email;
    // Phone-only appointments are valid. Do not create a retryable email
    // failure for a patient who did not supply an email address.
    if (!email) {
      skippedNoEmail++;
      continue;
    }

    const { data: claim, error: claimError } = await admin.rpc("claim_appointment_reminder", {
      p_appointment_id: a.id,
      p_kind: "reminder_24h",
      p_due_start: tomorrow.start,
      p_due_end: tomorrow.end,
    });
    if (claimError) {
      databaseFailures++;
      continue;
    }
    if (!isReminderClaim(claim)) {
      continue;
    }

    const { data: snapshot, error: beginError } = await admin.rpc("begin_appointment_reminder_send", {
      p_appointment_id: a.id,
      p_kind: "reminder_24h",
      p_scheduled_for: claim.scheduled_for,
      p_claim_token: claim.claim_token,
    });
    if (beginError) {
      databaseFailures++;
      continue;
    }
    // A cancellation, reschedule, or expired claim can invalidate the send.
    if (!isReminderSend(snapshot)) continue;

    attempted++;
    const res = await sendTemplate("reminder_24h", snapshot.email, {
      ref: a.reference_code,
      dentist: snapshot.dentist,
      locality: snapshot.locality,
      date: formatDate(claim.scheduled_for),
      time: formatTime(claim.scheduled_for),
    });
    const { error: completeError } = await admin.rpc("complete_appointment_reminder", {
      p_appointment_id: a.id,
      p_kind: "reminder_24h",
      p_scheduled_for: claim.scheduled_for,
      p_claim_token: claim.claim_token,
      p_sent: res.ok,
      p_error: res.ok ? null : res.reason,
      // SMTP transport failures may have been delivered; only a local
      // pre-transport configuration failure is safe to retry automatically.
      p_retryable: !res.ok && res.reason === "smtp-not-configured",
    });
    if (completeError) databaseFailures++;
    else if (res.ok) delivered++;
    else failed++;
  }

  const body = { attempted, delivered, failed, skipped_no_email: skippedNoEmail };
  if (databaseFailures > 0) {
    return NextResponse.json({ ok: false, error: "DB_ERROR", ...body }, { status: 500 });
  }
  if (failed > 0) {
    return NextResponse.json({ ok: false, error: "DELIVERY_INCOMPLETE", ...body }, { status: 503 });
  }
  return NextResponse.json({ ok: true, ...body });
}
