import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { getOrder } from "@/lib/orders";
import { paymentMode } from "@/lib/payments";
import { formatMoney } from "@/lib/format";
import { TestPayButton } from "@/components/checkout/TestPayButton";

export const metadata: Metadata = { title: "Test payment", robots: { index: false } };

export default async function TestPayPage({ searchParams }: { searchParams: Promise<{ purpose?: string; ref?: string }> }) {
  const { purpose, ref } = await searchParams;
  if (paymentMode() !== "test" || !ref || (purpose !== "order" && purpose !== "topup")) notFound();

  let amount = 0;
  let title = "";
  let back = "/";
  let already = false;
  if (purpose === "order") {
    const order = await getOrder(ref);
    if (!order) notFound();
    amount = order.totalCents;
    title = order.mode === "gift" ? `Cadeau gift for ${order.recipientName} · order ${order.number}` : `${order.items[0]?.title} · order ${order.number}`;
    back = order.mode === "gift" ? "/checkout?cancelled=1" : `/order/${order.id}`;
    already = order.status === "paid";
  } else {
    const db = await getDb();
    const [r] = await db.select().from(s.redemptions).where(eq(s.redemptions.id, Number(ref)));
    if (!r) notFound();
    const [cert] = await db.select().from(s.certificates).where(eq(s.certificates.id, r.certificateId));
    amount = r.topUpCents;
    title = `Top-up for ${r.title} (${r.optionLabel})`;
    back = `/redeem/${cert.code}/booking/${r.reference}?cancelled=1`;
    already = r.topUpStatus === "paid";
  }

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-16">
      <div className="w-full max-w-lg">
        <div className="rounded-[2rem] border border-line bg-paper p-8 shadow-[0_40px_80px_-50px_rgba(31,36,30,0.5)] sm:p-10">
          <p className="inline-flex rounded-full bg-clay-mist px-3 py-1 text-xs font-semibold text-clay-deep">Test mode · no real money moves</p>
          <h1 className="mt-5 text-4xl">Secure payment</h1>
          <p className="mt-2 text-ink-soft">{title}</p>
          <div className="mt-8 space-y-3">
            <div className="rounded-2xl border border-line bg-linen/60 px-4 py-3 font-mono text-sm tracking-[0.18em] text-ink-soft">4242 4242 4242 4242</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-line bg-linen/60 px-4 py-3 font-mono text-sm text-ink-soft">12 / 34</div>
              <div className="rounded-2xl border border-line bg-linen/60 px-4 py-3 font-mono text-sm text-ink-soft">123</div>
            </div>
          </div>
          <div className="mt-8 flex items-baseline justify-between border-t border-line pt-5">
            <span className="text-ink-soft">Total</span>
            <span className="font-display text-4xl">{formatMoney(amount)}</span>
          </div>
          <TestPayButton purpose={purpose} reference={ref} amountLabel={formatMoney(amount)} already={already} />
          <Link href={back} className="mt-4 block text-center text-sm text-muted hover:text-ink">
            Cancel and go back
          </Link>
        </div>
        <p className="mt-5 text-center text-xs text-muted">
          Add your Stripe keys (STRIPE_SECRET_KEY) to take real card, Apple Pay and Google Pay payments — this page then disappears.
        </p>
      </div>
    </div>
  );
}
