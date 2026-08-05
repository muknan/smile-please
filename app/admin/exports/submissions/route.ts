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
  const typeRaw = url.searchParams.get("type") ?? "";
  const type = (["patient", "dentist", "organization"] as const).find((t) => t === typeRaw) ?? "";

  const supabase = await createClient();
  let query = supabase.from("contact_submissions").select("*").order("created_at");
  if (from) query = query.gte("created_at", new Date(from).toISOString());
  if (to) query = query.lt("created_at", new Date(new Date(to).getTime() + 86_400_000).toISOString());
  if (type) query = query.eq("type", type);
  const { data } = await query;

  const headers = [
    "reference_code",
    "type",
    "name",
    "email",
    "phone",
    "organization_name",
    "dci_registration_no",
    "clinic_area",
    "partnership_type",
    "status",
    "message",
    "created_at",
  ];
  await logAudit("export.submissions", "submission", undefined, { from, to, type });
  return csvResponse(toCsv(headers, data ?? []), `smile-please-submissions-${new Date().toISOString().slice(0, 10)}.csv`);
}
