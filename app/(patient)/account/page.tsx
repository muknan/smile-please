import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { displayFirstName } from "@/lib/format";
import { AccountClient } from "./AccountClient";

export const metadata: Metadata = {
  title: "Your account",
  description: "Your Smile Please appointments, details, and consent choices.",
  robots: { index: false },
};

export default async function AccountPage() {
  const profile = await requireUser();
  const supabase = await createClient();

  const [patientRes, consentsRes] = await Promise.all([
    supabase.from("patients").select("*").eq("profile_id", profile.id).maybeSingle(),
    supabase
      .from("consents")
      .select("*")
      .eq("subject_type", "profile")
      .eq("subject_id", profile.id)
      .order("granted_at"),
  ]);

  const { data: appointmentsData } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", profile.id)
    .order("scheduled_for", { ascending: false });

  const { data: dentistsData } = await supabase
    .from("dentists")
    .select("profile_id, slug")
    .in(
      "profile_id",
      (appointmentsData ?? [])
        .map((a) => a.dentist_id)
        .filter((id): id is string => id !== null),
    );

  const appointmentsList = appointmentsData ?? [];
  const consents = consentsRes.data ?? [];
  const slugByDentist = new Map(
    (dentistsData ?? []).map((d) => [d.profile_id, d.slug]),
  );

  const now = new Date();
  const terminalStatuses = new Set(["cancelled_by_patient", "cancelled_by_dentist", "cancelled_by_admin", "completed", "no_show"]);
  const waitingOnUs = appointmentsList.filter(
    (a) => !a.scheduled_for && (a.status === "requested" || a.status === "assigned"),
  );
  const waitingIds = new Set(waitingOnUs.map((a) => a.id));
  const upcoming = appointmentsList.filter(
    (a) => a.scheduled_for && new Date(a.scheduled_for) >= now && !terminalStatuses.has(a.status),
  );
  const upcomingIds = new Set(upcoming.map((a) => a.id));
  const past = appointmentsList.filter((a) => !waitingIds.has(a.id) && !upcomingIds.has(a.id));

  // Don't surface the internal seed placeholder ("New user") as a greeting.
  const greeting = displayFirstName(profile.full_name);

  return (
    <div className="py-24">
      <div className="container-content max-w-3xl space-y-24">
        <header>
          <p className="font-utility text-label uppercase text-neem-600">Account</p>
          <h1 className="mt-6 text-display-l">Hello, {greeting}</h1>
          {profile.email && (
            <p className="mt-4 text-body-s text-ink-950/60">Signed in as {profile.email}</p>
          )}
        </header>

        <AccountClient
          profile={profile}
          patient={patientRes.data}
          waitingOnUs={waitingOnUs}
          upcoming={upcoming}
          past={past}
          consents={consents}
          slugByDentist={slugByDentist}
        />

        <section aria-labelledby="export-heading">
          <h2 id="export-heading" className="text-display-m">
            Your data
          </h2>
          <p className="mt-4 max-w-[60ch] text-body text-ink-950/80">
            Download everything we hold about you. The file is JSON — any text
            editor can open it.
          </p>
          <a
            href="/account/export"
            className="mt-6 inline-flex items-center justify-center rounded border border-neem-100 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:border-neem-600"
          >
            Download my data
          </a>
        </section>

        <p className="text-body-s text-ink-950/60">
          Want everything deleted?{" "}
          <Link href="/privacy" className="font-medium text-neem-600 underline underline-offset-4">
            Read the privacy notice
          </Link>{" "}
          — it explains the full withdrawal and erasure process.
        </p>
      </div>
    </div>
  );
}
