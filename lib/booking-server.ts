import "server-only";

import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

const SECRET = process.env.FORM_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "dev-form-secret");
if (!SECRET) throw new Error("FORM_SECRET must be configured in production.");

const CAPABILITY_TTL_MS = 10 * 60 * 1000;

function mac(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

/** A short lived, signed capability binding a browser to one held slot. */
export function createHoldOwner(now = Date.now()) {
  return refreshHoldOwner(randomUUID(), now);
}

/** Renews the signed owner while preserving the browser identity stored in the DB. */
export function refreshHoldOwner(ownerId: string, now = Date.now()) {
  const payload = `${ownerId}.${now + CAPABILITY_TTL_MS}`;
  return `${payload}.${mac(payload)}`;
}

export function holdOwnerFromCookie(token: string | undefined, now = Date.now()) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parts[0])) return false;
  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires < now) return false;
  const expected = mac(parts.slice(0, 2).join("."));
  const a = Buffer.from(expected);
  const b = Buffer.from(parts[2]);
  return a.length === b.length && timingSafeEqual(a, b) ? parts[0] : false;
}

export function createHoldCapability(slotId: string, ownerId: string, now = Date.now()) {
  const payload = `${slotId}.${ownerId}.${now + CAPABILITY_TTL_MS}.${randomBytes(12).toString("base64url")}`;
  return `${payload}.${mac(payload)}`;
}

export function heldSlotFromCapability(token: string | undefined, now = Date.now()) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 5) return false;
  const expires = Number(parts[2]);
  if (!Number.isFinite(expires) || expires < now) return false;
  const expected = mac(parts.slice(0, 4).join("."));
  const provided = parts[4];
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b) ? parts[0] : false;
}

export function verifyHoldCapability(token: string | undefined, slotId: string, ownerId: string, now = Date.now()) {
  if (heldSlotFromCapability(token, now) !== slotId) return false;
  const parts = token?.split(".");
  return parts?.[1] === ownerId;
}

/** Returns the signed lease deadline only when the capability belongs to this browser and slot. */
export function holdExpiresAtFromCapability(
  token: string | undefined,
  slotId: string,
  ownerId: string,
  now = Date.now(),
) {
  if (!verifyHoldCapability(token, slotId, ownerId, now)) return null;
  const expiresAt = Number(token?.split(".")[2]);
  return Number.isFinite(expiresAt) ? expiresAt : null;
}

export const HOLD_COOKIE = "smile-please-hold";
export const HOLD_OWNER_COOKIE = "smile-please-hold-owner";
export const HOLD_TTL_SECONDS = CAPABILITY_TTL_MS / 1000;
