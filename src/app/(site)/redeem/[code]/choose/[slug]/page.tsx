import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getExperienceBySlug } from "@/lib/catalog";
import { formatCode } from "@/lib/codes";
import { formatMoney } from "@/lib/format";
import { paymentMode } from "@/lib/payments";
import { clientIp } from "@/lib/rate-limit";
import { lookupCertificate, quoteFor } from "@/lib/redemptions";
import { BookingForm } from "@/components/redeem/BookingForm";
import { Img } from "@/components/Img";

export const metadata: Metadata = { title: "Choose your experience", robots: { index: false } };

type Props = { params: Promise<{ code: string; slug: string }>; searchParams: Promise<{ option?: string }> };

export default async function ChoosePage({ params, searchParams }: Props) {
  const { code, slug } = await params;
  const { option } = await searchParams;
  const result = await lookupCertificate(code, clientIp(await headers()));
  if (!result.ok) redirect(`/redeem`);
  const cert = result.certificate;
  if (cert.status !== "active") redirect(`/redeem/${cert.code}`);
  const e = await getExperienceBySlug(slug);
  if (!e) notFound();

  const options = e.options.map((o) => {
    const q = quoteFor(cert, cert.items, o);
    return { id: o.id, label: o.label, people: o.people, duration: o.duration, priceCents: q.priceCents, topUpCents: q.topUpCents, wasInGift: q.wasInGift };
  });
  const mode = paymentMode();

  return (
    <div className="container-page pb-10 pt-8">
      <Link href={`/redeem/${cert.code}`} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to your gift
      </Link>
      <div className="mt-6 grid gap-12 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <Img src={e.images[0]} alt="" priority sizes="(min-width:1024px) 400px, 100vw" className="aspect-[4/3] w-full rounded-[1.75rem] object-cover" />
            <p className="eyebrow mt-6">Booking with gift {formatCode(cert.code)}</p>
            <h1 className="mt-3 text-4xl">{e.title}</h1>
            <p className="mt-3 text-ink-soft">{e.summary}</p>
            <p className="mt-5 rounded-2xl bg-sage-mist px-5 py-4 text-sm">
              Your balance: <strong>{formatMoney(cert.balanceCents)}</strong>
            </p>
            {e.goodToKnow.length > 0 && (
              <ul className="mt-5 space-y-1.5 text-sm text-muted">
                {e.goodToKnow.map((g) => (
                  <li key={g}>· {g}</li>
                ))}
              </ul>
            )}
          </div>
        </aside>
        <div className="lg:col-span-8">
          <BookingForm
            mode="redeem"
            code={cert.code}
            experience={{ id: e.id, title: e.title }}
            options={options}
            locations={e.locations.map((l) => ({ id: l.id, name: l.name, address: l.address, schedule: l.schedule }))}
            defaultOptionId={Number(option) || undefined}
            balanceCents={cert.balanceCents}
            prefill={{ firstName: cert.recipientName?.split(" ")[0] }}
            paymentLabel={mode === "stripe" ? "Secure payment by Stripe." : "Test mode: simulated payment, no card charged."}
          />
        </div>
      </div>
    </div>
  );
}
