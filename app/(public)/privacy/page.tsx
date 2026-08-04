import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/site/Section";
import { NOTICE_VERSION } from "@/lib/consent";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "What Smile Please collects, why we collect it, how long we keep it, who we share it with, and how to withdraw consent.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/privacy` },
};

const collectedFields = [
  ["Full name", "To address you properly and match you with a dentist"],
  ["Phone number", "To confirm the appointment and to contact you about it"],
  ["Email address", "To send you your reference code and appointment updates"],
  ["Age band (not date of birth)", "To plan the right care and medicines"],
  ["Locality and pincode, never your street address", "To match you with a dentist near you"],
  ["What's wrong, and anything you tell us about it", "So the dentist knows what to prepare"],
  ["Preferred days and times", "To find a slot that works for you"],
  ["Booking and consent records", "To operate the service and meet our legal duties"],
];

const purposes = [
  [
    "Booking and care",
    "Everything needed to arrange treatment: identity, contact details, what you told us about your problem, and the appointment itself.",
  ],
  [
    "Awareness updates (optional)",
    "Occasional posts about camp dates and oral health. Only if you tick the separate box — we never bundle it with booking consent.",
  ],
];

const sharing = [
  ["Supabase (hosted database and authentication)", "USA/EU data centres", "Stores your account and booking data"],
  ["Brevo (transactional email)", "EU data centres", "Sends you booking confirmations and updates"],
  ["Vercel (website hosting)", "Global edge network", "Serves this website; logs are stripped of personal data"],
];

