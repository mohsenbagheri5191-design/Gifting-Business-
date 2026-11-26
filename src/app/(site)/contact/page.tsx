import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/sections";
import { LeadForm } from "@/components/LeadForm";
import { site } from "@/lib/config";

export const metadata: Metadata = { title: "Contact", description: `Talk to the ${site.name} team — by phone, email or at our Toronto studio.` };

export default function ContactPage() {
  const cards = [
    { icon: Phone, title: "Call us", body: site.supportPhone, href: `tel:${site.supportPhone.replace(/[^\d+]/g, "")}` },
    { icon: Mail, title: "Email", body: site.supportEmail, href: `mailto:${site.supportEmail}` },
    { icon: Clock, title: "Hours", body: site.supportHours },
    { icon: MapPin, title: site.studio.name, body: `${site.studio.address} · ${site.studio.hours}` },
  ];
  return (
    <>
      <PageHero eyebrow="Contact" title="We're here to help" description="Questions about a gift, a booking or a corporate order? Reach out — a real person will reply." />
      <section className="container-page grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.title} className="rounded-[1.75rem] border border-line bg-paper p-7">
            <c.icon className="h-6 w-6 text-clay" strokeWidth={1.5} />
            <p className="mt-4 text-sm text-muted">{c.title}</p>
            {c.href ? (
              <a href={c.href} className="mt-1 block font-display text-xl hover:text-moss">
                {c.body}
              </a>
            ) : (
              <p className="mt-1 font-display text-xl">{c.body}</p>
            )}
          </div>
        ))}
      </section>

      <section className="container-page mt-16 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="text-4xl">Quick links</h2>
          <ul className="mt-6 space-y-2">
            {[
              ["/redeem", "Redeem a gift"],
              ["/redeem?check=1", "Check a gift's balance"],
              ["/how-it-works", "How it works"],
              ["/faq", "Help & FAQ"],
              ["/corporate", "Corporate gifts"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="block rounded-2xl bg-paper px-5 py-4 font-semibold hover:bg-sand">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 rounded-[1.75rem] bg-sage-mist p-7">
            <h3 className="text-2xl">Run a great experience?</h3>
            <p className="mt-2 text-ink-soft">We&apos;re always looking for exceptional local partners. Tell us about yours using the form and choose &ldquo;partnership&rdquo; in your message.</p>
          </div>
        </div>
        <div className="lg:col-span-7">
          <h2 className="text-4xl">Send a message</h2>
          <p className="mt-2 text-ink-soft">Feedback, a complaint, an idea — we read everything.</p>
          <div className="mt-6">
            <LeadForm type="contact" submitLabel="Send message" messageLabel="How can we help? (include your gift code or order number if you have one)" />
          </div>
        </div>
      </section>
    </>
  );
}
