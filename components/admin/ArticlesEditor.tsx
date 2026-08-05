"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renderMarkdown } from "@/lib/markdown";
import { saveArticle, setArticleStatus, type ArticleInput } from "@/app/admin/actions";
import { Badge } from "@/components/ui/Badge";

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  body_md: string;
  cover_path: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
};

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const TOOLBAR: { label: string; before: string; after: string; sample: string }[] = [
  { label: "Bold", before: "**", after: "**", sample: "bold text" },
  { label: "Heading", before: "## ", after: "", sample: "A heading" },
  { label: "List", before: "- ", after: "", sample: "an item" },
  { label: "Link", before: "[", after: "](https://example.com)", sample: "link text" },
];

export function ArticlesEditor({ articles, categories }: { articles: Article[]; categories: string[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [buffer, setBuffer] = useState<Partial<ArticleInput>>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const body = buffer.body_md ?? "";

  const preview = useMemo(() => {
    try {
      return renderMarkdown(body);
    } catch {
      return <p className="text-clay-600">Couldn&apos;t preview the markdown.</p>;
    }
  }, [body]);

  const open = (a: Article) => {
    setBuffer({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt ?? "",
      category: a.category,
      body_md: a.body_md,
      cover_path: a.cover_path,
      status: a.status,
    });
    setDirty(false);
    setError(null);
    setNotice(null);
  };

  const startNew = () => {
    setBuffer({ slug: "", title: "", excerpt: "", category: categories[0], body_md: "", status: "draft" });
    setDirty(false);
    setError(null);
    setNotice(null);
  };

  const patch = (p: Partial<ArticleInput>) => {
    setBuffer((prev) => ({ ...prev, ...p }));
    setDirty(true);
  };

  const setTitle = (v: string) => {
    setBuffer((prev) => {
      const next = { ...prev, title: v };
      // Auto-slug only while the slug is untouched.
      if (!prev.slug) next.slug = slugFromTitle(v);
      return next;
    });
    setDirty(true);
  };

  const wrapSelected = (t: { before: string; after: string; sample: string }) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const selected = body.slice(start, end) || t.sample;
    const next = body.slice(0, start) + t.before + selected + t.after + body.slice(end);
    patch({ body_md: next });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + t.before.length, start + t.before.length + selected.length);
    });
  };

  const save = async (status: "draft" | "published") => {
    if (!buffer?.title) {
      setError("A title is required before saving.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const input: ArticleInput = {
      id: buffer.id,
      slug: buffer.slug ?? "",
      title: buffer.title ?? "",
      excerpt: buffer.excerpt ?? "",
      category: buffer.category ?? categories[0],
      body_md: buffer.body_md ?? "",
      cover_path: buffer.cover_path ?? null,
      status,
    };
    const res = await saveArticle(input);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Couldn't save.");
      return;
    }
    setNotice(status === "published" ? "Published. The public Learn page is up to date." : "Saved as a draft.");
    setDirty(false);
    startTransition(() => router.refresh());
  };

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Article list */}
      <aside>
        <button
          onClick={startNew}
          className="mb-3 w-full rounded bg-neem-900 px-4 py-2 font-utility text-body-s font-medium text-chalk-0"
        >
          + New article
        </button>
        <ul className="space-y-1">
          {articles.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => open(a)}
                className="flex w-full items-center justify-between rounded border border-neem-100 bg-chalk-0 px-3 py-2 text-left font-utility text-body-s text-ink-950 hover:border-neem-600"
              >
                <span className="truncate">{a.title}</span>
                <Badge tone={a.status === "published" ? "success" : "neutral"}>{a.status}</Badge>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Editor */}
      <section aria-label="Article editor" className="rounded border border-neem-100 bg-chalk-0 p-5">
        {!buffer || !buffer.title && !body && !buffer.slug ? (
          <p className="py-16 text-center font-utility text-body text-ink-950/60">
            Pick an article to edit, or start a new one.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={buffer.title ?? ""}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title"
                aria-label="Article title"
                className="min-w-0 flex-1 rounded border border-neem-100 px-3 py-2 font-utility text-body font-bold text-ink-950"
              />
              <select
                value={buffer.category ?? categories[0]}
                onChange={(e) => patch({ category: e.target.value })}
                aria-label="Category"
                className="rounded border border-neem-100 bg-chalk-0 px-3 py-2 font-utility text-body-s"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-utility text-label uppercase text-ink-950/60" htmlFor="slug">
                Slug
              </label>
              <div className="mt-1 flex items-center gap-2 font-utility text-body-s text-ink-950/60">
                <span>/learn/</span>
                <input
                  id="slug"
                  value={buffer.slug ?? ""}
                  onChange={(e) => {
                    patch({ slug: slugFromTitle(e.target.value) || e.target.value });
                    setDirty(true);
                  }}
                  className="flex-1 rounded border border-neem-100 px-3 py-2 font-utility text-body text-ink-950"
                />
              </div>
            </div>

            <input
              value={buffer.excerpt ?? ""}
              onChange={(e) => patch({ excerpt: e.target.value })}
              placeholder="One-line excerpt shown on the Learn page"
              aria-label="Excerpt"
              className="w-full rounded border border-neem-100 px-3 py-2 font-utility text-body-s text-ink-950"
            />

            <div className="grid gap-4 md:grid-cols-2">
              {/* Source */}
              <div>
                <div className="mb-2 flex flex-wrap gap-1">
                  {TOOLBAR.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => wrapSelected(t)}
                      className="rounded border border-neem-100 px-2 py-1 font-utility text-body-s text-ink-950 hover:border-neem-600"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <textarea
                  ref={taRef}
                  value={body}
                  onChange={(e) => patch({ body_md: e.target.value })}
                  rows={18}
                  aria-label="Article markdown"
                  className="w-full rounded border border-neem-100 px-3 py-3 font-mono text-data text-ink-950"
                />
                <p className="mt-1 font-utility text-body-s text-ink-950/50">
                  Write in Markdown. Bold, headings, bullet lists and links — that&apos;s all you
                  need. The preview on the right is exactly what readers see.
                </p>
              </div>

              {/* Preview */}
              <div aria-label="Preview" className="rounded border border-neem-100 bg-chalk-0 p-4">
                <p className="mb-2 font-utility text-label uppercase text-ink-950/60">Preview</p>
                <div className="prose-sm">{preview}</div>
              </div>
            </div>

            {error && <p className="font-utility text-body-s text-clay-600">{error}</p>}
            {notice && (
              <p className="rounded border border-neem-600/40 bg-neem-50 p-3 font-utility text-body-s text-neem-600">
                {notice}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => save("draft")}
                disabled={busy}
                className="rounded border border-neem-100 px-4 py-2 font-utility text-body-s text-ink-950 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save draft"}
              </button>
              <button
                onClick={() => save("published")}
                disabled={busy}
                className="rounded bg-neem-900 px-4 py-2 font-utility text-body-s font-medium text-chalk-0 disabled:opacity-60"
              >
                Publish
              </button>
              {buffer.id && (
                <button
                  onClick={async () => {
                    setBusy(true);
                    const res = await setArticleStatus(buffer.id!, "draft");
                    setBusy(false);
                    if (!res.ok) setError(res.error ?? "Couldn't unpublish.");
                    startTransition(() => router.refresh());
                  }}
                  className="rounded border border-neem-100 px-4 py-2 font-utility text-body-s text-ink-950"
                >
                  Unpublish
                </button>
              )}
              {dirty && (
                <span className="font-utility text-body-s text-marigold-600">Unsaved changes</span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
