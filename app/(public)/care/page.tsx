import type { Metadata } from "next";
import { SectionMarker } from "@/components/site/SectionMarker";

export const metadata: Metadata = {
  title: "Care",
  description:
    "Free dental care in Delhi: tell us what's wrong and we'll match you with a dentist nearby, or pick a dentist and time yourself.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/care` },
};

export default function CarePage() {
  return (
    <section className="py-24">
      <div className="container-content">
        <SectionMarker>Care</SectionMarker>
        <h1 className="mt-6 max-w-3xl text-display-l">Book a check-up, free</h1>
        <p className="mt-4 max-w-[65ch] text-body-l text-ink-950/70">
          Care costs nothing and nobody here turns a patient away. Choose the clinic nearest you,
          pick a time that works, and we confirm the appointment by phone or text.
        </p>
      </div>
    </section>
  );
}
