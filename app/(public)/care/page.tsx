import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/site/Section";
import { PageTopLink } from "@/components/site/PageTopLink";
import { ArrowLabel } from "@/components/ui/ArrowLabel";

export const metadata: Metadata = {
  title: "Free dental care",
  description:
    "Free dental care in Delhi: tell us what's wrong and we'll match you with a dentist nearby, or pick a dentist and time yourself. No account needed to start.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/care` },
};

export default function CarePage() {
  return (
    <Section marker="Care" className="public-hero" snap>
      <h1 className="max-w-3xl text-display-l">Book a check-up, free</h1>
      <p className="mt-6 max-w-[65ch] text-body-l text-ink-950/70">
        There is no charge for care arranged through Smile Please. Start with the route
        that best matches what you need.
      </p>

      <div className="mt-10 grid gap-6 sm:mt-16 md:grid-cols-2">
        <Link
          href="/care/request"
          className="group flex flex-col justify-between rounded-card border border-neem-100 bg-chalk-0 p-6 transition hover:border-neem-600 sm:p-10"
        >
          <div>
            <h2 className="text-display-m">Help me find a dentist</h2>
            <p className="mt-4 max-w-[45ch] text-body text-ink-950/80">
              Tell us what&apos;s wrong and we&apos;ll match you with someone nearby.
              Takes about two minutes.
            </p>
          </div>
          <span className="mt-6 font-utility text-body-s font-medium text-neem-600 transition-colors group-hover:text-neem-700 sm:mt-10">
            <ArrowLabel>Tell us what&apos;s wrong</ArrowLabel>
          </span>
        </Link>

        <PageTopLink
          href="/care/dentists"
          pendingSurfaceLabel="Dentists"
          className="group flex flex-col justify-between rounded-card border border-neem-100 bg-chalk-0 p-6 transition hover:border-neem-600 sm:p-10"
        >
          <div>
            <h2 className="text-display-m">Let me pick a dentist and time</h2>
            <p className="mt-4 max-w-[45ch] text-body text-ink-950/80">
              Browse our dentists and choose a slot that suits you. You&apos;ll see
              who&apos;s free and when.
            </p>
          </div>
          <span className="mt-6 font-utility text-body-s font-medium text-neem-600 transition-colors group-hover:text-neem-700 sm:mt-10">
            <ArrowLabel>See dentists and times</ArrowLabel>
          </span>
        </PageTopLink>
      </div>

      <p className="mt-10 text-body-s text-ink-950/75 sm:mt-16">
        Already booked?{" "}
        <Link href="/care/status" className="font-medium text-neem-600 underline underline-offset-4 hover:underline">
          Track your appointment
        </Link>{" "}
        with your reference code and phone number.
      </p>
    </Section>
  );
}
