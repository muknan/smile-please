import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { DesktopNav, MobileMenu } from "./HeaderNav";
import { HeaderProfile } from "./HeaderProfile";

/**
 * Server component that no longer reads cookies or the profile — the signed-in
 * state is a client island (HeaderProfile), so every public page is cacheable
 * instead of being forced dynamic by a per-view getUser() (D-19).
 */
export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-neem-100 bg-mineral-50"
      style={{ "--header-h": "60px" } as CSSProperties}
    >
      <div className="container-content flex h-[60px] items-center justify-between sm:h-[72px]">
        <Link href="/" className="flex items-center" aria-label="Smile Please — home">
          <Image
            src="/logo.svg"
            alt="Smile Please"
            width={140}
            height={33}
            className="h-[28px] w-auto sm:h-[36px]"
          />
        </Link>

        <DesktopNav />

        <div className="hidden items-center gap-4 sm:flex">
          <HeaderProfile />
        </div>

        <MobileMenu />
      </div>
    </header>
  );
}
