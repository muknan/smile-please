import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";

export function ArchHero() {
  return <section className="border-b border-neem-100">
    <div className="container-content pb-8 pt-10 sm:pb-10 sm:pt-16">
      <div className="grid items-center gap-8 md:grid-cols-[.95fr_1.05fr] md:gap-10">
        <div className="pb-2">
          <p className="eyebrow text-neem-600">Free dental care · New Delhi</p>
          <h1 className="hero-heading mt-6 max-w-[11ch] text-neem-900">Good care.<br />For every <span className="italic">smile.</span></h1>
          <p className="mt-6 max-w-[42ch] text-body-l text-ink-950/80">Everyone deserves a comfortable, confident smile. We connect people in Delhi with free dental care and the knowledge to look after it.</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/care" className="inline-flex min-h-12 items-center gap-4 rounded bg-neem-900 px-6 py-3 font-utility text-body-s font-medium text-chalk-0 hover:bg-neem-600">Find free dental care <ArrowRight size={18} aria-hidden="true" /></Link>
            <Link href="/about" className="text-link">Meet Smile Please</Link>
          </div>
        </div>
        <figure>
          <Image src="/community-illustration.webp" alt="Illustration of neighbours sharing a quiet moment beneath a neem tree in Delhi." width={1200} height={800} priority sizes="(max-width: 1023px) 100vw, 600px" className="aspect-[3/2] w-full object-cover md:aspect-[1.14]" />
          <figcaption className="mt-3 flex items-center justify-between gap-4 font-utility text-[11px] uppercase tracking-[.08em] text-neem-600"><span>Care begins in our communities.</span><span>Illustration</span></figcaption>
        </figure>
      </div>
      <div className="mt-10 grid divide-y divide-neem-100 border-t border-neem-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[["Need a helping hand?", "Find care", "/care/request"], ["A dentist with time to give?", "Volunteer with us", "/contact?tab=dentist"], ["Make a difference together.", "Explore partnerships", "/partners"]].map(([label, title, href], i) => <Link key={href} href={href} className={`group flex items-center justify-between gap-4 py-5 ${i ? "sm:pl-6" : ""} sm:pr-6`}><span><span className="block text-body-s text-ink-950/70">{label}</span><span className="mt-1 block font-medium">{title}</span></span><ArrowUpRight size={21} aria-hidden="true" className="shrink-0 transition group-hover:-translate-y-1 group-hover:translate-x-1" /></Link>)}
      </div>
    </div>
  </section>;
}
