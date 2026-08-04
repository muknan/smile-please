import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Section } from "@/components/site/Section";
import { ArchStepper } from "@/components/booking/ArchStepper";
import { createClient } from "@/lib/supabase/server";
import { makeRenderedAt } from "@/lib/antispam";
import { formatDateTime } from "@/lib/format";
import { BookForm } from "./BookForm";
import type { BookDetails } from "../actions";

export const metadata: Metadata = {
  title: "Confirm your booking",
  robots: { index: false },
};

type PageProps = {
  params: Promise<{ slotId: string }>;
  searchParams: Promise<{ reschedule?: string }>;
};

export default async function BookPage({ params, searchParams }: PageProps) {
  const { slotId } = await params;
  const { reschedule } = await searchParams;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_slot_details", { p_slot_id: slotId });

  if (error || !data) {
    redirect("/care/dentists?err=slot");
  }
  if (typeof data !== "object" || data === null || !("slot_id" in data)) {
    notFound();
  }

  const details: BookDetails = {
    slotId,
    dentistName: String(data.dentist_name ?? "A Smile Please dentist"),
    dentistLocality: String(data.dentist_locality ?? ""),
    startsAt: String(data.starts_at),
    locationType: String(data.location_type ?? "clinic"),
    campName: data.camp_name ? String(data.camp_name) : null,
    rescheduleAppointmentId: reschedule,
    renderedAt: makeRenderedAt(),
  };

  const startsAt = new Date(details.startsAt);
  if (Number.isNaN(startsAt.getTime())) notFound();

  return (
    <Section marker="Confirm" className="pt-24">
      <ArchStepper currentStep={2} />

      <div className="mt-12 max-w-[65ch]">
        <h1 className="text-display-l">
          {reschedule ? "Change your appointment" : "Confirm your booking"}
        </h1>

        <div className="mt-10 rounded-card border border-neem-100 bg-chalk-0 p-8">
          <p className="font-utility text-label uppercase text-neem-600">The visit</p>
          <p className="mt-4 text-display-m">{details.dentistName}</p>
          <p className="mt-2 text-body text-ink-950/80">
            {formatDateTime(startsAt)}
            {details.dentistLocality ? ` · ${details.dentistLocality}` : ""}
            {details.locationType === "camp" ? ` · camp${details.campName ? `: ${details.campName}` : ""}` : ""}
          </p>
          <p className="mt-2 text-body-s text-ink-950/60">
            Your slot is held for ten minutes. Free — no payment, ever.
          </p>
        </div>
      </div>

      <div className="mt-10 max-w-[65ch]">
        <BookForm details={details} />
      </div>
    </Section>
  );
}
