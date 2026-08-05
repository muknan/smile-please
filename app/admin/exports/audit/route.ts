import { createClient } from "@/lib/supabase/server";
import { requireAdminRoute } from "@/lib/route-auth";
import { logAudit } from "@/lib/audit";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(request: Request) {
  const guard = await requireAdminRoute();
  if (guard) return guard;
  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";

  const supabase = await createClient();
  let query = supabase.from("audit_log").select("*").order("created_at", { ascending: false });
  if (from) query = query.gte("created_at", new Date(from).toISOString());
  if (to) query = query.lt("created_at", new Date(new Date(to).getTime() + 86_400_000).toISOString());
  const { data } = await query;

  const headers = ["id", "actor_id", "action", "entity", "entity_id", "metadata", "ip_hash", "created_at"];
  await logAudit("export.audit", "audit_log", undefined, { from, to });
  return csvResponse(toCsv(headers, data ?? []), `smile-please-audit-${new Date().toISOString().slice(0, 10)}.csv`);
}
