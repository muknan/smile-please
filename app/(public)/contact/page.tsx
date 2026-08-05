import type { Metadata } from "next";
import { Section } from "@/components/site/Section";
import { ContactForm } from "@/components/contact/ContactForm";
import { makeRenderedAt } from "@/lib/antispam";
import { CONTACT_TABS, type ContactTab } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "A question about care, a dentist volunteering a few hours a month, or an organisation that wants to partner with Smile Please — write to us and a real person will reply within two working days.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/contact`,
  },
};

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function ContactPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const initialTab: ContactTab = CONTACT_TABS.includes(tab as ContactTab)
    ? (tab as ContactTab)
    : "patient";
  const whatsappNumberSet = Boolean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);

  return (
    <>
      <Section marker="Contact" className="pt-24">
        <h1 className="max-w-[24ch] text-display-l">Talk to us</h1>
        <p className="mt-6 max-w-[65ch] text-body-l text-ink-950/70">
          A question about care, a dentist who wants to give a few hours a month, a school or
          clinic that wants to host a camp — one page, whichever you are. A real person reads
          every message, usually within two working days.
        </p>

        <div className="mt-16">
          <ContactForm
            initialTab={initialTab}
            renderedAt={makeRenderedAt()}
            whatsappNumberSet={whatsappNumberSet}
          />
        </div>
      </Section>

      <Section marker="Our details" className="border-t border-neem-100 py-24">
        <dl className="max-w-[65ch] space-y-10">
          <div>
            <dt className="font-utility text-label uppercase text-neem-600">Registered address</dt>
            {/* CLIENT-COPY: replace with the trust's registered address. */}
            <dd className="mt-2 text-body">c/o [clinic name], New Delhi — [pin]</dd>
          </div>
          <div>
            <dt className="font-utility text-label uppercase text-neem-600">Email</dt>
            <dd className="mt-2 text-body">care@example.com</dd>
          </div>
          <div>
            <dt className="font-utility text-label uppercase text-neem-600">Grievance contact</dt>
            {/* CLIENT-COPY: replace with the named data-protection contact. */}
            <dd className="mt-2 text-body">
              [name], [email] — we answer within 7 working days
            </dd>
          </div>
        </dl>
      </Section>
    </>
  );
}
