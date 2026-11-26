import { asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getCartLines } from "./catalog";
import { boxColors, delivery, packaging, provinces, rules } from "./config";
import { generateCertificateCode, generateOrderNumber } from "./codes";
import { getDb, type Tx } from "./db";
import * as s from "./db/schema";
import { adminNotifyAddress, dispatchDueEmails, queueEmail } from "./email";
import { adminNotice, bookingRequestedEmail, certificateEmail, orderReceiptEmail } from "./email/templates";
import { formatDateTime, formatMoney } from "./format";
import { createCheckout, paymentMode } from "./payments";
import { giftOrderTotals } from "./pricing";
import { insertSelfBookingTx } from "./redemptions";
import { site } from "./config";
import { UserError, firstIssue, isFutureDate, zDate, zEmail, zId, zName, zPhone, zPostal, zTime } from "./validation";

const line = z.object({ experienceId: zId, optionId: zId });
const buyer = z.object({ firstName: zName, lastName: zName, email: zEmail, phone: zPhone });
const optionalText = (max: number) => z.string().trim().max(max).optional().default("");
const shipping = z.object({
  name: zName,
  line1: z.string().trim().min(3, "Please enter a street address").max(120),
  line2: optionalText(120),
  city: z.string().trim().min(2, "Please enter a city").max(60),
  province: z.enum(provinces),
  postalCode: zPostal,
  phone: zPhone,
  notes: optionalText(300),
});

export const giftOrderSchema = z.object({
  mode: z.literal("gift"),
  items: z
    .array(line)
    .min(1, "Add at least one experience to your gift")
    .max(rules.maxGiftItems, `A gift can hold up to ${rules.maxGiftItems} experiences`),
  packaging: z.enum(["ecert", "box"]),
  boxColor: z.string().optional().nullable(),
  deliveryMethod: z.enum(["email", "courier", "post", "pickup"]),
  buyer,
  recipientName: zName,
  recipientEmail: z.union([zEmail, z.literal("")]).optional(),
  sendTo: z.enum(["recipient", "me"]).default("recipient"),
  sendAt: z.string().optional().nullable(),
  fromName: zName,
  message: optionalText(rules.messageMaxLength),
  shipping: shipping.optional().nullable(),
  acceptTerms: z.literal(true),
});

const optionalDate = z.union([zDate, z.literal("")]).optional().nullable();
const optionalTime = z.union([zTime, z.literal("")]).optional().nullable();

export const selfOrderSchema = z.object({
  mode: z.literal("self"),
  item: line,
  buyer,
  booking: z.object({
    locationId: zId.optional().nullable(),
    preferredDate1: zDate,
    preferredTime1: zTime,
    preferredDate2: optionalDate,
    preferredTime2: optionalTime,
    notes: optionalText(500),
  }),
  acceptTerms: z.literal(true),
});

export const orderSchema = z.discriminatedUnion("mode", [giftOrderSchema, selfOrderSchema]);
export type OrderInput = z.input<typeof orderSchema>;

export type CreatedOrder = { orderId: string; number: string; redirectUrl: string };

export async function createOrder(raw: unknown): Promise<CreatedOrder> {
  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) throw new UserError(firstIssue(parsed.error));
  return parsed.data.mode === "gift" ? createGiftOrder(parsed.data) : createSelfOrder(parsed.data);
}

async function insertOrder(values: Omit<typeof s.orders.$inferInsert, "number">, items: Omit<typeof s.orderItems.$inferInsert, "orderId">[]) {
  const db = await getDb();
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(s.orders)
          .values({ ...values, number: generateOrderNumber() })
          .returning();
        await tx.insert(s.orderItems).values(items.map((i, idx) => ({ ...i, orderId: order.id, sort: idx })));
        return order;
      });
    } catch (err) {
      // order number collision (astronomically rare) → retry with a new number
      if (attempt < 3 && /orders_number_unique/.test(String(err))) continue;
      throw err;
    }
  }
}

async function startPayment(order: s.Order, lineItems: { name: string; amountCents: number }[]): Promise<CreatedOrder> {
  const db = await getDb();
  const session = await createCheckout({
    purpose: "order",
    referenceId: order.id,
    lineItems,
    customerEmail: order.buyerEmail,
    successPath: `/order/${order.id}`,
    cancelPath: order.mode === "gift" ? "/checkout?cancelled=1" : `/order/${order.id}?cancelled=1`,
  });
  await db.update(s.orders).set({ paymentProvider: session.provider, paymentRef: session.ref }).where(eq(s.orders.id, order.id));
  return { orderId: order.id, number: order.number, redirectUrl: session.url };
}

