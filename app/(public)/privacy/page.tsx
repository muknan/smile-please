import type { Metadata } from "next";
import { SectionMarker } from "@/components/site/SectionMarker";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <section className="py-24">
      <div className="container-content">
        <SectionMarker>Privacy</SectionMarker>
        <h1 className="mt-6 max-w-3xl text-display-l">What we collect, and why</h1>
        <p className="mt-4 max-w-[65ch] text-body-l text-ink-950/70">
          We collect only what we need to arrange your care: your name, a phone number we can
          reach you on, your locality, and your age band. We never ask for your street address or
          your date of birth. We will ask you separately for each thing we want to use your
          details for, and you can withdraw your consent at any time.
        </p>
      </div>
    </section>
  );
}
