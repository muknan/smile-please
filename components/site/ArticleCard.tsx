import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/format";
import { CategoryIcon } from "./CategoryIcon";

export type ArticleTeaser = {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  published_at: string | null;
  body_md: string;
  cover_path: string | null;
};

/** Rough read time from word count — a 60-second estimate, not a promise. */
export function readMinutes(bodyMd: string): number {
  const words = bodyMd.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function coverUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/article-covers/${path}`;
}

/**
 * Compact card — a small icon/thumbnail tile beside the text instead of a large
 * full-width cover, so more articles fit on screen. Tile shows the real cover
 * photo when one exists and a meaningful per-category icon otherwise.
 */
export function ArticleCard({ article }: { article: ArticleTeaser }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-neem-100 bg-chalk-0 transition hover:border-neem-600 hover:shadow-sm">
      <div className="flex items-start gap-4 p-5">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-card bg-neem-100 text-neem-600">
          {article.cover_path ? (
            <Image
              src={coverUrl(article.cover_path)}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <CategoryIcon category={article.category} size={28} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-utility text-label uppercase text-neem-600">{article.category}</p>
          <h3 className="mt-1 font-display text-body-l font-medium leading-snug">
            <Link
              href={`/learn/${article.slug}`}
              className="line-clamp-2 text-ink-950 transition hover:text-neem-600"
            >
              {article.title}
            </Link>
          </h3>
          {article.excerpt && (
            <p className="mt-1 line-clamp-2 text-body-s text-ink-950/70">{article.excerpt}</p>
          )}
          <p className="mt-2 font-utility text-data text-ink-950/60 tabular">
            {article.published_at ? formatDate(article.published_at) : "Soon"}
            <span aria-hidden="true"> · </span>
            {readMinutes(article.body_md)} min read
          </p>
        </div>
      </div>
    </article>
  );
}
