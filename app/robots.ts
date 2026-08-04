import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Private areas never appear in search results.
        disallow: ["/admin", "/dentist", "/account", "/auth"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
