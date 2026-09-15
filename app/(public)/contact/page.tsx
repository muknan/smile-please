import type { Metadata } from "next";
import { Section } from "@/components/site/Section";
import { ContactForm } from "@/components/contact/ContactForm";
import { makeRenderedAt } from "@/lib/antispam";
import { CONTACT_TABS, type ContactTab } from "@/lib/contact";
import { GRIEVANCE_EMAIL } from "@/lib/contact-info";

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
      <Section className="pt-16 sm:pt-20">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow">Contact</p>
            <h1 className="mt-4 max-w-[24ch] text-display-l">Talk to a real person</h1>
          </div>
          <p className="max-w-[58ch] text-body-l text-ink-950/70 lg:col-span-5">
          A question about care, a dentist who wants to give a few hours a month, a school or
          clinic that wants to host a camp — choose the route that fits. We usually reply within two working days.
          </p>
        </div>

        <div className="mt-12">
          <ContactForm
            initialTab={initialTab}
            renderedAt={makeRenderedAt()}
            whatsappNumberSet={whatsappNumberSet}
          />
        </div>
      </Section>

      <Section className="border-t border-neem-100 bg-neem-50 py-16">
        <p className="eyebrow">Formal requests</p>
        <h2 className="text-display-m">Complaints and data requests</h2>
        <p className="mt-4 max-w-[65ch] text-body-l text-ink-950/70">
          For email and phone, see the Contact block in the footer. This channel is for
          anything formal — a complaint, a request about your data, or an escalation.
        </p>
        <dl className="mt-8 max-w-[65ch]">
          <dt className="font-utility text-body-s font-semibold text-neem-600">Grievance contact</dt>
          <dd className="mt-2 text-body">
            {/* CLIENT-COPY: optional named DPO. Same mailbox handles data requests. */}
            <a
              href={`mailto:${GRIEVANCE_EMAIL}`}
              className="font-medium text-neem-600 underline underline-offset-4"
            >
              {GRIEVANCE_EMAIL}
            </a>{" "}
            — we answer within 7 working days
          </dd>
        </dl>
      </Section>
    </>
  );
}
