import * as React from "react";

/**
 * Tiny Markdown renderer for staff-written health articles (Master Phase 4.3).
 * No dependency, no sanitisation library: every character is HTML-escaped
 * before anything else, and the renderer never touches raw HTML or uses
 * dangerouslySetInnerHTML. Handles #/##/###, paragraphs, `-` lists,
 * **bold**, *italic*, and [text](url) — exactly what article bodies use.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** hrefs other than http(s) and mailto are dropped — belt-and-braces behind escaping. */
function safeHref(href: string): string | undefined {
  const h = href.trim();
  if (h.startsWith("http://") || h.startsWith("https://") || h.startsWith("mailto:")) return h;
  return undefined;
}

function renderInline(text: string, key: (label: string) => string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    if (match[2] !== undefined) {
      nodes.push(<strong key={key("b")}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(<em key={key("i")}>{match[3]}</em>);
    } else {
      const href = safeHref(match[5]);
      nodes.push(
        <a
          key={key("a")}
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
export function renderMarkdown(md: string): React.ReactNode[] {
  const lines = escapeHtml(md).split("\n");
  const out: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    out.push(<p key={key++}>{renderInline(paragraph.join(" "), () => `p${key}`)}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (list.length === 0) return;
    out.push(
      <ul key={key++} className="list-disc space-y-2 pl-6">
        {list.map((item, i) => (
          <li key={i}>{renderInline(item, () => `l${key}-${i}`)}</li>
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
      const level = heading[1].length;
      out.push(
        React.createElement(`h${level}`, { key: key++ }, renderInline(heading[2], () => `h${key}`)),
      );
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
