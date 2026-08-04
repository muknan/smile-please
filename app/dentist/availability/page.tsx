import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { AvailabilityForms } from "@/components/dentist/AvailabilityForms";
import { formatDayShortLabel, formatTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Availability",
  robots: { index: false },
};

export default async function AvailabilityPage() {
  const profile = await requireRole("dentist");
  const supabase = await createClient();

  const { data: upcoming } = await supabase
    .from("availability_slots")
    .select("id, starts_at, ends_at, status, location_type, camp_name, booked_count, capacity")
    .eq("dentist_id", profile.id)
    .gte("starts_at", new Date().toISOString())
    .lte("starts_at", new Date(Date.now() + 30 * 86_400_000).toISOString())
    .order("starts_at")
    .limit(40);

  return (
    <>
      <h1 className="mt-12 text-display-l">Availability</h1>
      <p className="mt-4 max-w-[60ch] text-body text-ink-950/70">
        Slots you add appear on your public page for the next two weeks. A slot
        with a booking is taken — it won&apos;t show as open.
      </p>

      <AvailabilityForms />

      <section className="mt-16" aria-label="Your upcoming slots">
        <h2 className="text-display-m">Next 30 days</h2>
        {(!upcoming || upcoming.length === 0) ? (
          <p className="mt-6 text-body-l text-ink-950/70">
            No slots yet. Add one above so patients can book you.
          </p>
        ) : (
          <ul className="mt-6 max-w-2xl space-y-2">
            {upcoming.map((slot) => (
              <li
                key={slot.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded border border-neem-100 bg-chalk-0 px-4 py-3"
              >
                <span className="font-utility text-data tabular-nums">
                  {formatDayShortLabel(slot.starts_at)}, {formatTime(slot.starts_at)}–
                  {formatTime(slot.ends_at)}
                  {slot.location_type === "camp" && ` · camp${slot.camp_name ? `: ${slot.camp_name}` : ""}`}
                </span>
                <span className="font-utility text-label uppercase text-neem-600">
                  {slot.status === "blocked"
                    ? "Blocked"
                    : slot.status === "booked"
                      ? "Booked"
                      : slot.status === "held"
                        ? "On hold"
                        : `${slot.booked_count}/${slot.capacity} booked`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
