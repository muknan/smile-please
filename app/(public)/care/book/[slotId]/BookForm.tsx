"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { fieldError } from "@/lib/form-errors";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConsentBlock } from "@/components/booking/ConsentBlock";
import { AGE_BANDS, REASONS } from "@/lib/schemas";
import { AGE_BAND_LABELS, REASON_CATEGORY_LABELS } from "@/lib/booking";
import { confirmSlotBooking, type BookDetails, type BookState } from "../actions";

export function BookForm({ details }: { details: BookDetails }) {
  const action = confirmSlotBooking.bind(null, details);
  const [state, formAction] = useActionState<BookState, FormData>(
    action,
    { status: "idle" },
  );
  const issues = state.status === "error" ? state.issues : undefined;
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
    if (state.status === "error" && state.issues?.length) {
      const first = state.issues[0];
      const el = first.path === "reason"
        ? formRef.current?.querySelector('[name="reason"]')
        : formRef.current?.querySelector(`[id="${first.path}"]`);
      if (el instanceof HTMLElement) el.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div className="max-w-[65ch] rounded-card border border-neem-100 bg-chalk-0 p-10">
        <h2 ref={successRef} tabIndex={-1} role="status" className="text-display-m focus:outline-none">
          {state.isReschedule ? "Your appointment moved." : "Booking confirmed."}
        </h2>
        <p className="mt-4 text-body-l">
          Your reference is{" "}
          <span className="font-utility font-semibold tabular-nums text-neem-600">
            {state.ref}
          </span>
          .
        </p>
        {state.isReschedule ? (
          <p className="mt-4 text-body text-ink-950/80">
            The dentist will see you at the new time. Your old slot is freed for
            someone else.
          </p>
        ) : (
          <p className="mt-4 text-body text-ink-950/80">
            Keep the reference safe — you can track the appointment with it and
            your phone number.
          </p>
        )}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/care/status"
            className="inline-flex items-center justify-center rounded bg-marigold-500 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95"
          >
            Track this appointment
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded border border-neem-100 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:border-neem-600"
          >
            Back to the site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction}>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0"
      />
      <input type="hidden" name="renderedAt" value={details.renderedAt} />

      {state.status === "error" && (
        <p role="alert" tabIndex={-1} className="rounded-card border border-clay-600 bg-clay-600/5 px-4 py-3 text-body-s text-clay-600">
          {state.error}
        </p>
      )}

      <section className="mt-10 first:mt-0">
        <h2 className="font-utility text-label uppercase text-ink-950">About you</h2>
        <div className="mt-6 space-y-6">
          <Field label="Full name" htmlFor="fullName" required error={fieldError(issues, "fullName")}>
            <Input id="fullName" name="fullName" autoComplete="name" required />
          </Field>

          <Field
            label="Phone"
            htmlFor="phone"
            required
            hint="We only use this to confirm the appointment. Format: +91 98765 43210."
            error={fieldError(issues, "phone")}
          >
            <Input id="phone" name="phone" type="tel" inputMode="tel" placeholder="+91" required />
          </Field>

          <Field
            label="Email"
            htmlFor="email"
            hint="Optional. We use it for appointment emails and a sign-in link to your account."
            error={fieldError(issues, "email")}
          >
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
          </Field>

          <Field label="Age band" htmlFor="ageBand" required error={fieldError(issues, "ageBand")}>
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
        </div>
      </section>

      <section className="mt-10 border-t border-neem-100 pt-10">
        <h2 className="font-utility text-label uppercase text-ink-950">What&apos;s wrong</h2>
        <p className="mt-2 text-body-s text-ink-950/60">
          Just so the dentist can prepare for your visit.
        </p>
        <div className="mt-6 space-y-6">
          <fieldset className="space-y-4">
            <legend className="text-label uppercase text-ink-950">What&apos;s wrong?<span aria-hidden="true" className="text-marigold-500"> *</span></legend>
            {fieldError(issues, "reason") && (
              <p role="alert" className="text-body-s text-clay-600">{fieldError(issues, "reason")}</p>
            )}
            {REASONS.map((reason) => (
              <div key={reason} className="flex items-center gap-4">
                <input
                  type="radio"
                  id={`reason-${reason}`}
                  name="reason"
                  value={reason}
                  required
                  className="choice-control"
                />
                <label htmlFor={`reason-${reason}`} className="cursor-pointer text-body">
                  {REASON_CATEGORY_LABELS[reason]}
                </label>
              </div>
            ))}
          </fieldset>

          <Field label="Anything else we should know" htmlFor="note">
            <Textarea id="note" name="note" rows={3} maxLength={500} />
          </Field>

          <Field label="Pincode" htmlFor="pincode" hint="Optional." error={fieldError(issues, "pincode")}>
            <Input id="pincode" name="pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} placeholder="110095" />
          </Field>
        </div>
      </section>

      <section className="mt-10 border-t border-neem-100 pt-10">
        <ConsentBlock />
      </section>

      <div className="mt-10">
        <SubmitButton pendingLabel="Confirming…">Confirm booking</SubmitButton>
        <p className="mt-3 text-body-s text-ink-950/60">
          Confirming books the slot. It&apos;s free, and you can cancel up to 24 hours
          before.
        </p>
      </div>
    </form>
  );
}
