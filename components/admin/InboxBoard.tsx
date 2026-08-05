"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDate, relativeDays } from "@/lib/format";
import { updateSubmission, convertToDentist, logSubmissionView } from "@/app/admin/actions";
import { Badge } from "@/components/ui/Badge";
import type { InboxSubmission } from "@/app/admin/inbox/page";
import type { Database } from "@/types/db";

type SubmissionType = Database["public"]["Enums"]["submission_type"];
type SubmissionStatus = Database["public"]["Enums"]["submission_status"];

const STATUS_TONE: Record<SubmissionStatus, "neutral" | "success" | "active" | "warning" | "danger"> = {
  new: "warning",
  in_review: "neutral",
  contacted: "active",
  resolved: "success",
  spam: "danger",
};

const STATUS_ORDER: SubmissionStatus[] = ["new", "in_review", "contacted", "resolved", "spam"];

const TYPE_LABEL: Record<SubmissionType, string> = {
  dentist: "Dentist",
  patient: "Patient",
  organization: "Organisation",
};

export function InboxBoard({ submissions }: { submissions: InboxSubmission[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const selected = submissions.find((s) => s.id === selectedId) ?? null;

  const open = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
    setError(null);
    setNotice(null);
    void logSubmissionView(id);
  };

  const doConvert = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await convertToDentist(selected.id);
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Couldn't convert.");
    else {
      setNotice(
        `Created a pending dentist profile for ${res.email}. They can finish their profile once the mailer (SMTP) is provisioned.`,
      );
      startTransition(() => router.refresh());
    }
  };

  const doStatus = async (status: SubmissionStatus, note: string) => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await updateSubmission(selected.id, status, note);
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Couldn't update.");
    startTransition(() => router.refresh());
  };

  return (
    <div className="mt-4 overflow-x-auto rounded border border-neem-100 bg-chalk-0">
      <table className="w-full border-collapse font-utility text-data">
        <thead className="text-left text-label uppercase text-ink-950/60">
          <tr>
            <th className="px-4 py-3">Reference</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Received</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {submissions.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-ink-950/60">
                Nothing here yet.
              </td>
            </tr>
          )}
          {submissions.map((s) => (
            <tr
              key={s.id}
              onClick={() => open(s.id)}
              className={
                "cursor-pointer border-t border-neem-100 bg-chalk-0 hover:bg-neem-50 " +
                (s.id === selectedId ? "bg-neem-100" : "")
              }
            >
              <td className="px-4 py-3 font-medium text-ink-950">{s.reference_code}</td>
              <td className="px-4 py-3 text-ink-950">
                {s.name}
                {s.organization_name ? ` · ${s.organization_name}` : ""}
              </td>
              <td className="px-4 py-3 text-ink-950/70">{s.email ?? s.phone ?? "—"}</td>
              <td className="px-4 py-3 text-ink-950/70">
                {formatDate(s.created_at)} · {relativeDays(s.created_at)}
              </td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONE[s.status] ?? "neutral"}>{s.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-ink-950/30" onClick={() => open(selected.id)}>
          <div
            className="h-full w-full max-w-lg overflow-y-auto bg-chalk-0 p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-utility text-xl font-bold text-ink-950">
                  {selected.reference_code}
                </h2>
                <p className="font-utility text-body-s text-ink-950/70">
                  {TYPE_LABEL[selected.type]} · <Badge tone={STATUS_TONE[selected.status]}>{selected.status}</Badge>
                </p>
              </div>
              <button onClick={() => open(selected.id)} aria-label="Close" className="rounded p-2 hover:bg-neem-100">
                ✕
              </button>
            </div>

            <dl className="mt-5 space-y-3 font-utility text-body">
              <div>
                <dt className="text-label uppercase text-ink-950/60">Contact</dt>
                <dd className="mt-0.5 text-ink-950">{selected.name}</dd>
                {selected.organization_name && (
                  <dd className="text-body-s text-ink-950/70">{selected.organization_name}</dd>
                )}
                <dd className="text-body-s text-ink-950/70">{selected.email}</dd>
                <dd className="text-body-s text-ink-950/70">{selected.phone}</dd>
                {selected.dci_registration_no && (
                  <dd className="text-body-s text-ink-950/70">DCI: {selected.dci_registration_no}</dd>
                )}
                {selected.clinic_area && (
                  <dd className="text-body-s text-ink-950/70">Clinic area: {selected.clinic_area}</dd>
                )}
                {selected.availability && (
                  <dd className="text-body-s text-ink-950/70">Free: {selected.availability}</dd>
                )}
                {selected.partnership_type && (
                  <dd className="text-body-s text-ink-950/70">Partnership: {selected.partnership_type}</dd>
                )}
              </div>
              <div>
                <dt className="text-label uppercase text-ink-950/60">Message</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-ink-950">{selected.message}</dd>
              </div>
            </dl>

            {selected.type === "dentist" && (
              <div className="mt-5 rounded border border-neem-100 bg-neem-50 p-4">
                <p className="font-utility text-body text-ink-950">
                  The NGO cannot function without volunteer dentists. This is the highest-value queue.
                </p>
                {!selected.converted_to_profile_id ? (
                  <button
                    onClick={doConvert}
                    disabled={busy}
                    className="mt-3 rounded bg-neem-900 px-4 py-2 font-utility text-body-s font-bold text-chalk-0 disabled:opacity-60"
                  >
                    {busy ? "Creating…" : "Convert to dentist profile"}
                  </button>
                ) : (
                  <p className="mt-3 font-utility text-body-s text-ink-950/70">
                    Converted to a dentist profile already.
                  </p>
                )}
                <p className="mt-2 font-utility text-body-s text-ink-950/60">
                  Creates an account and a pending dentist profile. No email is sent until the mailer is
                  provisioned.
                </p>
              </div>
            )}

            <div className="mt-5">
              <p className="font-utility text-label uppercase text-ink-950/60">Internal notes</p>
              <textarea
                defaultValue={selected.admin_notes ?? ""}
                rows={3}
                aria-label="Internal notes"
                className="mt-2 w-full rounded border border-neem-100 bg-chalk-0 px-3 py-2 font-utility text-body"
              />
              <p className="mt-1 font-utility text-body-s text-ink-950/50">
                Saved with the status change below.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-utility text-label uppercase text-ink-950/60">Status:</span>
              {STATUS_ORDER.map((st) => (
                <form key={st} action={async (fd) => {
                  await doStatus(st, String(fd.get("note") ?? ""));
                }}>
                  <input type="hidden" name="note" defaultValue={selected.admin_notes ?? ""} />
                  <button
                    type="submit"
                    disabled={busy || st === selected.status}
                    className={
                      st === selected.status
                        ? "rounded bg-ink-950 px-3 py-1.5 font-utility text-body-s font-medium text-chalk-0"
                        : "rounded border border-neem-100 px-3 py-1.5 font-utility text-body-s text-ink-950 hover:border-neem-600"
                    }
                  >
                    {st}
                  </button>
                </form>
              ))}
            </div>

            {selected.email && (
              <p className="mt-4 font-utility text-body-s text-ink-950/70">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.reference_code}`)}`}
                  className="font-medium text-neem-600 underline underline-offset-2"
                >
                  Quick reply by email
                </a>{" "}
                (prefilled with your reference code).
              </p>
            )}

            {error && <p className="mt-4 font-utility text-body-s text-clay-600">{error}</p>}
            {notice && (
              <p className="mt-4 rounded border border-neem-600/40 bg-neem-50 p-3 font-utility text-body-s text-neem-600">
                {notice}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
