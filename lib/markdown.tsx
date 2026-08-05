import * as React from "react";

/**
 * Tiny Markdown renderer for staff-written health articles (Master Phase 4.3).
 * No dependency, no sanitisation library: every character is HTML-escaped
 * before anything else, and the renderer never touches raw HTML or uses
 * dangerouslySetInnerHTML. Handles #/##/###, paragraphs, `-` lists,
 * **bold**, *italic*, and [text](url) — exactly what article bodies use.
 */

/** hrefs other than http(s) and mailto are dropped — belt-and-braces behind escaping. */
function safeHref(href: string): string | undefined {
  const h = href.trim();
  if (h.startsWith("http://") || h.startsWith("https://") || h.startsWith("mailto:")) return h;
  return undefined;
}

function renderInline(text: string, prefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let k = 0;
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    if (match[2] !== undefined) {
      nodes.push(<strong key={`${prefix}-${k++}`}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(<em key={`${prefix}-${k++}`}>{match[3]}</em>);
    } else {
      const href = safeHref(match[5]);
      nodes.push(
        <a
          key={`${prefix}-${k++}`}
          href={href}
          className="font-medium text-neem-600 underline underline-offset-4"
        >
          {match[4]}
        </a>,
      );
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

/** Block renderer: returns the article body as elements (h2+, p, ul). */
export function renderMarkdown(
  md: string,
  /** When set, a leading h2 whose text matches (case-insensitively) is dropped. */
  skipTitle?: string,
): React.ReactNode[] {
  // React escapes text children; pre-escaping here would display entities literally.
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let key = 0;
  let firstHeadingSeen = false;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const base = `p${key++}`;
    out.push(<p key={base}>{renderInline(paragraph.join(" "), base)}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (list.length === 0) return;
    const base = `l${key++}`;
    out.push(
      <ul key={base} className="list-disc space-y-2 pl-6">
        {list.map((item, i) => (
          <li key={i}>{renderInline(item, `${base}-${i}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    const item = line.match(/^[-*]\s+(.*)$/);

    if (heading) {
      flushParagraph();
      flushList();
      // Safe-guard against a first-line h2 duplicating the page's own H1 title,
      // so a future article authored that way doesn't repeat the heading (see
      // seed articles). Only the very first heading is ever dropped, and only
      // if it's an h2 whose text matches the article title case-insensitively.
      if (
        !firstHeadingSeen &&
        heading[1] === "##" &&
        skipTitle &&
        heading[2].trim().toLowerCase() === skipTitle.trim().toLowerCase()
      ) {
        firstHeadingSeen = true;
        continue;
      }
      firstHeadingSeen = true;
      // Start at h2 — article pages already own the h1 (D-20).
      const level = Math.min(4, heading[1].length + 1);
      const base = `h${key++}`;
      out.push(React.createElement(`h${level}`, { key: base }, renderInline(heading[2], base)));
    } else if (item) {
      flushParagraph();
      list.push(item[1]);
    } else if (line === "") {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return out;
}
