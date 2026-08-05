import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { DentistsBoard } from "@/components/admin/DentistsBoard";
import type { Database } from "@/types/db";

export const metadata: Metadata = { title: "Dentists", robots: { index: false } };

type DentistStatus = Database["public"]["Enums"]["dentist_status"];

const STATUSES: DentistStatus[] = ["pending", "active", "paused", "rejected"];

type PageProps = { searchParams: Promise<{ status?: string }> };

export default async function AdminDentistsPage({ searchParams }: PageProps) {
  await requireRole("admin");
  const { status } = await searchParams;
  const activeStatus: DentistStatus | "all" = STATUSES.includes(status as DentistStatus)
    ? (status as DentistStatus)
    : "all";
  const supabase = await createClient();

  let query = supabase.from("dentists").select("profile_id, slug, display_name, locality, city, dci_registration_no, dci_verified_at, status, is_public, created_at");
  if (activeStatus !== "all") query = query.eq("status", activeStatus);
  const { data } = await query.order("created_at");
  const rows = data ?? [];

  const profileIds = rows.map((d) => d.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", profileIds.length ? profileIds : [""]);
  const emailByProfile = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  return (
    <>
      <h1 className="font-utility text-2xl font-bold text-ink-950">Dentists</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", ...STATUSES] as const).map((s) => (
          <a
            key={s}
            href={`/admin/dentists${s === "all" ? "" : `?status=${s}`}`}
            className={
              s === activeStatus
                ? "rounded-full bg-ink-950 px-4 py-2 font-utility text-body-s text-chalk-0"
                : "rounded-full border border-neem-100 bg-chalk-0 px-4 py-2 font-utility text-body-s text-ink-950 hover:border-neem-600"
            }
          >
            {s === "all" ? "All" : s}
          </a>
        ))}
      </div>

      <DentistsBoard
        rows={rows.map((d) => ({
          profile_id: d.profile_id,
          slug: d.slug,
          display_name: d.display_name,
          locality: d.locality,
          city: d.city,
          dci_registration_no: d.dci_registration_no,
          dci_verified_at: d.dci_verified_at,
          status: d.status,
          is_public: d.is_public,
          created_at: d.created_at,
          email: emailByProfile.get(d.profile_id) ?? null,
        }))}
      />
    </>
  );
}
