import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/site/Section";
import { ArticleCard, type ArticleTeaser } from "@/components/site/ArticleCard";
import { getPublishedArticles } from "@/lib/articles";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Plain-language dental health articles from Smile Please dentists about brushing, gums, children's first visits and what happens at our camps.",
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

  const articles: ArticleTeaser[] = await getPublishedArticles(active);

  return (
    <Section marker="Learn" className="public-hero">
      <h1 className="max-w-3xl text-display-l">Plain answers about your mouth</h1>
      <p className="mt-6 max-w-[65ch] text-body-l text-ink-950/70">
        Brushing, flossing, what hurts, what to eat, and what you can safely ignore. Short
        articles without jargon, so the advice works when you&apos;re not in the clinic.
      </p>

      <nav className="mt-10 flex flex-wrap gap-x-6 gap-y-2" aria-label="Filter by topic">
        <Link
          href="/learn"
          aria-current={!active ? "page" : undefined}
            className={cn("min-h-11 border-b-2 px-0 font-utility text-body-s font-medium text-ink-950 transition hover:text-neem-600", !active ? "border-neem-600" : "border-transparent")}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/learn?category=${c}`}
            aria-current={active === c ? "page" : undefined}
            className={cn("min-h-11 border-b-2 px-0 font-utility text-body-s font-medium text-ink-950 transition hover:text-neem-600", active === c ? "border-neem-600" : "border-transparent")}
          >
            {c}
          </Link>
        ))}
      </nav>

      {articles.length > 0 ? (
        <div className="mt-6 md:mt-10">
          <ArticleCard article={articles[0]} featured />
          {articles.length > 1 && (
            <div className="mt-8 grid gap-x-8 md:grid-cols-2">
              {articles.slice(1).map((article) => <ArticleCard key={article.slug} article={article} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 max-w-[60ch] rounded-card border border-neem-100 bg-chalk-0 p-6 sm:mt-12 sm:p-10">
          <h2 className="text-display-m">
            {active ? `Nothing under “${active}” yet.` : "No articles published yet."}
          </h2>
          <p className="mt-4 text-body-l text-ink-950/70">
            We&apos;re writing these up. Meanwhile, if something in your mouth is bothering you,
            don&apos;t wait for an article. Book a check-up.
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
