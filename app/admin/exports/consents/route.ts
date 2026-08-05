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
  let query = supabase.from("consents").select("*").order("granted_at");
  if (from) query = query.gte("granted_at", new Date(from).toISOString());
  if (to) query = query.lt("granted_at", new Date(new Date(to).getTime() + 86_400_000).toISOString());
  const { data } = await query;

  const headers = ["id", "subject_type", "subject_id", "purpose", "notice_version", "granted_at", "withdrawn_at", "method"];
  await logAudit("export.consents", "consent", undefined, { from, to });
  return csvResponse(toCsv(headers, data ?? []), `smile-please-consents-${new Date().toISOString().slice(0, 10)}.csv`);
}
