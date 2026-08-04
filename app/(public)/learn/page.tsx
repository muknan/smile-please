import type { Metadata } from "next";
import { SectionMarker } from "@/components/site/SectionMarker";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <section className="py-24">
      <div className="container-content">
        <SectionMarker>Learn</SectionMarker>
        <h1 className="mt-6 max-w-3xl text-display-l">Plain answers about your mouth</h1>
        <p className="mt-4 max-w-[65ch] text-body-l text-ink-950/70">
          Brushing, flossing, what hurts, what to eat, and what you can safely ignore. We write in
          short articles without jargon, so the advice works when you are not in the clinic.
        </p>
      </div>
    </section>
  );
}
