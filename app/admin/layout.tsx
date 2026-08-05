import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { SignOutForm } from "@/components/site/SignOutForm";

/** Supabase JWT expiry is global (7 days), so admin sessions are capped here
 * at 8 hours: measured from the verified user's last_sign_in_at. */
const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("admin");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const lastSignIn = user?.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
  if (user !== null && Date.now() - lastSignIn > ADMIN_SESSION_MS) {
    await supabase.auth.signOut();
    redirect("/auth/sign-in?reason=admin_timeout");
  }

  // Unread counts for the nav badges (admin RLS reads everything).
  const [bookingsRes, inboxRes, dentistsRes] = await Promise.all([
    supabase.from("appointments").select("id", { count: "exact", head: true }).in("status", ["requested", "assigned"]),
    supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("dentists").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const counts = {
    bookings: bookingsRes.count ?? 0,
    inbox: inboxRes.count ?? 0,
    dentists: dentistsRes.count ?? 0,
  };

  return (
    <div className="min-h-screen bg-chalk-0 pb-16 md:pb-0">
      <AdminNav counts={counts} />

      <div className="md:pl-60">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-end gap-4 border-b border-neem-100 bg-chalk-0 px-4 md:px-8">
          <span className="font-utility text-body-s text-ink-950">
            {profile.full_name}
            {profile.email ? ` · ${profile.email}` : ""}
          </span>
          <SignOutForm />
        </header>

        <main className="px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
