import { ArrowLabel } from "@/components/ui/ArrowLabel";
import type { Metadata } from "next";
import { BookOpen, HeartHandshake, MapPin, ShieldCheck, Stethoscope } from "lucide-react";
import { ArticleCard, type ArticleTeaser } from "@/components/site/ArticleCard";
import { Button } from "@/components/ui/Button";
import { PageTopLink } from "@/components/site/PageTopLink";
import { getPublishedArticles } from "@/lib/articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const revalidate = 60;
export const metadata: Metadata = {
  title: { absolute: "Smile Please — Free dental care in Delhi" },
  description: "Smile Please connects people in Delhi with registered dentists who provide free check-ups and essential dental care.",
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: { images: [{ url: "/og?title=Free dental care for Delhi" }] },
};

const steps = [
  ["Tell us what you need", "Share a few details online. It takes about two minutes and you do not need an account."],
  ["We find nearby care", "Our team checks your request and matches you with a registered dentist near your area."],
  ["Confirm and visit", "We confirm by phone. Your appointment and essential treatment are free."],
] as const;

export default async function HomePage() {
  const articles: ArticleTeaser[] = await getPublishedArticles(undefined, 3);
  return (
    <>
      <section className="overflow-hidden bg-neem-950 text-chalk-0">
        <div className="container-content grid min-h-[540px] items-center gap-10 py-12 md:min-h-[610px] md:grid-cols-12 md:gap-12 md:py-24">
          <div className="md:col-span-7 lg:col-span-6">
            <p className="font-utility text-body-s font-semibold text-marigold-500">Free dental care in Delhi</p>
            <h1 className="hero-heading mt-5 max-w-[13ch]">A painful tooth should not have to wait.</h1>
            <p className="mt-6 max-w-[52ch] text-body-l text-chalk-0/80">Tell us what is wrong. We connect people who cannot afford treatment with registered dentists who give their time for free.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="/care/request"><ArrowLabel>Request free care</ArrowLabel></Button>
              <Button href="/care/dentists" variant="ghost" className="border-chalk-0/45 text-chalk-0 hover:border-chalk-0 hover:bg-chalk-0/10">Browse dentists</Button>
            </div>
            <p className="mt-6 flex items-center gap-2 font-utility text-body-s text-chalk-0/70"><ShieldCheck size={18} aria-hidden="true" /> No payment. No account needed to start.</p>
          </div>
          <div className="md:col-span-5 md:col-start-8 lg:col-start-8" aria-label="Care available across Delhi">
            <div className="rounded-panel bg-neem-900 p-6 ring-1 ring-chalk-0/15 sm:p-8">
              <div className="flex items-center justify-between border-b border-chalk-0/15 pb-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-marigold-500 text-neem-950"><Stethoscope size={24} aria-hidden="true" /></span>
                <span className="rounded-full bg-chalk-0/10 px-3 py-1 font-utility text-label font-semibold text-chalk-0/80">Delhi</span>
              </div>
              <p className="mt-8 font-display text-display-m">Care that starts with a person listening.</p>
              <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-chalk-0/15 pt-6">
                <div><dt className="text-body-s text-chalk-0/60">Response</dt><dd className="mt-1 font-utility text-body-s font-semibold">Within 2 working days</dd></div>
                <div><dt className="text-body-s text-chalk-0/60">Dentists</dt><dd className="mt-1 font-utility text-body-s font-semibold">DCI registered</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neem-100 bg-chalk-0">
        <div className="container-content grid gap-6 py-7 font-utility text-body-s text-ink-950/75 sm:grid-cols-3">
          <p className="flex items-center gap-3"><MapPin className="text-neem-600" size={20} aria-hidden="true" /> Matched near your area</p>
          <p className="flex items-center gap-3"><ShieldCheck className="text-neem-600" size={20} aria-hidden="true" /> Details kept private</p>
          <p className="flex items-center gap-3"><HeartHandshake className="text-neem-600" size={20} aria-hidden="true" /> A real person replies</p>
        </div>
      </section>

      <section className="public-section">
        <div className="container-content grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4"><p className="eyebrow">How care works</p><h2 className="mt-4 text-display-l">Three clear steps.</h2><p className="mt-5 max-w-[42ch] text-body text-ink-950/70">We ask only for what we need to arrange care, and explain each step before you continue.</p></div>
          <ol className="divide-y divide-neem-100 border-y border-neem-100 lg:col-span-7 lg:col-start-6">
            {steps.map(([title, body], index) => <li key={title} className="grid grid-cols-[2.5rem_1fr] gap-4 py-7"><span className="font-utility text-body-s font-semibold text-neem-600">0{index + 1}</span><div><h3 className="font-display text-display-m">{title}</h3><p className="mt-2 max-w-[52ch] text-body text-ink-950/70">{body}</p></div></li>)}
          </ol>
        </div>
      </section>

      <section className="bg-neem-100/65 py-16 sm:py-20"><div className="container-content grid gap-8 md:grid-cols-2">
        <div className="border-b border-neem-600/20 pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-10"><Stethoscope className="text-neem-600" size={28} aria-hidden="true" /><h2 className="mt-5 text-display-m">Need treatment?</h2><p className="mt-3 max-w-[48ch] text-body text-ink-950/75">Request help and let our team find a suitable dentist, or browse the public directory yourself.</p><PageTopLink className="cta-link mt-5 text-neem-700" href="/care"><ArrowLabel>Find free care</ArrowLabel></PageTopLink></div>
        <div className="md:pl-4"><BookOpen className="text-neem-600" size={28} aria-hidden="true" /><h2 className="mt-5 text-display-m">Want practical guidance?</h2><p className="mt-3 max-w-[48ch] text-body text-ink-950/75">Read short, plain-language advice about brushing, pain, children’s teeth and gum health.</p><PageTopLink className="cta-link mt-5 text-neem-700" href="/learn"><ArrowLabel>Explore oral-health guides</ArrowLabel></PageTopLink></div>
      </div></section>

      <section className="public-section"><div className="container-content">
        <div className="flex flex-col gap-4 border-b border-neem-100 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Useful now</p><h2 className="mt-3 text-display-l">Advice from our dentists.</h2></div><PageTopLink href="/learn" className="cta-link text-neem-700"><ArrowLabel>View all guides</ArrowLabel></PageTopLink></div>
        {articles?.length ? <div className="divide-y divide-neem-100">{articles.map((article) => <ArticleCard key={article.slug} article={article} />)}</div> : <p className="py-10 text-body-l text-ink-950/70">New guides are being prepared. If something hurts, request care now.</p>}
      </div></section>

      <section className="bg-neem-950 py-16 text-chalk-0 sm:py-20"><div className="container-content grid gap-8 lg:grid-cols-12 lg:items-end"><div className="lg:col-span-7"><p className="font-utility text-body-s font-semibold text-marigold-500">Help more people get care</p><h2 className="mt-4 text-display-l">Dentists, schools and organisations are part of the work.</h2></div><div className="flex flex-wrap gap-3 lg:col-span-4 lg:col-start-9"><Button href="/contact?tab=dentist">Volunteer as a dentist</Button><Button href="/partners" variant="ghost" className="border-chalk-0/45 text-chalk-0 hover:bg-chalk-0/10">Partner with us</Button></div></div></section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "NGO", name: "Smile Please", description: "Free dental care and oral health awareness for underserved communities in New Delhi.", areaServed: "New Delhi", url: SITE_URL }) }} />
    </>
  );
}
