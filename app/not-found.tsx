import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="py-24">
        <div className="container-content">
          <h1 className="max-w-3xl text-display-l">That page is not here</h1>
          <p className="mt-4 max-w-[65ch] text-body-l text-ink-950/70">
            The address may have changed or been mistyped. Head back to the homepage, or use the
            menu above.
          </p>
          <div className="mt-10">
            <Button href="/">Go to the homepage</Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
