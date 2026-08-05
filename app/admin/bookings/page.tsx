import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/booking";
import { BookingsBoard } from "@/components/admin/BookingsBoard";
import type { Database } from "@/types/db";

export const metadata: Metadata = { title: "Bookings", robots: { index: false } };

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

const ALL_STATUSES: AppointmentStatus[] = [
  "requested",
  "assigned",
  "confirmed",
  "completed",
  "no_show",
  "cancelled_by_patient",
  "cancelled_by_dentist",
  "cancelled_by_admin",
];

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  await requireRole("admin");
  const sp = await searchParams;

  const rawStatus = one(sp.status);
  const statuses: AppointmentStatus[] = rawStatus ? rawStatus.split(",").filter((s): s is AppointmentStatus => (ALL_STATUSES as string[]).includes(s)) : [];
  const source = one(sp.source);
  const sourceFilter = (["self_booked", "patient_request", "admin_created"] as const).find((s) => s === source);
  const dentist = one(sp.dentist);
  const locality = one(sp.locality);
  const from = one(sp.from);
  const to = one(sp.to);

  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select("*")
    .order("created_at", { ascending: false });
  if (statuses.length) query = query.in("status", statuses);
  if (sourceFilter) query = query.eq("source", sourceFilter);
  if (dentist) query = query.eq("dentist_id", dentist);
  const fromDate = from && !Number.isNaN(new Date(from).getTime()) ? new Date(`${from}T00:00:00+05:30`) : null;
  const toDate = to && !Number.isNaN(new Date(to).getTime()) ? new Date(`${to}T00:00:00+05:30`) : null;
  if (fromDate) query = query.gte("scheduled_for", fromDate.toISOString());
  if (toDate) query = query.lt("scheduled_for", toDate.toISOString());

  const { data: appointments } = await query;
  const list = appointments ?? [];

  // Bundle supporting data for the board.
  const ids = list.map((a) => a.id);
  const patientIds = Array.from(new Set(list.map((a) => a.patient_id)));
  const dentistIds = Array.from(new Set(list.map((a) => a.dentist_id).filter((d): d is string => !!d)));

  const patientsP = supabase.from("profiles").select("id, full_name, phone").in("id", patientIds.length ? patientIds : [""]);
  const dentistsP = supabase.from("dentists").select("profile_id, display_name, locality").in("profile_id", dentistIds.length ? dentistIds : [""]);
  const eventsP = ids.length ? supabase.from("appointment_events").select("appointment_id, from_status, to_status, actor_role, reason, created_at").in("appointment_id", ids).order("created_at") : Promise.resolve({ data: [] });
  const notesP = ids.length ? supabase.from("clinical_notes").select("appointment_id, note, created_at").in("appointment_id", ids) : Promise.resolve({ data: [] });
  const allDentistsP = supabase.from("dentists").select("profile_id, display_name, locality, status").eq("status", "active");
  const slotsP = supabase.from("availability_slots").select("id, dentist_id, starts_at, ends_at, location_type, camp_name").eq("status", "open").gt("starts_at", new Date().toISOString()).order("starts_at");

  const [patientsRes, dentistsRes, eventsRes, notesRes, allDentistsRes, slotsRes] = await Promise.all([patientsP, dentistsP, eventsP, notesP, allDentistsP, slotsP]);

  const patientById = new Map((patientsRes.data ?? []).map((p) => [p.id, p]));
  const dentistByProfile = new Map((dentistsRes.data ?? []).map((d) => [d.profile_id, d]));
  type EventRow = Database["public"]["Tables"]["appointment_events"]["Row"];
  type NoteRow = Database["public"]["Tables"]["clinical_notes"]["Row"];
  const eventsByAppt = new Map<string, EventRow[]>();
  for (const e of (eventsRes.data ?? []) as EventRow[]) {
    const arr = eventsByAppt.get(e.appointment_id) ?? [];
    arr.push(e as EventRow);
    eventsByAppt.set(e.appointment_id, arr);
  }
  const notesByAppt = new Map<string, NoteRow>();
  for (const n of (notesRes.data ?? []) as NoteRow[]) notesByAppt.set(n.appointment_id, n);

  return (
    <>
      <h1 className="text-display-l text-ink-950">Bookings</h1>

      <BookingsBoard
        rows={list}
        statusLabels={STATUS_LABELS}
        allStatuses={ALL_STATUSES}
        patientById={Object.fromEntries(patientById)}
        dentistByProfile={Object.fromEntries(dentistByProfile)}
        eventsByAppt={Object.fromEntries(eventsByAppt)}
        notesByAppt={Object.fromEntries(notesByAppt)}
        activeDentists={(allDentistsRes.data ?? []).map((d) => ({
          profile_id: d.profile_id,
          display_name: d.display_name,
          locality: d.locality,
        }))}
        openSlots={(slotsRes.data ?? []).map((s) => ({
          id: s.id,
          dentist_id: s.dentist_id,
          starts_at: s.starts_at,
        }))}
        filters={{
          status: statuses.join(","),
          source: sourceFilter ?? "",
          dentist: dentist ?? "",
          locality: locality ?? "",
          from: from ?? "",
          to: to ?? "",
        }}
      />
    </>
  );
}
