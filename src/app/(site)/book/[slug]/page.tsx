import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getExperienceBySlug } from "@/lib/catalog";
import { paymentMode } from "@/lib/payments";
import { BookingForm } from "@/components/redeem/BookingForm";
import { Img } from "@/components/Img";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ option?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await getExperienceBySlug((await params).slug);
  return e ? { title: `Book ${e.title}`, robots: { index: false } } : {};
}

/** "Book for myself" (bodo's "Купити для себе"): pay, then we confirm the date. */
export default async function BookForMyselfPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { option } = await searchParams;
  const e = await getExperienceBySlug(slug);
  if (!e) notFound();
  const mode = paymentMode();

  return (
    <div className="container-page pb-10 pt-8">
      <Link href={`/experiences/${e.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to the experience
      </Link>
      <div className="mt-6 grid gap-12 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <Img src={e.images[0]} alt="" priority sizes="(min-width:1024px) 400px, 100vw" className="aspect-[4/3] w-full rounded-[1.75rem] object-cover" />
            <p className="eyebrow mt-6">Book for yourself</p>
            <h1 className="mt-3 text-4xl">{e.title}</h1>
            <p className="mt-3 text-ink-soft">{e.summary}</p>
            <ol className="mt-6 space-y-2 rounded-2xl bg-paper p-5 text-sm text-ink-soft">
              <li>1. Choose your option and preferred dates</li>
              <li>2. Pay securely online</li>
              <li>3. We confirm with the venue — usually within a few hours</li>
            </ol>
          </div>
        </aside>
        <div className="lg:col-span-8">
          <BookingForm
            mode="self"
            experience={{ id: e.id, title: e.title }}
            options={e.options.map((o) => ({ id: o.id, label: o.label, people: o.people, duration: o.duration, priceCents: o.priceCents }))}
            locations={e.locations.map((l) => ({ id: l.id, name: l.name, address: l.address, schedule: l.schedule }))}
            defaultOptionId={Number(option) || undefined}
            paymentLabel={mode === "stripe" ? "Secure payment by Stripe — cards, Apple Pay and Google Pay." : "Test mode: simulated payment, no card charged."}
          />
        </div>
      </div>
    </div>
  );
}