async function createGiftOrder(input: z.output<typeof giftOrderSchema>): Promise<CreatedOrder> {
  const lines = await getCartLines(input.items);
  if (lines.length !== input.items.length) {
    throw new UserError("Something in your gift is no longer available. Please review your gift box.", 409);
  }
  if (new Set(lines.map((l) => l.experienceId)).size !== lines.length) {
    throw new UserError("Each experience can only be added to a gift once.");
  }

  const method = delivery[input.deliveryMethod];
  if (method.packaging !== input.packaging) throw new UserError("Please choose a delivery option for your packaging.");

  let sendAt: Date | null = null;
  let recipientEmail: string | null = null;
  let boxColor: string | null = null;
  let ship: z.output<typeof shipping> | null = null;

  if (input.packaging === "ecert") {
    if (input.sendTo === "recipient") {
      if (!input.recipientEmail) throw new UserError("Please enter the recipient's email address.");
      recipientEmail = input.recipientEmail;
    }
    if (input.sendAt) {
      const d = new Date(input.sendAt);
      if (Number.isNaN(+d)) throw new UserError("Please choose a valid delivery date and time.");
      if (+d > Date.now() + 366 * 86400_000) throw new UserError("Delivery can be scheduled up to a year ahead.");
      sendAt = +d > Date.now() + 60_000 ? d : null;
    }
  } else {
    boxColor = boxColors.some((c) => c.id === input.boxColor) ? input.boxColor! : boxColors[0].id;
    if (method.needsAddress) {
      if (!input.shipping) throw new UserError("Please enter the delivery address.");
      ship = input.shipping;
      if (input.deliveryMethod === "courier" && !/^M/i.test(ship.postalCode)) {
        throw new UserError("Same-day courier delivers within Toronto (postal codes starting with M). Please choose Canada Post for other addresses.");
      }
    }
  }

  const totals = giftOrderTotals(lines, input.packaging, input.deliveryMethod);
  const order = await insertOrder(
    {
      mode: "gift",
      buyerFirstName: input.buyer.firstName,
      buyerLastName: input.buyer.lastName,
      buyerEmail: input.buyer.email,
      buyerPhone: input.buyer.phone,
      packaging: input.packaging,
      boxColor,
      deliveryMethod: input.deliveryMethod,
      shipName: ship?.name ?? null,
      shipLine1: ship?.line1 ?? null,
      shipLine2: ship?.line2 || null,
      shipCity: ship?.city ?? null,
      shipProvince: ship?.province ?? null,
      shipPostalCode: ship?.postalCode ?? null,
      shipPhone: ship?.phone ?? null,
      shipNotes: ship?.notes || null,
      recipientName: input.recipientName,
      recipientEmail,
      sendTo: input.packaging === "ecert" ? input.sendTo : null,
      sendAt,
      fromName: input.fromName,
      message: input.message || null,
      ...totals,
      paymentProvider: paymentMode(),
    },
    lines.map((l) => ({
      experienceId: l.experienceId,
      optionId: l.optionId,
      title: l.title,
      optionLabel: l.optionLabel,
      people: l.people,
      duration: l.duration,
      priceCents: l.priceCents,
      image: l.image,
    })),
  );

  const count = lines.length;
  return startPayment(order, [
    {
      name: `${site.name} gift — ${count} experience${count > 1 ? "s" : ""} to choose from (value of the most expensive)`,
      amountCents: totals.certificateValueCents,
    },
    { name: packaging[input.packaging].name, amountCents: totals.packagingFeeCents },
    { name: method.name, amountCents: totals.deliveryFeeCents },
  ]);
}

