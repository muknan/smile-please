import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

/**
 * One reusable Open Graph image: the approved Smile Please lockup, page title
 * and a calm neem field. Used via /og?title=... from generateMetadata.
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
  const logo = await readFile(
    path.join(process.cwd(), "public/brand/soft-embrace-reversed.svg"),
    "base64",
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/svg+xml;base64,${logo}`}
          alt=""
          width={720}
          height={173}
          style={{ position: "absolute", top: 46, objectFit: "contain" }}
        />
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
