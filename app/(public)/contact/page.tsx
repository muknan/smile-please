import type { Metadata } from "next";
import { SectionMarker } from "@/components/site/SectionMarker";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <section className="py-24">
      <div className="container-content">
        <SectionMarker>Contact</SectionMarker>
        <h1 className="mt-6 max-w-3xl text-display-l">Talk to us</h1>
        <p className="mt-4 max-w-[65ch] text-body-l text-ink-950/70">
          A question about care, a clinic that wants to host us, a school that wants a session —
          write to care@example.com and a real person will reply.
        </p>
      </div>
    </section>
  );
}
