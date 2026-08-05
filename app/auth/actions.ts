"use server";

import { createClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/schemas";
import { checkHuman, clientIp, hashedIpKey } from "@/lib/antispam";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const HOURLY_LIMIT = 5;

export type SignInState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; error: string };

/**
 * Sends a magic link. Runs the Master §9.6 public-form protections server-side:
 * honeypot `website`, 3-second minimum fill time, and the 5-per-hour per-IP
 * rate limit (stored in Postgres via migration 008) — a direct client call to
 * supabase.auth.signInWithOtp would let a bot bypass all three.
 */
export async function requestSignInLink(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const human = checkHuman(formData);
  if (!human.ok) return { status: "error", error: human.error };

  const parsed = signInSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }
  const email = parsed.data.email;

  const ip = await clientIp();
  const supabase = await createClient();
  const { data: allowed, error: rateError } = await supabase.rpc("record_signin_attempt", {
    p_ip: hashedIpKey("signin", ip),
  });
  if (rateError || allowed === false) {
    return {
      status: "error",
      error: `Too many sign-in requests from this network in the last hour (limit ${HOURLY_LIMIT}). Wait an hour and try again.`,
    };
  }

  const rawNext = formData.get("next");
  const next =
    typeof rawNext === "string" && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/account";

  const { error: sendError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (sendError) {
    return {
      status: "error",
      error: "We couldn't send the link just now. Wait a few minutes and try again.",
    };
  }

  return { status: "sent", email };
}

