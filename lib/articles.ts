import { unstable_cache } from "next/cache";
import type { ArticleTeaser } from "@/components/site/ArticleCard";
import { createPublicClient } from "@/lib/supabase/server";

/** Public editorial content is shared by every visitor and changes infrequently. */
export const getPublishedArticles = unstable_cache(
  async (category?: string, limit?: number): Promise<ArticleTeaser[]> => {
    const supabase = createPublicClient();
    let query = supabase
      .from("articles")
      .select("slug, title, excerpt, category, published_at, body_md, cover_path")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (category) query = query.eq("category", category);
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ArticleTeaser[];
  },
  ["published-articles"],
  { tags: ["published-articles"], revalidate: 3600 },
);
