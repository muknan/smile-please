import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { Section } from "@/components/site/Section";
import { makeRenderedAt } from "@/lib/antispam";

export const metadata: Metadata = {
  title: "Partner with us",
  description: "Work with Smile Please to make community dental care more reachable in Delhi.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/partners`,
  },
};

const COLLABORATIONS = [
  ["Community outreach and camps", "Help us explore a neighbourhood initiative, camp or awareness session where there is a clear local need and the right clinical support."],
  ["Professional time", "Dentists, hygienists and other professionals can discuss contributing their time, skills or practical advice."],
  ["Supplies and equipment", "Dental suppliers and clinics can talk with us about useful consumables, equipment or in-kind support."],
  ["Treatment support", "If your organisation wants to support patient treatment, tell us what you have in mind so the team can discuss a responsible route."],
] as const;

export default async function PartnersPage() {
  return (
    <>
      <Section marker="Partner with us" className="public-hero pb-14 sm:pb-20">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="font-utility text-label uppercase tracking-[0.16em] text-neem-600">A shared table</p>
            <h1 className="mt-5 max-w-[15ch] text-display-l">Make room for better care.</h1>
          </div>
          <p className="max-w-[42ch] text-body-l text-ink-950/70">
            Smile Please works to make dental care and oral health awareness more reachable for underserved communities in Delhi. Organisations can help us listen well, meet people where they are and support care that is practical and dignified.
          </p>
        </div>
      </Section>

      <Section marker="Ways to work together" className="border-t border-neem-100 py-14 sm:py-20">
        <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[0.7fr_1.3fr]">
          <h2 className="max-w-[12ch] text-display-m">A partnership can begin with one useful idea.</h2>
          <div className="divide-y divide-neem-100 border-y border-neem-100">
            {COLLABORATIONS.map(([title, body], index) => (
              <div key={title} className="grid gap-3 py-7 sm:grid-cols-[3rem_1fr] sm:gap-7">
                <p className="font-utility text-label font-semibold text-marigold-700">0{index + 1}</p>
                <div>
                  <h3 className="text-body font-semibold">{title}</h3>
                  <p className="mt-2 max-w-[58ch] text-body text-ink-950/70">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section marker="Good fit" className="warm-section py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 className="text-display-m">Bring your context. We will bring a careful conversation.</h2>
          <div className="max-w-[60ch] space-y-5 text-body-l text-ink-950/75">
            <p>We welcome enquiries from companies and CSR teams, foundations, healthcare and dental organisations, suppliers, schools and universities, NGOs, community groups and volunteer organisations.</p>
            <p>A good fit starts with a shared community purpose, a contribution you can describe clearly, and room to shape the practical details together. An enquiry is a conversation about feasibility, not a promise that a particular activity or treatment can be arranged.</p>
          </div>
        </div>
      </Section>

      <Section marker="What happens next" className="border-t border-neem-100 py-14 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <h2 className="text-display-m">Three steps from idea to next step.</h2>
          <ol className="divide-y divide-neem-100 border-y border-neem-100">
            {[
              ["Share the shape", "Tell us who you are, what interests you and what you could contribute."],
              ["Explore the fit", "The team will review the context and follow up with questions about community need, feasibility and care."],
              ["Agree a next step", "If there is a workable path, we will define the next conversation or activity together."],
            ].map(([title, body], index) => (
              <li key={title} className="grid gap-3 py-6 sm:grid-cols-[3rem_1fr] sm:gap-7">
                <span className="font-utility text-label font-semibold text-marigold-700">0{index + 1}</span>
                <div><h3 className="text-body font-semibold">{title}</h3><p className="mt-2 text-body text-ink-950/70">{body}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section marker="Start a conversation" className="bg-neem-900 py-14 text-chalk-0 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <h2 className="text-display-m">Tell us what you have in mind.</h2>
            <p className="mt-4 max-w-[34ch] text-body text-chalk-0/70">A few considered details help the team understand where to begin.</p>
          </div>
          <div className="rounded-card bg-mineral-50 p-6 text-ink-950 sm:p-10">
            <ContactForm initialTab="organization" renderedAt={await makeRenderedAt()} whatsappNumberSet={false} organizationOnly sourcePage="/partners" />
          </div>
        </div>
      </Section>
    </>
  );
}
