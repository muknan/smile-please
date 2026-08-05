import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ArticlesEditor } from "@/components/admin/ArticlesEditor";

export const metadata: Metadata = { title: "Articles", robots: { index: false } };

const CATEGORIES = ["Prevention", "Children", "Gum health", "Camps"] as const;

export default async function AdminArticlesPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, category, body_md, cover_path, status, published_at, created_at")
    .order("updated_at", { ascending: false });
  const articles = data ?? [];

  return (
    <>
      <h1 className="text-display-l text-ink-950">Articles</h1>
      <ArticlesEditor articles={articles} categories={[...CATEGORIES]} />
    </>
  );
}
