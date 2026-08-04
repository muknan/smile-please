import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "No access" };

export default function ForbiddenPage() {
  return (
    <>
      <SiteHeader />
      <main className="py-24">
        <div className="container-content">
          <p className="text-label">Access</p>
          <h1 className="mt-6 max-w-3xl text-display-l">You don&apos;t have access to this area</h1>
          <p className="mt-4 max-w-[65ch] text-body-l text-ink-950/70">
            This part of the site is for a different role. Head to your own area or back to the
            homepage.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/account">Go to your account</Button>
            <Button href="/" variant="ghost">
              Go to the homepage
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
