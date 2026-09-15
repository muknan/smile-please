import Link from "next/link";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL } from "@/lib/contact-info";
import { Logo } from "./Logo";

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
    <footer className="bg-neem-900 py-9 text-chalk-0 sm:py-16">
      <div className="container-content">
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:gap-y-10 lg:grid-cols-4 lg:gap-10">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" aria-label="Smile Please — home" className="inline-flex rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-marigold-500">
              <Logo className="text-chalk-0" />
            </Link>
            <p className="mt-4 max-w-[34ch] text-body-s text-chalk-0/70 sm:mt-6 sm:max-w-[28ch]">
              Free dental care and oral health awareness for underserved communities in Delhi.
            </p>
          </div>

          <nav aria-label="Care">
            <h2 className="font-utility text-label uppercase text-neem-100">Care</h2>
            <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-4">
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
            <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-4">
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

          <div className="col-span-2 lg:col-span-1">
            <h2 className="font-utility text-label uppercase text-neem-100">Contact</h2>
            <address className="mt-3 space-y-2 text-body-s not-italic text-chalk-0/70 sm:mt-4 sm:space-y-4">
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
            </address>
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-chalk-0/20 pt-5 text-body-s text-chalk-0/70 sm:mt-16 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-6">
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
