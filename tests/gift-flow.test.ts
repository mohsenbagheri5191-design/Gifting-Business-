import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../src/lib/db";
import * as s from "../src/lib/db/schema";
import { listExperiences } from "../src/lib/catalog";
import { createOrder, markOrderPaid } from "../src/lib/orders";
import {
  cancelRedemption,
  confirmRedemption,
  createRedemption,
  getCertificate,
  lookupCertificate,
  markTopUpPaid,
} from "../src/lib/redemptions";
import { isValidCode } from "../src/lib/codes";

const tomorrow = () => new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10);
const buyer = { firstName: "Dexter", lastName: "Morgan", email: "dexter@example.com", phone: "416 555 0101" };
const guest = { firstName: "Yashar", lastName: "Morgan", email: "yashar@example.com", phone: "416 555 0102" };

type Pick3 = { experienceId: number; optionId: number; priceCents: number; title: string };
let picks: Pick3[] = [];
let swap: { experienceId: number; optionId: number; priceCents: number };

beforeAll(async () => {
  await getDb(); // migrates + seeds the in-memory database
  const all = await listExperiences({ sort: "price-asc" });
  expect(all.length).toBeGreaterThan(20);
  // three experiences with distinct prices, like Dexter's choice (restaurant, comedy, workshop)
  const byPrice = all.map((e) => ({ experienceId: e.id, optionId: e.options[0].id, priceCents: e.options[0].priceCents, title: e.title }));
  const distinct = byPrice.filter((p, i, arr) => arr.findIndex((q) => q.priceCents === p.priceCents) === i);
  picks = [distinct[2], distinct[5], distinct[8]];
  const expensive = [...all].sort((a, b) => b.fromPriceCents - a.fromPriceCents)[0];
  swap = { experienceId: expensive.id, optionId: expensive.options[0].id, priceCents: expensive.options[0].priceCents };
});

afterAll(async () => {
  await closeDb();
});

async function buyGift(extra: Record<string, unknown> = {}) {
  const created = await createOrder({
    mode: "gift",
    items: picks.map(({ experienceId, optionId }) => ({ experienceId, optionId })),
    packaging: "ecert",
    deliveryMethod: "email",
    buyer,
    recipientName: "Yashar",
    recipientEmail: "yashar@example.com",
    sendTo: "recipient",
    fromName: "Dexter",
    message: "Happy birthday, brother!",
    acceptTerms: true,
    ...extra,
  });
  expect(created.redirectUrl).toContain("/pay/test");
  return markOrderPaid(created.orderId, { provider: "test" });
}

