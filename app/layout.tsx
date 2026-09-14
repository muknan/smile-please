import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"], weight: ["500", "600"],
  variable: "--font-display", display: "swap",
});
const body = IBM_Plex_Sans({
  subsets: ["latin"], weight: ["400", "500", "600"],
  variable: "--font-body", display: "swap",
});
const utility = IBM_Plex_Sans({
  subsets: ["latin"], weight: ["400", "500", "600"],
  variable: "--font-utility", display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Smile Please — Free dental care in Delhi", template: "%s · Smile Please" },
  description:
    "Smile Please is a dental health NGO in New Delhi providing free dental care and running awareness programmes in underserved communities.",
  openGraph: {
    siteName: "Smile Please",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/og" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#183C34" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${utility.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
