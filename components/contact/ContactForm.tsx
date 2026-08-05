"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { submitContact, type ContactState } from "@/app/(public)/contact/actions";
import {
  CONTACT_TABS,
  TAB_LABELS,
  PARTNERSHIP_OPTIONS,
  PARTNERSHIP_LABELS,
  whatsappHref,
  type ContactTab,
} from "@/lib/contact";

const CONSENT_COPY: Record<ContactTab, string> = {
  patient:
    "I agree that Smile Please can store my name, phone number and message so a member of the team can reply. I can withdraw this at any time.",
  dentist:
    "I agree that Smile Please can store my details and message so the team can contact me about volunteering. I can withdraw this at any time.",
  organization:
    "I agree that Smile Please can store these details and message so the team can contact us about the partnership. We can withdraw this at any time.",
};

export function ContactForm({
  initialTab,
  renderedAt,
  whatsappNumberSet,
}: {
  initialTab: ContactTab;
  renderedAt: string;
  whatsappNumberSet: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<ContactTab>(initialTab);
  const [state, formAction, pending] = useActionState<ContactState, FormData>(submitContact, {
    status: "idle",
  });

  const wa = whatsappHref(tab, whatsappNumberSet);

  const switchTab = (next: ContactTab) => {
    setTab(next);
    router.replace(`/contact?tab=${next}`, { scroll: false });
  };

  if (state.status === "success") {
    return (
      <div className="max-w-[65ch] rounded-card border border-neem-100 bg-chalk-0 p-10">
        <p className="font-utility text-label uppercase text-neem-600">Message received</p>
        <h2 className="mt-4 text-display-m">Thanks — it&apos;s with a real person now.</h2>
        <p className="mt-4 text-body text-ink-950/80">
          Your reference is <strong className="text-neem-600">{state.ref}</strong>.{" "}
          {/* CLIENT-COPY: replace with the named member of the team who reads this mailbox. */}
          [Name] or someone from the team will get back to you within 2 working days. Keep the
          reference if you need to follow up.
        </p>
        <Link
          href="/privacy"
          className="mt-8 inline-block font-utility text-body-s font-medium text-neem-600 underline underline-offset-4"
        >
          How we use your details
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* WhatsApp alternative — hidden entirely when the env var is unset. */}
      {wa && (
        <a
          href={wa}
          className="inline-flex items-center gap-3 rounded-card border border-neem-100 bg-chalk-0 px-6 py-4 transition hover:border-neem-600"
        >
          <span className="text-body font-medium text-ink-950">Prefer WhatsApp?</span>
          <span className="font-utility text-body-s text-neem-600">
            Message us directly about “{TAB_LABELS[tab]}”
          </span>
        </a>
      )}

      <div role="tablist" aria-label="What best describes you?" className="flex flex-wrap gap-2">
        {CONTACT_TABS.map((t) => (
          <button
            key={t}
            role="tab"
            id={`contact-tab-${t}`}
            aria-selected={tab === t}
            aria-controls="contact-panel"
            onClick={() => switchTab(t)}
            className={
              tab === t
                ? "rounded-full bg-neem-900 px-5 py-2.5 font-utility text-body-s font-medium text-chalk-0 transition"
                : "rounded-full border border-neem-100 bg-chalk-0 px-5 py-2.5 font-utility text-body-s font-medium text-ink-950 transition hover:border-neem-600"
            }
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "dentist" && (
        <p className="max-w-[60ch] rounded-card border border-neem-100 bg-chalk-0 p-6 text-body text-ink-950/80">
          We&apos;re looking for dentists who can give a few hours a month. Tell us when
          you&apos;re free and we&apos;ll be in touch.
        </p>
      )}

      <form action={formAction} className="max-w-[65ch] space-y-8" aria-live="polite">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-px w-px"
        />
        <input type="hidden" name="renderedAt" value={renderedAt} />
        <input type="hidden" name="tab" value={tab} />

        {tab === "patient" && (
          <>
            <Field label="Full name" htmlFor="contact-name" required>
              <Input id="contact-name" name="name" autoComplete="name" required />
            </Field>
            <Field
              label="Phone"
              htmlFor="contact-phone"
              required
              hint="We only call if we need to confirm something about your message."
            >
              <Input id="contact-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue="+91" required />
            </Field>
            <Field label="Email" htmlFor="contact-email" hint="Optional — reply by email instead of phone.">
              <Input id="contact-email" name="email" type="email" autoComplete="email" />
            </Field>
            <Field label="Your message" htmlFor="contact-message" required>
              <Textarea id="contact-message" name="message" rows={5} maxLength={1000} required />
            </Field>
          </>
        )}

        {tab === "dentist" && (
          <>
            <Field label="Your name" htmlFor="contact-name" required>
              <Input id="contact-name" name="name" autoComplete="name" required />
            </Field>
            <Field label="Phone" htmlFor="contact-phone" required>
              <Input id="contact-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue="+91" required />
            </Field>
            <Field label="Email" htmlFor="contact-email" required hint="We reply here, usually within two working days.">
              <Input id="contact-email" name="email" type="email" autoComplete="email" required />
            </Field>
            <Field label="DCI registration number" htmlFor="contact-dci" hint="Optional, but it speeds things up.">
              <Input id="contact-dci" name="dciRegNo" autoComplete="off" maxLength={40} />
            </Field>
            <Field label="Clinic area" htmlFor="contact-area" required hint="Which area of Delhi can you practise in?">
              <Input id="contact-area" name="clinicArea" required maxLength={120} />
            </Field>
            <Field label="When you're free" htmlFor="contact-when" hint="Evenings, weekends, a half-day a month — anything helps.">
              <Input id="contact-when" name="availability" maxLength={200} />
            </Field>
            <Field label="Your message" htmlFor="contact-message" required>
              <Textarea id="contact-message" name="message" rows={5} maxLength={1000} required placeholder="Tell us a little about your practice and what you'd like to do." />
            </Field>
          </>
        )}

        {tab === "organization" && (
          <>
            <Field label="Organisation name" htmlFor="contact-org" required>
              <Input id="contact-org" name="organizationName" autoComplete="organization" required />
            </Field>
            <Field label="Contact person" htmlFor="contact-person" required>
              <Input id="contact-person" name="contactPerson" autoComplete="name" required />
            </Field>
            <Field label="Email" htmlFor="contact-email" required>
              <Input id="contact-email" name="email" type="email" autoComplete="email" required />
            </Field>
            <Field label="Phone" htmlFor="contact-phone" hint="Optional.">
              <Input id="contact-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue="+91" />
            </Field>
            <Field label="Partnership type" htmlFor="contact-partnership" required>
              <Select id="contact-partnership" name="partnershipType" required defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {PARTNERSHIP_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {PARTNERSHIP_LABELS[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Your message" htmlFor="contact-message" required>
              <Textarea id="contact-message" name="message" rows={5} maxLength={1000} required />
            </Field>
          </>
        )}

        <fieldset className="space-y-4 rounded-card border border-neem-100 bg-chalk-0 p-6">
          <legend className="font-utility text-label uppercase text-ink-950">Consent</legend>
          <div className="flex gap-4">
            <input
              type="checkbox"
              id="consentContact"
              name="consentContact"
              required
              className="mt-1 h-5 w-5 shrink-0 rounded border-neem-100 accent-neem-600"
            />
            <div>
              <label htmlFor="consentContact" className="text-body">
                {CONSENT_COPY[tab]}
              </label>
              <p className="mt-2 text-body-s text-ink-950/60">
                <Link href="/privacy" className="font-medium text-neem-600 underline underline-offset-4">
                  Read the full privacy notice
                </Link>{" "}
                — it explains what we keep, why, and how to withdraw.
              </p>
            </div>
          </div>
        </fieldset>

        {state.status === "error" && (
          <p role="alert" className="text-body-s text-clay-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded bg-marigold-500 px-8 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
