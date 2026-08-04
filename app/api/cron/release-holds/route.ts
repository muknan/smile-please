import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase/admin";

/**
 * Resets expired 10-minute holds back to open (Phase 5 §5.7). Guarded by
 * CRON_SECRET in the Authorization header; wired to an external scheduler
 * (cron) in a later phase. One of the two permitted uses of the service-role
 * client: rate_limits/availability RLS deliberately grants anon nothing here,
 * and holds are system state, not user data.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data, error } = await admin
    .from("availability_slots")
    .update({ status: "open", held_until: null })
    .eq("status", "held")
    .lt("held_until", new Date().toISOString())
    .select("id");

  if (error) {
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, released: data?.length ?? 0 });
}
