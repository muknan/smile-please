import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { SignOutForm } from "@/components/site/SignOutForm";

export const metadata: Metadata = { title: "Dentist portal" };

export default async function DentistHomePage() {
  const profile = await requireRole("dentist");
  const firstName = profile.full_name.trim().split(/\s+/)[0] ?? "there";

  return (
    <main className="py-24">
      <div className="container-content max-w-2xl">
        <p className="text-label">Dentist portal</p>
        <h1 className="mt-6 text-display-l">Hello, {firstName}</h1>
        <p className="mt-4 text-body-l text-ink-950/70">
          This is where you&apos;ll set your availability, see your appointments, and manage your
          public profile.
        </p>
        <p className="mt-6 text-body-s text-ink-950/60">
          Signed in as {profile.email ?? profile.full_name}.{" "}
          <Link href="/" className="font-medium text-neem-600 underline-offset-2 hover:underline">
            View the public site
          </Link>
        </p>
        <div className="mt-10">
          <SignOutForm />
        </div>
      </div>
    </main>
  );
}
