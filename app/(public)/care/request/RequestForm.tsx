"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ConsentBlock } from "@/components/booking/ConsentBlock";
import {
  AGE_BANDS,
  LOCALITIES,
  REASONS,
} from "@/lib/schemas";
import { AGE_BAND_LABELS, REASON_CATEGORY_LABELS } from "@/lib/booking";
import { submitCareRequest, type RequestState } from "./actions";

const MINOR_NOTE =
  "A parent or guardian needs to make this booking. Please ask them to fill this in, or call us on the number at the bottom of this page.";

export function RequestForm({ renderedAt }: { renderedAt: string }) {
  const [state, formAction, pending] = useActionState<RequestState, FormData>(
    submitCareRequest,
    { status: "idle" },
  );
  const [forMinor, setForMinor] = useState(false);

  if (state.status === "success") {
    return (
      <div className="max-w-[65ch] rounded-card border border-neem-100 bg-chalk-0 p-10">
        <h2 className="text-display-m">Your request is in.</h2>
        <p className="mt-4 text-body-l">
          Your reference is{" "}
          <span className="font-utility font-semibold tabular-nums text-neem-600">
            {state.ref}
          </span>
          . Keep it somewhere — you can use it with your phone number to track the
          appointment.
        </p>
        <p className="mt-4 text-body text-ink-950/80">
          We&apos;ll match you with a dentist near {""} and call or message to confirm,
          usually within two working days.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/care/dentists"
            className="inline-flex items-center justify-center rounded bg-marigold-500 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95"
          >
            Browse dentists yourself
          </Link>
          <Link
            href="/care/status"
            className="inline-flex items-center justify-center rounded border border-neem-100 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:border-neem-600"
          >
            Track this request
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="max-w-[65ch] space-y-10"
      aria-live="polite"
    >
      {/* honeypot — hidden but not display:none; bots fill it, humans never see it */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0"
      />
      <input type="hidden" name="renderedAt" value={renderedAt} />

      <Field label="Full name" htmlFor="fullName" required>
        <Input id="fullName" name="fullName" autoComplete="name" required />
      </Field>

      <Field
        label="Phone"
        htmlFor="phone"
        required
        hint="We only use this to confirm the appointment. Format: +91 98765 43210."
      >
        <Input id="phone" name="phone" type="tel" inputMode="tel" placeholder="+91" required />
      </Field>

      <Field
        label="Email"
        htmlFor="email"
        hint="Optional. We use it for appointment emails and a sign-in link to your account."
      >
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
      </Field>

      <Field label="Age band" htmlFor="ageBand" required>
        <Select id="ageBand" name="ageBand" required defaultValue="">
          <option value="" disabled>
            Choose…
          </option>
          {AGE_BANDS.map((band) => (
            <option key={band} value={band}>
              {AGE_BAND_LABELS[band]}
            </option>
          ))}
        </Select>
      </Field>

      <fieldset className="space-y-4">
        <legend className="text-label uppercase text-ink-950">What&apos;s wrong?</legend>
        {REASONS.map((reason) => (
          <div key={reason} className="flex items-center gap-4">
            <input
              type="radio"
              id={`reason-${reason}`}
              name="reason"
              value={reason}
              required
              className="h-5 w-5 accent-neem-600"
            />
            <label htmlFor={`reason-${reason}`} className="text-body">
              {REASON_CATEGORY_LABELS[reason]}
            </label>
          </div>
        ))}
      </fieldset>

      <Field label="Anything else we should know" htmlFor="note">
        <Textarea id="note" name="note" rows={4} maxLength={500} />
        <p className="mt-2 text-body-s text-ink-950/60">Up to 500 characters.</p>
      </Field>

      <Field label="Area you're in" htmlFor="locality" required>
        <Select id="locality" name="locality" required defaultValue="">
          <option value="" disabled>
            Choose…
          </option>
          {LOCALITIES.map((locality) => (
            <option key={locality} value={locality}>
              {locality}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Pincode" htmlFor="pincode" hint="Optional. Helps us confirm the area.">
        <Input id="pincode" name="pincode" inputMode="numeric" maxLength={6} placeholder="110095" />
      </Field>

      <fieldset className="space-y-4">
        <legend className="text-label uppercase text-ink-950">Preferred days</legend>
        {["weekdays", "weekends"].map((day) => (
          <div key={day} className="flex items-center gap-4">
            <input
              type="checkbox"
              id={`days-${day}`}
              name="preferredDays"
              value={day}
              className="h-5 w-5 accent-neem-600"
            />
            <label htmlFor={`days-${day}`} className="text-body">
              {day === "weekdays" ? "Weekdays (Mon–Fri)" : "Weekends"}
            </label>
          </div>
        ))}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-label uppercase text-ink-950">Preferred time</legend>
        {["morning", "afternoon", "evening"].map((time) => (
          <div key={time} className="flex items-center gap-4">
            <input
              type="checkbox"
              id={`times-${time}`}
              name="preferredTimes"
              value={time}
              className="h-5 w-5 accent-neem-600"
            />
            <label htmlFor={`times-${time}`} className="text-body">
              {time === "morning" ? "Morning (9–12)" : time === "afternoon" ? "Afternoon (12–4)" : "Evening (4–8)"}
            </label>
          </div>
        ))}
      </fieldset>

      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          id="forMinor"
          name="forMinor"
          checked={forMinor}
          onChange={(e) => setForMinor(e.target.checked)}
          className="h-5 w-5 accent-neem-600"
        />
        <label htmlFor="forMinor" className="text-body">
          Booking for someone under 18?
        </label>
      </div>

      {forMinor && (
        <p role="status" className="rounded border border-clay-600 bg-chalk-0 px-4 py-3 text-body-s text-clay-600">
          {MINOR_NOTE}
        </p>
      )}

      <ConsentBlock disabled={forMinor} />

      {state.status === "guardian" && (
        <p role="alert" className="text-body-s text-clay-600">
          {MINOR_NOTE}
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="text-body-s text-clay-600">
          {state.error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending || forMinor}
          className="inline-flex items-center justify-center rounded bg-marigold-500 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send my request"}
        </button>
      </div>
    </form>
  );
}
