import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientIp, hashedIpKey } from "@/lib/antispam";

/**
 * Places the 10-minute hold (Phase 5 §5.6/5.7). Anonymous by design — Path B
 * booking never requires an account. The hold correctness lives in the
 * hold_slot RPC (row lock first); this route is a thin wrapper.
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

  const ip = await clientIp();
  const supabase = await createClient();
  const { data: allowed, error: rateError } = await supabase.rpc("check_rate_limit", {
    p_key: hashedIpKey("hold", ip),
    p_limit: 30,
    p_window_seconds: 3600,
  });
  if (rateError || allowed !== true) {
    return NextResponse.json({ ok: false, error: "RATE_LIMITED" }, { status: 429 });
  }

  const { data, error } = await supabase.rpc("hold_slot", { p_slot_id: slotId });

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

  return NextResponse.json({ ok: true, slot: data });
}