export default function PrivacyPage() {
  return (
    <>
      <Section marker="Privacy" className="pt-24">
        <h1 className="text-display-l">Privacy notice</h1>
        <p className="mt-6 max-w-[65ch] text-body-l text-ink-950/70">
          This notice explains what we collect, why, how long we keep it, who we share it with,
          and how to exercise your rights under Indian data-protection law.
        </p>

        {/* LEGAL-REVIEW-REQUIRED: this notice must be reviewed by an Indian practitioner
            before real patient data is collected. */}

        <h2 className="mt-24 text-display-m">1. Who we are</h2>
        <dl className="mt-8 space-y-6">
          <div>
            <dt className="font-utility text-label uppercase text-neem-600">Data fiduciary</dt>
            <dd className="mt-2 text-body">Smile Please (registered public charitable trust)</dd>
          </div>
          <div>
            <dt className="font-utility text-label uppercase text-neem-600">Registered address</dt>
            {/* CLIENT-COPY: replace with the trust's registered address. */}
            <dd className="mt-2 text-body">c/o [clinic name], New Delhi — [pin]</dd>
          </div>
          <div>
            <dt className="font-utility text-label uppercase text-neem-600">Grievance contact</dt>
            {/* CLIENT-COPY: replace with the named data-protection contact. */}
            <dd className="mt-2 text-body">[name], [email] — we answer within 7 working days</dd>
          </div>
        </dl>
      </Section>

      <Section marker="What we collect" className="border-t border-neem-100 py-24">
        <h2 className="text-display-m">2. What we collect</h2>
        <p className="mt-6 max-w-[65ch] text-body">
          Only what the service needs. If a field is optional, it stays optional.
        </p>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full border-collapse text-body-s">
            <thead>
              <tr className="border-b-2 border-neem-100 text-left">
                <th scope="col" className="py-3 pr-6 font-utility text-label uppercase text-neem-600">
                  Field
                </th>
                <th scope="col" className="py-3 font-utility text-label uppercase text-neem-600">
                  Why we collect it
                </th>
              </tr>
            </thead>
            <tbody>
              {collectedFields.map(([field, why]) => (
                <tr key={field} className="border-b border-neem-100 align-top">
                  <td className="py-4 pr-6 font-medium">{field}</td>
                  <td className="py-4">{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-8 max-w-[65ch] text-body-s text-ink-950/60">
          We never collect your date of birth (only an age band, and for under-18s no details at
          all — a parent or guardian books in their own name), a street address, your DCI
          registration number, or anything from public records about you. Your clinical note is
          kept out of your own account view: it is written by the dentist for the dentist.
        </p>
      </Section>

      <Section marker="Why we collect it" className="border-t border-neem-100 py-24">
        <h2 className="text-display-m">3. Why we collect it</h2>
        <ul className="mt-10 space-y-10">
          {purposes.map(([purpose, why]) => (
            <li key={purpose} className="max-w-[65ch]">
              <h3 className="text-display-m">{purpose}</h3>
              <p className="mt-3 text-body text-ink-950/80">{why}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section marker="How long we keep it" className="border-t border-neem-100 py-24">
        <h2 className="text-display-m">4. How long we keep it</h2>
        <ul className="mt-8 max-w-[65ch] list-disc space-y-4 pl-6 text-body">
          <li>Booking records and consent records: 12 months after the last activity.</li>
          <li>Audit logs (who read or changed a record): 12 months.</li>
          <li>Contact messages: 12 months after they are resolved.</li>
          <li>Anything you withdraw consent for is deleted or anonymised within 30 days.</li>
        </ul>
      </Section>

      <Section marker="Who we share it with" className="border-t border-neem-100 py-24">
        <h2 className="text-display-m">5. Who we share it with</h2>
        <p className="mt-6 max-w-[65ch] text-body">
          We do not sell data, and we do not show your details publicly. The named processors
          below touch data only to run the service:
        </p>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full border-collapse text-body-s">
            <thead>
              <tr className="border-b-2 border-neem-100 text-left">
                <th scope="col" className="py-3 pr-6 font-utility text-label uppercase text-neem-600">
                  Processor
                </th>
                <th scope="col" className="py-3 pr-6 font-utility text-label uppercase text-neem-600">
                  Where
                </th>
                <th scope="col" className="py-3 font-utility text-label uppercase text-neem-600">
                  What they do
                </th>
              </tr>
            </thead>
            <tbody>
              {sharing.map((row) => (
                <tr key={row[0]} className="border-b border-neem-100 align-top">
                  <td className="py-4 pr-6 font-medium">{row[0]}</td>
                  <td className="py-4 pr-6">{row[1]}</td>
                  <td className="py-4">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section marker="Your rights" className="border-t border-neem-100 py-24">
        <h2 className="text-display-m">6. Your rights</h2>
        <ul className="mt-8 max-w-[65ch] list-disc space-y-4 pl-6 text-body">
          <li>
            <strong>Access:</strong> download everything we hold about you from your account, or
            ask us and we&apos;ll send a copy within 30 days.
          </li>
          <li>
            <strong>Correction:</strong> fix your name, phone, locality, or age band in your
            account, or tell us what to change.
          </li>
          <li>
            <strong>Erasure:</strong> ask us to delete your data. Where the law lets us, we do.
          </li>
          <li>
            <strong>Grievance redressal:</strong> our grievance contact answers within 7 working
            days.
          </li>
          <li>
            <strong>Nominate someone:</strong> name a person who may act on your data rights if
            you become unable to.
          </li>
        </ul>
      </Section>

      <Section marker="Withdrawing consent" className="border-t border-neem-100 py-24">
        <h2 className="text-display-m">7. How to withdraw consent</h2>
        <p className="mt-6 max-w-[65ch] text-body">
          Consent is per purpose. Withdrawal is as easy as granting it: open your account, see
          what you agreed to, and revoke it. Withdrawing our awareness updates takes effect
          immediately. Withdrawing booking consent cancels any pending appointments, because we
          can&apos;t arrange care without your details.
        </p>
        <Link
          href="/account"
          className="mt-8 inline-flex items-center justify-center rounded bg-marigold-500 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95"
        >
          Manage consent in your account
        </Link>
      </Section>

      <Section marker="Children" className="border-t border-neem-100 py-24">
        <h2 className="text-display-m">8. Children&apos;s data</h2>
        <p className="mt-6 max-w-[65ch] text-body">
          Bookings for anyone under 18 must be made by a parent or guardian, who stands as the
          data principal. We do not collect the child&apos;s name, age, or any other detail in the
          booking form. If a child appears at a clinic unaccompanied, the dentist will handle it
          as the law requires before any treatment.
        </p>
      </Section>

      <Section marker="Complaints" className="border-t border-neem-100 py-24">
        <h2 className="text-display-m">9. How to complain</h2>
        <p className="mt-6 max-w-[65ch] text-body">
          Tried us first and not satisfied? You can complain to the Data Protection Board of
          India — the process is published at the board&apos;s website, and you can also approach
          it through the{" "}
          <a
            href="https://www.meity.gov.in"
            className="font-medium text-neem-600 underline underline-offset-4"
          >
            Ministry of Electronics &amp; IT
          </a>
          .
        </p>
        <p className="mt-16 border-t border-neem-100 pt-8 font-utility text-body-s text-ink-950/70">
          Notice version: {NOTICE_VERSION}
        </p>
      </Section>
    </>
  );
}
