"use client";

import { useState, useTransition } from "react";
import { saveClinicalNote, transitionAsDentist } from "@/app/dentist/actions";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import type { Database } from "@/types/db";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type ClinicalNote = Database["public"]["Tables"]["clinical_notes"]["Row"];

/** Per-appointment dentist actions: confirm, complete, no-show, cancel with a
 * reason, and clinical notes on completed visits. Every status change routes
 * through the transition RPC — never a direct write. */
export function AppointmentActions({
  appointment,
  existingNote,
}: {
  appointment: Appointment;
  existingNote?: ClinicalNote | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(existingNote?.note ?? "");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const act = (
    to: "confirmed" | "completed" | "no_show" | "cancelled_by_dentist",
    reason?: string,
  ) => {
    setError(null);
    startTransition(async () => {
      const state = await transitionAsDentist(appointment.id, to, reason);
      if (!state.ok) setError(state.error ?? "Try again.");
      else if (to === "cancelled_by_dentist") {
        setCancelOpen(false);
        setCancelReason("");
      }
    });
  };

  const saveNote = () => {
    setError(null);
    startTransition(async () => {
      const state = await saveClinicalNote(appointment.id, note);
      if (!state.ok) setError(state.error ?? "Try again.");
      else setNoteOpen(false);
    });
  };

  const status = appointment.status;
  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3">
        {status === "assigned" && (
          <ActionButton pending={pending} onClick={() => act("confirmed")}>
            Confirm
          </ActionButton>
        )}
        {status === "confirmed" && (
          <>
            <ActionButton pending={pending} onClick={() => act("completed")}>
              Mark completed
            </ActionButton>
            <ActionButton pending={pending} onClick={() => act("no_show")} muted>
              Mark no-show
            </ActionButton>
          </>
        )}
        {["requested", "assigned", "confirmed"].includes(status) && (
          <ActionButton pending={pending} onClick={() => setCancelOpen(true)} danger>
            Cancel with reason
          </ActionButton>
        )}
        {status === "completed" && (
          <ActionButton pending={pending} onClick={() => setNoteOpen(true)} muted>
            {existingNote ? "Edit clinical note" : "Add clinical note"}
          </ActionButton>
        )}
      </div>

      {noteOpen && (
        <div className="mt-4 space-y-3">
          <label htmlFor={`note-${appointment.id}`} className="sr-only">
            Clinical note
          </label>
          <textarea
            id={`note-${appointment.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="w-full rounded border border-neem-100 bg-chalk-0 px-4 py-3 text-body"
            placeholder="What you did, what to watch for…"
          />
          <button
            type="button"
            onClick={saveNote}
            disabled={pending || note.trim().length === 0}
            className="rounded bg-neem-900 px-4 py-2 font-utility text-body-s font-medium text-chalk-0 transition hover:bg-neem-600 disabled:opacity-50"
          >
            Save note
          </button>
          <button
            type="button"
            onClick={() => setNoteOpen(false)}
            className="ml-3 rounded border border-neem-100 px-4 py-2 font-utility text-body-s font-medium text-ink-950"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-body-s text-clay-600">
          {error}
        </p>
      )}

      <Dialog
        open={cancelOpen}
        title="Cancel this appointment?"
        description="Tell the patient why the clinic cannot keep this appointment. The reason is saved in the record."
        onClose={() => {
          if (!pending) setCancelOpen(false);
        }}
      >
        <div className="mt-5">
          <label htmlFor={`cancel-reason-${appointment.id}`} className="font-utility text-body-s font-semibold text-ink-950">
            Reason for cancelling
          </label>
          <Textarea
            id={`cancel-reason-${appointment.id}`}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            rows={4}
            maxLength={500}
            className="mt-2"
          />
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setCancelOpen(false)} disabled={pending}>
              Keep appointment
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => act("cancelled_by_dentist", cancelReason.trim())}
              disabled={pending || cancelReason.trim().length === 0}
            >
              {pending ? "Cancelling…" : "Cancel appointment"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  pending,
  danger,
  muted,
}: {
  children: React.ReactNode;
  onClick: () => void;
  pending: boolean;
  danger?: boolean;
  muted?: boolean;
}) {
  const classes = danger
    ? "border border-clay-600 text-clay-600 hover:bg-clay-600 hover:text-chalk-0"
    : muted
      ? "border border-neem-100 text-ink-950 hover:border-neem-600"
      : "bg-neem-900 text-chalk-0 hover:bg-neem-600";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`rounded px-4 py-2 font-utility text-body-s font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${classes}`}
    >
      {children}
    </button>
  );
}
