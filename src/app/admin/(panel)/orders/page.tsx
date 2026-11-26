import Link from "next/link";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { formatDateTime, formatMoney } from "@/lib/format";
import { AdminTitle, Badge, FilterLinks, Panel, Td, Th } from "../ui";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const db = await getDb();
  const where: SQL[] = [];
  if (status === "to_pack") where.push(eq(s.orders.fulfillmentStatus, "to_pack"), eq(s.orders.status, "paid"));
  else if (status) where.push(eq(s.orders.status, status as s.OrderStatus));
  if (q) {
    const t = `%${q.trim()}%`;
    where.push(or(ilike(s.orders.number, t), ilike(s.orders.buyerEmail, t), ilike(s.orders.buyerLastName, t), ilike(s.orders.recipientName, t))!);
  }
  const orders = await db
    .select()
    .from(s.orders)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(s.orders.createdAt))
    .limit(200);

  return (
    <>
      <AdminTitle title="Orders">
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Order no., email, name…" className="input min-h-10 w-64 py-2 text-sm" />
          <button className="btn btn-outline btn-sm">Search</button>
        </form>
      </AdminTitle>
      <FilterLinks
        base="/admin/orders"
        current={status}
        options={[
          ["", "All"],
          ["paid", "Paid"],
          ["to_pack", "Boxes to pack"],
          ["pending_payment", "Awaiting payment"],
          ["cancelled", "Cancelled"],
        ]}
      />
      <Panel className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Buyer</Th>
              <Th>For</Th>
              <Th>Delivery</Th>
              <Th>Total</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <Td>
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-moss">
                    {o.number}
                  </Link>
                  <div className="text-xs text-muted">{formatDateTime(o.createdAt)}</div>
                </Td>
                <Td>
                  {o.buyerFirstName} {o.buyerLastName}
                  <div className="text-xs text-muted">{o.buyerEmail}</div>
                </Td>
                <Td>{o.mode === "gift" ? o.recipientName : "Self booking"}</Td>
                <Td>
                  {o.mode === "self" ? "—" : o.packaging === "ecert" ? "E-certificate" : `Box · ${o.deliveryMethod}`}
                  {o.packaging === "box" && o.status === "paid" && (
                    <div className="mt-1">
                      <Badge tone={o.fulfillmentStatus === "to_pack" ? "warn" : "good"}>{o.fulfillmentStatus.replace("_", " ")}</Badge>
                    </div>
                  )}
                </Td>
                <Td>{formatMoney(o.totalCents)}</Td>
                <Td>
                  <Badge tone={o.status === "paid" ? "good" : o.status === "pending_payment" ? "neutral" : "warn"}>{o.status.replace("_", " ")}</Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-8 text-center text-muted">No orders found.</p>}
      </Panel>
    </>
  );
}
