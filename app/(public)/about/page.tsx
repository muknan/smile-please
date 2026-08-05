import type { Metadata } from "next";
import { Section } from "@/components/site/Section";

export const metadata: Metadata = {
  title: "About",
  description:
    "How Smile Please started, what we believe, who runs it, and the registration details you can check.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/about` },
};

const values = [
  {
    title: "Care is never conditional",
    body: "A toothache does not care who you are, and neither do we. If you need dental care, you get it — no forms about income, no means testing, no judgement.",
  },
  {
    title: "We say what we do",
    body: "Every claim on this site is something a patient, a partner, or a regulator can check. If we don't know yet, we say so plainly.",
  },
  {
    title: "Your details stay your own",
    body: "We collect the minimum we need and explain each field. We never sell data, and you can withdraw consent whenever you like.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Section marker="About" className="pt-24">
        <h1 className="text-display-l">Why Smile Please exists</h1>

        {/* CLIENT-COPY: replace with the founder's real words. 150–200 words, first person. */}
        <div className="mt-16 max-w-[65ch] space-y-6 text-body-l">
          <p>
            I spent years watching people in Delhi live with pain they didn&apos;t have to. A
            cavity that could be fixed in twenty minutes becomes an extraction, then a denture,
            then a whole set of problems — because the nearest affordable dentist is two bus
            rides and a day&apos;s wages away.
          </p>
          <p>
            Smile Please started with a chair, a light, and a list of volunteers. We run free
            clinic days in neighbourhoods where dental care is a luxury, and we go into schools
            to explain what most people never get told: most dental disease is preventable, and
            the prevention takes two minutes a day.
          </p>
          <p>
            We are small, and we are honest about being small. Every rupee goes to treatment,
            equipment, or the people who give their time. This is the story so far. It grows
            with every patient who walks in.
          </p>
        </div>
        {/* END CLIENT-COPY */}
      </Section>

      <Section marker="What we hold to" className="border-t border-neem-100 py-24">
        <div className="space-y-16">
          {values.map((value) => (
            <div key={value.title} className="max-w-[65ch]">
              <h2 className="text-display-m">{value.title}</h2>
              <p className="mt-4 text-body text-ink-950/80">{value.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section marker="Registration" className="border-t border-neem-100 py-24">
        <h2 className="text-display-l">Organisation details</h2>
        <p className="mt-6 max-w-[65ch] text-body-l text-ink-950/70">
          Registration details — the trust deed number, registered address and grievance
          contact — will be published here once finalised.
        </p>
        {/* CLIENT-COPY: publish the trust's real deed details (registration number,
            registered address and grievance contact) when they are finalised. */}
      </Section>
    </>
  );
}
