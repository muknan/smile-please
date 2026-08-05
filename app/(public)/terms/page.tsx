import type { Metadata } from "next";
import { Section } from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "The plain-language terms for using Smile Please: it's free, it doesn't create a doctor–patient relationship, and it is not for emergencies.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/terms` },
};

const terms = [
  {
    title: "The service is free",
    body: "Every appointment we arrange is free. No hidden charges, no payment gateway, no insurance forms. You will never be asked to pay through this website.",
  },
  {
    title: "Using the website is not treatment",
    body: "Booking through this site does not create a doctor–patient relationship. The dentist–patient relationship begins at the appointment. Nothing on this site, including our articles, is a diagnosis or a prescription — it is information.",
  },
  {
    title: "Appointments can move",
    body: "Volunteer dentists are human, and camps move with weather and health. We may have to reassign or cancel an appointment; we will tell you in good time and arrange a replacement. You can cancel or move your own appointment up to 24 hours before it is due — after that, call us and we'll sort it.",
  },
  {
    title: "This is not emergency care",
    body: "We do not provide emergency treatment.",
  },
];

export default function TermsPage() {
  return (
    <>
      <Section marker="Terms" className="pt-24" snap={false}>
        <h1 className="text-display-l">Terms of use</h1>
        <p className="mt-6 max-w-[65ch] text-body-l text-ink-950/70">
          Short and plain, because paperwork shouldn&apos;t need a lawyer. Using this website
          means you agree to these terms.
        </p>
      </Section>

      {/* A visible emergency line: this is a health service and the rule matters more than the prose. */}
      <section className="bg-neem-900 py-16 text-chalk-0">
        <div className="container-content">
          <h2 className="text-display-m">In a dental emergency, go to a hospital.</h2>
          <p className="mt-4 max-w-[60ch] text-body-l text-chalk-0/80">
            Heavy bleeding, a knocked-out tooth, a swollen face that is growing, or pain so bad
            you can&apos;t function: do not wait for an appointment. Call an ambulance or go
            straight to the nearest hospital casualty department.
          </p>
        </div>
      </section>

      <Section marker="The rules" className="py-24" snap={false}>
        <div className="max-w-[65ch] space-y-16">
          {terms.map((term) => (
            <section key={term.title}>
              <h2 className="text-display-m">{term.title}</h2>
              <p className="mt-4 text-body text-ink-950/80">{term.body}</p>
            </section>
          ))}

          <section>
            <h2 className="text-display-m">Acceptable use</h2>
            <p className="mt-4 text-body text-ink-950/80">
              Be truthful in the booking form — we arrange real care with real dentists, and a
              wrong phone number costs someone a slot. Don&apos;t use the site to harass staff,
              test our anti-spam measures, or book appointments you don&apos;t intend to keep.
              We may cancel bookings that look abusive, and repeated misuse can get a number
              blocked from the service.
            </p>
          </section>

          <section>
            <h2 className="text-display-m">Changes</h2>
            <p className="mt-4 text-body text-ink-950/80">
              These terms can change as the service grows. When they do, the date below moves and
              the change is noted on this page. Continued use after a change means you accept it.
            </p>
            <p className="mt-8 border-t border-neem-100 pt-8 font-utility text-body-s text-ink-950/70">
              Terms version: v1 — 2026-08-04
            </p>
          </section>
        </div>
      </Section>
    </>
  );
}
