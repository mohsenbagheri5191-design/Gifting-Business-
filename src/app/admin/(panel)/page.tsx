import Link from "next/link";
import { and, count, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { SAMPLE_REVIEW_EMAIL } from "@/lib/db/seed-data";
import { formatDateTime, formatMoney } from "@/lib/format";
import { paymentMode } from "@/lib/payments";
import { site } from "@/lib/config";
import { AdminTitle, Badge, Panel, Td, Th } from "./ui";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const db = await getDb();
  const [[paid], [liability], [pendingBookings], [awaitingTopUps], [toPack], [newLeads], [pendingReviews], [sampleReviews], recent] = await Promise.all([
    db.select({ n: count(), revenue: sql<number>`coalesce(sum(${s.orders.totalCents}),0)::int` }).from(s.orders).where(eq(s.orders.status, "paid")),
    db
      .select({ n: count(), sum: sql<number>`coalesce(sum(${s.certificates.balanceCents}),0)::int` })
      .from(s.certificates)
      .where(and(eq(s.certificates.isCancelled, false), gt(s.certificates.balanceCents, 0))),
    db.select({ n: count() }).from(s.redemptions).where(eq(s.redemptions.status, "requested")),
    db.select({ n: count() }).from(s.redemptions).where(eq(s.redemptions.status, "awaiting_payment")),
    db.select({ n: count() }).from(s.orders).where(and(eq(s.orders.status, "paid"), eq(s.orders.fulfillmentStatus, "to_pack"))),
    db.select({ n: count() }).from(s.leads).where(eq(s.leads.status, "new")),
    db.select({ n: count() }).from(s.reviews).where(eq(s.reviews.isPublished, false)),
    db.select({ n: count() }).from(s.reviews).where(eq(s.reviews.authorEmail, SAMPLE_REVIEW_EMAIL)),
    db.select().from(s.orders).orderBy(desc(s.orders.createdAt)).limit(8),
  ]);

  const kpis = [
    ["Revenue (paid orders)", formatMoney(paid.revenue), `${paid.n} orders`],
    ["Outstanding gift balances", formatMoney(liability.sum), `${liability.n} active gift codes`],
    ["Bookings to confirm", String(pendingBookings.n), `${awaitingTopUps.n} awaiting top-up`],
    ["Gift boxes to pack", String(toPack.n), `${newLeads.n} new enquiries`],
  ];

  const checklist: [boolean, string, string][] = [
    [paymentMode() === "stripe", "Stripe payments connected", "Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET"],
    [!!process.env.SMTP_URL, "Email sending connected", "Set SMTP_URL and MAIL_FROM (otherwise emails stay in Emails)"],
    [!!process.env.ADMIN_PASSWORD, "Admin password set", "Set ADMIN_PASSWORD and SESSION_SECRET"],
    [!!process.env.DATABASE_URL, "Production database connected", "Set DATABASE_URL (Postgres)"],
    [!site.supportEmail.endsWith(".example"), "Real contact details", "Edit src/lib/config.ts or NEXT_PUBLIC_SUPPORT_* variables"],
    [sampleReviews.n === 0, "Sample reviews removed", "Admin → Reviews → Remove sample reviews"],
  ];

  return (
    <>
      <AdminTitle title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value, sub]) => (
          <Panel key={label} className="p-6">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 font-display text-4xl">{value}</p>
            <p className="mt-1 text-sm text-ink-soft">{sub}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Panel className="overflow-x-auto xl:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-2xl">Latest orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-moss">
              All orders
            </Link>
          </div>
          <table className="mt-3 w-full">
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Buyer</Th>
                <Th>Type</Th>
                <Th>Total</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <Td>
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-moss">
                      {o.number}
                    </Link>
                    <div className="text-xs text-muted">{formatDateTime(o.createdAt)}</div>
                  </Td>
                  <Td>
                    {o.buyerFirstName} {o.buyerLastName}
                  </Td>
                  <Td>{o.mode === "gift" ? (o.packaging === "box" ? "Gift box" : "E-certificate") : "Booking"}</Td>
                  <Td>{formatMoney(o.totalCents)}</Td>
                  <Td>
                    <Badge tone={o.status === "paid" ? "good" : o.status === "pending_payment" ? "neutral" : "warn"}>{o.status.replace("_", " ")}</Badge>
                  </Td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <Td className="py-8 text-center text-muted">No orders yet.</Td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-2xl">Launch checklist</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {checklist.map(([ok, label, hint]) => (
              <li key={label} className="flex gap-3">
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${ok ? "bg-sage-mist text-moss" : "bg-clay-mist text-clay-deep"}`}>{ok ? "✓" : "!"}</span>
                <span>
                  <span className="font-semibold">{label}</span>
                  {!ok && <span className="block text-muted">{hint}</span>}
                </span>
              </li>
            ))}
          </ul>
          {pendingReviews.n > 0 && (
            <Link href="/admin/reviews" className="mt-6 block rounded-xl bg-sand px-4 py-3 text-sm">
              {pendingReviews.n} review{pendingReviews.n === 1 ? "" : "s"} waiting for moderation →
            </Link>
          )}
        </Panel>
      </div>
    </>
  );
}
