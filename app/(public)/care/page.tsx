import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Free dental care",
  description:
    "Free dental care in Delhi: tell us what's wrong and we'll match you with a dentist nearby, or pick a dentist and time yourself. No account needed to start.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/care` },
};

export default function CarePage() {
  return (
    <Section marker="Care" className="pt-24" snap>
      <h1 className="max-w-3xl text-display-l">Book a check-up, free</h1>
      <p className="mt-6 max-w-[65ch] text-body-l text-ink-950/70">
        Care costs nothing, and nobody here turns a patient away. Two ways in — pick
        whichever matches what you know.
      </p>

      <div className="mt-16 grid gap-6 md:grid-cols-2">
        <Link
          href="/care/request"
          className="group flex flex-col justify-between rounded-card border border-neem-100 bg-chalk-0 p-10 transition hover:border-neem-600"
        >
          <div>
            <h2 className="text-display-m">Help me find a dentist</h2>
            <p className="mt-4 max-w-[45ch] text-body text-ink-950/80">
              Tell us what&apos;s wrong and we&apos;ll match you with someone nearby.
              Takes about two minutes.
            </p>
          </div>
          <span className="mt-10 font-utility text-body-s font-medium text-neem-600 underline-offset-4 group-hover:underline">
            Tell us what&apos;s wrong →
          </span>
        </Link>

        <Link
          href="/care/dentists"
          className="group flex flex-col justify-between rounded-card border border-neem-100 bg-chalk-0 p-10 transition hover:border-neem-600"
        >
          <div>
            <h2 className="text-display-m">Let me pick a dentist and time</h2>
            <p className="mt-4 max-w-[45ch] text-body text-ink-950/80">
              Browse our dentists and choose a slot that suits you. You&apos;ll see
              who&apos;s free and when.
            </p>
          </div>
          <span className="mt-10 font-utility text-body-s font-medium text-neem-600 underline-offset-4 group-hover:underline">
            See dentists and times →
          </span>
        </Link>
      </div>

      <p className="mt-16 text-body-s text-ink-950/60">
        Already booked?{" "}
        <Link href="/care/status" className="font-medium text-neem-600 underline underline-offset-4 hover:underline">
          Track your appointment
        </Link>{" "}
        with your reference code and phone number.
      </p>
    </Section>
  );
}
