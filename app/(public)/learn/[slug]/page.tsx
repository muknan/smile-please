import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { renderMarkdown } from "@/lib/markdown";
import { ArticleCard, readMinutes } from "@/components/site/ArticleCard";
import { formatDate } from "@/lib/format";

export const revalidate = 3600;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("slug")
    .eq("status", "published");
  return (data ?? []).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return { title: "Article not found" };
  return {
    title: data.title,
    description:
      data.excerpt ?? `A plain-language dental health article from Smile Please.`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/learn/${slug}`,
    },
    openGraph: {
      title: data.title,
      images: [{ url: `/og?title=${encodeURIComponent(data.title)}` }],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select(
      "id, slug, title, excerpt, category, body_md, cover_path, published_at, status",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) notFound();

  // One more article to route readers onward; missing is fine.
  const { data: moreData } = await supabase
    .from("articles")
    .select("slug, title, excerpt, category, published_at, body_md, cover_path")
    .eq("status", "published")
    .neq("id", data.id)
    .order("published_at", { ascending: false })
    .limit(1);
  const more = moreData ? moreData[0] : undefined;

  return (
    <article className="py-24">
      <div className="container-content max-w-3xl">
        <p className="font-utility text-label uppercase text-neem-600">
          {data.category}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          <time dateTime={data.published_at ?? undefined}>
            {data.published_at ? formatDate(data.published_at) : "Soon"}
          </time>
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          {readMinutes(data.body_md)} min read
        </p>
        <h1 className="mt-6 text-display-l">{data.title}</h1>

        <div className="mt-16 space-y-6 [&_h2]:mt-16 [&_h2]:text-display-m [&_h3]:mt-10 [&_h3]:text-display-m">
          {renderMarkdown(data.body_md, data.title)}
        </div>

        {/* Awareness content always routes into care: the point of the page. */}
        <aside className="mt-24 rounded-card border border-neem-100 bg-chalk-0 p-10">
          <h2 className="text-display-m">Something in your mouth needs a look?</h2>
          <p className="mt-4 max-w-[55ch] text-body-l text-ink-950/70">
            A check-up is free, and it takes about ten minutes to arrange. The dentist will tell
            you what&apos;s actually going on — no scare tactics.
          </p>
          <Link
            href="/care"
            className="mt-8 inline-flex items-center justify-center rounded bg-marigold-500 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95"
          >
            Book a check-up
          </Link>
        </aside>

        {more && (
          <section className="mt-24" aria-label="Read next">
            <h2 className="text-display-m">Read next</h2>
            <div className="mt-10 max-w-md">
              <ArticleCard article={more} />
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
