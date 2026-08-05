import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Exports", robots: { index: false } };

const KIND_OPTIONS = [
  { value: "patient", label: "Patients" },
  { value: "dentist", label: "Dentists" },
  { value: "organization", label: "Organisations" },
  { value: "", label: "All types" },
];

export default async function AdminExportsPage() {
  await requireRole("admin");
  return (
    <>
      <h1 className="text-display-l text-ink-950">Exports</h1>
      <p className="mt-2 max-w-[65ch] rounded border border-clay-600/40 bg-clay-600/5 p-4 font-utility text-body-s text-ink-950">
        Exported files contain personal data. Store them securely and delete them when you&apos;re
        done. Every export is recorded in the audit log.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded border border-neem-100 bg-chalk-0 p-5">
          <h2 className="font-utility text-lg font-bold text-ink-950">Bookings</h2>
          <ExportForm action="/admin/exports/bookings">
            <p className="mt-3 font-utility text-body-s text-ink-950/60">
              Excludes clinical notes by default.
            </p>
            <label className="mt-2 flex items-center gap-2 font-utility text-body-s text-ink-950">
              <input type="checkbox" name="clinical" value="1" />
              Include clinical notes (sensitive — handle with care)
            </label>
          </ExportForm>
        </section>

        <section className="rounded border border-neem-100 bg-chalk-0 p-5">
          <h2 className="font-utility text-lg font-bold text-ink-950">Contact submissions</h2>
          <ExportForm action="/admin/exports/submissions">
            <label className="mt-3 block">
              <span className="font-utility text-label uppercase text-ink-950/60">Type</span>
              <select name="type" className="mt-1 w-full rounded border border-neem-100 bg-chalk-0 px-3 py-2 font-utility text-body">
                {KIND_OPTIONS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
          </ExportForm>
        </section>

        <section className="rounded border border-neem-100 bg-chalk-0 p-5">
          <h2 className="font-utility text-lg font-bold text-ink-950">Consent records</h2>
          <ExportForm action="/admin/exports/consents" />
        </section>

        <section className="rounded border border-neem-100 bg-chalk-0 p-5">
          <h2 className="font-utility text-lg font-bold text-ink-950">Audit log</h2>
          <ExportForm action="/admin/exports/audit" />
        </section>
      </div>
    </>
  );
}

function ExportForm({ action, children }: { action: string; children?: React.ReactNode }) {
  return (
    <form action={action} method="get" className="mt-3">
      {children}
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="font-utility text-label uppercase text-ink-950/60">From</span>
          <input type="date" name="from" className="mt-1 rounded border border-neem-100 bg-chalk-0 px-3 py-2 font-utility text-body" />
        </label>
        <label className="block">
          <span className="font-utility text-label uppercase text-ink-950/60">To</span>
          <input type="date" name="to" className="mt-1 rounded border border-neem-100 bg-chalk-0 px-3 py-2 font-utility text-body" />
        </label>
        <button className="rounded bg-neem-900 px-4 py-2 font-utility text-body-s font-medium text-chalk-0">
          Export CSV
        </button>
      </div>
    </form>
  );
}
