import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

/**
 * Patient-area chrome — mirrors the public layout so a signed-in patient on
 * /account still gets the site header (logo → home, nav, signed-in profile
 * link) and footer, instead of a bare island with no way back to the site.
 */
export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-chalk-0 focus:px-4 focus:py-2 focus:text-ink-950 focus:outline focus:outline-2 focus:outline-neem-600"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
