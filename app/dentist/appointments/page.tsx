import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { dayKey, formatDayShortLabel, fullDayLabel, formatTime } from "@/lib/format";
import { AGE_BAND_LABELS, REASON_CATEGORY_LABELS } from "@/lib/booking";
import { AppointmentActions } from "@/components/dentist/AppointmentActions";
import type { Database } from "@/types/db";

export const metadata: Metadata = {
  title: "Appointments",
  robots: { index: false },
};

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

export default async function DentistAppointmentsPage() {
  const profile = await requireRole("dentist");
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("dentist_id", profile.id)
    .gte("scheduled_for", new Date(Date.now() - 30 * 86_400_000).toISOString())
    .order("scheduled_for");

  const list = (appointments ?? []) as Appointment[];
  const patientIds = Array.from(new Set(list.map((a) => a.patient_id)));
  const { data: profiles } = patientIds.length
    ? await supabase.from("profiles").select("id, full_name, phone").in("id", patientIds)
    : { data: null };
  const { data: patientRows } = patientIds.length
    ? await supabase.from("patients").select("profile_id, locality, age_band").in("profile_id", patientIds)
    : { data: null };

  const patientById = new Map(
    (profiles ?? []).map((p) => [p.id, p]),
  );
  const patientRowById = new Map(
    (patientRows ?? []).map((p) => [p.profile_id, p]),
  );

  const grouped = new Map<string, Appointment[]>();
  for (const appointment of list) {
    const key = appointment.scheduled_for ? dayKey(appointment.scheduled_for) : "unscheduled";
    const bucket = grouped.get(key) ?? [];
    bucket.push(appointment);
    grouped.set(key, bucket);
  }
  const keys = Array.from(grouped.keys()).sort().reverse();

  return (
    <>
      <h1 className="mt-12 text-display-l">Appointments</h1>
      {keys.length === 0 ? (
        <p className="mt-8 text-body-l text-ink-950/70">
          Nothing assigned yet. You&apos;ll see patients here once the team assigns
          them.
        </p>
      ) : (
        keys.map((key) => {
          const dayAppointments = grouped.get(key)!;
          const sample = dayAppointments[0];
          return (
            <section key={key} className="mt-12" aria-label={key === "unscheduled" ? "Unscheduled" : fullDayLabel(sample.scheduled_for!)}>
              <h2 className="text-display-m">
                {key === "unscheduled" ? "No time set" : formatDayShortLabel(sample.scheduled_for!)}
              </h2>
              <ul className="mt-6 space-y-4">
                {dayAppointments.map((appointment) => {
                  const patient = patientById.get(appointment.patient_id);
                  const patientRow = patientRowById.get(appointment.patient_id);
                  const showContact = ["assigned", "confirmed", "completed", "no_show"].includes(appointment.status);
                  return (
                    <li
                      key={appointment.id}
                      className="rounded-card border border-neem-100 bg-chalk-0 p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          {appointment.scheduled_for && (
                            <p className="font-utility text-data tabular-nums text-ink-950/60">
                              {formatTime(appointment.scheduled_for)}
                            </p>
                          )}
                          <h3 className="mt-1 text-body-l font-semibold">
                            {patient?.full_name ?? "Patient"}
                          </h3>
                          {showContact && patient?.phone && (
                            <p className="mt-1 font-utility text-body-s tabular-nums text-neem-600">
                              {patient.phone}
                            </p>
                          )}
                          {patientRow?.locality && (
                            <p className="mt-1 text-body-s text-ink-950/60">
                              {patientRow.locality}
                              {patientRow.age_band
                                ? ` · ${AGE_BAND_LABELS[patientRow.age_band] ?? patientRow.age_band}`
                                : ""}
                            </p>
                          )}
                          <p className="mt-1 text-body-s text-ink-950/60">
                            {REASON_CATEGORY_LABELS[appointment.reason_category] ?? appointment.reason_category}
                            {appointment.patient_note ? ` — ${appointment.patient_note}` : ""}
                          </p>
                        </div>
                        <span className="rounded bg-neem-100 px-2 py-1 font-utility text-label uppercase text-neem-600">
                          {appointment.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <AppointmentActions appointment={appointment} />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </>
  );
}
