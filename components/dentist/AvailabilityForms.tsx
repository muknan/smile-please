"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  addSingleSlot,
  addWeeklyPattern,
  blockDay,
  type SlotFormState,
} from "@/app/dentist/actions";

const WEEKDAYS = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
  { value: "sun", label: "Sunday" },
];

function Outcome({ state }: { state: SlotFormState }) {
  if (state.ok) {
    return (
      <p role="status" className="mt-4 text-body-s text-neem-600">
        {state.message}
      </p>
    );
  }
  if (state.error) {
    return (
      <p role="alert" className="mt-4 text-body-s text-clay-600">
        {state.error}
      </p>
    );
  }
  return null;
}

function LocationFields() {
  return (
    <fieldset>
      <legend className="text-label uppercase text-ink-950">Location</legend>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="locationType"
            value="clinic"
            defaultChecked
            className="choice-control"
          />
          Clinic
        </label>
        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="locationType"
            value="camp"
            className="choice-control"
          />
          Camp
        </label>
        <input
          type="text"
          name="campName"
          placeholder="Camp name (if camp)"
          className="rounded border border-neem-100 bg-chalk-0 px-3 py-2 text-body"
        />
      </div>
    </fieldset>
  );
}

function SingleSlotForm() {
  const [state, formAction, pending] = useActionState<SlotFormState, FormData>(
    addSingleSlot,
    { ok: false },
  );
  return (
    <form action={formAction} className="mt-6 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Date (Delhi)" htmlFor="s-date" required>
          <Input id="s-date" name="date" type="date" required />
        </Field>
        <Field label="Start time" htmlFor="s-time" required>
          <Input id="s-time" name="time" type="time" required />
        </Field>
        <Field label="Duration" htmlFor="s-duration" required>
          <Select id="s-duration" name="duration" defaultValue="30">
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
          </Select>
        </Field>
      </div>
      <LocationFields />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neem-900 px-6 py-3 font-utility text-body-s font-medium text-chalk-0 transition hover:bg-neem-600 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add single slot"}
      </button>
      <Outcome state={state} />
    </form>
  );
}

function WeeklyForm() {
  const [state, formAction, pending] = useActionState<SlotFormState, FormData>(
    addWeeklyPattern,
    { ok: false },
  );
  return (
    <form action={formAction} className="mt-6 space-y-6">
      <fieldset>
        <legend className="text-label uppercase text-ink-950">Repeat on</legend>
        <div className="mt-4 flex flex-wrap gap-3">
          {WEEKDAYS.map((day) => (
            <label key={day.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="days"
                value={day.value}
                className="choice-control"
              />
              <span className="text-body">{day.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Start time" htmlFor="w-time" required>
          <Input id="w-time" name="time" type="time" required />
        </Field>
        <Field label="Duration" htmlFor="w-duration" required>
          <Select id="w-duration" name="duration" defaultValue="30">
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
          </Select>
        </Field>
        <Field label="From (Delhi date)" htmlFor="w-from" required>
          <Input id="w-from" name="from" type="date" required />
        </Field>
        <Field label="To" htmlFor="w-to" required>
          <Input id="w-to" name="to" type="date" required />
        </Field>
      </div>
      <LocationFields />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neem-900 px-6 py-3 font-utility text-body-s font-medium text-chalk-0 transition hover:bg-neem-600 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add weekly pattern"}
      </button>
      <Outcome state={state} />
    </form>
  );
}

function BlockForm() {
  const [state, formAction, pending] = useActionState<SlotFormState, FormData>(
    blockDay,
    { ok: false },
  );
  return (
    <form action={formAction} className="mt-6 space-y-6">
      <Field
        label="Date to block"
        htmlFor="b-date"
        hint="Removes that day from the public calendar. If a slot already exists then, delete it first."
      >
        <Input id="b-date" name="date" type="date" required />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-clay-600 px-6 py-3 font-utility text-body-s font-medium text-clay-600 transition hover:bg-clay-600 hover:text-chalk-0 disabled:opacity-50"
      >
        {pending ? "Blocking…" : "Block this day"}
      </button>
      <Outcome state={state} />
    </form>
  );
}

export function AvailabilityForms() {
  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-2">
      <section className="rounded-card border border-neem-100 bg-chalk-0 p-8">
        <h2 className="text-display-m">Add a single slot</h2>
        <SingleSlotForm />
      </section>
      <section className="rounded-card border border-neem-100 bg-chalk-0 p-8">
        <h2 className="text-display-m">Weekly pattern</h2>
        <WeeklyForm />
      </section>
      <section className="rounded-card border border-neem-100 bg-chalk-0 p-8">
        <h2 className="text-display-m">Block a day</h2>
        <BlockForm />
      </section>
    </div>
  );
}
