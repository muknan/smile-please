import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ArchHero } from "@/components/site/ArchHero";
import { Section } from "@/components/site/Section";
import { ArticleCard, type ArticleTeaser } from "@/components/site/ArticleCard";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Free dental care in Delhi — Smile Please",
  description:
    "Smile Please is a dental health NGO in New Delhi. Real dentists, registered with the DCI, give free check-ups and care to communities who otherwise go without.",
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: { images: [{ url: "/og?title=Free dental care for Delhi" }] },
};

async function getLatestArticles(limit: number): Promise<ArticleTeaser[] | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("slug, title, excerpt, category, published_at, body_md, cover_path")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  return data;
}

/** Stylised molar — custom icon, no icon library needed. */
function ToothIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-neem-600"
    >
      <path d="M12 3.4c-2.3 0-3.6 1.3-5 1.6-1.7.4-3 1.9-3.2 4.5-.3 3.3.7 7 1.6 10.1.3 1.2.9 1.8 1.8 1.7.9-.2 1.3-.9 1.6-1.8.2-.7.5-1.4.9-1.7.5-.4 1.2-.5 1.9-.5s1.4.1 1.9.5c.4.3.7 1 .9 1.7.3.9.7 1.6 1.6 1.8.9.1 1.5-.5 1.8-1.7.9-3.1 1.9-6.8 1.6-10.1-.2-2.6-1.5-4.1-3.2-4.5-1.4-.3-2.7-1.6-5-1.6z" />
    </svg>
  );
}

const steps = [
  {
    title: "Tell us what's wrong",
    body: "A short form or a phone call — two minutes, and you don't need an account to start.",
  },
  {
    title: "We match you with a dentist near you",
    body: "Usually within two working days. We ask for your area so you're not crossing the city.",
  },
  {
    title: "You go. It's free.",
    body: "The appointment is confirmed by phone, and the clinic handles everything after.",
  },
];

const trust = [
  "Every dentist is registered with the Dental Council of India",
  "We ask for the minimum we need and tell you why",
  "Your phone number is never shown publicly or sold",
  "A named person reads every message you send",
];

export default async function HomePage() {
  const articles = await getLatestArticles(3);

  return (
    <>
      <ArchHero />

      <Section marker="What we do" className="snap-start snap-always pt-24">
        <h2 className="text-display-l">Two things, both free.</h2>
        <div className="mt-16 grid gap-16 md:grid-cols-2 md:gap-6">
          <div>
            <ToothIcon />
            <h3 className="mt-6 text-display-m">Treatment at camps and clinics</h3>
            <p className="mt-4 max-w-[52ch] text-body text-ink-950/80">
              Our dentists run regular camp days and see patients at partner clinics across Delhi.
              Check-ups, cleanings, and extractions are free. Nobody here is turned away for being
              unable to pay.
            </p>
          </div>
          <div>
            <BookOpen className="text-neem-600" size={40} strokeWidth={1.5} aria-hidden="true" />
            <h3 className="mt-6 text-display-m">Awareness in schools and communities</h3>
            <p className="mt-4 max-w-[52ch] text-body text-ink-950/80">
              We run short, plain sessions about what cavities actually are, how brushing works,
              and when a small problem needs a dentist. No jargon, no fear, no sales — just the
              facts that keep teeth out of trouble.
            </p>
          </div>
        </div>
      </Section>

      <Section marker="How it works" className="snap-start snap-always border-t border-neem-100 py-24">
        <h2 className="text-display-l">Three steps, then we&apos;re out of your way.</h2>
        <ol className="mt-16 space-y-16">
          {steps.map((step, i) => (
            <li key={step.title} className="grid gap-4 md:grid-cols-12 md:gap-6">
              {/* The only places on the site where numbered markers are honest: this is a sequence. */}
              <span
                aria-hidden="true"
                className="flex h-16 w-16 items-center justify-center rounded-full border border-neem-600 font-utility text-data font-semibold text-neem-600"
              >
                {i + 1}
              </span>
              <div className="md:col-span-11">
                <h3 className="text-display-m">{step.title}</h3>
                <p className="mt-4 max-w-[60ch] text-body text-ink-950/80">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section marker="Trust" className="snap-start snap-always bg-neem-100 py-24">
        <h2 className="text-display-l">The ground rules.</h2>
        <ul className="mt-16 grid gap-10 md:grid-cols-2 md:gap-x-6 md:gap-y-10">
          {trust.map((claim) => (
            <li key={claim} className="flex gap-4">
              <span aria-hidden="true" className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-neem-600" />
              <p className="max-w-[45ch] text-body-l">{claim}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section marker="Learn" className="snap-start snap-always py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-[20ch] text-display-l">
            What the dentists tell people every day.
          </h2>
          <Link
            href="/learn"
            className="font-utility text-body-s font-medium text-neem-600 underline-offset-4 hover:underline"
          >
            All articles
          </Link>
        </div>
        {articles && articles.length > 0 ? (
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <p className="mt-16 max-w-[50ch] text-body-l text-ink-950/70">
            Our latest articles haven&apos;t been published yet. Check back soon, or book a
            check-up and ask us in person.
          </p>
        )}
      </Section>

      <section className="snap-start snap-always bg-neem-900 py-24 text-chalk-0">
        <div className="container-content grid gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8 lg:col-start-2">
            <h2 className="text-display-l">Are you a dentist or an organisation?</h2>
            <p className="mt-6 max-w-[55ch] text-body-l text-chalk-0/80">
              Volunteer a few hours a month, host a camp, or fund a clinic day. We&apos;ll be in
              touch within two working days.
            </p>
            <div className="mt-12 flex flex-wrap gap-4">
              <Link
                href="/contact?tab=dentist"
                className="inline-flex items-center justify-center rounded bg-marigold-500 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95"
              >
                I&apos;m a dentist
              </Link>
              <Link
                href="/contact?tab=organization"
                className="inline-flex items-center justify-center rounded border border-chalk-0/40 px-6 py-3 font-utility text-body-s font-medium text-chalk-0 transition hover:border-marigold-500 hover:text-marigold-500"
              >
                We&apos;re an organisation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NGO",
            name: "Smile Please",
            description:
              "Free dental care and oral health awareness for underserved communities in New Delhi.",
            areaServed: "New Delhi",
            url: SITE_URL,
          }),
        }}
      />
    </>
  );
}
