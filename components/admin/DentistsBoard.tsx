"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import {
  setDentistStatus,
  verifyDci,
  adminAddSlot,
  adminBlockDay,
} from "@/app/admin/actions";
import { Badge } from "@/components/ui/Badge";
import type { Database } from "@/types/db";

type DentistStatus = Database["public"]["Enums"]["dentist_status"];

type DentistRow = {
  profile_id: string;
  slug: string;
  display_name: string;
  locality: string | null;
  city: string | null;
  dci_registration_no: string | null;
  dci_verified_at: string | null;
  status: DentistStatus;
  is_public: boolean;
  created_at: string;
  email: string | null;
};

const STATUS_TONE: Record<DentistStatus, "neutral" | "success" | "active" | "warning" | "danger"> = {
  pending: "warning",
  active: "success",
  paused: "neutral",
  rejected: "danger",
};

export function DentistsBoard({ rows }: { rows: DentistRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (id: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(id);
    setError(null);
    const res = await fn();
    setBusy(null);
    if (!res.ok && res.error) setError(res.error);
    startTransition(() => router.refresh());
  };

  return (
    <div className="mt-4 space-y-4">
      {error && <p className="font-utility text-body-s text-clay-600">{error}</p>}

      {rows.length === 0 && (
        <p className="rounded border border-neem-100 bg-chalk-0 p-6 font-utility text-body text-ink-950/60">
          No dentists here.
        </p>
      )}

      {rows.map((d) => (
        <DentistCard
          key={d.profile_id}
          dentist={d}
          busy={busy === d.profile_id}
          onStatus={(s, reason) =>
            run(d.profile_id, () => setDentistStatus(d.profile_id, s, reason))
          }
          onVerify={() => run(d.profile_id, () => verifyDci(d.profile_id))}
          onAddSlot={(date, time) =>
            run(d.profile_id, () => adminAddSlot(d.profile_id, date, time))
          }
          onBlockDay={(date) => run(d.profile_id, () => adminBlockDay(d.profile_id, date))}
        />
      ))}
    </div>
  );
}

function DentistCard({
  dentist: d,
  busy,
  onStatus,
  onVerify,
  onAddSlot,
  onBlockDay,
}: {
  dentist: DentistRow;
  busy: boolean;
  onStatus: (s: DentistStatus, reason?: string) => void;
  onVerify: () => void;
  onAddSlot: (date: string, time: string) => void;
  onBlockDay: (date: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");

  return (
    <div className="rounded border border-neem-100 bg-chalk-0 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-utility text-body font-bold text-ink-950">{d.display_name}</p>
          <p className="font-utility text-body-s text-ink-950/60">
            {d.locality ? `${d.locality}, ${d.city ?? ""}` : (d.city ?? "")} · {d.email ?? "no email"}
          </p>
          <p className="mt-1 font-utility text-body-s text-ink-950/60">
            DCI: {d.dci_registration_no ?? "not provided"}
            {d.dci_verified_at ? ` · verified ${formatDate(d.dci_verified_at)}` : " · not verified"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
          {d.is_public && (
            <span className="font-utility text-data text-neem-600">listed on site</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          disabled={busy || d.status === "active"}
          onClick={() => onStatus("active")}
          className="rounded bg-neem-900 px-3 py-1.5 font-utility text-body-s font-medium text-chalk-0 disabled:opacity-40"
        >
          Approve
        </button>
        <button
          disabled={busy || d.status === "paused"}
          onClick={() => onStatus("paused")}
          className="rounded border border-neem-100 px-3 py-1.5 font-utility text-body-s text-ink-950 disabled:opacity-40"
        >
          Pause
        </button>
        {rejecting ? (
          <span className="inline-flex items-center gap-2">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for rejection"
              aria-label="Reason for rejection"
              className="w-52 rounded border border-neem-100 px-2 py-1.5 font-utility text-body-s"
            />
            <button
              disabled={busy || !reason.trim()}
              onClick={() => onStatus("rejected", reason.trim())}
              className="rounded bg-clay-600 px-3 py-1.5 font-utility text-body-s font-medium text-chalk-0 disabled:opacity-40"
            >
              Confirm reject
            </button>
            <button onClick={() => setRejecting(false)} className="font-utility text-body-s text-ink-950/60">
              Cancel
            </button>
          </span>
        ) : (
          <button
            disabled={busy}
            onClick={() => setRejecting(true)}
            className="rounded border border-neem-100 px-3 py-1.5 font-utility text-body-s text-clay-600 disabled:opacity-40"
          >
            Reject
          </button>
        )}

        <button
          disabled={busy || !!d.dci_verified_at || !d.dci_registration_no}
          onClick={onVerify}
          className="rounded border border-neem-100 px-3 py-1.5 font-utility text-body-s text-ink-950 disabled:opacity-40"
        >
          {d.dci_verified_at ? "DCI verified" : "I&apos;ve checked the DCI register"}
        </button>
      </div>

      <div className="mt-4 rounded border border-neem-100 bg-neem-50 p-4">
        <p className="font-utility text-label uppercase text-ink-950/60">
          Availability (on this dentist&apos;s behalf)
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          {adding ? (
            <>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Date"
                className="rounded border border-neem-100 bg-chalk-0 px-2 py-1.5 font-utility text-body-s"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-label="Time"
                className="rounded border border-neem-100 bg-chalk-0 px-2 py-1.5 font-utility text-body-s"
              />
              <button
                disabled={busy || !date}
                onClick={() => {
                  onAddSlot(date, time);
                  setAdding(false);
                }}
                className="rounded bg-neem-900 px-3 py-1.5 font-utility text-body-s font-medium text-chalk-0 disabled:opacity-40"
              >
                Add slot
              </button>
              <button onClick={() => setAdding(false)} className="font-utility text-body-s text-ink-950/60">
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="rounded border border-neem-100 bg-chalk-0 px-3 py-1.5 font-utility text-body-s text-ink-950"
            >
              Add a slot
            </button>
          )}
          <input
            type="date"
            aria-label="Block a full day"
            onChange={(e) => e.target.value && onBlockDay(e.target.value)}
            className="rounded border border-neem-100 bg-chalk-0 px-2 py-1.5 font-utility text-body-s"
            title="Block all slots on this date"
          />
          <span className="font-utility text-body-s text-ink-950/50">(block a full day)</span>
        </div>
      </div>
    </div>
  );
}
