import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST-only sign-out, so a stray link or prefetch can never end a session.
 * Any GET to this route is a 405 by Next.js.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url));
}
