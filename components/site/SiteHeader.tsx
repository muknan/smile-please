import Image from "next/image";
import Link from "next/link";
import { getProfile, type UserRole } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { DesktopNav, MobileMenu, type HeaderProfile } from "./HeaderNav";
import { SignOutForm } from "./SignOutForm";

const ROLE_HOME: Record<UserRole, string> = {
  patient: "/account",
  dentist: "/dentist",
  admin: "/admin",
};

/**
 * Server component that reads the profile, so the signed-in state (first
 * name linking to the role home + sign-out form) is rendered server-side.
 * The menu and nav highlighting stay in the client HeaderNav component.
 */
export async function SiteHeader() {
  const profile = await getProfile();
  const signedIn: HeaderProfile = profile
    ? {
        firstName: profile.full_name.trim().split(/\s+/)[0] || "Account",
        home: ROLE_HOME[profile.role],
      }
    : null;

  return (
    <header className="sticky top-0 z-50 border-b border-neem-100 bg-mineral-50">
      <div className="container-content flex h-[60px] items-center justify-between sm:h-[72px]">
        <Link href="/" className="flex items-center" aria-label="Smile Please — home">
          <Image
            src="/logo.svg"
            alt="Smile Please"
            width={140}
            height={36}
            className="h-[28px] w-auto sm:h-[36px]"
          />
        </Link>

        <DesktopNav />

        <div className="hidden items-center gap-4 sm:flex">
          {signedIn ? (
            <>
              <Link
                href={signedIn.home}
                className="font-utility text-body-s font-medium text-ink-950 transition hover:text-neem-600"
              >
                {signedIn.firstName}
              </Link>
              <SignOutForm />
            </>
          ) : (
            <Button href="/care">Book a check-up</Button>
          )}
        </div>

        <MobileMenu signedIn={signedIn} />
      </div>
    </header>
  );
}
