import type { Metadata } from "next";
import { Fraunces, Mukta, IBM_Plex_Sans } from "next/font/google";
import { ArchClipDefs } from "@/components/site/Arch";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"], weight: ["500", "600"],
  variable: "--font-display", display: "swap",
});
const body = Mukta({
  subsets: ["latin"], weight: ["300", "400", "600"],
  variable: "--font-body", display: "swap",
});
const utility = IBM_Plex_Sans({
  subsets: ["latin"], weight: ["400", "500", "600"],
  variable: "--font-utility", display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Smile Please — Free dental care in Delhi", template: "%s · Smile Please" },
  description:
    "Smile Please is a dental health NGO in New Delhi providing free dental care and running awareness programmes in underserved communities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${utility.variable}`}>
      <body className="antialiased">
        <ArchClipDefs />
        {children}
      </body>
    </html>
  );
}
