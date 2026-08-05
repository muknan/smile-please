import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/site/Section";
import { ArticleCard, type ArticleTeaser } from "@/components/site/ArticleCard";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Plain-language dental health articles from Smile Please dentists — brushing, gums, children's first visits, and what happens at our camps.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/learn` },
};

const CATEGORIES = ["Children", "Gum health", "Prevention", "Camps"] as const;

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const active = CATEGORIES.find((c) => c === category);

  const supabase = await createClient();
  let query = supabase
    .from("articles")
    .select("slug, title, excerpt, category, published_at, body_md, cover_path")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (active) query = query.eq("category", active);
  const { data } = await query;
  const articles = (data ?? []) as ArticleTeaser[];

  return (
    <Section marker="Learn" className="pt-24">
      <h1 className="max-w-3xl text-display-l">Plain answers about your mouth</h1>
      <p className="mt-6 max-w-[65ch] text-body-l text-ink-950/70">
        Brushing, flossing, what hurts, what to eat, and what you can safely ignore. Short
        articles without jargon, so the advice works when you&apos;re not in the clinic.
      </p>

      <div className="mt-16 flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
        <Link
          href="/learn"
          aria-current={!active ? "page" : undefined}
          className={cn(
            "rounded border border-neem-100 bg-chalk-0 px-4 py-2 font-utility text-body-s font-medium text-ink-950 transition hover:border-neem-600",
            !active && "border-neem-600 bg-neem-600 text-chalk-0",
          )}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/learn?category=${c}`}
            aria-current={active === c ? "page" : undefined}
            className={cn(
              "rounded border border-neem-100 bg-chalk-0 px-4 py-2 font-utility text-body-s font-medium text-ink-950 transition hover:border-neem-600",
              active === c && "border-neem-600 bg-neem-600 text-chalk-0",
            )}
          >
            {c}
          </Link>
        ))}
      </div>

      {articles.length > 0 ? (
        <div className="mt-16 flex flex-wrap justify-center gap-6">
          {articles.map((article) => (
            <div
              key={article.slug}
              className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
            >
              <ArticleCard article={article} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-16 max-w-[60ch] rounded-card border border-neem-100 bg-chalk-0 p-10">
          <h2 className="text-display-m">
            {active ? `Nothing under “${active}” yet.` : "No articles published yet."}
          </h2>
          <p className="mt-4 text-body-l text-ink-950/70">
            We&apos;re writing these up. Meanwhile, if something in your mouth is bothering you,
            don&apos;t wait for an article — book a check-up.
          </p>
          <Link
            href="/care"
            className="mt-8 inline-flex items-center justify-center rounded bg-marigold-500 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95"
          >
            Book a check-up
          </Link>
        </div>
      )}
    </Section>
  );
}
