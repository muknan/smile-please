import type { Metadata } from "next";
import { Section } from "@/components/site/Section";
import { makeRenderedAt } from "@/lib/antispam";
import { StatusLookup } from "./StatusLookup";

export const metadata: Metadata = {
  title: "Track your appointment",
  description:
    "Check the status of your Smile Please appointment with your reference code and phone number — no account needed.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/care/status` },
};

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  return (
    <Section marker="Track" className="pt-24">
      <h1 className="text-display-l">Track your appointment</h1>
      <p className="mt-6 max-w-[65ch] text-body-l text-ink-950/70">
        No account needed — just the reference from your confirmation message and
        the phone number you booked with.
      </p>
      <div className="mt-16">
        <StatusLookup initialRef={ref} renderedAt={makeRenderedAt()} />
      </div>
    </Section>
  );
}
