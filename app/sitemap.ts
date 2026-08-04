import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/care",
    "/learn",
    "/contact",
    "/privacy",
    "/terms",
  ].map((path) => ({ url: `${BASE}${path}`, lastModified: new Date() }));

  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("slug, updated_at")
    .eq("status", "published");

  const articles: MetadataRoute.Sitemap = (data ?? []).map((article) => ({
    url: `${BASE}/learn/${article.slug}`,
    lastModified: new Date(article.updated_at),
  }));

  return [...staticPages, ...articles];
}
