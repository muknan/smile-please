import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/site/Section";
import {
  SlotGrid,
  type GridSlot,
  type DayColumn,
} from "@/components/booking/SlotGrid";
import { createClient } from "@/lib/supabase/server";
import { dayKey, formatDayShortLabel, formatTime, fullDayLabel } from "@/lib/format";

export const revalidate = 60;

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data } = await supabase.from("public_dentists").select("slug");
  return (data ?? []).map((d) => ({ slug: d.slug }));
}

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reschedule?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_dentists")
    .select("display_name, locality")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return { title: "Dentist not found" };
  return {
    title: data.display_name,
    description: `Free dental check-ups with ${data.display_name} in ${data.locality}, New Delhi — book a slot directly.`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/care/dentists/${slug}`,
    },
  };
}

export default async function DentistProfilePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { reschedule } = await searchParams;

  const supabase = await createClient();
  const { data: dentist } = await supabase
    .from("public_dentists")
    .select("slug, display_name, locality, city, specialties, languages, bio, photo_path")
    .eq("slug", slug)
    .maybeSingle();
  if (!dentist) notFound();

  const from = new Date();
  const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const { data: slots } = await supabase
    .from("public_slots")
    .select("id, dentist_slug, starts_at, ends_at, location_type, camp_name")
    .eq("dentist_slug", slug)
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString())
    .order("starts_at");

  // Build the day × time matrix.
  const gridSlots = (slots ?? []) as (GridSlot & { starts_at: string })[];
  const days: DayColumn[] = [];
  const dayIndex = new Map<string, number>();
  const times: string[] = [];
  const timeIndex = new Map<string, number>();
  const timeMinutes = new Map<string, number>();

  for (const slot of gridSlots) {
    const key = dayKey(slot.starts_at);
    if (!dayIndex.has(key)) {
      dayIndex.set(key, days.length);
      const d = new Date(slot.starts_at);
      days.push({ dateKey: key, shortLabel: formatDayShortLabel(d), fullLabel: fullDayLabel(d) });
    }
    const timeKey = formatTime(slot.starts_at);
    if (!timeMinutes.has(timeKey)) {
      const d = new Date(slot.starts_at);
      timeMinutes.set(timeKey, d.getUTCHours() * 60 + d.getUTCMinutes() + 330);
      times.push(timeKey);
    }
  }
  times.sort((a, b) => timeMinutes.get(a)! - timeMinutes.get(b)!);
  times.forEach((time, index) => timeIndex.set(time, index));

  const cells: (GridSlot | null)[][] = Array.from({ length: days.length }, () =>
    Array(times.length).fill(null),
  );
  for (const slot of gridSlots) {
    const d = dayIndex.get(dayKey(slot.starts_at))!;
    const t = timeIndex.get(formatTime(slot.starts_at))!;
    cells[d][t] = {
      id: slot.id,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      location_type: slot.location_type as GridSlot["location_type"],
      camp_name: slot.camp_name,
    };
  }

  return (
    <>
      <Section marker={dentist.locality ?? dentist.city ?? "Dentist"} className="pt-24">
        <h1 className="text-display-l">{dentist.display_name}</h1>
        <p className="mt-2 font-utility text-body-l text-neem-600">
          {dentist.locality}, {dentist.city}
        </p>

        {(dentist.specialties ?? []).length > 0 && (
          <p className="mt-6 text-body text-ink-950/80">{(dentist.specialties ?? []).join(" · ")}</p>
        )}
        {(dentist.languages ?? []).length > 0 && (
          <p className="mt-2 text-body-s text-ink-950/60">Speaks {(dentist.languages ?? []).join(", ")}</p>
        )}
        {dentist.bio && <p className="mt-6 max-w-[65ch] text-body text-ink-950/80">{dentist.bio}</p>}
      </Section>

      <Section marker="Pick a time" className="border-t border-neem-100 pb-24 pt-16">
        <h2 className="text-display-m">Next two weeks</h2>
        {reschedule && (
          <p className="mt-4 max-w-[65ch] rounded border border-neem-100 bg-chalk-0 px-4 py-3 text-body-s">
            You&apos;re changing an existing appointment. Pick a new time below —
            your old slot will be freed automatically.
          </p>
        )}
        <div className="mt-10">
          {days.length > 0 ? (
            <SlotGrid
              days={days}
              times={times}
              cells={cells}
              rescheduleAppointmentId={reschedule}
            />
          ) : (
            <p className="max-w-[55ch] text-body-l text-ink-950/70">
              This dentist has no open slots in the next two weeks right now. Try
              another dentist, or tell us what you need and we&apos;ll find someone.
            </p>
          )}
        </div>
      </Section>
    </>
  );
}
