import type { Metadata } from "next";
import { Section } from "@/components/site/Section";
import { makeRenderedAt } from "@/lib/antispam";
import { StatusLookup } from "../StatusLookup";

export const runtime = "nodejs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ref: string }>;
}): Promise<Metadata> {
  const { ref } = await params;
  return {
    title: "Track appointment",
    description: "Check the status of your Smile Please appointment.",
    robots: { index: false },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/care/status/${ref}`,
    },
  };
}

export default async function StatusByRefPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  return (
    <Section marker="Track" className="pt-24">
      <h1 className="text-display-l">Track your appointment</h1>
      <p className="mt-6 max-w-[65ch] text-body-l text-ink-950/70">
        Reference <span className="font-utility font-semibold tabular-nums">{ref}</span> —
        enter the phone you booked with.
      </p>
      <div className="mt-16">
        <StatusLookup initialRef={ref} renderedAt={makeRenderedAt()} />
      </div>
    </Section>
  );
}
