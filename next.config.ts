import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://knbyxtammyrwvfkavhwv.supabase.co";

/** @see Phase 8 §8.1 — security response headers. */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next 15 emits an inline bootstrap script + flight payload; allow it.
      "script-src 'self' 'unsafe-inline'",
      // Tailwind + Next inline critical CSS.
      "style-src 'self' 'unsafe-inline'",
      // Supabase Storage images + our own, plus data:/blob: for images.
      `img-src 'self' data: blob: ${SUPABASE_URL}`,
      "font-src 'self' data:",
      // Supabase REST + realtime (auth, PostgREST, presence).
      `connect-src 'self' ${SUPABASE_URL} wss://${SUPABASE_URL.replace(/^https?:\/\//, "")}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
