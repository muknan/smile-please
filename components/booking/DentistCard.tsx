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
    <article className="flex flex-col rounded-card border border-neem-100 bg-chalk-0">
      <div className="overflow-hidden">
        {dentist.photo_path ? (
          <div
            className="relative h-40 w-full"
            style={{ clipPath: "url(#arch-clip)" }}
          >
            <Image
              src={coverUrl(dentist.photo_path)}
              alt=""
              fill
              sizes="(max-width: 1024px) 45vw, 25vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="flex h-40 w-full items-center justify-center bg-neem-100"
            style={{ clipPath: "url(#arch-clip)" }}
          >
            <span className="font-display text-display-l text-neem-600/50">{initials}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-display-m">
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
          <p className="mt-1 text-body-s text-ink-950/60">
            Speaks {dentist.languages.join(", ")}
          </p>
        )}

        <div className="mt-auto pt-6">
          {dentist.next_slot_at ? (
            <p className="rounded border border-neem-100 bg-mineral-50 px-4 py-3 font-utility text-body-s tabular-nums text-ink-950">
              Next free: {formatDateTime(dentist.next_slot_at)}
            </p>
          ) : (
            <p className="text-body-s text-ink-950/60">No open slots in the next two weeks.</p>
          )}
          <Link
            href={`/care/dentists/${dentist.slug}`}
            className="mt-4 inline-flex items-center justify-center rounded border border-neem-100 px-4 py-2 font-utility text-body-s font-medium text-ink-950 transition hover:border-neem-600"
          >
            See times
          </Link>
        </div>
      </div>
    </article>
  );
}
