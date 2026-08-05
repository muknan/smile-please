import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

/**
 * SERVICE ROLE client. Bypasses RLS. Used in exactly four places:
 * 1. the admin dentist-approval action (Phase 7)
 * 2. the scheduled hold-expiry job
 * 3. the admin daily digest cron (runs with no user session)
 * 4. email-failure audit logging (same reason)
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
