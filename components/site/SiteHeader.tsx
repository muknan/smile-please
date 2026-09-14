import Link from "next/link";
import { DesktopNav, MobileMenu } from "./HeaderNav";
import { HeaderProfile } from "./HeaderProfile";
import { Logo } from "./Logo";

export function SiteHeader() {
  return <header className="sticky top-0 z-50 border-b border-neem-100 bg-mineral-50 [--header-h:76px] sm:[--header-h:88px]">
    <div className="container-content flex h-[76px] items-center justify-between gap-6 sm:h-[88px]">
      <Link href="/" aria-label="Smile Please — home"><Logo /></Link>
      <DesktopNav />
      <div className="hidden items-center gap-4 md:flex"><HeaderProfile /></div>
      <MobileMenu />
    </div>
  </header>;
}
