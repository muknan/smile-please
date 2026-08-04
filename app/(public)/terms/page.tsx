import type { Metadata } from "next";
import { SectionMarker } from "@/components/site/SectionMarker";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <section className="py-24">
      <div className="container-content">
        <SectionMarker>Terms</SectionMarker>
        <h1 className="mt-6 max-w-3xl text-display-l">The short version</h1>
        <p className="mt-4 max-w-[65ch] text-body-l text-ink-950/70">
          Smile Please care is always free, and using this site never creates a bill. Appointments
          are arranged in good faith, so please cancel if you cannot come. Nothing on this site is
          a substitute for a dentist examining you in person.
        </p>
      </div>
    </section>
  );
}
