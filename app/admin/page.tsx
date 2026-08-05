import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { relativeDays } from "@/lib/format";

export const metadata: Metadata = { title: "Admin overview", robots: { index: false } };

function dayStart(offsetDays: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + offsetDays * 86_400_000);
}

export default async function AdminOverviewPage() {
  await requireRole("admin");
  const supabase = await createClient();

  // Needs-action queues.
  const [requested, dentistEnq, tomorrowUnconfirmed, todayRes, weekRes, allRes] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id, created_at")
        .eq("status", "requested")
        .order("created_at", { ascending: true }),
      supabase
        .from("contact_submissions")
        .select("id, created_at")
        .eq("type", "dentist")
        .eq("status", "new")
        .order("created_at", { ascending: true }),
      supabase
        .from("appointments")
        .select("id")
        .eq("status", "assigned")
        .gte("scheduled_for", dayStart(1).toISOString())
        .lt("scheduled_for", dayStart(2).toISOString()),
      supabase.from("appointments").select("id", { count: "exact", head: true }).gte("scheduled_for", dayStart(0).toISOString()).lt("scheduled_for", dayStart(1).toISOString()),
      supabase.from("appointments").select("id", { count: "exact", head: true }).gte("scheduled_for", dayStart(0).toISOString()).lt("scheduled_for", dayStart(7).toISOString()),
      supabase.from("appointments").select("id", { count: "exact", head: true }),
    ]);

  const careWaits = requested.data ?? [];
  const dentistWaits = dentistEnq.data ?? [];
  const tomorrow = tomorrowUnconfirmed.data ?? [];

  const items: { label: string; detail: string; href: string; urgent: boolean }[] = [];
  if (careWaits.length)
    items.push({
      label: `${careWaits.length} care request${careWaits.length > 1 ? "s" : ""} unassigned`,
      detail: `oldest: ${relativeDays(careWaits[0].created_at)}`,
      href: "/admin/bookings?status=requested",
      urgent: true,
    });
  if (dentistWaits.length)
    items.push({
      label: `${dentistWaits.length} dentist enquire${dentistWaits.length > 1 ? "s" : "y"} unanswered`,
      detail: `oldest: ${relativeDays(dentistWaits[0].created_at)}`,
      href: "/admin/inbox?type=dentist",
      urgent: true,
    });
  if (tomorrow.length)
    items.push({
      label: `${tomorrow.length} booking${tomorrow.length > 1 ? "s" : ""} tomorrow, unconfirmed`,
      detail: "needs the dentist to confirm",
      href: "/admin/bookings?status=assigned",
      urgent: true,
    });

  const todayCount = todayRes.count ?? 0;
  const weekCount = weekRes.count ?? 0;
  const totalCount = allRes.count ?? 0;

  return (
    <>
      <h1 className="font-utility text-2xl font-bold text-ink-950">Overview</h1>
      <p className="mt-2 font-utility text-body-s text-ink-950/60">
        {totalCount} appointments in total. Land on what is rotting — oldest problem first.
      </p>

      <section aria-labelledby="needs-action" className="mt-8">
        <h2 className="font-utility text-label uppercase text-ink-950/70">Needs action</h2>
        {items.length === 0 ? (
          <p className="mt-4 rounded border border-neem-100 bg-chalk-0 p-6 font-utility text-body">
            Nothing waiting. {todayCount} appointments today.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {items.map((it) => (
              <li key={it.label}>
                <Link
                  href={it.href}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded border border-neem-100 bg-chalk-0 px-5 py-4 font-utility text-body transition hover:border-neem-600"
                >
                  <span className="flex items-center gap-3">
                    {it.urgent && (
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 rounded-full bg-marigold-500"
                      />
                    )}
                    <span className="font-medium text-ink-950">{it.label}</span>
                  </span>
                  <span className="text-body-s text-ink-950/60">{it.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Appointment volumes" className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded border border-neem-100 bg-chalk-0 p-6">
          <p className="font-utility text-label uppercase text-ink-950/70">Today</p>
          <p className="mt-2 text-data font-bold text-ink-950">{todayCount} appointments</p>
        </div>
        <div className="rounded border border-neem-100 bg-chalk-0 p-6">
          <p className="font-utility text-label uppercase text-ink-950/70">This week</p>
          <p className="mt-2 text-data font-bold text-ink-950">{weekCount} appointments</p>
        </div>
      </section>
    </>
  );
}
