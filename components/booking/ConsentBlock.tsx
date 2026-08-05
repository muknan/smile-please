import Link from "next/link";

/**
 * Inline consent block (Phase 5 §5.4/5.8, Master §9.7). The consent text
 * renders on the form — never behind a link only. Two separate checkboxes:
 * booking consent (required, carries its own text) and a distinct,
 * never-pre-ticked awareness-updates opt-in.
 */
export function ConsentBlock({ disabled }: { disabled?: boolean }) {
  return (
    <fieldset
      disabled={disabled}
      className="space-y-6 rounded-card border border-neem-100 bg-chalk-0 p-6"
    >
      <legend className="font-utility text-label uppercase text-ink-950">Consent</legend>

      <div className="flex gap-4">
        <input
          type="checkbox"
          id="consentBooking"
          name="consentBooking"
          required
          aria-describedby="consent-booking-note"
          className="choice-control mt-1"
        />
        <div>
          <label htmlFor="consentBooking" className="text-body">
            I agree that Smile Please can store my name, phone number and the details
            above so a dentist can be arranged for me, and can contact me about this
            appointment. I can withdraw this at any time.
          </label>
          <p id="consent-booking-note" className="mt-2 text-body-s text-ink-950/60">
            <Link href="/privacy" className="font-medium text-neem-600 underline underline-offset-4">
              Read the full privacy notice
            </Link>{" "}
            — it explains what we keep, why, and how to withdraw.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <input
          type="checkbox"
          id="consentUpdates"
          name="consentUpdates"
          className="choice-control mt-1"
        />
        <label htmlFor="consentUpdates" className="text-body">
          I&apos;d also like occasional updates about camp dates and oral health. This is
          separate from booking consent — you can unsubscribe any time.
        </label>
      </div>
    </fieldset>
  );
}
