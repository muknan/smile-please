import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/site/Section";
import { DentistCard, type DirectoryDentist } from "@/components/booking/DentistCard";
import { createClient } from "@/lib/supabase/server";
import { LOCALITIES } from "@/lib/schemas";

export const metadata: Metadata = {
  title: "Our dentists",
  description:
    "Browse the Smile Please dentists in Delhi, their languages and specialties, and book a free slot directly.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/care/dentists` },
};

export default async function DentistsPage({
  searchParams,
}: {
  searchParams: Promise<{ locality?: string; lang?: string; slots?: string; err?: string }>;
}) {
  const { locality, lang, slots, err } = await searchParams;
  const slotsOnly = slots === "1";

  const supabase = await createClient();
  const { data: dentists } = await supabase
    .from("public_dentists")
    .select("slug, display_name, locality, city, specialties, languages, bio, photo_path")
    .order("locality");

  // Next available slot per dentist within 14 days (for the card + filter).
  const windowStart = new Date();
  const windowEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const { data: slotsData } = await supabase
    .from("public_slots")
    .select("dentist_slug, starts_at")
    .gte("starts_at", windowStart.toISOString())
    .lte("starts_at", windowEnd.toISOString())
    .order("starts_at");

  const nextBySlug = new Map<string, string>();
  for (const slot of slotsData ?? []) {
    if (slot.dentist_slug && slot.starts_at && !nextBySlug.has(slot.dentist_slug)) {
      nextBySlug.set(slot.dentist_slug, slot.starts_at);
    }
  }

  const allLanguages = Array.from(
    new Set((dentists ?? []).flatMap((d) => d.languages ?? [])),
  ).sort();

  let list: DirectoryDentist[] = (dentists ?? [])
    .filter((d) => d.slug !== null && d.display_name !== null)
    .map((d) => ({
      ...d,
      slug: d.slug!,
      display_name: d.display_name!,
      next_slot_at: nextBySlug.get(d.slug!) ?? null,
    })) as DirectoryDentist[];

  if (locality && LOCALITIES.includes(locality as (typeof LOCALITIES)[number])) {
    list = list.filter((d) => d.locality === locality);
  }
  if (lang && allLanguages.includes(lang)) {
    list = list.filter((d) => d.languages?.includes(lang));
  }
  if (slotsOnly) {
    list = list.filter((d) => d.next_slot_at !== null);
  }

  return (
    <Section marker="Our dentists" className="pt-24">
      <h1 className="text-display-l">Our dentists</h1>
      <p className="mt-6 max-w-[65ch] text-body-l text-ink-950/70">
        Every dentist here is registered with the Dental Council of India and
        gives their time for free. Pick someone near you and choose a slot.
      </p>

      {err === "slot" && (
        <p role="status" className="mt-6 rounded-card border border-clay-600 bg-chalk-0 px-4 py-3 text-body-s text-clay-600">
          That slot was just taken or is no longer available — pick another time from the list below.
        </p>
      )}

      <form
        method="get"
        className="mt-12 flex flex-wrap items-end gap-4"
        aria-label="Filter dentists"
      >
        <label className="flex flex-col gap-2" htmlFor="filter-locality">
          <span className="font-utility text-label uppercase text-ink-950">Area</span>
          <select
            id="filter-locality"
            name="locality"
            defaultValue={locality ?? ""}
            className="rounded border border-neem-100 bg-chalk-0 px-4 py-3 text-body"
          >
            <option value="">Any area</option>
            {LOCALITIES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2" htmlFor="filter-lang">
          <span className="font-utility text-label uppercase text-ink-950">Language</span>
          <select
            id="filter-lang"
            name="lang"
            defaultValue={lang ?? ""}
            className="rounded border border-neem-100 bg-chalk-0 px-4 py-3 text-body"
          >
            <option value="">Any language</option>
            {allLanguages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-3 pb-3" htmlFor="filter-slots">
          <input
            type="checkbox"
            id="filter-slots"
            name="slots"
            value="1"
            defaultChecked={slotsOnly}
            className="h-5 w-5 accent-neem-600"
          />
          <span className="text-body">Only dentists with open slots in the next 14 days</span>
        </label>

        <button
          type="submit"
          className="rounded bg-marigold-500 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95"
        >
          Filter
        </button>
      </form>

      {list.length > 0 ? (
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((dentist) => (
            <DentistCard key={dentist.slug} dentist={dentist} />
          ))}
        </div>
      ) : (
        <div className="mt-16 max-w-[60ch] rounded-card border border-neem-100 bg-chalk-0 p-10">
          <h2 className="text-display-m">No dentists match those filters right now.</h2>
          <p className="mt-4 text-body-l text-ink-950/70">
            Try a wider area, or tell us what you need and we&apos;ll find someone.
          </p>
          <Link
            href="/care/request"
            className="mt-8 inline-flex items-center justify-center rounded bg-marigold-500 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95"
          >
            Tell us what&apos;s wrong
          </Link>
        </div>
      )}
    </Section>
  );
}
