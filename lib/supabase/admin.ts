import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

/**
 * SERVICE ROLE client. Bypasses RLS. Used in exactly two places:
 * 1. the admin dentist-approval action
 * 2. the scheduled hold-expiry job
 * If you think you need it elsewhere, you have an RLS bug — fix the policy.
 */
export const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
