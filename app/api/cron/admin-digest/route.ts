import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase/admin";
import { sendTemplate } from "@/lib/email";
import { formatDate } from "@/lib/format";

/**
 * Phase 6 §6.4 — one digest per day instead of one email per submission.
 * Lists anything still `new` (contact) or `requested` (care) and older than
 * 24 hours. Immediate notification is reserved for dentist enquiries, which
 * are sent inline by the contact action. Guarded by CRON_SECRET; wired to an
 * external scheduler in Phase 8. Uses the service-role client because this
 * runs without a user session and must read across both queues.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [enquiriesRes, careRes] = await Promise.all([
    admin
      .from("contact_submissions")
      .select("reference_code, type, name, created_at")
      .in("type", ["patient", "organization"])
      .eq("status", "new")
      .lt("created_at", cutoff)
      .order("created_at"),
    admin
      .from("appointments")
      .select("reference_code, created_at, patient_id")
      .eq("status", "requested")
      .lt("created_at", cutoff)
      .order("created_at"),
  ]);

  const enquiries = enquiriesRes.data ?? [];
  const care = careRes.data ?? [];

  const lines: string[] = [];
  for (const a of care) {
    lines.push(`- Care request ${a.reference_code}, from ${formatDate(a.created_at)}`);
  }
  for (const s of enquiries) {
    lines.push(`- ${s.type === "organization" ? "Organisation" : "Patient"} enquiry ${s.reference_code} (${s.name}), from ${formatDate(s.created_at)}`);
  }

  let sendResult: Awaited<ReturnType<typeof sendTemplate>> | null = null;
  if (care.length + enquiries.length > 0) {
    sendResult = await sendTemplate("unassigned_digest", process.env.ADMIN_NOTIFY_EMAIL ?? "", {
      careCount: care.length,
      enquiryCount: enquiries.length,
      date: formatDate(new Date().toISOString()),
      lines,
    });
  }

  return NextResponse.json({
    ok: true,
    careCount: care.length,
    enquiryCount: enquiries.length,
    notified: sendResult?.ok ?? false,
  });
}
