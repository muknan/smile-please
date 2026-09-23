/** Accept root-relative paths only, including after WHATWG URL normalization. */
export function safeRedirectPath(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string" || !value.startsWith("/") || /[\\\u0000-\u0020]/.test(value)) return fallback;
  try {
    const base = "https://internal.invalid";
    const target = new URL(value, base);
    return target.origin === base ? `${target.pathname}${target.search}${target.hash}` : fallback;
  } catch {
    return fallback;
  }
}
