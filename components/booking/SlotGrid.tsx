"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format";

export type GridSlot = {
  id: string;
  starts_at: string;
  ends_at: string;
  location_type: "clinic" | "camp";
  camp_name: string | null;
};

export type DayColumn = {
  dateKey: string;
  /** Short column header, e.g. "Wed 12" */
  shortLabel: string;
  /** Full date for accessible names, e.g. "Wednesday, 12 August" */
  fullLabel: string;
};

/**
 * The 14-day slot grid (Phase 5 §5.6). Days are columns, times are rows.
 * Fully keyboard operable: arrow keys move the cursor within the grid, Enter
 * activates the focused slot, and each cell's accessible name is the full date
 * and time — never just "10:30".
 * Activating a slot places the 10-minute hold (POST /api/hold) and navigates
 * to /care/book/[slotId]. A taken slot refreshes the grid with a clear message.
 */
export function SlotGrid({
  days,
  times,
  cells,
  rescheduleAppointmentId,
}: {
  days: DayColumn[];
  times: string[];
  /** cells[day][time] — the slot in that cell, or null when unavailable. */
  cells: (GridSlot | null)[][];
  rescheduleAppointmentId?: string;
}) {
  const router = useRouter();
  const [cursor, setCursor] = useState<{ d: number; t: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const slotAt = (d: number, t: number): GridSlot | null =>
    cells[d]?.[t] ?? null;

  const focusCell = (d: number, t: number) => {
    setCursor({ d, t });
    requestAnimationFrame(() => {
      const el = gridRef.current?.querySelector<HTMLElement>(
        `[data-cell="${d}-${t}"]`,
      );
      el?.focus();
    });
  };

  const move = (e: React.KeyboardEvent, d: number, t: number) => {
    const rows = times.length;
    const cols = days.length;
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        focusCell((d + 1) % cols, t);
        break;
      case "ArrowLeft":
        e.preventDefault();
        focusCell((d - 1 + cols) % cols, t);
        break;
      case "ArrowDown":
        e.preventDefault();
        focusCell(d, (t + 1) % rows);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusCell(d, (t - 1 + rows) % rows);
        break;
    }
  };

  const pick = async (slot: GridSlot) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: slot.id }),
      });
      const body = (await res.json()) as { ok: boolean; error?: string };
      if (res.ok && body.ok) {
        const q = rescheduleAppointmentId
          ? `?reschedule=${rescheduleAppointmentId}`
          : "";
        router.push(`/care/book/${slot.id}${q}`);
        return;
      }
      if (body.error === "SLOT_HELD") {
        setMessage(
          "Someone else is looking at this slot right now — pick the next one.",
        );
      } else {
        setMessage("Someone just booked this slot. Here are the next available times.");
        router.refresh();
      }
    } catch {
      setMessage("The slot server didn't respond. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <p
          role="status"
          className="rounded border border-clay-600 bg-chalk-0 px-4 py-3 text-body-s text-clay-600"
        >
          {message}
        </p>
      )}
      <div className="overflow-x-auto">
        <div
          ref={gridRef}
          role="grid"
          aria-label="Available appointment times"
          className="grid min-w-[720px] gap-px"
          style={{ gridTemplateColumns: `120px repeat(${days.length}, minmax(84px, 1fr))` }}
        >
          {/* corner + day headers */}
          <div role="columnheader" className="p-2" />
          {days.map((day) => (
            <div
              key={day.dateKey}
              role="columnheader"
              className="flex flex-col items-center gap-1 p-2 text-center"
            >
              <span className="font-utility text-body-s font-semibold text-ink-950">
                {day.shortLabel}
              </span>
              <span className="font-utility text-body-s text-ink-950/60">
                {new Date(day.dateKey).toLocaleDateString("en-IN", { month: "short" })}
              </span>
            </div>
          ))}

          {times.map((time, t) => (
            <GridRow
              key={time}
              time={time}
              t={t}
              days={days}
              cursor={cursor}
              busy={busy}
              slotAt={slotAt}
              onMove={move}
              onPick={pick}
              onFocusCell={focusCell}
            />
          ))}
        </div>
      </div>
      <p className="text-body-s text-ink-950/60">
        Use the arrow keys to move and Enter to pick a time. Picking a time reserves
        it for ten minutes while you enter your details.
      </p>
    </div>
  );
}

function GridRow({
  time,
  t,
  days,
  cursor,
  busy,
  slotAt,
  onMove,
  onPick,
  onFocusCell,
}: {
  time: string;
  t: number;
  days: DayColumn[];
  cursor: { d: number; t: number } | null;
  busy: boolean;
  slotAt: (d: number, t: number) => GridSlot | null;
  onMove: (e: React.KeyboardEvent, d: number, t: number) => void;
  onPick: (slot: GridSlot) => void;
  onFocusCell: (d: number, t: number) => void;
}) {
  return (
    <>
      <div
        role="rowheader"
        className="flex items-center justify-end pr-4 font-utility text-data tabular-nums text-neem-600"
      >
        {time}
      </div>
      {days.map((day, d) => {
        const slot = slotAt(d, t);
        const isCursor = cursor?.d === d && cursor?.t === t;
        return (
          <div key={day.dateKey} role="gridcell" className="p-1">
            {slot ? (
              <button
                type="button"
                data-cell={`${d}-${t}`}
                tabIndex={isCursor ? 0 : -1}
                aria-label={`${formatTime(slot.starts_at)}, ${day.fullLabel}`}
                aria-disabled={busy || undefined}
                disabled={busy}
                onKeyDown={(e) => onMove(e, d, t)}
                onFocus={() => setCursorIfNeeded(d, t, onFocusCell)}
                onClick={() => {
                  onFocusCell(d, t);
                  onPick(slot);
                }}
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center gap-1 rounded border px-2 py-3 font-utility text-data tabular-nums transition",
                  "border-neem-100 bg-chalk-0 text-ink-950 hover:border-neem-600",
                  "disabled:cursor-wait disabled:opacity-60",
                )}
              >
                <span>{formatTime(slot.starts_at)}</span>
                {slot.location_type === "camp" && (
                  <span className="rounded bg-neem-100 px-1.5 py-0.5 font-utility text-label uppercase text-neem-600">
                    {slot.camp_name ?? "Camp"}
                  </span>
                )}
              </button>
            ) : (
              <div
                aria-disabled="true"
                data-cell={`${d}-${t}`}
                className="flex h-full w-full items-center justify-center rounded border border-transparent bg-neem-100 text-body-s text-ink-950/40"
              >
                —
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/** Moves the roving cursor when a cell receives focus (click or Tab). */
function setCursorIfNeeded(
  d: number,
  t: number,
  onFocusCell: (d: number, t: number) => void,
) {
  onFocusCell(d, t);
}
