import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

/** Supabase JWT expiry is global (7 days), so admin sessions are capped here
 * at 8 hours: measured from the verified user's last_sign_in_at. */
const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const lastSignIn = user?.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
  const expired = user !== null && Date.now() - lastSignIn > ADMIN_SESSION_MS;

  if (expired) {
    await supabase.auth.signOut();
    redirect("/auth/sign-in?reason=admin_timeout");
  }

  return <>{children}</>;
}
