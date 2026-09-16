import { DesktopNav, MobileMenu } from "./HeaderNav";
import { HeaderProfile } from "./HeaderProfile";
import { BrandLockup } from "./Logo";
import { PageTopLink } from "./PageTopLink";

export function SiteHeader() {
  return <header className="sticky top-0 z-50 border-b border-neem-100 bg-mineral-50/95 [--header-h:64px] backdrop-blur sm:[--header-h:72px]">
    <div className="container-content flex h-[64px] items-center justify-between gap-5 sm:h-[72px]">
      <PageTopLink href="/" aria-label="Smile Please — Home" className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600 focus-visible:ring-offset-4"><BrandLockup /></PageTopLink>
      <DesktopNav />
      <div className="hidden items-center gap-4 md:flex"><HeaderProfile /></div>
      <MobileMenu />
    </div>
  </header>;
}