async function createSelfOrder(input: z.output<typeof selfOrderSchema>): Promise<CreatedOrder> {
  const [line] = await getCartLines([input.item]);
  if (!line) throw new UserError("This experience is no longer available.", 409);
  const b = input.booking;
  if (!isFutureDate(b.preferredDate1) || (b.preferredDate2 && !isFutureDate(b.preferredDate2))) {
    throw new UserError("Please choose dates from tomorrow onwards.");
  }
  const db = await getDb();
  const locations = await db.select().from(s.experienceLocations).where(eq(s.experienceLocations.experienceId, line.experienceId));
  let locationId: number | null = b.locationId ?? null;
  if (locations.length === 1) locationId = locations[0].id;
  if (locations.length > 1 && !locations.some((l) => l.id === locationId)) throw new UserError("Please choose a location.");

  const order = await insertOrder(
    {
      mode: "self",
      buyerFirstName: input.buyer.firstName,
      buyerLastName: input.buyer.lastName,
      buyerEmail: input.buyer.email,
      buyerPhone: input.buyer.phone,
      packaging: "none",
      deliveryMethod: "none",
      recipientName: `${input.buyer.firstName} ${input.buyer.lastName}`,
      bookingDetails: {
        locationId,
        preferredDate1: b.preferredDate1,
        preferredTime1: b.preferredTime1,
        preferredDate2: b.preferredDate2 || null,
        preferredTime2: b.preferredTime2 || null,
        notes: b.notes || null,
      },
      certificateValueCents: line.priceCents,
      totalCents: line.priceCents,
      paymentProvider: paymentMode(),
    },
    [
      {
        experienceId: line.experienceId,
        optionId: line.optionId,
        title: line.title,
        optionLabel: line.optionLabel,
        people: line.people,
        duration: line.duration,
        priceCents: line.priceCents,
        image: line.image,
      },
    ],
  );
  return startPayment(order, [{ name: `${line.title} — ${line.optionLabel}`, amountCents: line.priceCents }]);
}

/* ------------------------------------------------------------- fulfilment */

async function uniqueCertificateCode(tx: Tx): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateCertificateCode();
    const [exists] = await tx.select({ id: s.certificates.id }).from(s.certificates).where(eq(s.certificates.code, code));
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique certificate code");
}

function addMonths(d: Date, months: number) {
  const out = new Date(d);
  out.setMonth(out.getMonth() + months);
  return out;
}

export type FulfilledOrder = {
  order: s.Order;
  certificate: s.Certificate;
  items: s.OrderItem[];
  redemption: s.Redemption | null;
};

/**
 * Called once payment succeeds (Stripe redirect/webhook or the test payment page).
 * Idempotent: issues exactly one certificate per order, with a fresh random 14-character
 * code linked to the purchased experiences, then queues the emails.
 */
export async function markOrderPaid(orderId: string, payment: { provider: string; ref?: string | null }): Promise<FulfilledOrder> {
  const db = await getDb();
  const result = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(s.orders).where(eq(s.orders.id, orderId)).for("update");
    if (!order) throw new UserError("Order not found.", 404);
    const items = await tx.select().from(s.orderItems).where(eq(s.orderItems.orderId, orderId)).orderBy(asc(s.orderItems.sort));

    if (order.status === "paid") {
      const [certificate] = await tx.select().from(s.certificates).where(eq(s.certificates.orderId, orderId));
      return { order, certificate, items, redemption: null, fresh: false };
    }
    if (order.status !== "pending_payment") throw new UserError("This order can no longer be paid.", 409);

    const now = new Date();
    const [paid] = await tx
      .update(s.orders)
      .set({
        status: "paid",
        paidAt: now,
        paymentProvider: payment.provider,
        paymentRef: payment.ref ?? order.paymentRef,
        fulfillmentStatus: order.packaging === "box" ? "to_pack" : "none",
        updatedAt: now,
      })
      .where(eq(s.orders.id, orderId))
      .returning();

    const code = await uniqueCertificateCode(tx);
    const [certificate] = await tx
      .insert(s.certificates)
      .values({
        code,
        orderId,
        kind: order.mode,
        valueCents: order.certificateValueCents,
        balanceCents: order.certificateValueCents,
        currency: order.currency,
        recipientName: order.recipientName,
        fromName: order.mode === "gift" ? order.fromName : null,
        message: order.mode === "gift" ? order.message : null,
        expiresAt: rules.certificateValidMonths > 0 ? addMonths(now, rules.certificateValidMonths) : null,
      })
      .returning();

    await tx.insert(s.certificateItems).values(
      items.map((i, idx) => ({
        certificateId: certificate.id,
        experienceId: i.experienceId,
        optionId: i.optionId,
        title: i.title,
        optionLabel: i.optionLabel,
        people: i.people,
        duration: i.duration,
        priceCents: i.priceCents,
        image: i.image,
        sort: idx,
      })),
    );

    const experienceIds = items.map((i) => i.experienceId).filter((x): x is number => x != null);
    if (experienceIds.length) {
      await tx
        .update(s.experiences)
        .set({ giftedCount: sql`${s.experiences.giftedCount} + 1` })
        .where(inArray(s.experiences.id, experienceIds));
    }

    let redemption: s.Redemption | null = null;
    let cert = certificate;
    if (order.mode === "self" && order.bookingDetails && items[0]) {
      ({ redemption, certificate: cert } = await insertSelfBookingTx(tx, certificate, items[0], order));
    }
    return { order: paid, certificate: cert, items, redemption, fresh: true };
  });

  if (result.fresh) {
    await queueOrderEmails(result);
    void dispatchDueEmails().catch(() => {});
  }
  return { order: result.order, certificate: result.certificate, items: result.items, redemption: result.redemption };
}

