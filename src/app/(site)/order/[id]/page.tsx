import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { CheckCircle2, Clock, Mail, Package, Printer } from "lucide-react";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { deliveryNote, getOrder, markOrderPaid } from "@/lib/orders";
import { paymentMode, retrievePaidStripeSession } from "@/lib/payments";
import { formatCode } from "@/lib/codes";
import { formatDateTime, formatMoney } from "@/lib/format";
import { boxColors, delivery } from "@/lib/config";
import { CertificateCard } from "@/components/CertificateCard";
import { ClearGiftBox } from "@/components/checkout/ClearGiftBox";
import { Stepper } from "@/components/checkout/Stepper";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ session_id?: string; cancelled?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  let order = await getOrder(id);
  if (!order) notFound();

  // Returning from Stripe: confirm the payment directly with Stripe (the webhook does the same).
  if (order.status === "pending_payment" && sp.session_id && paymentMode() === "stripe") {
    try {
      const session = await retrievePaidStripeSession(sp.session_id);
      if (session.paid && session.purpose === "order" && session.referenceId === order.id) {
        await markOrderPaid(order.id, { provider: "stripe", ref: session.ref });
        order = (await getOrder(id))!;
      }
    } catch (err) {
      console.error("[cadeau] stripe session check failed", err);
    }
  }

  if (order.status !== "paid") {
    return (
      <div className="container-page py-24 text-center">
        <p className="eyebrow">Order {order.number}</p>
        <h1 className="mt-4 text-5xl">{sp.cancelled ? "Payment cancelled" : "Waiting for payment"}</h1>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">
          {sp.cancelled ? "Nothing was charged. You can try again whenever you're ready." : "If you've just paid, this page will update in a moment."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          {paymentMode() === "test" && (
            <Link href={`/pay/test?purpose=order&ref=${order.id}`} className="btn btn-primary">
              Complete test payment
            </Link>
          )}
          <Link href={order.mode === "gift" ? "/checkout" : "/experiences"} className="btn btn-outline">
            Back
          </Link>
        </div>
      </div>
    );
  }

  const cert = order.certificates[0];
  const db = await getDb();
  const mail = cert ? await db.select().from(s.emails).where(eq(s.emails.certificateId, cert.id)).orderBy(asc(s.emails.createdAt)) : [];
  const recipientMail = mail.find((m) => m.kind === "certificate_recipient");
  const [booking] = cert ? await db.select().from(s.redemptions).where(eq(s.redemptions.certificateId, cert.id)) : [];

  return (
    <div className="container-page pb-10 pt-8">
      <ClearGiftBox />
      {order.mode === "gift" && <Stepper current={5} />}
      <div className="mt-10 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-sage-mist px-4 py-1.5 text-sm font-semibold text-moss">
            <CheckCircle2 className="h-4 w-4" /> Payment received
          </span>
          <h1 className="mt-5 text-5xl sm:text-6xl">{order.mode === "gift" ? "Your gift is ready" : "Your booking request is in"}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Thank you, {order.buyerFirstName}. {deliveryNote(order)}
          </p>

          {cert && (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-clay/60 bg-paper p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Gift code</p>
              <p className="mt-2 font-mono text-3xl tracking-[0.14em]">{formatCode(cert.code)}</p>
              <p className="mt-2 text-sm text-ink-soft">
                {order.mode === "gift"
                  ? `${order.recipientName} enters this at /redeem to choose their experience. Keep it safe — it works like cash.`
                  : "Use this code to see or change your booking."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/certificate/${cert.code}`} className="btn btn-primary btn-sm">
                  <Printer className="h-4 w-4" /> View & print certificate
                </Link>
                <Link href={`/redeem/${cert.code}`} className="btn btn-outline btn-sm">
                  {order.mode === "gift" ? "See what they'll see" : "Manage booking"}
                </Link>
              </div>
            </div>
          )}

          <ol className="mt-8 space-y-3">
            <li className="flex gap-4 rounded-2xl bg-paper p-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
              <div>
                <p className="font-semibold">Receipt sent to {order.buyerEmail}</p>
                <p className="text-sm text-muted">Order {order.number} · {formatMoney(order.totalCents)}</p>
              </div>
            </li>
            {order.packaging === "ecert" && recipientMail && (
              <li className="flex gap-4 rounded-2xl bg-paper p-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                <div>
                  <p className="font-semibold">
                    E-certificate {recipientMail.status === "scheduled" ? "scheduled" : "sent"} to {recipientMail.toAddress}
                  </p>
                  <p className="text-sm text-muted">{recipientMail.status === "scheduled" ? `Arrives ${formatDateTime(recipientMail.scheduledFor)} (Toronto)` : `Sent ${formatDateTime(recipientMail.sentAt ?? recipientMail.createdAt)}`}</p>
                </div>
              </li>
            )}
            {order.packaging === "box" && (
              <li className="flex gap-4 rounded-2xl bg-paper p-4">
                <Package className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                <div>
                  <p className="font-semibold">
                    {boxColors.find((c) => c.id === order.boxColor)?.name} gift box · {delivery[order.deliveryMethod as keyof typeof delivery]?.name}
                  </p>
                  <p className="text-sm text-muted">
                    {order.deliveryMethod === "pickup" ? "We'll email you when it's ready to collect." : `To ${order.shipLine1}, ${order.shipCity} ${order.shipPostalCode}`}
                  </p>
                </div>
              </li>
            )}
            {booking && (
              <li className="flex gap-4 rounded-2xl bg-paper p-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                <div>
                  <p className="font-semibold">Booking {booking.reference} — awaiting confirmation</p>
                  <p className="text-sm text-muted">
                    Preferred: {booking.preferredDate1} at {booking.preferredTime1}
                    {booking.preferredDate2 ? ` or ${booking.preferredDate2} at ${booking.preferredTime2}` : ""}
                  </p>
                </div>
              </li>
            )}
          </ol>

          <div className="mt-10 rounded-[1.75rem] border border-line bg-paper p-6">
            <p className="font-display text-xl">Order summary</p>
            <ul className="mt-3 space-y-2 text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span className="text-ink-soft">
                    {i.title} · {i.optionLabel}
                  </span>
                  <span className="text-muted">{formatMoney(i.priceCents)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt>{order.mode === "gift" ? "Gift value (most expensive)" : "Experience"}</dt>
                <dd>{formatMoney(order.certificateValueCents)}</dd>
              </div>
              {order.packagingFeeCents > 0 && (
                <div className="flex justify-between">
                  <dt>Gift box</dt>
                  <dd>{formatMoney(order.packagingFeeCents)}</dd>
                </div>
              )}
              {order.deliveryFeeCents > 0 && (
                <div className="flex justify-between">
                  <dt>Delivery</dt>
                  <dd>{formatMoney(order.deliveryFeeCents)}</dd>
                </div>
              )}
              <div className="flex justify-between pt-1 font-semibold">
                <dt>Total paid</dt>
                <dd>{formatMoney(order.totalCents)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {cert && order.mode === "gift" && (
          <div className="lg:col-span-6">
            <CertificateCard
              recipientName={order.recipientName ?? ""}
              fromName={order.fromName}
              message={order.message}
              items={order.items.map((i) => ({ title: i.title, optionLabel: i.optionLabel }))}
              code={cert.code}
              expiresAt={cert.expiresAt}
            />
          </div>
        )}
      </div>
    </div>
  );
}
