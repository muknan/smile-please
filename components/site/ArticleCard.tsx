import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/format";

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

/** Editorial article teaser, with an optional lead treatment for the first story. */
export function ArticleCard({ article, featured = false }: { article: ArticleTeaser; featured?: boolean }) {
  if (featured) {
    return (
      <article className="grid gap-8 border-b border-neem-100 py-8 md:grid-cols-5 md:gap-10 md:border-y md:py-10">
        {article.cover_path && (
          <div className="relative aspect-[16/9] overflow-hidden bg-neem-100 md:col-span-2 md:aspect-auto">
            <Image src={coverUrl(article.cover_path)} alt="" fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
          </div>
        )}
        <div className={article.cover_path ? "md:col-span-3" : "md:col-span-5"}>
          <p className="font-utility text-label text-neem-600">{article.category}</p>
          <h2 className="mt-3 font-display text-display-m leading-tight md:text-display-l">
            <Link href={`/learn/${article.slug}`} className="text-ink-950 transition hover:text-neem-600">{article.title}</Link>
          </h2>
          {article.excerpt && <p className="mt-4 max-w-[58ch] text-body-l text-ink-950/70">{article.excerpt}</p>}
          <p className="mt-6 font-utility text-data text-ink-950/70 tabular">
            {article.published_at ? formatDate(article.published_at) : "Soon"}<span aria-hidden="true"> · </span>{readMinutes(article.body_md)} min read
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="group border-b border-neem-100 py-5">
      <div className="min-w-0">
        <p className="font-utility text-label text-neem-600">{article.category}</p>
        <h3 className="mt-1 font-display text-body-l font-medium leading-snug">
            <Link
              href={`/learn/${article.slug}`}
              className="line-clamp-2 text-ink-950 transition hover:text-neem-600"
            >
              {article.title}
            </Link>
        </h3>
        {article.excerpt && <p className="mt-1 line-clamp-2 text-body-s text-ink-950/70">{article.excerpt}</p>}
        <p className="mt-2 font-utility text-data text-ink-950/70 tabular">
          {article.published_at ? formatDate(article.published_at) : "Soon"}<span aria-hidden="true"> · </span>{readMinutes(article.body_md)} min read
        </p>
      </div>
    </article>
  );
}
