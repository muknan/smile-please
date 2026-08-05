import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL must be configured.");
const SUPABASE_HOST = new URL(SUPABASE_URL).hostname;
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
      // D-41: Next 16 emits an inline bootstrap script + flight payload, and the
      // landing page inlines a JSON-LD "NGO" script. A strict nonce CSP needs
      // middleware to mint a per-request nonce and apply it to every inline
      // script; doing that here safely is deferred as a dedicated task.
      // 'unsafe-inline' is retained for scripts with this caveat documented.
      "script-src 'self' 'unsafe-inline'",
      // Tailwind + Next inline critical CSS.
      "style-src 'self' 'unsafe-inline'",
      // Supabase Storage images + our own, plus data:/blob: for images.
      `img-src 'self' data: blob: ${SUPABASE_URL}`,
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
  images: {
    remotePatterns: [
      { protocol: "https", hostname: SUPABASE_HOST, pathname: "/storage/v1/object/public/**" },
    ],
  },
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
