import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Route-handler guard (route handlers can't call redirect()). Returns a 401/403
 * Response when the caller isn't an authenticated admin, or null to proceed.
 */
export async function requireAdminRoute(): Promise<Response | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return new Response("Forbidden", { status: 403 });
  return null;
}
