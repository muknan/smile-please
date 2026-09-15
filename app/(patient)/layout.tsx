import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SkipLink } from "@/components/site/SkipLink";

/**
 * Patient-area chrome — mirrors the public layout so a signed-in patient on
 * /account still gets the site header (logo → home, nav, signed-in profile
 * link) and footer, instead of a bare island with no way back to the site.
 */
export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main" tabIndex={-1}>{children}</main>
      <SiteFooter />
    </>
  );
}
