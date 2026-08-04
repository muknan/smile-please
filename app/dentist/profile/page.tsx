import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ProfileForm } from "@/components/dentist/ProfileForm";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false },
};

export default async function DentistProfilePage() {
  const profile = await requireRole("dentist");
  const supabase = await createClient();
  const { data: dentist } = await supabase
    .from("dentists")
    .select("slug, display_name, locality, specialties, languages, bio, is_public, status")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!dentist) {
    return (
      <>
        <h1 className="mt-12 text-display-l">Profile</h1>
        <p className="mt-6 max-w-[60ch] text-body-l text-ink-950/70">
          Your dentist profile isn&apos;t set up yet — the team will do that when
          they approve you. Check back after approval.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="mt-12 text-display-l">Your public profile</h1>
      {!dentist.is_public && (
        <p className="mt-4 max-w-[65ch] rounded border border-neem-100 bg-chalk-0 px-4 py-3 text-body-s">
          Your profile is currently hidden while it&apos;s reviewed. The team will
          publish it once it&apos;s checked.
        </p>
      )}
      <ProfileForm
        displayName={dentist.display_name}
        locality={dentist.locality}
        specialties={dentist.specialties}
        languages={dentist.languages}
        bio={dentist.bio}
      />
    </>
  );
}
