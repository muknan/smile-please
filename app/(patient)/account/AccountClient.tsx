"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { STATUS_LABELS, AGE_BAND_LABELS, REASON_CATEGORY_LABELS } from "@/lib/booking";
import { LOCALITIES, AGE_BANDS } from "@/lib/schemas";
import { formatDate, formatTime } from "@/lib/format";
import { cancelAppointment, updateProfile, withdrawConsent } from "./actions";
import type { Database } from "@/types/db";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  reason_category: Database["public"]["Enums"]["reason_category"];
};
type Consent = Database["public"]["Tables"]["consents"]["Row"];

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

function AppointmentRow({
  appointment,
  dentistSlug,
}: {
  appointment: Appointment;
  dentistSlug?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cancellable = ["requested", "assigned", "confirmed"].includes(appointment.status);
  const reschedulable =
    cancellable &&
    !!appointment.scheduled_for &&
    new Date(appointment.scheduled_for).getTime() - Date.now() > 24 * 60 * 60 * 1000;

  const cancel = () => {
    const reason = window.prompt("Tell us why you're cancelling (optional)", "");
    if (reason === null) return;
    startTransition(async () => {
      const state = await cancelAppointment(
        appointment.id,
        reason.trim() === "" ? "Cancelled by patient" : reason.trim(),
      );
      if (state.status === "ok") {
        setMessage(state.message);
        setError(null);
      } else {
        setError(state.status === "error" ? state.error : "Try again.");
      }
    });
  };

  return (
    <li className="rounded-card border border-neem-100 bg-chalk-0 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-utility text-body-s tabular-nums text-ink-950/60">
            {appointment.reference_code}
            {appointment.source === "self_booked" && <span> · self-booked</span>}
          </p>
          <h3 className="mt-2 text-display-m">
            {appointment.scheduled_for
              ? `${formatDate(appointment.scheduled_for)}, ${formatTime(appointment.scheduled_for)}`
              : "Awaiting a time"}
          </h3>
          <p className="mt-1 text-body-s text-ink-950/70">
            {REASON_CATEGORY_LABELS[appointment.reason_category]}
          </p>
        </div>
        <Badge tone={TONE[appointment.status] ?? "neutral"}>
          {STATUS_LABELS[appointment.status] ?? appointment.status}
        </Badge>
      </div>

      {message && (
        <p role="status" className="mt-4 text-body-s text-neem-600">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-body-s text-clay-600">
          {error}
        </p>
      )}

      {(cancellable || reschedulable) && (
        <div className="mt-6 flex flex-wrap gap-4">
          {reschedulable && dentistSlug && (
            <Link
              href={`/care/dentists/${dentistSlug}?reschedule=${appointment.id}`}
              className="inline-flex items-center justify-center rounded border border-neem-100 px-4 py-2 font-utility text-body-s font-medium text-ink-950 transition hover:border-neem-600"
            >
              Change the time
            </Link>
          )}
          {reschedulable && !dentistSlug && (
            <p className="mt-4 text-body-s text-ink-950/60">
              To change the time, call our team — this dentist isn&apos;t taking
              self-service changes right now.
            </p>
          )}
          {cancellable && (
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="inline-flex items-center justify-center rounded border border-clay-600 px-4 py-2 font-utility text-body-s font-medium text-clay-600 transition hover:bg-clay-600 hover:text-chalk-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Cancelling…" : "Cancel appointment"}
            </button>
          )}
        </div>
      )}

      {!cancellable && (
        <p className="mt-4 text-body-s text-ink-950/60">
          {appointment.status.startsWith("cancelled_")
            ? `Cancelled: ${appointment.cancelled_reason ?? "no reason given"}`
            : "This appointment is past and can't be changed online."}
        </p>
      )}
    </li>
  );
}

