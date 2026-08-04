import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

/**
 * One reusable Open Graph image: neem-900 field, the arch in marigold-500,
 * the page title in Fraunces. Used via /og?title=... from generateMetadata.
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
        <svg
          width="720"
          height="330"
          viewBox="0 0 720 330"
          style={{ position: "absolute", top: 68 }}
        >
          <path
            d="M140,330 L140,180 C140,110 250,40 360,8 C470,40 580,110 580,180 L580,330"
            fill="none"
            stroke="#E9A227"
            strokeWidth="8"
          />
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
