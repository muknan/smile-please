import "server-only";

export function escapeCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: (unknown[] | Record<string, unknown>)[]): string {
  const lines: string[] = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    if (Array.isArray(row)) {
      lines.push(row.map(escapeCell).join(","));
    } else {
      lines.push(headers.map((h) => escapeCell(row[h])).join(","));
    }
  }
  return lines.join("\r\n");
}

/** Streams a CSV download with a friendly filename (Phase 7 §7.7). */
export function csvResponse(csv: string, filename: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("\uFEFF" + csv));
      controller.close();
    },
  });
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}"`,
    },
  });
}
