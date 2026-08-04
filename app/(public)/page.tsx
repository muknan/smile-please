import { SectionMarker } from "@/components/site/SectionMarker";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <section className="py-24">
      <div className="container-content">
        <SectionMarker>Home</SectionMarker>
        <h1 className="mt-6 max-w-3xl text-display-l">Free dental care in Delhi</h1>
        <p className="mt-4 max-w-[65ch] text-body-l text-ink-950/70">
          Smile Please runs free dental clinics and awareness programmes for communities that
          otherwise go without. A dentist will see you. It is free, and it takes about ten minutes
          to arrange.
        </p>
        <div className="mt-10">
          <Button href="/care">Book a check-up</Button>
        </div>
      </div>
    </section>
  );
}
