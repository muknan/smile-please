import "server-only";
import { createHash, createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * The Master §9.6 / Phase 6 §6.2 public-form protections, applied to every
 * public form: honeypot `website`, 3-second minimum fill time (timestamp
 * HMAC-signed so it can't be forged), and 5-per-IP-per-hour in Postgres
 * (check_rate_limit, keyed on sha256(ip + salt) — never the raw IP).
 */

export const MIN_FILL_MS = 3000;
export const MAX_TOKEN_AGE_MS = 2 * 60 * 60 * 1000;
export const HOURLY_LIMIT = 5;

const FORM_SECRET = process.env.FORM_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "dev-form-secret");
if (!FORM_SECRET) throw new Error("FORM_SECRET must be configured in production.");

/** Client IP best-effort (behind nginx/Vercel). Never logged raw. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const vercel = h.get("x-vercel-forwarded-for");
  if (vercel) return vercel.trim();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",").map((part) => part.trim()).filter(Boolean).at(-1) ?? "local";
  return h.get("x-real-ip") ?? "local";
}

export function hashedIpKey(scope: string, ip: string): string {
  return createHash("sha256").update(`${scope}|${ip}|${FORM_SECRET}`).digest("hex");
}

/** HMAC signature so a bot can't forge a back-dated renderedAt. */
export function signRenderedAt(ts: number): string {
  return createHmac("sha256", FORM_SECRET).update(String(ts)).digest("hex").slice(0, 16);
}

/** Returns the signed timestamp to embed in a hidden field (server render). */
export function makeRenderedAt(): string {
  const ts = Date.now();
  return `${ts}.${signRenderedAt(ts)}`;
}

export type HumanCheck = { ok: true } | { ok: false; error: string };

/**
 * Honeypot + minimum fill time. Called from server actions.
 * Honeypot-filled forms are dropped silently (the caller decides how to show
 * success); too-fast submissions get a visible error.
 */
export function checkHuman(formData: FormData): HumanCheck {
  const website = formData.get("website");
  if (typeof website === "string" && website !== "") {
    return { ok: false, error: "The form wasn't filled in by a human. Try again." };
  }
  const rendered = String(formData.get("renderedAt") ?? "");
  const [tsRaw, sig] = rendered.split(".");
  const ts = Number(tsRaw);
  const age = Date.now() - ts;
  if (
    !Number.isFinite(ts) ||
    ts <= 0 ||
    sig !== signRenderedAt(ts) ||
    age < MIN_FILL_MS ||
    age > MAX_TOKEN_AGE_MS
  ) {
    return {
      ok: false,
      error: "This form has expired or was submitted too quickly. Refresh and try again.",
    };
  }
  return { ok: true };
}

/**
 * True when the caller may proceed; false when over the per-IP hourly budget.
 * Uses the check_rate_limit RPC — the rate_limits table has no RLS policy and
 * is reachable only through that definer function.
 */
export async function withinRateLimit(scope: string, ip: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: hashedIpKey(scope, ip),
    p_limit: HOURLY_LIMIT,
    p_window_seconds: 3600,
  });
  return !error && data === true;
}
