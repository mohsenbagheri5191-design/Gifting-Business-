import type { Metadata } from "next";
import Link from "next/link";
import { FaqList, PageHero } from "@/components/sections";
import { faqSections } from "@/lib/faq";
import { site } from "@/lib/config";

export const metadata: Metadata = { title: "Help & FAQ", description: "Answers about ordering, payment, delivery, using a Cadeau gift and refunds." };

export default function FaqPage() {
  return (
    <>
      <PageHero eyebrow="Help centre" title="How can we help?" description="Everything about ordering, delivery and using your gift. Can't find your answer? We're one message away." />
      <div className="container-page grid gap-12 lg:grid-cols-12">
        <nav className="lg:col-span-3" aria-label="Help topics">
          <ul className="flex flex-wrap gap-2 lg:sticky lg:top-32 lg:flex-col lg:gap-1">
            {faqSections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-full border border-line bg-paper px-4 py-2 text-sm hover:border-sage lg:rounded-xl lg:border-0 lg:bg-transparent lg:px-3 lg:text-base lg:hover:bg-sand">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-16 lg:col-span-9">
          {faqSections.map((s) => (
            <section key={s.id} id={s.id}>
              <h2 className="mb-4 text-4xl">{s.title}</h2>
              <FaqList items={s.items} />
            </section>
          ))}
          <div className="rounded-[2rem] bg-sage-mist p-9">
            <h2 className="text-3xl">Still wondering?</h2>
            <p className="mt-2 text-ink-soft">
              Call {site.supportPhone} or email {site.supportEmail} — {site.supportHours.toLowerCase()}.
            </p>
            <Link href="/contact" className="btn btn-primary mt-5">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
