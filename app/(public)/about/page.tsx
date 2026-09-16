import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/site/Section";
import { BRAND_TAGLINE } from "@/components/site/Logo";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Smile Please works to make free dental care and practical oral-health information easier to reach in Delhi.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/about` },
  openGraph: {
    siteName: "Smile Please",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/og?title=Why Smile Please exists" }],
  },
};

const values = [
  {
    title: "Care should be easier to reach",
    body: "Cost and distance can turn a manageable dental problem into lasting pain. We connect people with volunteer dentists and make the route to asking for help clear.",
  },
  {
    title: "We say what we do",
    body: "We describe the care, availability and next steps as they are. When no appointment time is posted, we offer a request route instead of pretending care is immediately available.",
  },
  {
    title: "Your details stay your own",
    body: "We collect the minimum we need and explain each field. We never sell data, and you can withdraw consent whenever you like.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Section marker="About" className="public-hero" snap>
        <h1 className="text-display-l">Why Smile Please exists</h1>
        <p className="mt-4 font-display text-display-m text-neem-700">{BRAND_TAGLINE}</p>

        <div className="mt-8 max-w-[65ch] space-y-6 text-body-l sm:mt-12 lg:mt-16">
          <p>
            Smile Please is a New Delhi organisation helping people reach free dental care.
            Patients can ask the team to find a nearby dentist or book directly when a volunteer
            has posted an available time.
          </p>
          <p>
            The work also includes practical oral-health awareness for communities, schools and
            families. The aim is straightforward: make reliable guidance easier to understand and
            make the next step toward care easier to take.
          </p>
          <p>
            Smile Please is a small service supported by volunteer professionals. That makes
            honesty about capacity essential: availability changes, requests are reviewed by a
            person, and the site always shows a useful fallback when a direct slot is not open.
          </p>
        </div>
      </Section>

      <Section marker="What we hold to" className="border-t border-neem-100 py-14 sm:py-20 lg:py-24" snap>
        <div className="space-y-10 sm:space-y-16">
          {values.map((value) => (
            <div key={value.title} className="max-w-[65ch]">
              <h2 className="text-display-m">{value.title}</h2>
              <p className="mt-4 text-body text-ink-950/80">{value.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-3 border-t border-neem-100 pt-8 sm:mt-16">
          <Button href="/care/request">Request free care</Button>
          <Button href="/care/dentists" variant="ghost">Browse dentists</Button>
        </div>
      </Section>

    </>
  );
}
