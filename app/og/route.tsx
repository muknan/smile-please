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
        <svg width="152" height="152" viewBox="0 0 64 64" fill="none" style={{ position: "absolute", top: 58 }}>
          <g fill="#FFFFFF">
            <rect x="14" y="13" width="8" height="25" rx="4" />
            <rect x="23" y="6" width="8" height="33" rx="4" />
            <rect x="32" y="4" width="8" height="35" rx="4" />
            <rect x="41" y="10" width="8" height="29" rx="4" />
            <rect x="9" y="24" width="9" height="24" rx="4.5" transform="rotate(-35 9 24)" />
            <rect x="14" y="27" width="36" height="29" rx="15" />
          </g>
          <path d="M23 39c2.2 5 5.7 7.5 9.8 7.5s7.6-2.5 9.8-7.5" stroke="#183C34" strokeWidth="3" strokeLinecap="round" />
          <path d="m54 6 1.6 4.4L60 12l-4.4 1.6L54 18l-1.6-4.4L48 12l4.4-1.6L54 6Z" fill="#E0B54B" />
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
        <div style={{ fontSize: 24, color: "#DCE7E0", marginTop: 28 }}>Healthier smiles, within reach. · New Delhi</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Fraunces", data: font, weight: 600, style: "normal" }],
    },
  );
}
