import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { getOrder } from "@/lib/orders";
import { formatCode } from "@/lib/codes";
import { formatDateTime, formatMoney } from "@/lib/format";
import { boxColors, delivery } from "@/lib/config";
import { cancelOrder, resendCertificate, updateFulfillment } from "../../../actions";
import { AdminTitle, Badge, ErrorBanner, Panel } from "../../ui";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const order = await getOrder(id);
  if (!order) notFound();
  const cert = order.certificates[0];
  const db = await getDb();
  const mail = await db.select().from(s.emails).where(eq(s.emails.orderId, order.id)).orderBy(asc(s.emails.createdAt));
  const bookings = cert ? await db.select().from(s.redemptions).where(eq(s.redemptions.certificateId, cert.id)) : [];

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-muted hover:text-ink">
        ← Orders
      </Link>
      <AdminTitle title={`Order ${order.number}`}>
        <Badge tone={order.status === "paid" ? "good" : "warn"}>{order.status.replace("_", " ")}</Badge>
      </AdminTitle>
      <ErrorBanner message={error} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel className="p-6">
            <h2 className="text-2xl">{order.mode === "gift" ? `Gift for ${order.recipientName}` : "Booking for the buyer"}</h2>
            <ul className="mt-4 divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-2.5 text-sm">
                  <span>
                    {i.title} <span className="text-muted">· {i.optionLabel} · {i.duration}</span>
                  </span>
                  <span>{formatMoney(i.priceCents)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 grid gap-1 border-t border-line pt-4 text-sm sm:grid-cols-2">
              <dt className="text-muted">Gift value</dt>
              <dd>{formatMoney(order.certificateValueCents)}</dd>
              <dt className="text-muted">Packaging</dt>
              <dd>
                {order.packaging === "box" ? `Gift box (${boxColors.find((c) => c.id === order.boxColor)?.name}) ${formatMoney(order.packagingFeeCents)}` : order.packaging === "ecert" ? "E-certificate" : "—"}
              </dd>
              <dt className="text-muted">Delivery</dt>
              <dd>
                {delivery[order.deliveryMethod as keyof typeof delivery]?.name ?? "—"} {order.deliveryFeeCents ? formatMoney(order.deliveryFeeCents) : ""}
              </dd>
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold">{formatMoney(order.totalCents)}</dd>
              <dt className="text-muted">Payment</dt>
              <dd>
                {order.paymentProvider} {order.paymentRef ? `· ${order.paymentRef}` : ""} {order.paidAt ? `· ${formatDateTime(order.paidAt)}` : ""}
              </dd>
            </dl>
            {order.message && <blockquote className="mt-4 rounded-xl bg-linen px-4 py-3 text-sm italic">“{order.message}” — {order.fromName}</blockquote>}
          </Panel>

          {cert && (
            <Panel className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl">Gift code</h2>
                <Link href={`/admin/certificates/${cert.code}`} className="text-sm font-semibold text-moss">
                  Open gift code →
                </Link>
              </div>
              <p className="mt-3 font-mono text-2xl tracking-[0.14em]">{formatCode(cert.code)}</p>
              <p className="mt-1 text-sm text-muted">
                Balance {formatMoney(cert.balanceCents)} of {formatMoney(cert.valueCents)} {cert.isCancelled && "· CANCELLED"}
              </p>
              {bookings.length > 0 && (
                <ul className="mt-4 space-y-1 text-sm">
                  {bookings.map((b) => (
                    <li key={b.id}>
                      {b.reference} · {b.title} · <Badge>{b.status.replace("_", " ")}</Badge>
                    </li>
                  ))}
                </ul>
              )}
              {order.mode === "gift" && (
                <form action={resendCertificate} className="mt-5 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={order.id} />
                  <input name="to" type="email" defaultValue={order.recipientEmail ?? order.buyerEmail} className="input min-h-10 max-w-xs py-2 text-sm" />
                  <button className="btn btn-outline btn-sm">Re-send certificate</button>
                </form>
              )}
            </Panel>
          )}

          <Panel className="p-6">
            <h2 className="text-2xl">Emails</h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {mail.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <Link href={`/admin/emails/${m.id}`} className="text-moss">
                    {m.subject}
                  </Link>
                  <span className="text-muted">
                    → {m.toAddress} · <Badge tone={m.status === "failed" ? "bad" : m.status === "scheduled" ? "neutral" : "good"}>{m.status}</Badge>{" "}
                    {m.status === "scheduled" ? formatDateTime(m.scheduledFor) : formatDateTime(m.sentAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel className="p-6 text-sm">
            <h2 className="text-2xl">Buyer</h2>
            <p className="mt-3 font-semibold">
              {order.buyerFirstName} {order.buyerLastName}
            </p>
            <p>{order.buyerEmail}</p>
            <p>{order.buyerPhone}</p>
            {order.recipientEmail && <p className="mt-3 text-muted">Recipient email: {order.recipientEmail}</p>}
            {order.sendAt && <p className="text-muted">Scheduled for {formatDateTime(order.sendAt)}</p>}
          </Panel>

          {order.packaging === "box" && (
            <Panel className="p-6 text-sm">
              <h2 className="text-2xl">Fulfilment</h2>
              {order.deliveryMethod !== "pickup" && (
                <address className="mt-3 not-italic">
                  {order.shipName}
                  <br />
                  {order.shipLine1} {order.shipLine2}
                  <br />
                  {order.shipCity}, {order.shipProvince} {order.shipPostalCode}
                  <br />
                  {order.shipPhone}
                  {order.shipNotes && <span className="mt-1 block text-muted">Note: {order.shipNotes}</span>}
                </address>
              )}
              <form action={updateFulfillment} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={order.id} />
                <select name="fulfillmentStatus" defaultValue={order.fulfillmentStatus} className="select min-h-10 py-2 text-sm">
                  {["to_pack", "packed", "shipped", "delivered", "picked_up"].map((st) => (
                    <option key={st} value={st}>
                      {st.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} placeholder="Tracking number" className="input min-h-10 py-2 text-sm" />
                <textarea name="adminNote" defaultValue={order.adminNote ?? ""} placeholder="Internal note" className="textarea min-h-20 text-sm" />
                <button className="btn btn-primary btn-sm">Save</button>
              </form>
            </Panel>
          )}

          {order.status === "paid" && (
            <Panel className="p-6 text-sm">
              <h2 className="text-2xl">Cancel order</h2>
              <p className="mt-2 text-muted">Voids the gift code (only if it has no bookings). Refund the payment in your Stripe dashboard.</p>
              <form action={cancelOrder} className="mt-4">
                <input type="hidden" name="id" value={order.id} />
                <button className="btn btn-outline btn-sm">Cancel order & void code</button>
              </form>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
