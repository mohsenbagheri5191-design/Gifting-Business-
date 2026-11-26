import { and, asc, desc, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { rules, site } from "./config";
import { generateBookingReference, isValidCode, normalizeCode } from "./codes";
import { getDb, type Tx } from "./db";
import * as s from "./db/schema";
import { adminNotifyAddress, dispatchDueEmails, queueEmail } from "./email";
import { adminNotice, bookingConfirmedEmail, bookingDeclinedEmail, bookingRequestedEmail } from "./email/templates";
import { formatMoney } from "./format";
import { createCheckout } from "./payments";
import { splitRedemption } from "./pricing";
import { LIMITS, isLimited, record } from "./rate-limit";
import { UserError, firstIssue, isFutureDate, zDate, zEmail, zId, zName, zPhone, zTime } from "./validation";

/* ------------------------------------------------------------ certificates */

export type CertificateStatus = "active" | "used" | "expired" | "cancelled";

export function certificateStatus(c: Pick<s.Certificate, "isCancelled" | "expiresAt" | "balanceCents">, now = new Date()): CertificateStatus {
  if (c.isCancelled) return "cancelled";
  if (c.expiresAt && c.expiresAt < now) return "expired";
  if (c.balanceCents <= 0) return "used";
  return "active";
}

export type CertificateView = s.Certificate & {
  items: s.CertificateItem[];
  redemptions: s.Redemption[];
  status: CertificateStatus;
};

export async function getCertificate(code: string): Promise<CertificateView | null> {
  const c = normalizeCode(code);
  if (!isValidCode(c)) return null;
  const db = await getDb();
  const row = await db.query.certificates.findFirst({
    where: eq(s.certificates.code, c),
    with: {
      items: { orderBy: [asc(s.certificateItems.sort)] },
      redemptions: { orderBy: [desc(s.redemptions.createdAt)] },
    },
  });
  if (!row) return null;
  return { ...row, status: certificateStatus(row) };
}

export type LookupResult =
  | { ok: true; certificate: CertificateView }
  | { ok: false; reason: "invalid" | "not_found" | "rate_limited" };

/**
 * Looks a code up for a visitor. Failed attempts are counted per IP and
 * blocked after a few tries, so codes can't be guessed by brute force.
 */
export async function lookupCertificate(raw: string, ip: string): Promise<LookupResult> {
  const key = `code-fail:${ip}`;
  if (isLimited(key, LIMITS.codeFailures.limit, LIMITS.codeFailures.windowMs)) return { ok: false, reason: "rate_limited" };
  const code = normalizeCode(raw);
  if (!isValidCode(code)) {
    record(key);
    return { ok: false, reason: "invalid" };
  }
  const certificate = await getCertificate(code);
  if (!certificate) {
    record(key);
    return { ok: false, reason: "not_found" };
  }
  if (!certificate.firstViewedAt) {
    const db = await getDb();
    await db.update(s.certificates).set({ firstViewedAt: new Date() }).where(eq(s.certificates.id, certificate.id));
  }
  return { ok: true, certificate };
}

/** What the recipient would pay for an experience option with this certificate. */
export function quoteFor(cert: Pick<s.Certificate, "balanceCents">, items: s.CertificateItem[], option: { id: number; priceCents: number }) {
  const inGift = items.find((i) => i.optionId === option.id);
  // Experiences the giver chose keep the price they were bought at (price protection).
  const priceCents = inGift ? Math.min(inGift.priceCents, option.priceCents) : option.priceCents;
  return { priceCents, wasInGift: !!inGift, ...splitRedemption(priceCents, cert.balanceCents) };
}

/* --------------------------------------------------------------- bookings */

const optionalDate = z.union([zDate, z.literal("")]).optional().nullable();
const optionalTime = z.union([zTime, z.literal("")]).optional().nullable();

export const redemptionSchema = z.object({
  code: z.string().min(1),
  experienceId: zId,
  optionId: zId,
  locationId: zId.optional().nullable(),
  guest: z.object({ firstName: zName, lastName: zName, email: zEmail, phone: zPhone }),
  preferredDate1: zDate,
  preferredTime1: zTime,
  preferredDate2: optionalDate,
  preferredTime2: optionalTime,
  notes: z.string().trim().max(500).optional().default(""),
  acceptTerms: z.literal(true),
});

export type RedemptionResult = { reference: string; redirectUrl: string; status: s.RedemptionStatus };

export async function createRedemption(raw: unknown): Promise<RedemptionResult> {
  const parsed = redemptionSchema.safeParse(raw);
  if (!parsed.success) throw new UserError(firstIssue(parsed.error));
  const input = parsed.data;
  const code = normalizeCode(input.code);
  if (!isValidCode(code)) throw new UserError("That gift code doesn't look right.");
  if (!isFutureDate(input.preferredDate1) || (input.preferredDate2 && !isFutureDate(input.preferredDate2))) {
    throw new UserError("Please choose dates from tomorrow onwards.");
  }

  const db = await getDb();
  const { redemption, certificate } = await db.transaction(async (tx) => {
    const [cert] = await tx.select().from(s.certificates).where(eq(s.certificates.code, code)).for("update");
    if (!cert) throw new UserError("We couldn't find that gift code.", 404);
    const status = certificateStatus(cert);
    if (status === "cancelled") throw new UserError("This gift has been cancelled. Please contact us if you think this is a mistake.", 409);
    if (status === "expired") throw new UserError("This gift has expired. Please contact us — we'll see what we can do.", 409);
    if (status === "used") throw new UserError("This gift has already been fully used.", 409);

    const [row] = await tx
      .select({ option: s.experienceOptions, experience: s.experiences })
      .from(s.experienceOptions)
      .innerJoin(s.experiences, eq(s.experienceOptions.experienceId, s.experiences.id))
      .where(
        and(
          eq(s.experienceOptions.id, input.optionId),
          eq(s.experienceOptions.experienceId, input.experienceId),
          eq(s.experienceOptions.isActive, true),
          eq(s.experiences.isActive, true),
        ),
      );
    if (!row) throw new UserError("That experience is no longer available. Please choose another.", 409);

    const locations = await tx.select().from(s.experienceLocations).where(eq(s.experienceLocations.experienceId, input.experienceId));
    let location = locations.find((l) => l.id === input.locationId) ?? null;
    if (!location && locations.length === 1) location = locations[0];
    if (!location && locations.length > 1) throw new UserError("Please choose a location.");

    const items = await tx.select().from(s.certificateItems).where(eq(s.certificateItems.certificateId, cert.id));
    const quote = quoteFor(cert, items, row.option);
    const status2: s.RedemptionStatus = quote.topUpCents > 0 ? "awaiting_payment" : "requested";

    const [updatedCert] = await tx
      .update(s.certificates)
      .set({ balanceCents: cert.balanceCents - quote.fromBalanceCents })
      .where(eq(s.certificates.id, cert.id))
      .returning();

    const [redemption] = await tx
      .insert(s.redemptions)
      .values({
        reference: generateBookingReference(),
        certificateId: cert.id,
        experienceId: row.experience.id,
        optionId: row.option.id,
        locationId: location?.id ?? null,
        title: row.experience.title,
        optionLabel: row.option.label,
        people: row.option.people,
        duration: row.option.duration,
        locationName: location?.name ?? null,
        locationAddress: location?.address ?? null,
        image: row.experience.images[0] ?? null,
        wasInGift: quote.wasInGift,
        priceCents: quote.priceCents,
        fromBalanceCents: quote.fromBalanceCents,
        topUpCents: quote.topUpCents,
        topUpStatus: quote.topUpCents > 0 ? "pending" : "none",
        guestFirstName: input.guest.firstName,
        guestLastName: input.guest.lastName,
        guestEmail: input.guest.email,
        guestPhone: input.guest.phone,
        preferredDate1: input.preferredDate1,
        preferredTime1: input.preferredTime1,
        preferredDate2: input.preferredDate2 || null,
        preferredTime2: input.preferredTime2 || null,
        notes: input.notes || null,
        status: status2,
      })
      .returning();
    return { redemption, certificate: updatedCert };
  });

  const bookingPath = `/redeem/${code}/booking/${redemption.reference}`;
  if (redemption.topUpCents > 0) {
    try {
      const session = await createCheckout({
        purpose: "topup",
        referenceId: String(redemption.id),
        lineItems: [{ name: `Top-up for ${redemption.title} (${redemption.optionLabel})`, amountCents: redemption.topUpCents }],
        customerEmail: redemption.guestEmail,
        successPath: bookingPath,
        cancelPath: `${bookingPath}?cancelled=1`,
      });
      await db
        .update(s.redemptions)
        .set({ topUpProvider: session.provider, topUpRef: session.ref })
        .where(eq(s.redemptions.id, redemption.id));
      return { reference: redemption.reference, redirectUrl: session.url, status: redemption.status };
    } catch (err) {
      await cancelRedemption(redemption.id, "cancelled", "Payment could not be started");
      throw err;
    }
  }

  await queueBookingRequested(redemption, certificate);
  return { reference: redemption.reference, redirectUrl: bookingPath, status: redemption.status };
}

/** "Book for myself" orders: the booking is created the moment payment succeeds. */
export async function insertSelfBookingTx(tx: Tx, certificate: s.Certificate, item: s.OrderItem, order: s.Order) {
  const b = order.bookingDetails!;
  const [location] = b.locationId
    ? await tx.select().from(s.experienceLocations).where(eq(s.experienceLocations.id, b.locationId))
    : [null];
  const [updatedCert] = await tx
    .update(s.certificates)
    .set({ balanceCents: 0 })
    .where(eq(s.certificates.id, certificate.id))
    .returning();
  const [redemption] = await tx
    .insert(s.redemptions)
    .values({
      reference: generateBookingReference(),
      certificateId: certificate.id,
      experienceId: item.experienceId,
      optionId: item.optionId,
      locationId: location?.id ?? null,
      title: item.title,
      optionLabel: item.optionLabel,
      people: item.people,
      duration: item.duration,
      locationName: location?.name ?? null,
      locationAddress: location?.address ?? null,
      image: item.image,
      wasInGift: true,
      priceCents: item.priceCents,
      fromBalanceCents: certificate.balanceCents,
      topUpCents: 0,
      guestFirstName: order.buyerFirstName,
      guestLastName: order.buyerLastName,
      guestEmail: order.buyerEmail,
      guestPhone: order.buyerPhone,
      preferredDate1: b.preferredDate1,
      preferredTime1: b.preferredTime1,
      preferredDate2: b.preferredDate2 ?? null,
      preferredTime2: b.preferredTime2 ?? null,
      notes: b.notes ?? null,
      status: "requested",
    })
    .returning();
  return { redemption, certificate: updatedCert };
}

async function queueBookingRequested(redemption: s.Redemption, certificate: s.Certificate) {
  const db = await getDb();
  await queueEmail(db, {
    ...bookingRequestedEmail(redemption, certificate.code, certificate.balanceCents),
    kind: "booking_requested",
    to: redemption.guestEmail,
    redemptionId: redemption.id,
    certificateId: certificate.id,
  });
  const admin = adminNotifyAddress();
  if (admin) {
    await queueEmail(db, {
      ...adminNotice(
        `Booking request ${redemption.reference}`,
        [
          `${redemption.guestFirstName} ${redemption.guestLastName} chose ${redemption.title} (${redemption.optionLabel}).`,
          `Preferred: ${redemption.preferredDate1} ${redemption.preferredTime1}${redemption.preferredDate2 ? ` or ${redemption.preferredDate2} ${redemption.preferredTime2 ?? ""}` : ""}`,
        ],
        `${site.url}/admin/bookings`,
      ),
      kind: "admin_new_booking",
      to: admin,
      redemptionId: redemption.id,
    });
  }
  void dispatchDueEmails().catch(() => {});
}

/** Called when a recipient's top-up payment succeeds. Idempotent. */
export async function markTopUpPaid(redemptionId: number, payment: { provider: string; ref?: string | null }) {
  const db = await getDb();
  const out = await db.transaction(async (tx) => {
    const [r] = await tx.select().from(s.redemptions).where(eq(s.redemptions.id, redemptionId)).for("update");
    if (!r) throw new UserError("Booking not found.", 404);
    if (r.topUpStatus === "paid") return { r, fresh: false };
    let status: s.RedemptionStatus = "requested";
    let adminNote = r.adminNote;
    if (r.status === "cancelled") {
      // The hold expired before payment arrived: try to take the balance again.
      const [cert] = await tx.select().from(s.certificates).where(eq(s.certificates.id, r.certificateId)).for("update");
      if (cert && cert.balanceCents >= r.fromBalanceCents && certificateStatus(cert) !== "cancelled") {
        await tx
          .update(s.certificates)
          .set({ balanceCents: cert.balanceCents - r.fromBalanceCents })
          .where(eq(s.certificates.id, cert.id));
      } else {
        status = "cancelled";
        adminNote = `${adminNote ?? ""} Top-up was paid after the hold expired and the balance had been used — refund the top-up.`.trim();
      }
    }
    const [updated] = await tx
      .update(s.redemptions)
      .set({ topUpStatus: "paid", topUpPaidAt: new Date(), topUpProvider: payment.provider, topUpRef: payment.ref ?? r.topUpRef, status, adminNote, updatedAt: new Date() })
      .where(eq(s.redemptions.id, r.id))
      .returning();
    return { r: updated, fresh: true };
  });
  if (out.fresh && out.r.status === "requested") {
    const [cert] = await db.select().from(s.certificates).where(eq(s.certificates.id, out.r.certificateId));
    await queueBookingRequested(out.r, cert);
  }
  return out.r;
}

/**
 * Cancels or declines a booking and puts the amount taken from the gift back on its balance.
 * (A paid top-up is refunded separately from your Stripe dashboard.)
 */
export async function cancelRedemption(id: number, as: "cancelled" | "declined", note?: string) {
  const db = await getDb();
  const out = await db.transaction(async (tx) => {
    const [r] = await tx.select().from(s.redemptions).where(eq(s.redemptions.id, id)).for("update");
    if (!r) throw new UserError("Booking not found.", 404);
    if (!["awaiting_payment", "requested", "confirmed"].includes(r.status)) return { r, cert: null, restored: 0 };
    const [cert] = await tx.select().from(s.certificates).where(eq(s.certificates.id, r.certificateId)).for("update");
    const [updatedCert] = await tx
      .update(s.certificates)
      .set({ balanceCents: cert.balanceCents + r.fromBalanceCents })
      .where(eq(s.certificates.id, cert.id))
      .returning();
    const [updated] = await tx
      .update(s.redemptions)
      .set({ status: as, adminNote: note ?? r.adminNote, updatedAt: new Date() })
      .where(eq(s.redemptions.id, r.id))
      .returning();
    return { r: updated, cert: updatedCert, restored: r.fromBalanceCents };
  });
  if (out.cert && as === "declined") {
    await queueEmail(db, {
      ...bookingDeclinedEmail(out.r, out.cert.code, out.restored),
      kind: "booking_declined",
      to: out.r.guestEmail,
      redemptionId: out.r.id,
      certificateId: out.cert.id,
    });
    void dispatchDueEmails().catch(() => {});
  }
  return out.r;
}

export async function confirmRedemption(id: number, scheduledFor: string, note?: string) {
  if (!scheduledFor.trim()) throw new UserError("Enter the confirmed date and time.");
  const db = await getDb();
  const [r] = await db.select().from(s.redemptions).where(eq(s.redemptions.id, id));
  if (!r) throw new UserError("Booking not found.", 404);
  if (r.status !== "requested" && r.status !== "confirmed") throw new UserError(`A ${r.status.replace("_", " ")} booking can't be confirmed.`);
  const [updated] = await db
    .update(s.redemptions)
    .set({ status: "confirmed", scheduledFor: scheduledFor.trim(), adminNote: note?.trim() || null, confirmedAt: new Date(), updatedAt: new Date() })
    .where(eq(s.redemptions.id, id))
    .returning();
  const [cert] = await db.select().from(s.certificates).where(eq(s.certificates.id, r.certificateId));
  await queueEmail(db, {
    ...bookingConfirmedEmail(updated, cert.code),
    kind: "booking_confirmed",
    to: updated.guestEmail,
    redemptionId: updated.id,
    certificateId: cert.id,
  });
  void dispatchDueEmails().catch(() => {});
  return updated;
}

export async function completeRedemption(id: number) {
  const db = await getDb();
  const [updated] = await db
    .update(s.redemptions)
    .set({ status: "completed", updatedAt: new Date() })
    .where(and(eq(s.redemptions.id, id), eq(s.redemptions.status, "confirmed")))
    .returning();
  if (!updated) throw new UserError("Only confirmed bookings can be marked as completed.");
  return updated;
}

/** Releases balances held for top-ups that were never paid. Runs every minute. */
export async function releaseExpiredHolds() {
  const db = await getDb();
  const cutoff = new Date(Date.now() - rules.topUpHoldMinutes * 60_000);
  const stale = await db
    .select({ id: s.redemptions.id })
    .from(s.redemptions)
    .where(and(eq(s.redemptions.status, "awaiting_payment"), lt(s.redemptions.createdAt, cutoff)));
  for (const r of stale) await cancelRedemption(r.id, "cancelled", "Top-up not completed in time — balance released.");
  return stale.length;
}

export async function getRedemptionByReference(code: string, reference: string) {
  const cert = await getCertificate(code);
  if (!cert) return null;
  const r = cert.redemptions.find((x) => x.reference === reference);
  return r ? { certificate: cert, redemption: r } : null;
}

export function describeBalance(cert: Pick<s.Certificate, "balanceCents" | "valueCents">) {
  return cert.balanceCents === cert.valueCents
    ? `${formatMoney(cert.valueCents)} gift`
    : `${formatMoney(cert.balanceCents)} of ${formatMoney(cert.valueCents)} remaining`;
}
