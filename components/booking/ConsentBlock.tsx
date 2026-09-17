import Link from "next/link";

/**
 * Inline consent block (Phase 5 §5.4/5.8, Master §9.7). The consent text
 * renders on the form — never behind a link only. Two separate checkboxes:
 * booking consent (required, carries its own text) and a distinct,
 * never-pre-ticked awareness-updates opt-in.
 */
export function ConsentBlock({ disabled, error }: { disabled?: boolean; error?: string }) {
  return (
    <fieldset
      disabled={disabled}
      className={`consent-surface space-y-6 transition hover:border-neem-600 disabled:cursor-not-allowed disabled:opacity-60 ${error ? "border-clay-600" : ""}`}
    >
      <legend className="rounded-full bg-neem-900 px-3 py-1 font-utility text-label font-semibold text-chalk-0">Consent and privacy</legend>

      <div className="flex gap-4">
        <input
          type="checkbox"
          id="consentBooking"
          name="consentBooking"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "consent-booking-error consent-booking-note" : "consent-booking-note"}
          className="choice-control mt-1"
        />
        <div>
          <label htmlFor="consentBooking" className="text-body">
            <span className="mr-2 inline-flex rounded-full bg-marigold-100 px-2 py-0.5 font-utility text-label font-semibold">Required</span>
            I agree that Smile Please can store my name, phone number and the details
            above so a dentist can be arranged for me, and can contact me about this
            appointment. I can withdraw this at any time.
          </label>
          <p id="consent-booking-note" className="mt-2 text-body-s text-ink-950/70">
            <Link href="/privacy" className="font-medium text-neem-600 underline underline-offset-4">
              Read the full privacy notice
            </Link>. It explains what we keep, why, and how to withdraw.
          </p>
        </div>
      </div>

      {error && <p id="consent-booking-error" role="alert" className="text-body-s font-medium text-clay-600">{error}</p>}

      <div className="flex gap-4">
        <input
          type="checkbox"
          id="consentUpdates"
          name="consentUpdates"
          className="choice-control mt-1"
        />
        <label htmlFor="consentUpdates" className="text-body">
          <span className="mr-2 inline-flex rounded-full border border-neem-200 bg-chalk-0 px-2 py-0.5 font-utility text-label font-semibold">Optional</span>
          I&apos;d also like occasional updates about camp dates and oral health. This is
          separate from booking consent. You can unsubscribe any time.
        </label>
      </div>
    </fieldset>
  );
}