describe("Dexter gives Yashar a choice of experiences", () => {
  it("charges only the most expensive experience and issues a 14-character code linked to all items", async () => {
    const { order, certificate, items } = await buyGift();
    const max = Math.max(...picks.map((p) => p.priceCents));
    expect(order.status).toBe("paid");
    expect(order.totalCents).toBe(max);
    expect(certificate.valueCents).toBe(max);
    expect(certificate.balanceCents).toBe(max);
    expect(certificate.code).toHaveLength(14);
    expect(isValidCode(certificate.code)).toBe(true);
    expect(items).toHaveLength(3);

    const view = await getCertificate(certificate.code);
    expect(view?.items.map((i) => i.optionId).sort()).toEqual(picks.map((p) => p.optionId).sort());

    // emails: receipt to Dexter, certificate to Yashar, copy to Dexter
    const db = await getDb();
    const mail = await db.select().from(s.emails).where(eq(s.emails.certificateId, certificate.id));
    expect(mail.map((m) => m.kind).sort()).toEqual(["certificate_copy", "certificate_recipient", "order_receipt"]);
    expect(mail.find((m) => m.kind === "certificate_recipient")?.toAddress).toBe("yashar@example.com");
  });

  it("is idempotent when the payment confirmation arrives twice", async () => {
    const created = await createOrder({
      mode: "gift",
      items: [{ experienceId: picks[0].experienceId, optionId: picks[0].optionId }],
      packaging: "ecert",
      deliveryMethod: "email",
      buyer,
      recipientName: "Yashar",
      sendTo: "me",
      fromName: "Dexter",
      acceptTerms: true,
    });
    const a = await markOrderPaid(created.orderId, { provider: "test" });
    const b = await markOrderPaid(created.orderId, { provider: "test" });
    expect(b.certificate.code).toBe(a.certificate.code);
    const db = await getDb();
    const certs = await db.select().from(s.certificates).where(eq(s.certificates.orderId, created.orderId));
    expect(certs).toHaveLength(1);
  });

  it("lets Yashar pick a cheaper packaged experience and keep the remaining balance", async () => {
    const { certificate } = await buyGift();
    const cheapest = [...picks].sort((a, b) => a.priceCents - b.priceCents)[0];
    const res = await createRedemption({
      code: certificate.code.toLowerCase().replace(/(.{7})/, "$1-"), // typed casually
      experienceId: cheapest.experienceId,
      optionId: cheapest.optionId,
      guest,
      preferredDate1: tomorrow(),
      preferredTime1: "18:00",
      acceptTerms: true,
    });
    expect(res.status).toBe("requested");
    const view = await getCertificate(certificate.code);
    expect(view?.balanceCents).toBe(certificate.valueCents - cheapest.priceCents);
    expect(view?.status).toBe("active");

    // admin confirms → email
    const booking = view!.redemptions[0];
    const confirmed = await confirmRedemption(booking.id, "Saturday 14 March, 7:00 pm");
    expect(confirmed.status).toBe("confirmed");
  });

  it("lets Yashar swap for something pricier and pay the difference", async () => {
    const { certificate } = await buyGift();
    expect(swap.priceCents).toBeGreaterThan(certificate.valueCents);
    const res = await createRedemption({
      code: certificate.code,
      experienceId: swap.experienceId,
      optionId: swap.optionId,
      guest,
      preferredDate1: tomorrow(),
      preferredTime1: "10:00",
      acceptTerms: true,
    });
    expect(res.status).toBe("awaiting_payment");
    expect(res.redirectUrl).toContain("purpose=topup");

    let view = await getCertificate(certificate.code);
    const r = view!.redemptions[0];
    expect(r.topUpCents).toBe(swap.priceCents - certificate.valueCents);
    expect(view!.balanceCents).toBe(0); // held while paying

    await markTopUpPaid(r.id, { provider: "test" });
    view = await getCertificate(certificate.code);
    expect(view!.redemptions[0].status).toBe("requested");
    expect(view!.redemptions[0].topUpStatus).toBe("paid");
    expect(view!.status).toBe("used");
  });

  it("returns the amount to the balance when a booking is declined", async () => {
    const { certificate } = await buyGift();
    await createRedemption({
      code: certificate.code,
      experienceId: picks[1].experienceId,
      optionId: picks[1].optionId,
      guest,
      preferredDate1: tomorrow(),
      preferredTime1: "12:00",
      acceptTerms: true,
    });
    let view = await getCertificate(certificate.code);
    await cancelRedemption(view!.redemptions[0].id, "declined", "Fully booked that weekend");
    view = await getCertificate(certificate.code);
    expect(view!.balanceCents).toBe(certificate.valueCents);
    expect(view!.redemptions[0].status).toBe("declined");
  });

  it("protects the recipient from later price increases on packaged experiences", async () => {
    const { certificate } = await buyGift();
    const target = [...picks].sort((a, b) => b.priceCents - a.priceCents)[0];
    const db = await getDb();
    await db.update(s.experienceOptions).set({ priceCents: target.priceCents + 5000 }).where(eq(s.experienceOptions.id, target.optionId));
    try {
      const res = await createRedemption({
        code: certificate.code,
        experienceId: target.experienceId,
        optionId: target.optionId,
        guest,
        preferredDate1: tomorrow(),
        preferredTime1: "19:30",
        acceptTerms: true,
      });
      expect(res.status).toBe("requested");
      const view = await getCertificate(certificate.code);
      expect(view!.redemptions[0].topUpCents).toBe(0);
      expect(view!.balanceCents).toBe(0);
    } finally {
      await db.update(s.experienceOptions).set({ priceCents: target.priceCents }).where(eq(s.experienceOptions.id, target.optionId));
    }
  });
});

describe("validation and safety", () => {
  it("rejects more than five experiences and duplicates", async () => {
    const all = await listExperiences();
    const six = all.slice(0, 6).map((e) => ({ experienceId: e.id, optionId: e.options[0].id }));
    await expect(
      createOrder({ mode: "gift", items: six, packaging: "ecert", deliveryMethod: "email", buyer, recipientName: "Y", sendTo: "me", fromName: "D", acceptTerms: true }),
    ).rejects.toThrow(/up to 5/);
    const dup = [six[0], { ...six[0], optionId: all[0].options.at(-1)!.id }];
    await expect(
      createOrder({ mode: "gift", items: dup, packaging: "ecert", deliveryMethod: "email", buyer, recipientName: "Y", sendTo: "me", fromName: "D", acceptTerms: true }),
    ).rejects.toThrow(/once/);
  });

  it("only sends same-day couriers inside Toronto", async () => {
    await expect(
      createOrder({
        mode: "gift",
        items: [{ experienceId: picks[0].experienceId, optionId: picks[0].optionId }],
        packaging: "box",
        boxColor: "sage",
        deliveryMethod: "courier",
        buyer,
        recipientName: "Yashar",
        fromName: "Dexter",
        shipping: { name: "Yashar", line1: "1 Main St", city: "Ottawa", province: "ON", postalCode: "K1A 0B1", phone: "613 555 0100" },
        acceptTerms: true,
      }),
    ).rejects.toThrow(/Toronto/);
  });

  it("blocks brute-force code guessing", async () => {
    const ip = "203.0.113.9";
    for (let i = 0; i < 10; i++) expect((await lookupCertificate("ZZZZZZZZZZZZZZ", ip)).ok).toBe(false);
    const blocked = await lookupCertificate("ZZZZZZZZZZZZZZ", ip);
    expect(blocked).toEqual({ ok: false, reason: "rate_limited" });
  });

  it("books straight away for 'Book for myself' orders", async () => {
    const created = await createOrder({
      mode: "self",
      item: { experienceId: picks[0].experienceId, optionId: picks[0].optionId },
      buyer,
      booking: { preferredDate1: tomorrow(), preferredTime1: "17:00" },
      acceptTerms: true,
    });
    const { certificate, redemption } = await markOrderPaid(created.orderId, { provider: "test" });
    expect(redemption?.status).toBe("requested");
    expect(certificate.balanceCents).toBe(0);
  });
});
