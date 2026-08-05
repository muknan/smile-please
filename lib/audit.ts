import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/db";

export type AuditAction =
  | "booking.view"
  | "booking.action"
  | "submission.view"
  | "submission.update"
  | "submission.convert"
  | "dentist.update"
  | "dentist.approve"
  | "dentist.verify_dci"
  | "article.save"
  | "article.publish"
  | "article.unpublish"
  | "export.bookings"
  | "export.submissions"
  | "export.consents"
  | "export.audit"
  | "role.change";

/**
 * Phase 7 §7.8 — access logging. Every meaningful admin read/write is an
 * event: opening a booking or submission drawer, running an export, changing
 * a role. Action names are stable strings so the log can be filtered later.
 * The data itself is NEVER logged — the entity id is enough.
 */
export async function logAudit(
  action: AuditAction,
  entity: string,
  entityId?: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = await createClient();
    await (supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => { error: unknown })(
      "write_audit",
      {
        p_action: action,
        p_entity: entity,
        p_entity_id: entityId ?? null,
        p_metadata: (metadata ?? null) as Database["public"]["Tables"]["audit_log"]["Insert"]["metadata"],
      },
    );
  } catch {
    // Logging must never take the admin action it accompanies down with it.
  }
}
