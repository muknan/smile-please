import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clientIp, hashedIpKey } from "@/lib/antispam";
import { admin } from "@/lib/supabase/admin";
import {
  createHoldCapability,
  HOLD_COOKIE,
  HOLD_OWNER_COOKIE,
  HOLD_TTL_SECONDS,
  createHoldOwner,
  holdOwnerFromCookie,
  refreshHoldOwner,
} from "@/lib/booking-server";

/**
 * Places the 10-minute hold. The mutation is service-only; this endpoint is
 * the narrow validated boundary and issues a signed browser capability.
 */
export async function POST(request: Request) {
  let slotId: unknown;
  try {
    ({ slotId } = await request.json());
  } catch {
    slotId = undefined;
  }
  if (
    typeof slotId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slotId)
  ) {
    return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const holdOwner = holdOwnerFromCookie(cookieStore.get(HOLD_OWNER_COOKIE)?.value);
  // Set the signed owner first. A browser cannot send a newly set HttpOnly
  // cookie until its next request, so this request intentionally performs no
  // hold mutation; the client retries once after receiving this response.
  if (!holdOwner) {
    const response = NextResponse.json({ ok: false, error: "HOLD_OWNER_INITIALIZED" }, { status: 428 });
    response.cookies.set(HOLD_OWNER_COOKIE, createHoldOwner(), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      maxAge: HOLD_TTL_SECONDS, path: "/",
    });
    return response;
  }

  const ip = await clientIp();
  const { data: allowed, error: rateError } = await admin.rpc("check_rate_limit", {
    p_key: hashedIpKey("hold", ip),
    p_limit: 30,
    p_window_seconds: 3600,
  });
  if (rateError || allowed !== true) {
    return NextResponse.json({ ok: false, error: "RATE_LIMITED" }, { status: 429 });
  }

  const { data, error } = await admin.rpc("hold_slot", { p_slot_id: slotId, p_hold_owner: holdOwner });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("SLOT_HELD")) {
      return NextResponse.json({ ok: false, error: "SLOT_HELD" }, { status: 409 });
    }
    if (msg.includes("SLOT_TAKEN")) {
      return NextResponse.json({ ok: false, error: "SLOT_TAKEN" }, { status: 409 });
    }
    if (msg.includes("SLOT_NOT_FOUND")) {
      return NextResponse.json({ ok: false, error: "SLOT_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "ERROR" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, slot: data });
  // A replacement selection starts a fresh ten-minute lease. Renew the owner
  // token to the same deadline so the browser can confirm for the full hold.
  response.cookies.set(HOLD_OWNER_COOKIE, refreshHoldOwner(holdOwner), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    maxAge: HOLD_TTL_SECONDS, path: "/",
  });
  response.cookies.set(HOLD_COOKIE, createHoldCapability(slotId, holdOwner), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    maxAge: HOLD_TTL_SECONDS, path: "/",
  });
  return response;
}
