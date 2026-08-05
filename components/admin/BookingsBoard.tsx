"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatDateTime, relativeDays } from "@/lib/format";
import { appointmentAction, assignAppointment, logBookingView } from "@/app/admin/actions";
import { Badge } from "@/components/ui/Badge";
import type { Database } from "@/types/db";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export type BookingsBoardProps = {
  rows: Appointment[];
  statusLabels: Record<string, string>;
  allStatuses: AppointmentStatus[];
  patientById: Record<string, { full_name: string; phone: string | null }>;
  dentistByProfile: Record<string, { display_name: string; locality: string | null }>;
  eventsByAppt: Record<
    string,
    { from_status: string | null; to_status: string | null; actor_role: string | null; reason: string | null; created_at: string }[]
  >;
  notesByAppt: Record<string, { note: string; created_at: string }>;
  activeDentists: { profile_id: string; display_name: string; locality: string | null }[];
  openSlots: { id: string; dentist_id: string; starts_at: string }[];
  filters: { status: string; source: string; dentist: string; locality: string; from: string; to: string };
};

type Dialog =
  | { kind: "transition"; to: AppointmentStatus; label: string }
  | { kind: "assign" }
  | null;

const CANCEL_STATUSES: AppointmentStatus[] = [
  "cancelled_by_patient",
  "cancelled_by_dentist",
  "cancelled_by_admin",
];

/** Distinct, colour-free marker for self-booked rows so the admin reviews them. */
function SourceBadge({ source }: { source: Appointment["source"] }) {
  if (source === "self_booked")
    return (
      <span className="inline-flex items-center gap-1 rounded border border-ink-950 bg-chalk-0 px-2 py-0.5 font-utility text-data font-bold uppercase tracking-wide text-ink-950">
        Self-booked
      </span>
    );
  return (
    <span className="inline-flex items-center rounded bg-neem-100 px-2 py-0.5 font-utility text-data text-ink-950">
      Requested
    </span>
  );
}

const TONE: Record<string, "neutral" | "success" | "active" | "danger" | "warning"> = {
  requested: "warning",
  assigned: "neutral",
  confirmed: "success",
  completed: "active",
  no_show: "danger",
  cancelled_by_patient: "danger",
  cancelled_by_dentist: "danger",
  cancelled_by_admin: "danger",
};

