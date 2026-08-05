import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase/admin";

/**
 * Phase 8 §8.5 — keep-alive. The free Supabase tier pauses a project after 7
 * days of inactivity; a low-traffic prototype will hit that. This is a trivial
 * DB read run every 6 hours to hold the project awake. Not optional.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const t0 = Date.now();
  const { count, error } = await admin.from("profiles").select("id", { count: "exact", head: true });
  if (error) return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  return NextResponse.json({ ok: true, profcount: count ?? 0, ms: Date.now() - t0 });
}
