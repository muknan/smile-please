"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/booking";
import { lookupAppointmentAction, type StatusState } from "./actions";

export function StatusLookup({ initialRef, renderedAt }: { initialRef?: string; renderedAt: string }) {
  const [state, formAction, pending] = useActionState<StatusState, FormData>(
    lookupAppointmentAction,
    { status: "idle" },
  );

  if (state.status === "found") {
    const { result } = state;
    const badgeTone =
      result.status === "confirmed"
        ? ("success" as const)
        : result.status === "completed"
          ? ("active" as const)
          : ["cancelled_by_patient", "cancelled_by_dentist", "cancelled_by_admin", "no_show"].includes(
                result.status,
              )
            ? ("danger" as const)
            : ("neutral" as const);
    return (
      <div className="max-w-[65ch] rounded-card border border-neem-100 bg-chalk-0 p-10">
        <h2 className="flex flex-wrap items-center gap-4 text-display-m">
          Appointment
          <Badge tone={badgeTone}>
            {STATUS_LABELS[result.status as keyof typeof STATUS_LABELS] ?? result.status}
          </Badge>
        </h2>
        <dl className="mt-8 space-y-6">
          <div>
            <dt className="font-utility text-label uppercase text-ink-950">Dentist</dt>
            <dd className="mt-1 text-body">{result.dentist}</dd>
          </div>
          {result.locality && (
            <div>
              <dt className="font-utility text-label uppercase text-ink-950">Where</dt>
              <dd className="mt-1 text-body">{result.locality}</dd>
            </div>
          )}
          {result.scheduled_for && (
            <div>
              <dt className="font-utility text-label uppercase text-ink-950">When</dt>
              <dd className="mt-1 font-utility text-data tabular-nums">
                {formatDateTime(result.scheduled_for)}
              </dd>
            </div>
          )}
          {result.cancelled_reason && (
            <div>
              <dt className="font-utility text-label uppercase text-ink-950">Why it was cancelled</dt>
              <dd className="mt-1 text-body">{result.cancelled_reason}</dd>
            </div>
          )}
        </dl>

        {result.events.length > 0 && (
          <div className="mt-10 border-t border-neem-100 pt-8">
            <h3 className="font-utility text-label uppercase text-ink-950">What&apos;s happened so far</h3>
            <ol className="mt-6 space-y-6">
              {result.events.map((event, i) => (
                <li key={i} className="flex gap-6">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-neem-600"
                  />
                  <div>
                    <p className="text-body font-medium">
                      {STATUS_LABELS[event.status as keyof typeof STATUS_LABELS] ?? event.status}
                    </p>
                    <p className="mt-1 font-utility text-body-s tabular-nums text-ink-950/60">
                      {formatDateTime(event.at)}
                    </p>
                    {event.reason && <p className="mt-1 text-body-s text-ink-950/70">{event.reason}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/care"
            className="inline-flex items-center justify-center rounded bg-marigold-500 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95"
          >
            Book another
          </Link>
          <Link
            href="/care/status"
            className="inline-flex items-center justify-center rounded border border-neem-100 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:border-neem-600"
          >
            Look up another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-[65ch] space-y-8" aria-live="polite">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0"
      />
      <input type="hidden" name="renderedAt" value={renderedAt} />

      <Field
        label="Reference code"
        htmlFor="ref"
        required
        hint="It looks like SP-2026-0417 — on your confirmation message."
      >
        <Input
          id="ref"
          name="ref"
          defaultValue={initialRef ?? ""}
          placeholder="SP-2026-0000"
          autoComplete="off"
          required
        />
      </Field>

      <Field label="Phone you booked with" htmlFor="phone" required>
        <Input id="phone" name="phone" type="tel" inputMode="tel" placeholder="+91" required />
      </Field>

      {state.status === "notfound" && (
        <p role="alert" className="text-body-s text-clay-600">
          We couldn&apos;t find an appointment with those details. Check the reference
          and phone number, or call us and we&apos;ll look it up for you.
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="text-body-s text-clay-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded bg-marigold-500 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Looking…" : "Find my appointment"}
      </button>
    </form>
  );
}