export function BookingsBoard(props: BookingsBoardProps) {
  const { rows, statusLabels, allStatuses, patientById, dentistByProfile, eventsByAppt, notesByAppt, activeDentists, openSlots, filters } = props;
  const router = useRouter();
  const [cursor, setCursor] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [showShorts, setShowShorts] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = rows[cursor] ?? null;

  const applyFilters = useCallback(
    (patch: Partial<typeof filters>) => {
      const merged = { ...filters, ...patch };
      const p = new URLSearchParams();
      if (merged.status) p.set("status", merged.status);
      if (merged.source) p.set("source", merged.source);
      if (merged.dentist) p.set("dentist", merged.dentist);
      if (merged.locality) p.set("locality", merged.locality);
      if (merged.from) p.set("from", merged.from);
      if (merged.to) p.set("to", merged.to);
      router.replace(`/admin/bookings${p.toString() ? `?${p.toString()}` : ""}`);
      setCursor(0);
      setSelectedId(null);
      setDialog(null);
    },
    [router, filters],
  );

  const openDrawer = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
    setDialog(null);
    setError(null);
    void logBookingView(id);
  }, []);

  // Keyboard shortcuts: j/k move, Enter open, a assign, Escape close, ? help.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (dialog) {
        if (e.key === "Escape") {
          e.preventDefault();
          setDialog(null);
          setError(null);
        }
        return;
      }
      if (selectedId) {
        if (e.key === "Escape") {
          e.preventDefault();
          setSelectedId(null);
        }
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        setShowShorts((v) => !v);
        return;
      }
      if (rows.length === 0) return;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, rows.length - 1));
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      }
      if (e.key === "Enter" && selected) {
        e.preventDefault();
        openDrawer(selected.id);
      }
      if (e.key === "a" && selected) {
        e.preventDefault();
        setDialog({ kind: "assign" });
        setError(null);
      }
    },
    [dialog, selectedId, rows, selected, openDrawer],
  );

  // Keep the cursor within range after filtering.
  useEffect(() => {
    if (cursor >= rows.length) setCursor(Math.max(0, rows.length - 1));
  }, [rows.length, cursor]);

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok && res.error) setError(res.error);
    router.refresh();
    setDialog(null);
    setSelectedId(null);
  };

  const transition = (to: AppointmentStatus, label: string) => setDialog({ kind: "transition", to, label });
  const isCancel = dialog?.kind === "transition" && CANCEL_STATUSES.includes(dialog.to);

  const submitDialog = async (formData: FormData) => {
    if (!selected) return;
    const reason = String(formData.get("reason") ?? "").trim();
    if (dialog?.kind === "transition" && dialog.to) {
      await run(() => appointmentAction(selected.id, dialog.to, reason));
    } else if (dialog?.kind === "assign") {
      const dentistId = String(formData.get("dentistId") ?? "");
      const slotId = String(formData.get("slotId") ?? "");
      const slot = openSlots.find((s) => s.id === slotId);
      await run(() =>
        assignAppointment(selected.id, dentistId, reason, {
          newSlotId: slot?.id,
          scheduledFor: slot?.starts_at,
        }),
      );
    }
  };

  const dialogFor = dialog && selected ? (
    <form
      action={submitDialog}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={dialog.kind === "assign" ? "Assign a dentist" : `Mark ${dialog.label}`}
      onKeyDown={onKeyDown}
    >
      <div className="w-full max-w-md rounded border border-neem-100 bg-chalk-0 p-6 shadow-lg">
        <h3 className="font-utility text-lg font-bold text-ink-950">
          {dialog.kind === "assign" ? "Assign a dentist" : `Mark ${dialog.label}`}
        </h3>
        <p className="mt-1 font-utility text-body-s text-ink-950/70">
          {selected.reference_code} — {patientById[selected.patient_id]?.full_name ?? "Unknown patient"}
        </p>

        {dialog.kind === "assign" && (
          <label className="mt-4 block">
            <span className="font-utility text-label uppercase text-ink-950/70">Dentist</span>
            <select
              name="dentistId"
              required
              className="mt-1 w-full rounded border border-neem-100 bg-chalk-0 px-3 py-2 font-utility text-body"
            >
              <option value="" disabled>
                Choose…
              </option>
              {activeDentists.map((d) => (
                <option key={d.profile_id} value={d.profile_id}>
                  {d.display_name}
                  {d.locality ? ` — ${d.locality}` : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        {dialog.kind === "assign" && (
          <label className="mt-3 block">
            <span className="font-utility text-label uppercase text-ink-950/70">
              Slot <span className="normal-case">(optional)</span>
            </span>
            <select
              name="slotId"
              className="mt-1 w-full rounded border border-neem-100 bg-chalk-0 px-3 py-2 font-utility text-body"
            >
              <option value="">No slot yet</option>
              {openSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDateTime(s.starts_at)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="mt-4 block">
          <span className="font-utility text-label uppercase text-ink-950/70">
            One-line reason <span aria-hidden="true">*</span>
          </span>
          {isCancel && (
            <p className="mt-1 font-utility text-body-s text-ink-950/60">
              Separate the reason so the audit trail stays legible later.
            </p>
          )}
          <input
            name="reason"
            required
            placeholder={isCancel ? "e.g. Patient called to cancel" : "e.g. Matched with a nearby dentist"}
            className="mt-1 w-full rounded border border-neem-100 bg-chalk-0 px-3 py-2 font-utility text-body"
          />
        </label>

        {error && <p className="mt-3 font-utility text-body-s text-clay-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setDialog(null);
              setError(null);
            }}
            className="rounded border border-neem-100 px-4 py-2 font-utility text-body-s text-ink-950"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-neem-900 px-4 py-2 font-utility text-body-s font-medium text-chalk-0 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </form>
  ) : null;

  return (
    <div tabIndex={0} onKeyDown={onKeyDown} className="mt-6 outline-none" aria-label="Bookings table, keyboard shortcuts: j/k to move, Enter to open, a to assign, ? for help">
      <Filters
        statuses={allStatuses}
        statusLabels={statusLabels}
        filters={filters}
        onChange={applyFilters}
      />

      {showShorts && <ShortcutsOverlay onClose={() => setShowShorts(false)} />}

      <div className="mt-4 overflow-x-auto rounded border border-neem-100 bg-chalk-0">
        <table className="w-full border-collapse font-utility text-data">
          <thead className="text-left text-label uppercase text-ink-950/60">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Dentist</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Age</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-ink-950/60">
                  No bookings match those filters.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <Row
                  key={r.id}
                  row={r}
                  active={i === cursor}
                  selected={r.id === selectedId}
                  statusLabels={statusLabels}
                  patientById={patientById}
                  dentistByProfile={dentistByProfile}
                  onActivate={() => setCursor(i)}
                  onClickRow={() => openDrawer(r.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-2 font-utility text-body-s text-ink-950/50">
        {rows.length} rows · press <kbd>?</kbd> for keyboard shortcuts
      </p>

      {selectedId && (
        <Drawer
          row={rows.find((r) => r.id === selectedId) ?? null}
          statusLabels={statusLabels}
          patientById={patientById}
          dentistByProfile={dentistByProfile}
          events={eventsByAppt[selectedId] ?? []}
          note={notesByAppt[selectedId] ?? null}
          onClose={() => setSelectedId(null)}
          onTransition={transition}
          onAssign={() => setDialog({ kind: "assign" })}
        />
      )}

      {dialogFor}
    </div>
  );
}

function Filters({
  statuses,
  statusLabels,
  filters,
  onChange,
}: {
  statuses: AppointmentStatus[];
  statusLabels: Record<string, string>;
  filters: BookingsBoardProps["filters"];
  onChange: (patch: Partial<BookingsBoardProps["filters"]>) => void;
}) {
  const current = filters.status ? filters.status.split(",").filter(Boolean) : [];
  const toggle = (s: AppointmentStatus) => {
    const next = current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
    onChange({ status: next.join(",") });
  };
  return (
    <fieldset className="mt-4">
      <legend className="sr-only">Filter by status</legend>
      <div className="flex flex-wrap gap-1.5">
        {statuses.map((s) => {
          const on = current.includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s)}
              className={
                on
                  ? "rounded-full bg-ink-950 px-3 py-1 font-utility text-data text-chalk-0"
                  : "rounded-full border border-neem-100 bg-chalk-0 px-3 py-1 font-utility text-data text-ink-950 hover:border-neem-600"
              }
            >
              {statusLabels[s]}
            </button>
          );
        })}
        {current.length > 0 && (
          <button
            type="button"
            onClick={() => onChange({ status: "" })}
            className="rounded-full px-3 py-1 font-utility text-data text-clay-600 underline"
          >
            Clear
          </button>
        )}
      </div>
    </fieldset>
  );
}

function Row({
  row,
  active,
  selected,
  statusLabels,
  patientById,
  dentistByProfile,
  onActivate,
  onClickRow,
}: {
  row: Appointment;
  active: boolean;
  selected: boolean;
  statusLabels: Record<string, string>;
  patientById: BookingsBoardProps["patientById"];
  dentistByProfile: BookingsBoardProps["dentistByProfile"];
  onActivate: () => void;
  onClickRow: () => void;
}) {
  const patient = patientById[row.patient_id];
  const dentist = row.dentist_id ? dentistByProfile[row.dentist_id] : null;
  const when = row.scheduled_for ? formatDateTime(row.scheduled_for) : "—";
  return (
    <tr
      onClick={onClickRow}
      onMouseEnter={onActivate}
      tabIndex={-1}
      className={
        "cursor-pointer border-t border-neem-100 " +
        (selected
          ? "bg-neem-100"
          : active
            ? "bg-chalk-0 ring-1 ring-inset ring-neem-600"
            : "bg-chalk-0 hover:bg-neem-50")
      }
      data-row-active={active}
    >
      <td className="px-4 py-3 font-medium text-ink-950">{row.reference_code}</td>
      <td className="px-4 py-3 text-ink-950">{patient?.full_name ?? "—"}</td>
      <td className="px-4 py-3 text-ink-950/70">{patient?.phone ?? "—"}</td>
      <td className="px-4 py-3 text-ink-950">{dentist?.display_name ?? "Unassigned"}</td>
      <td className="px-4 py-3 text-ink-950/80">{when}</td>
      <td className="px-4 py-3">
        <Badge tone={TONE[row.status] ?? "neutral"}>{statusLabels[row.status]}</Badge>
      </td>
      <td className="px-4 py-3">
        <SourceBadge source={row.source} />
      </td>
      <td className="px-4 py-3 text-ink-950/60">{relativeDays(row.created_at)}</td>
    </tr>
  );
}

function Drawer({
  row,
  statusLabels,
  patientById,
  dentistByProfile,
  events,
  note,
  onClose,
  onTransition,
  onAssign,
}: {
  row: Appointment | null;
  statusLabels: Record<string, string>;
  patientById: BookingsBoardProps["patientById"];
  dentistByProfile: BookingsBoardProps["dentistByProfile"];
  events: { to_status: string | null; actor_role: string | null; reason: string | null; created_at: string }[];
  note: { note: string; created_at: string } | null;
  onClose: () => void;
  onTransition: (to: AppointmentStatus, label: string) => void;
  onAssign: () => void;
}) {
  if (!row) return null;
  const patient = patientById[row.patient_id];
  const dentist = row.dentist_id ? dentistByProfile[row.dentist_id] : null;

  const actions: { to: AppointmentStatus; label: string }[] = [];
  if (row.status === "requested" || row.status === "assigned") actions.push({ to: "assigned", label: "Assign / reassign" });
  if (row.status === "assigned") actions.push({ to: "confirmed", label: "Confirm" });
  if (row.status === "confirmed") {
    actions.push({ to: "confirmed", label: "Reschedule" });
    actions.push({ to: "completed", label: "Mark complete" });
    actions.push({ to: "no_show", label: "No-show" });
  }
  actions.push({ to: "cancelled_by_admin", label: "Cancel" });

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink-950/30" onClick={onClose} role="presentation">
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-chalk-0 p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label={`Appointment ${row.reference_code}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-utility text-xl font-bold text-ink-950">{row.reference_code}</h2>
            <p className="font-utility text-body-s text-ink-950/70">
              <Badge tone={TONE[row.status] ?? "neutral"}>{statusLabels[row.status]}</Badge>{" "}
              <SourceBadge source={row.source} />
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-2 font-utility text-body text-ink-950 hover:bg-neem-100"
          >
            ✕
          </button>
        </div>

        <dl className="mt-5 space-y-3 font-utility text-body">
          <div>
            <dt className="text-label uppercase text-ink-950/60">Patient</dt>
            <dd className="mt-0.5 text-ink-950">{patient?.full_name ?? "—"}</dd>
            <dd className="text-body-s text-ink-950/70">{patient?.phone ?? ""}</dd>
          </div>
          <div>
            <dt className="text-label uppercase text-ink-950/60">Dentist</dt>
            <dd className="mt-0.5 text-ink-950">{dentist?.display_name ?? "Unassigned"}</dd>
            {dentist?.locality && (
              <dd className="text-body-s text-ink-950/70">{dentist.locality}</dd>
            )}
          </div>
          <div>
            <dt className="text-label uppercase text-ink-950/60">When</dt>
            <dd className="mt-0.5 text-ink-950">{row.scheduled_for ? formatDateTime(row.scheduled_for) : "No time set"}</dd>
          </div>
          {row.reason_category && (
            <div>
              <dt className="text-label uppercase text-ink-950/60">What&apos;s wrong</dt>
              <dd className="mt-0.5 text-ink-950">{row.reason_category}</dd>
            </div>
          )}
          {row.patient_note && (
            <div>
              <dt className="text-label uppercase text-ink-950/60">Patient note</dt>
              <dd className="mt-0.5 text-ink-950">{row.patient_note}</dd>
            </div>
          )}
          <div>
            <dt className="text-label uppercase text-ink-950/60">Clinical note</dt>
            <dd className="mt-0.5 text-ink-950">
              {note ? note.note : "Not recorded yet"}
            </dd>
          </div>
        </dl>

        <div className="mt-5">
          <p className="font-utility text-label uppercase text-ink-950/60">Timeline</p>
          <ol className="mt-2 space-y-2">
            {events.length === 0 && (
              <li className="font-utility text-body-s text-ink-950/50">No events yet.</li>
            )}
            {events.map((e, i) => (
              <li key={i} className="font-utility text-body-s text-ink-950">
                <span className="text-ink-950/60">{formatDate(e.created_at)}:</span>{" "}
                <strong>{statusLabels[e.to_status ?? ""] ?? e.to_status}</strong>
                {e.reason ? ` — ${e.reason}` : ""}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {actions.map((a) => (
            <button
              key={a.to}
              onClick={() => (a.to === "assigned" ? onAssign() : onTransition(a.to, a.label))}
              className="rounded bg-neem-900 px-3 py-1.5 font-utility text-body-s font-medium text-chalk-0"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ["j / ↓", "Move the row cursor down"],
    ["k / ↑", "Move the row cursor up"],
    ["Enter", "Open the booking drawer"],
    ["a", "Assign a dentist"],
    ["Escape", "Close the drawer or dialog"],
    ["?", "Toggle this help"],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded border border-neem-100 bg-chalk-0 p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-utility text-lg font-bold text-ink-950">Keyboard shortcuts</h2>
        <dl className="mt-4 space-y-2">
          {rows.map(([k, d]) => (
            <div key={k} className="flex items-baseline justify-between gap-4">
              <dt>
                <kbd className="rounded border border-neem-100 bg-neem-100/40 px-1.5 font-utility text-data text-ink-950">
                  {k}
                </kbd>
              </dt>
              <dd className="font-utility text-body-s text-ink-950/70">{d}</dd>
            </div>
          ))}
        </dl>
        <button
          onClick={onClose}
          className="mt-5 rounded bg-neem-900 px-4 py-2 font-utility text-body-s font-medium text-chalk-0"
        >
          Close
        </button>
      </div>
    </div>
  );
}
