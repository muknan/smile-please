import Image from "next/image";
import Link from "next/link";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL } from "@/lib/contact-info";

const CARE_LINKS = [
  { href: "/care", label: "Book a check-up" },
  { href: "/about", label: "About the care" },
  { href: "/contact", label: "Contact us" },
];

const LEARN_LINKS = [
  { href: "/learn", label: "Awareness articles" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  return (
    <footer className="bg-neem-900 py-16 text-chalk-0">
      <div className="container-content">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image
              src="/logo.svg"
              alt="Smile Please"
              width={140}
              height={33}
              className="h-[28px] w-auto [filter:brightness(0)_invert(1)]"
            />
            <p className="mt-6 max-w-[28ch] text-body-s text-chalk-0/70">
              Free dental care and oral health awareness for underserved communities in Delhi.
            </p>
          </div>

          <nav aria-label="Care">
            <h2 className="font-utility text-label uppercase text-neem-100">Care</h2>
            <ul className="mt-4 space-y-4">
              {CARE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-s text-chalk-0 transition hover:text-marigold-500"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Learn">
            <h2 className="font-utility text-label uppercase text-neem-100">Learn</h2>
            <ul className="mt-4 space-y-4">
              {LEARN_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-s text-chalk-0 transition hover:text-marigold-500"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-utility text-label uppercase text-neem-100">Contact</h2>
            <address className="mt-4 space-y-4 text-body-s not-italic text-chalk-0/70">
              <p>New Delhi, India</p>
              <p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-chalk-0 transition hover:text-marigold-500">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                <a href={`tel:${CONTACT_PHONE_TEL}`} className="text-chalk-0 transition hover:text-marigold-500">
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </p>
              {/* CLIENT-COPY: registration number / trust-detail line not yet supplied. */}
              <p>Registered trust details to be supplied.</p>
            </address>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-chalk-0/20 pt-6 text-body-s text-chalk-0/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Smile Please</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/privacy" className="transition hover:text-marigold-500">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-marigold-500">
              Terms
            </Link>
            <span>Data queries: {CONTACT_EMAIL}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