export function deliveryNote(order: s.Order): string {
  if (order.mode === "self") return "We'll confirm your date by email within a few hours.";
  if (order.packaging === "ecert") {
    if (order.sendTo === "me") return "We've emailed you the certificate to print or forward.";
    if (order.sendAt && +order.sendAt > Date.now())
      return `We'll email the certificate to ${order.recipientEmail} on ${formatDateTime(order.sendAt)} and send you a copy at the same moment.`;
    return `We've emailed the certificate to ${order.recipientEmail}. A copy is on its way to you too.`;
  }
  if (order.deliveryMethod === "courier") return "Your gift box will be hand-finished and delivered by courier — today for orders placed before 2 pm.";
  if (order.deliveryMethod === "post") return "Your gift box ships within one business day by Canada Post Xpresspost. We'll email you the tracking number.";
  return `Your gift box will be ready to collect from ${site.studio.name} within 2 hours.`;
}

async function queueOrderEmails({ order, certificate, items, redemption }: FulfilledOrder) {
  const db = await getDb();
  const receipt = orderReceiptEmail({
    orderId: order.id,
    number: order.number,
    buyerFirstName: order.buyerFirstName,
    mode: order.mode,
    recipientName: order.recipientName,
    items,
    certificateValueCents: order.certificateValueCents,
    packagingFeeCents: order.packagingFeeCents,
    deliveryFeeCents: order.deliveryFeeCents,
    totalCents: order.totalCents,
    code: certificate.code,
    deliveryNote: deliveryNote(order),
  });
  await queueEmail(db, { ...receipt, kind: "order_receipt", to: order.buyerEmail, orderId: order.id, certificateId: certificate.id });

  if (order.mode === "gift" && order.packaging === "ecert") {
    const base = {
      code: certificate.code,
      recipientName: order.recipientName ?? "",
      fromName: order.fromName ?? order.buyerFirstName,
      message: order.message,
      items,
      expiresAt: certificate.expiresAt,
    };
    if (order.sendTo === "recipient" && order.recipientEmail) {
      await queueEmail(db, {
        ...certificateEmail({ ...base, toBuyer: false }),
        kind: "certificate_recipient",
        to: order.recipientEmail,
        scheduledFor: order.sendAt,
        orderId: order.id,
        certificateId: certificate.id,
      });
      await queueEmail(db, {
        ...certificateEmail({ ...base, toBuyer: true }),
        kind: "certificate_copy",
        to: order.buyerEmail,
        scheduledFor: order.sendAt,
        orderId: order.id,
        certificateId: certificate.id,
      });
    } else {
      await queueEmail(db, {
        ...certificateEmail({ ...base, toBuyer: true }),
        kind: "certificate_buyer",
        to: order.buyerEmail,
        orderId: order.id,
        certificateId: certificate.id,
      });
    }
  }

  if (redemption) {
    await queueEmail(db, {
      ...bookingRequestedEmail(redemption, certificate.code, certificate.balanceCents),
      kind: "booking_requested",
      to: redemption.guestEmail,
      redemptionId: redemption.id,
      certificateId: certificate.id,
    });
  }

  const admin = adminNotifyAddress();
  if (admin) {
    await queueEmail(db, {
      ...adminNotice(
        `New ${order.mode === "gift" ? "gift" : "booking"} order ${order.number}`,
        [
          `${order.buyerFirstName} ${order.buyerLastName} paid ${formatMoney(order.totalCents)}.`,
          order.mode === "gift" ? `Packaging: ${order.packaging === "box" ? `gift box (${order.deliveryMethod})` : "e-certificate"}` : "Booking request to confirm.",
        ],
        `${site.url}/admin/orders/${order.id}`,
      ),
      kind: "admin_new_order",
      to: admin,
      orderId: order.id,
    });
  }
}

export async function getOrder(orderId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  const db = await getDb();
  const order = await db.query.orders.findFirst({
    where: eq(s.orders.id, orderId),
    with: { items: { orderBy: [asc(s.orderItems.sort)] }, certificates: true },
  });
  return order ?? null;
}