export function AccountClient({
  profile,
  patient,
  upcoming,
  past,
  consents,
  slugByDentist,
}: {
  profile: Database["public"]["Tables"]["profiles"]["Row"];
  patient: Database["public"]["Tables"]["patients"]["Row"] | null;
  upcoming: Appointment[];
  past: Appointment[];
  consents: Consent[];
  slugByDentist: Map<string, string>;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeError, setNoticeError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const consentGranted = (purpose: string) =>
    consents.some((c) => c.purpose === purpose && c.withdrawn_at === null);
  const consentNotice = (purpose: string) =>
    consents.find((c) => c.purpose === purpose && c.withdrawn_at !== null)?.withdrawn_at ?? null;

  const withdraw = (purpose: "booking" | "awareness_updates") => {
    const warning =
      purpose === "booking"
        ? "Withdrawing booking consent cancels any pending appointments. Continue?"
        : "You'll stop receiving awareness updates immediately. Continue?";
    if (!window.confirm(warning)) return;
    startTransition(async () => {
      const state = await withdrawConsent(purpose);
      setNoticeError(null);
      setNotice(state.status === "ok" ? state.message : state.status === "error" ? state.error : null);
      if (state.status === "error") setNoticeError(state.error);
    });
  };

  return (
    <>
      {upcoming.length > 0 && (
        <section aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="text-display-m">
            Upcoming
          </h2>
          <ul className="mt-8 space-y-6">
            {upcoming.map((a) => (
              <AppointmentRow key={a.id} appointment={a} dentistSlug={slugByDentist.get(a.dentist_id ?? "")} />
            ))}
          </ul>
        </section>
      )}

      {upcoming.length === 0 && (
        <section className="rounded-card border border-neem-100 bg-chalk-0 p-10">
          <h2 className="text-display-m">No upcoming appointments</h2>
          <p className="mt-4 text-body-l text-ink-950/70">
            A check-up is free and takes about two minutes to arrange.
          </p>
          <Link
            href="/care"
            className="mt-8 inline-flex items-center justify-center rounded bg-marigold-500 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95"
          >
            Book a check-up
          </Link>
        </section>
      )}

      {past.length > 0 && (
        <section aria-labelledby="past-heading">
          <h2 id="past-heading" className="text-display-m">
            Past appointments
          </h2>
          <ul className="mt-8 space-y-6">
            {past.map((a) => (
              <AppointmentRow key={a.id} appointment={a} dentistSlug={slugByDentist.get(a.dentist_id ?? "")} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="details-heading">
        <h2 id="details-heading" className="text-display-m">
          Your details
        </h2>
        <form
          action={async (formData) => {
            const state = await updateProfile({ status: "idle" }, formData);
            setNoticeError(null);
            if (state.status === "ok") setNotice(state.message);
            else setNoticeError(state.status === "error" ? state.error : "Try again.");
          }}
          className="mt-8 grid max-w-[65ch] gap-6 md:grid-cols-2"
        >
          <Field label="Full name" htmlFor="edit-name" required>
            <Input id="edit-name" name="fullName" defaultValue={profile.full_name} required />
          </Field>
          <Field label="Phone" htmlFor="edit-phone" required>
            <Input id="edit-phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} required />
          </Field>
          <Field label="Area" htmlFor="edit-locality" required>
            <Select id="edit-locality" name="locality" defaultValue={patient?.locality ?? ""} required>
              <option value="" disabled>
                Choose…
              </option>
              {LOCALITIES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Age band" htmlFor="edit-age" required>
            <Select id="edit-age" name="ageBand" defaultValue={patient?.age_band ?? ""} required>
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
          <div className="md:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded bg-neem-900 px-6 py-3 font-utility text-body-s font-medium text-chalk-0 transition hover:bg-neem-600"
            >
              Save details
            </button>
          </div>
        </form>
      </section>

      <section aria-labelledby="consent-heading">
        <h2 id="consent-heading" className="text-display-m">
          Consent you&apos;ve given
        </h2>
        <p className="mt-4 max-w-[60ch] text-body text-ink-950/70">
          Withdrawing is as easy as granting. Each purpose is separate.
        </p>
        <ul className="mt-8 max-w-[65ch] space-y-4">
          <li className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-neem-100 bg-chalk-0 p-6">
            <div>
              <h3 className="text-body font-semibold">Booking and care</h3>
              <p className="mt-1 text-body-s text-ink-950/60">
                {consentGranted("booking")
                  ? "Granted · keeps your appointments possible"
                  : consentNotice("booking")
                    ? `Withdrawn on ${formatDate(consentNotice("booking")!)}`
                    : "Not granted"}
              </p>
            </div>
            {consentGranted("booking") && (
              <button
                type="button"
                onClick={() => withdraw("booking")}
                disabled={pending}
                className="rounded border border-clay-600 px-4 py-2 font-utility text-body-s font-medium text-clay-600 transition hover:bg-clay-600 hover:text-chalk-0 disabled:opacity-50"
              >
                Withdraw booking consent
              </button>
            )}
          </li>
          <li className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-neem-100 bg-chalk-0 p-6">
            <div>
              <h3 className="text-body font-semibold">Awareness updates</h3>
              <p className="mt-1 text-body-s text-ink-950/60">
                {consentGranted("awareness_updates")
                  ? "Granted · camp dates and oral health posts"
                  : consentNotice("awareness_updates")
                    ? `Withdrawn on ${formatDate(consentNotice("awareness_updates")!)}`
                    : "Not granted"}
              </p>
            </div>
            {consentGranted("awareness_updates") && (
              <button
                type="button"
                onClick={() => withdraw("awareness_updates")}
                disabled={pending}
                className="rounded border border-neem-100 px-4 py-2 font-utility text-body-s font-medium text-ink-950 transition hover:border-neem-600 disabled:opacity-50"
              >
                Stop updates
              </button>
            )}
          </li>
        </ul>
        {notice && (
          <p role="status" className="mt-6 text-body-s text-neem-600">
            {notice}
          </p>
        )}
        {noticeError && (
          <p role="alert" className="mt-6 text-body-s text-clay-600">
            {noticeError}
          </p>
        )}
      </section>
    </>
  );
}
