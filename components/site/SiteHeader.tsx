import { DesktopNav, MobileMenu } from "./HeaderNav";
import { HeaderProfile } from "./HeaderProfile";
import { Logo } from "./Logo";
import { PageTopLink } from "./PageTopLink";

export function SiteHeader() {
  return <header className="sticky top-0 z-50 border-b border-neem-100 bg-mineral-50 [--header-h:64px] sm:[--header-h:72px]">
    <div className="container-content flex h-[64px] items-center justify-between gap-5 sm:h-[72px]">
      <PageTopLink href="/" pendingSurfaceLabel="Home" aria-label="Smile Please — home" className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600 focus-visible:ring-offset-4"><Logo /></PageTopLink>
      <DesktopNav />
      <div className="hidden items-center gap-4 md:flex"><HeaderProfile /></div>
      <MobileMenu />
    </div>
  </header>;
}
