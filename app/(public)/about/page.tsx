import type { Metadata } from "next";
import { SectionMarker } from "@/components/site/SectionMarker";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <section className="py-24">
      <div className="container-content">
        <SectionMarker>About us</SectionMarker>
        <h1 className="mt-6 max-w-3xl text-display-l">Free dental care, close to home</h1>
        <p className="mt-4 max-w-[65ch] text-body-l text-ink-950/70">
          We are a small team of dentists, public-health workers, and volunteers based in New
          Delhi. We run free check-up and treatment days in neighbourhoods that lack clinics, and
          we teach daily dental habits to children and adults who never learned them.
        </p>
      </div>
    </section>
  );
}
