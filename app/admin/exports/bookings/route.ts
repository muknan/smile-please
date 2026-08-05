import { createClient } from "@/lib/supabase/server";
import { requireAdminRoute } from "@/lib/route-auth";
import { logAudit } from "@/lib/audit";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  const guard = await requireAdminRoute();
  if (guard) return guard;

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  const clinical = url.searchParams.get("clinical") === "1";

  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select("id, reference_code, created_at, scheduled_for, status, source, dentist_id, patient_id")
    .order("created_at");
  if (from) query = query.gte("scheduled_for", new Date(from).toISOString());
  if (to) query = query.lt("scheduled_for", new Date(new Date(to).getTime() + 86_400_000).toISOString());
  const { data: appts } = await query;

  const patientIds = Array.from(new Set((appts ?? []).map((a) => a.patient_id)));
  const dentistIds = Array.from(new Set((appts ?? []).map((a) => a.dentist_id).filter((d): d is string => !!d)));
  const [patientsRes, dentistsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone").in("id", patientIds.length ? patientIds : [""]),
    supabase.from("dentists").select("profile_id, display_name").in("profile_id", dentistIds.length ? dentistIds : [""]),
  ]);
  const patient = new Map((patientsRes.data ?? []).map((p) => [p.id, p]));
  const dentist = new Map((dentistsRes.data ?? []).map((d) => [d.profile_id, d.display_name]));

  const headers = [
    "reference_code",
    "patient_name",
    "patient_phone",
    "dentist",
    "scheduled_for",
    "status",
    "source",
    "created_at",
  ];

  const rows: Record<string, unknown>[] = (appts ?? []).map((a) => ({
    reference_code: a.reference_code,
    patient_name: patient.get(a.patient_id)?.full_name ?? "",
    patient_phone: patient.get(a.patient_id)?.phone ?? "",
    dentist: a.dentist_id ? dentist.get(a.dentist_id) ?? "" : "",
    scheduled_for: a.scheduled_for ?? "",
    status: a.status,
    source: a.source,
    created_at: a.created_at,
  }));

  if (clinical) {
    const ids = (appts ?? []).map((a) => a.id);
    const { data: notes } = ids.length
      ? await supabase.from("clinical_notes").select("appointment_id, note").in("appointment_id", ids)
      : { data: [] };
    const refByAppt = new Map((appts ?? []).map((a) => [a.id, a.reference_code]));
    const noteByRef = new Map<string, string>();
    for (const n of notes ?? []) {
      const ref = refByAppt.get(n.appointment_id);
      if (ref) noteByRef.set(ref, n.note);
    }
    headers.push("clinical_note");
    rows.forEach((r) => (r.clinical_note = noteByRef.get(String(r.reference_code)) ?? ""));
  }

  await logAudit("export.bookings", "booking", undefined, { from, to, clinicalNotes: clinical });
  return csvResponse(toCsv(headers, rows), `smile-please-bookings-${new Date().toISOString().slice(0, 10)}.csv`);
}
