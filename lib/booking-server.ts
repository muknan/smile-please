import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SECRET = process.env.FORM_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "dev-form-secret");
if (!SECRET) throw new Error("FORM_SECRET must be configured in production.");

const CAPABILITY_TTL_MS = 10 * 60 * 1000;

function mac(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

/** A short lived, signed capability binding a browser to one held slot. */
export function createHoldCapability(slotId: string, now = Date.now()) {
  const payload = `${slotId}.${now + CAPABILITY_TTL_MS}.${randomBytes(12).toString("base64url")}`;
  return `${payload}.${mac(payload)}`;
}

export function heldSlotFromCapability(token: string | undefined, now = Date.now()) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires < now) return false;
  const expected = mac(parts.slice(0, 3).join("."));
  const provided = parts[3];
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b) ? parts[0] : false;
}

export function verifyHoldCapability(token: string | undefined, slotId: string, now = Date.now()) {
  return heldSlotFromCapability(token, now) === slotId;
}

export const HOLD_COOKIE = "smile-please-hold";
export const HOLD_TTL_SECONDS = CAPABILITY_TTL_MS / 1000;
