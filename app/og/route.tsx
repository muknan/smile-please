import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

/**
 * One reusable Open Graph image: the Smile Please mark, page title and a
 * calm neem field. Used via /og?title=... from generateMetadata.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? "Smile Please — free dental care in Delhi").slice(
    0,
    90,
  );

  // TTF, not woff2: the bundled @vercel/og parser reads plain OpenType only.
  const font = await readFile(
    path.join(process.cwd(), "public/fonts/fraunces-latin-600.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          backgroundColor: "#12302A",
          fontFamily: "Fraunces",
          color: "#FFFFFF",
          padding: "0 96px 96px",
        }}
      >
        <svg width="160" height="160" viewBox="0 0 48 48" fill="none" style={{ position: "absolute", top: 64 }}>
          <path d="M9 24c3.1 8.2 9.3 12.3 15 12.3S35.9 32.2 39 24" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
          <path d="m33 4 2.2 6.8L42 13l-6.8 2.2L33 22l-2.2-6.8L24 13l6.8-2.2L33 4Z" fill="#E0B54B" />
        </svg>
        <div
          style={{
            fontSize: 64,
            lineHeight: 1.08,
            letterSpacing: "-0.01em",
            textAlign: "center",
            maxWidth: 980,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 24, color: "#DCE7E0", marginTop: 28 }}>Smile Please · New Delhi</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Fraunces", data: font, weight: 600, style: "normal" }],
    },
  );
}
