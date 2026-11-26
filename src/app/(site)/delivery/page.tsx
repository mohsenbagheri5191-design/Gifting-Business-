import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, FileText, Mail, MapPin, Package, Truck } from "lucide-react";
import { PageHero } from "@/components/sections";
import { delivery, packaging, site } from "@/lib/config";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Delivery & payment", description: "E-certificates in minutes, same-day courier in Toronto, Xpresspost across Canada, or studio pickup." };

const icons = { email: Mail, courier: Truck, post: Package, pickup: MapPin } as const;

export default function DeliveryPage() {
  return (
    <>
      <PageHero eyebrow="Delivery & payment" title="However it needs to arrive" description="From an e-certificate timed to the minute to a gift box at their door this afternoon." />
      <section className="container-page grid gap-4 md:grid-cols-2">
        {Object.values(delivery).map((d) => {
          const Icon = icons[d.id];
          return (
            <div key={d.id} className="rounded-[2rem] border border-line bg-paper p-8">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-sage-mist text-moss">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <span className="font-display text-3xl">{d.priceCents ? formatMoney(d.priceCents) : "Free"}</span>
              </div>
              <h2 className="mt-6 text-3xl">{d.name}</h2>
              <p className="mt-2 font-semibold text-clay-deep">{d.eta}</p>
              <p className="mt-3 text-ink-soft">
                {d.id === "email" && "The certificate is emailed with your personal message — to you or straight to them, right away or at the date and time you choose. You receive a copy the moment it's sent."}
                {d.id === "courier" && `Your ${packaging.box.name.toLowerCase()} delivered by hand anywhere in Toronto (postal codes starting with M). Order before 2 pm for same-day delivery.`}
                {d.id === "post" && "Tracked delivery anywhere in Canada. We hand-finish and ship your box within one business day and email you the tracking number."}
                {d.id === "pickup" && `Collect your box from ${site.studio.name}, ${site.studio.address} — ${site.studio.hours}.`}
              </p>
            </div>
          );
        })}
      </section>

      <section className="container-page mt-20 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="eyebrow">Payment</p>
          <h2 className="mt-3 text-4xl">Simple and secure</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
          <div className="rounded-[2rem] bg-paper p-8">
            <CreditCard className="h-6 w-6 text-clay" strokeWidth={1.5} />
            <h3 className="mt-4 text-2xl">Online, instantly</h3>
            <p className="mt-2 text-ink-soft">Visa, Mastercard, American Express, Apple Pay and Google Pay — processed securely by Stripe. We never see your card details.</p>
          </div>
          <div className="rounded-[2rem] bg-paper p-8">
            <FileText className="h-6 w-6 text-clay" strokeWidth={1.5} />
            <h3 className="mt-4 text-2xl">By invoice, for companies</h3>
            <p className="mt-2 text-ink-soft">
              Ordering for a team or clients? We&apos;ll send a quote and invoice. <Link href="/corporate" className="underline underline-offset-4">Corporate gifts</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
