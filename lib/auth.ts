import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/db";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = Database["public"]["Enums"]["user_role"];

/** The current Supabase user, or null when signed out. Always verified server-side. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The current user's profiles row, or null. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data;
}

/** Guards an area that needs any signed-in user; returns the profile. */
export async function requireUser(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/auth/sign-in");
  return profile;
}

/**
 * Guards a role area. The role is read from the database on every call —
 * never from a cookie or client-supplied value. Admins pass every check.
 */
export async function requireRole(role: UserRole): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/auth/sign-in");
  if (profile.role !== "admin" && profile.role !== role) redirect("/403");
  return profile;
}

/** Server action: end the session and return to the homepage. */
export async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
