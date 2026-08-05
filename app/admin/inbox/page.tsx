import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { InboxBoard } from "@/components/admin/InboxBoard";
import type { Database } from "@/types/db";

export const metadata: Metadata = { title: "Inbox", robots: { index: false } };

type SubmissionType = Database["public"]["Enums"]["submission_type"];

const TYPES: SubmissionType[] = ["dentist", "patient", "organization"];

const TYPE_LABEL: Record<SubmissionType, string> = {
  dentist: "Dentists",
  patient: "Patients",
  organization: "Organisations",
};

type PageProps = { searchParams: Promise<{ type?: string }> };

export default async function AdminInboxPage({ searchParams }: PageProps) {
  await requireRole("admin");
  const { type } = await searchParams;
  const activeType: SubmissionType = TYPES.includes(type as SubmissionType) ? (type as SubmissionType) : "dentist";
  const supabase = await createClient();

  const [subsRes, countsRes] = await Promise.all([
    supabase
      .from("contact_submissions")
      .select("*")
      .eq("type", activeType)
      .order("created_at", { ascending: false }),
    supabase
      .from("contact_submissions")
      .select("type")
      .eq("status", "new"),
  ]);

  const unread: Record<SubmissionType, number> = { dentist: 0, patient: 0, organization: 0 };
  for (const r of countsRes.data ?? []) {
    const t = r.type as SubmissionType;
    if (t in unread) unread[t] += 1;
  }

  return (
    <>
      <h1 className="text-display-l text-ink-950">Inbox</h1>

      <div role="tablist" aria-label="Submission type" className="mt-4 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <a
            key={t}
            role="tab"
            href={`/admin/inbox?type=${t}`}
            aria-selected={t === activeType}
            className={
              t === activeType
                ? "inline-flex items-center gap-2 rounded-full bg-ink-950 px-4 py-2 font-utility text-body-s text-chalk-0"
                : "inline-flex items-center gap-2 rounded-full border border-neem-100 bg-chalk-0 px-4 py-2 font-utility text-body-s text-ink-950 hover:border-neem-600"
            }
          >
            {TYPE_LABEL[t]}
            {unread[t] > 0 && (
              <span className="rounded-full bg-marigold-500 px-1.5 font-utility text-data font-bold text-ink-950">
                {unread[t]}
              </span>
            )}
          </a>
        ))}
      </div>

      <InboxBoard submissions={(subsRes.data ?? []) as InboxSubmission[]} />
    </>
  );
}

export type InboxSubmission = Database["public"]["Tables"]["contact_submissions"]["Row"];
