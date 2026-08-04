import Link from "next/link";
import Image from "next/image";
import { ArchGlyph } from "@/components/site/Arch";
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

/** Arch-masked cover. Placeholder glyph when there is no photo yet. */
function Cover({ article }: { article: ArticleTeaser }) {
  const inner = article.cover_path ? (
    <Image
      src={coverUrl(article.cover_path)}
      alt=""
      fill
      sizes="(max-width: 1024px) 90vw, 30vw"
      className="object-cover"
    />
  ) : (
    <div
      aria-hidden="true"
      className="flex h-full w-full items-center justify-center bg-neem-100"
    >
      <ArchGlyph size={64} className="text-neem-600/40" />
    </div>
  );
  return (
    <div
      aria-hidden={article.cover_path ? undefined : true}
      className="relative h-40 w-full sm:h-44"
      style={{ clipPath: "url(#arch-clip)" }}
    >
      {inner}
    </div>
  );
}

export function ArticleCard({ article }: { article: ArticleTeaser }) {
  return (
    <article className="flex flex-col overflow-visible rounded-card border border-neem-100 bg-chalk-0">
      <Cover article={article} />
      <div className="flex flex-1 flex-col p-6">
        <p className="font-utility text-label uppercase text-neem-600">
          {article.category}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          <time dateTime={article.published_at ?? undefined}>
            {article.published_at ? formatDate(article.published_at) : "Soon"}
          </time>
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          {readMinutes(article.body_md)} min read
        </p>
        <h3 className="mt-4 text-display-m leading-snug">
          <Link
            href={`/learn/${article.slug}`}
            className="text-ink-950 transition hover:text-neem-600"
          >
            {article.title}
          </Link>
        </h3>
        {article.excerpt && (
          <p className="mt-4 text-body-s text-ink-950/70">{article.excerpt}</p>
        )}
        <p className="mt-6">
          <Link
            href={`/learn/${article.slug}`}
            className="font-utility text-body-s font-medium text-neem-600 underline-offset-4 hover:underline"
          >
            Read it
          </Link>
        </p>
      </div>
    </article>
  );
}
