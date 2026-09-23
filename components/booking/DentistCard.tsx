import Link from "next/link";
import Image from "next/image";
import { formatDateTime } from "@/lib/format";

export type DirectoryDentist = {
  slug: string;
  display_name: string;
  locality: string;
  city: string;
  specialties: string[];
  languages: string[];
  bio: string | null;
  photo_path: string | null;
  /** First open upcoming slot (precomputed from public_slots). */
  next_slot_at: string | null;
};

function coverUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dentist-photos/${path}`;
}

/**
 * Directory card. Renders ONLY the public fields — never phone, email,
 * address, or DCI number: those fields do not exist in the public_dentists
 * view, and if they appear in the query this page feeds from, the view is
 * wrong (go fix the view, not the card).
 */
export function DentistCard({ dentist }: { dentist: DirectoryDentist }) {
  const initials = dentist.display_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <article className="flex h-full gap-4 border-t border-neem-100 py-6 sm:gap-5">
      <div className="shrink-0">
        {dentist.photo_path ? (
          <div
            className="relative h-20 w-20 overflow-hidden rounded-full bg-neem-100 sm:h-24 sm:w-24"
          >
            <Image
              src={coverUrl(dentist.photo_path)}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="flex h-20 w-20 items-center justify-center rounded-full bg-neem-100 sm:h-24 sm:w-24"
          >
            <span className="font-display text-display-m text-neem-700">{initials}</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="break-words text-display-m leading-tight">
          <Link
            href={`/care/dentists/${dentist.slug}`}
            className="text-ink-950 transition hover:text-neem-600"
          >
            {dentist.display_name}
          </Link>
        </h3>
        <p className="mt-1 font-utility text-body-s text-neem-600">{dentist.locality}, {dentist.city}</p>

        {dentist.specialties.length > 0 && (
          <p className="mt-4 text-body-s text-ink-950/80">
            {dentist.specialties.join(" · ")}
          </p>
        )}
        {dentist.languages.length > 0 && (
          <p className="mt-1 text-body-s text-ink-950/75">
            Speaks {dentist.languages.join(", ")}
          </p>
        )}

        <div className="mt-auto pt-5">
          {dentist.next_slot_at ? (
            <p className="rounded border border-neem-100 bg-mineral-50 px-4 py-3 font-utility text-body-s tabular-nums text-ink-950">
              Next free: {formatDateTime(dentist.next_slot_at)}
            </p>
          ) : (
            <p className="text-body-s text-ink-950/75">No times posted for the next 14 days</p>
          )}
          <Link href={`/care/dentists/${dentist.slug}`} className="mt-3 inline-flex min-h-11 items-center font-utility text-body-s font-medium text-neem-600 underline decoration-neem-600/40 underline-offset-4 transition hover:text-neem-900">
            {dentist.next_slot_at ? "See times" : "View profile"}
          </Link>
        </div>
      </div>
    </article>
  );
}
