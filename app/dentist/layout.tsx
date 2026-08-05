import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SignOutForm } from "@/components/site/SignOutForm";
import { DentistTabs } from "@/components/dentist/DentistTabs";

export default async function DentistLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("dentist");
  // D-34: an admin passes requireRole but may have no dentists row — such an
  // admin belongs in the admin portal, not the dentist portal.
  if (profile.role === "admin") {
    const supabase = await createClient();
    const { data: dentistRow } = await supabase
      .from("dentists")
      .select("profile_id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (!dentistRow) redirect("/admin");
  }
  return (
    <main className="min-h-screen">
      <div className="container-content max-w-4xl py-16">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <Link
            href="/dentist"
            className="font-display text-display-m text-ink-950 hover:text-neem-600"
          >
            Dentist portal
          </Link>
          <SignOutForm />
        </header>
        <DentistTabs />
        {children}
      </div>
    </main>
  );
}
