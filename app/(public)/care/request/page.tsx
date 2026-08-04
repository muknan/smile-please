import type { Metadata } from "next";
import { Section } from "@/components/site/Section";
import { makeRenderedAt } from "@/lib/antispam";
import { RequestForm } from "./RequestForm";

export const metadata: Metadata = {
  title: "Tell us what's wrong",
  description:
    "Tell Smile Please what's wrong and we'll match you with a free dentist near you in Delhi. Two minutes, no account needed.",
};

export default function CareRequestPage() {
  return (
    <Section marker="Care request" className="pt-24">
      <h1 className="max-w-3xl text-display-l">Tell us what&apos;s wrong</h1>
      <p className="mt-6 max-w-[65ch] text-body-l text-ink-950/70">
        Two minutes, no account needed. We&apos;ll match you with a dentist near you —
        usually within two working days — and call or message to confirm.
      </p>
      <div className="mt-16">
        <RequestForm renderedAt={makeRenderedAt()} />
      </div>
    </Section>
  );
}
