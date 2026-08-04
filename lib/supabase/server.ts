import { createServerClient } from "@supabase/ssr";
import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/db";

/**
 * Server client — anon key, reads auth cookies. Default for everything.
 * Outside a request scope (generateStaticParams during `next build`) cookies()
 * throws synchronously; there is no session in that context, so a stateless
 * anon client (same anon key, no cookies) is the correct equivalent.
 */
export async function createClient() {
  try {
    const cookieStore = await cookies();
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // Called from a Server Component — safe to ignore if middleware
              // refreshes the session.
            }
          },
        },
      },
    );
  } catch {
    return createStatelessClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
}
