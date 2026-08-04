import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { SignOutForm } from "@/components/site/SignOutForm";
import { DentistTabs } from "@/components/dentist/DentistTabs";

export default async function DentistLayout({ children }: { children: React.ReactNode }) {
  await requireRole("dentist");
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
