"use client";

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fieldError } from "@/lib/form-errors";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { SubmitButton } from "@/components/ui/SubmitButton";
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
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [state, formAction] = useActionState<ContactState, FormData>(submitContact, {
    status: "idle",
  });

  // D-28: persist typed values across tab switches.
  const setDraftField =
    (name: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setDraft((d) => ({ ...d, [name]: e.target.value }));
  const draftValue = (name: string) => draft[name] ?? "";

  const wa = whatsappHref(tab, whatsappNumberSet);
  const issues = state.status === "error" ? state.issues : undefined;
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
    if (state.status === "error" && state.issues?.length) {
      const first = state.issues[0];
      const el = formRef.current?.querySelector(`[name="${first.path}"]`);
      if (el instanceof HTMLElement) el.focus();
    }
  }, [state]);

  const switchTab = (next: ContactTab) => {
    setTab(next);
    router.replace(`/contact?tab=${next}`, { scroll: false });
  };

  if (state.status === "success") {
    return (
      <div className="max-w-[65ch] rounded-card border border-neem-100 bg-chalk-0 p-10">
        <p className="font-utility text-label uppercase text-neem-600">Message received</p>
        <h2 ref={successRef} tabIndex={-1} role="status" className="mt-4 text-display-m focus:outline-none">Thanks — it&apos;s with a real person now.</h2>
        <p className="mt-4 text-body text-ink-950/80">
          Your reference is <strong className="text-neem-600">{state.ref}</strong>.{" "}
          The Smile Please team will get back to you within 2 working days. Keep the reference if
          you need to follow up.
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
        {CONTACT_TABS.map((t, i) => (
          <button
            key={t}
            role="tab"
            id={`contact-tab-${t}`}
            aria-selected={tab === t}
            aria-controls="contact-panel"
            tabIndex={tab === t ? 0 : -1}
            onClick={() => switchTab(t)}
            onKeyDown={(e) => {
              // D-28: standard roving-tabindex tablist arrow/Home/End handling.
              const n = CONTACT_TABS.length;
              let next: number | null = null;
              if (e.key === "ArrowRight") next = (i + 1) % n;
              else if (e.key === "ArrowLeft") next = (i - 1 + n) % n;
              else if (e.key === "Home") next = 0;
              else if (e.key === "End") next = n - 1;
              if (next !== null) {
                e.preventDefault();
                const target = CONTACT_TABS[next];
                setTab(target);
                document.getElementById(`contact-tab-${target}`)?.focus();
              }
            }}
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

      <form ref={formRef} action={formAction} id="contact-panel" className="max-w-[65ch] space-y-8" aria-label={`${TAB_LABELS[tab]} form`}>
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
            <Field label="Full name" htmlFor="contact-name" required error={fieldError(issues, "name")}>
              <Input id="contact-name"  name="name" value={draftValue("name")} onChange={setDraftField("name")} autoComplete="name" required />
            </Field>
            <Field
              label="Phone"
              htmlFor="contact-phone"
              required
              hint="We only call if we need to confirm something about your message." error={fieldError(issues, "phone")}
            >
              <Input id="contact-phone"  name="phone" value={draftValue("phone")} onChange={setDraftField("phone")} type="tel" inputMode="tel" autoComplete="tel" defaultValue="+91" required />
            </Field>
            <Field label="Email" htmlFor="contact-email" hint="Optional — reply by email instead of phone." error={fieldError(issues, "email")}>
              <Input id="contact-email"  name="email" value={draftValue("email")} onChange={setDraftField("email")} type="email" autoComplete="email" />
            </Field>
            <Field label="Your message" htmlFor="contact-message" required error={fieldError(issues, "message")}>
              <Textarea id="contact-message"  name="message" value={draftValue("message")} onChange={setDraftField("message")} rows={5} maxLength={1000} required />
            </Field>
          </>
        )}

        {tab === "dentist" && (
          <>
            <Field label="Your name" htmlFor="contact-name" required error={fieldError(issues, "name")}>
              <Input id="contact-name"  name="name" value={draftValue("name")} onChange={setDraftField("name")} autoComplete="name" required />
            </Field>
            <Field label="Phone" htmlFor="contact-phone" required>
              <Input id="contact-phone"  name="phone" value={draftValue("phone")} onChange={setDraftField("phone")} type="tel" inputMode="tel" autoComplete="tel" defaultValue="+91" required />
            </Field>
            <Field label="Email" htmlFor="contact-email" required hint="We reply here, usually within two working days." error={fieldError(issues, "email")}>
              <Input id="contact-email"  name="email" value={draftValue("email")} onChange={setDraftField("email")} type="email" autoComplete="email" required />
            </Field>
            <Field label="DCI registration number" htmlFor="contact-dci" hint="Optional, but it speeds things up.">
              <Input id="contact-dci"  name="dciRegNo" value={draftValue("dciRegNo")} onChange={setDraftField("dciRegNo")} autoComplete="off" maxLength={40} />
            </Field>
            <Field label="Clinic area" htmlFor="contact-area" required hint="Which area of Delhi can you practise in?" error={fieldError(issues, "clinicArea")}>
              <Input id="contact-area"  name="clinicArea" value={draftValue("clinicArea")} onChange={setDraftField("clinicArea")} required maxLength={120} />
            </Field>
            <Field label="When you're free" htmlFor="contact-when" hint="Evenings, weekends, a half-day a month — anything helps.">
              <Input id="contact-when"  name="availability" value={draftValue("availability")} onChange={setDraftField("availability")} maxLength={200} />
            </Field>
            <Field label="Your message" htmlFor="contact-message" required error={fieldError(issues, "message")}>
              <Textarea id="contact-message"  name="message" value={draftValue("message")} onChange={setDraftField("message")} rows={5} maxLength={1000} required placeholder="Tell us a little about your practice and what you'd like to do." />
            </Field>
          </>
        )}

        {tab === "organization" && (
          <>
            <Field label="Organisation name" htmlFor="contact-org" required error={fieldError(issues, "organizationName")}>
              <Input id="contact-org"  name="organizationName" value={draftValue("organizationName")} onChange={setDraftField("organizationName")} autoComplete="organization" required />
            </Field>
            <Field label="Contact person" htmlFor="contact-person" required error={fieldError(issues, "contactPerson")}>
              <Input id="contact-person"  name="contactPerson" value={draftValue("contactPerson")} onChange={setDraftField("contactPerson")} autoComplete="name" required />
            </Field>
            <Field label="Email" htmlFor="contact-email" required error={fieldError(issues, "email")}>
              <Input id="contact-email"  name="email" value={draftValue("email")} onChange={setDraftField("email")} type="email" autoComplete="email" required />
            </Field>
            <Field label="Phone" htmlFor="contact-phone" hint="Optional.">
              <Input id="contact-phone"  name="phone" value={draftValue("phone")} onChange={setDraftField("phone")} type="tel" inputMode="tel" autoComplete="tel" defaultValue="+91" />
            </Field>
            <Field label="Partnership type" htmlFor="contact-partnership" required error={fieldError(issues, "partnershipType")}>
              <Select id="contact-partnership"  name="partnershipType" value={draftValue("partnershipType")} onChange={setDraftField("partnershipType")} required defaultValue="">
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
            <Field label="Your message" htmlFor="contact-message" required error={fieldError(issues, "message")}>
              <Textarea id="contact-message"  name="message" value={draftValue("message")} onChange={setDraftField("message")} rows={5} maxLength={1000} required />
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
              className="choice-control mt-1"
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

        <SubmitButton pendingLabel="Sending…">Send message</SubmitButton>
      </form>
    </div>
  );
}
