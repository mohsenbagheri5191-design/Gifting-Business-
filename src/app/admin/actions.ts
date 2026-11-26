"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { checkPassword, endAdminSession, requireAdmin, startAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { SAMPLE_REVIEW_EMAIL } from "@/lib/db/seed-data";
import { dispatchDueEmails, queueEmail } from "@/lib/email";
import { certificateEmail } from "@/lib/email/templates";
import { LIMITS, clientIp, take } from "@/lib/rate-limit";
import { cancelRedemption, completeRedemption, confirmRedemption } from "@/lib/redemptions";
import { UserError } from "@/lib/validation";

/* ------------------------------------------------------------------ auth */

export async function login(_: unknown, formData: FormData) {
  const ip = clientIp(await headers());
  if (!take(`admin-login:${ip}`, LIMITS.adminLogin.limit, LIMITS.adminLogin.windowMs)) return { error: "Too many attempts. Try again in 15 minutes." };
  if (!checkPassword(String(formData.get("password") ?? ""))) return { error: "That password isn't right." };
  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/login");
}

/* --------------------------------------------------------------- bookings */

export async function confirmBooking(formData: FormData) {
  await requireAdmin();
  await run(() => confirmRedemption(Number(formData.get("id")), String(formData.get("scheduledFor") ?? ""), String(formData.get("note") ?? "")));
  revalidatePath("/admin/bookings");
}

export async function declineBooking(formData: FormData) {
  await requireAdmin();
  await run(() => cancelRedemption(Number(formData.get("id")), "declined", String(formData.get("note") ?? "") || undefined));
  revalidatePath("/admin/bookings");
}

export async function completeBooking(formData: FormData) {
  await requireAdmin();
  await run(() => completeRedemption(Number(formData.get("id"))));
  revalidatePath("/admin/bookings");
}

/* ----------------------------------------------------------------- orders */

export async function updateFulfillment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("fulfillmentStatus")) as s.FulfillmentStatus;
  const db = await getDb();
  await db
    .update(s.orders)
    .set({
      fulfillmentStatus: status,
      trackingNumber: String(formData.get("trackingNumber") ?? "") || null,
      adminNote: String(formData.get("adminNote") ?? "") || null,
      updatedAt: new Date(),
    })
    .where(eq(s.orders.id, id));
  revalidatePath(`/admin/orders/${id}`);
}

/** Cancels a paid order whose gift hasn't been used, and voids its certificate (refund it in Stripe). */
export async function cancelOrder(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const db = await getDb();
  await run(() => db.transaction(async (tx) => {
    const certs = await tx.select().from(s.certificates).where(eq(s.certificates.orderId, id));
    for (const c of certs) {
      const used = await tx
        .select({ id: s.redemptions.id })
        .from(s.redemptions)
        .where(and(eq(s.redemptions.certificateId, c.id), inArray(s.redemptions.status, ["requested", "confirmed", "completed", "awaiting_payment"])));
      if (used.length) throw new UserError("This gift already has bookings — cancel those first.");
      await tx.update(s.certificates).set({ isCancelled: true }).where(eq(s.certificates.id, c.id));
    }
    await tx.update(s.orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(s.orders.id, id));
  }));
  revalidatePath(`/admin/orders/${id}`);
}

export async function resendCertificate(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const to = String(formData.get("to") ?? "").trim();
  const db = await getDb();
  const order = await db.query.orders.findFirst({ where: eq(s.orders.id, id), with: { items: { orderBy: [asc(s.orderItems.sort)] }, certificates: true } });
  const cert = order?.certificates[0];
  if (!order || !cert || !to) return;
  await queueEmail(db, {
    ...certificateEmail({
      code: cert.code,
      recipientName: order.recipientName ?? "",
      fromName: order.fromName ?? order.buyerFirstName,
      message: order.message,
      items: order.items,
      expiresAt: cert.expiresAt,
      toBuyer: to === order.buyerEmail,
    }),
    kind: "certificate_resend",
    to,
    orderId: order.id,
    certificateId: cert.id,
  });
  await dispatchDueEmails();
  revalidatePath(`/admin/orders/${id}`);
}

/* ------------------------------------------------------------ certificates */

export async function setCertificateCancelled(formData: FormData) {
  await requireAdmin();
  const db = await getDb();
  const code = String(formData.get("code"));
  await db.update(s.certificates).set({ isCancelled: formData.get("cancelled") === "true" }).where(eq(s.certificates.code, code));
  revalidatePath(`/admin/certificates/${code}`);
}

/* ---------------------------------------------------------------- reviews */

export async function setReviewPublished(formData: FormData) {
  await requireAdmin();
  const db = await getDb();
  const id = Number(formData.get("id"));
  const publish = formData.get("publish") === "true";
  const [r] = await db.update(s.reviews).set({ isPublished: publish }).where(eq(s.reviews.id, id)).returning();
  if (r) await refreshRating(r.experienceId);
  revalidatePath("/admin/reviews");
}

export async function deleteReview(formData: FormData) {
  await requireAdmin();
  const db = await getDb();
  const [r] = await db.delete(s.reviews).where(eq(s.reviews.id, Number(formData.get("id")))).returning();
  if (r) await refreshRating(r.experienceId);
  revalidatePath("/admin/reviews");
}

export async function deleteSampleReviews() {
  await requireAdmin();
  const db = await getDb();
  const removed = await db.delete(s.reviews).where(eq(s.reviews.authorEmail, SAMPLE_REVIEW_EMAIL)).returning();
  for (const id of new Set(removed.map((r) => r.experienceId))) await refreshRating(id);
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
}

async function refreshRating(experienceId: number) {
  const db = await getDb();
  const rows = await db.select({ rating: s.reviews.rating }).from(s.reviews).where(and(eq(s.reviews.experienceId, experienceId), eq(s.reviews.isPublished, true)));
  const avg = rows.length ? rows.reduce((a, r) => a + r.rating, 0) / rows.length : 5;
  await db.update(s.experiences).set({ rating: Math.round(avg * 10) / 10, reviewCount: rows.length }).where(eq(s.experiences.id, experienceId));
}

/* ------------------------------------------------------------------ leads */

export async function setLeadStatus(formData: FormData) {
  await requireAdmin();
  const db = await getDb();
  await db
    .update(s.leads)
    .set({ status: String(formData.get("status")) as s.Lead["status"] })
    .where(eq(s.leads.id, Number(formData.get("id"))));
  revalidatePath("/admin/leads");
}

/* ------------------------------------------------------------ experiences */

const lines = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export async function saveExperience(_: unknown, formData: FormData) {
  await requireAdmin();
  const db = await getDb();
  const idRaw = formData.get("id");
  const id = idRaw ? Number(idRaw) : null;
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!title || !slug) return { error: "Title and URL slug are required." };

  const options = lines(formData.get("options")).map((l) => {
    const [label, people, duration, price] = l.split("|").map((x) => x.trim());
    return { label, people: Math.max(1, Number(people) || 1), duration: duration || "", priceCents: Math.round(Number(String(price).replace(/[^\d.]/g, "")) * 100) };
  });
  if (!options.length || options.some((o) => !o.label || !o.duration || !(o.priceCents > 0))) {
    return { error: "Each option needs: Label | people | duration | price — e.g. “For two | 2 | 2 hours | 180”." };
  }
  const locations = lines(formData.get("locations")).map((l) => {
    const [name, address, schedule] = l.split("|").map((x) => x.trim());
    return { name, address: address || name, schedule: schedule || null };
  });

  const values = {
    title,
    slug,
    summary: String(formData.get("summary") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    whyWeLoveIt: String(formData.get("whyWeLoveIt") ?? "").trim() || null,
    included: lines(formData.get("included")),
    goodToKnow: lines(formData.get("goodToKnow")),
    citySlug: String(formData.get("citySlug") ?? "toronto"),
    categorySlugs: formData.getAll("categories").map(String),
    recipientTags: formData.getAll("recipients").map(String),
    occasionTags: formData.getAll("occasions").map(String),
    images: lines(formData.get("images")),
    isBestseller: formData.get("isBestseller") === "on",
    isNew: formData.get("isNew") === "on",
    isActive: formData.get("isActive") === "on",
    seasonNote: String(formData.get("seasonNote") ?? "").trim() || null,
    minAge: Number(formData.get("minAge")) || null,
  };
  if (!values.summary || !values.description) return { error: "Summary and description are required." };

  let savedId = id;
  try {
    await db.transaction(async (tx) => {
      if (id) await tx.update(s.experiences).set(values).where(eq(s.experiences.id, id));
      else savedId = (await tx.insert(s.experiences).values({ ...values, sort: 999 }).returning({ id: s.experiences.id }))[0].id;

      // Update options in place (keeps their ids, so gifts already sold stay linked and price-protected).
      const existing = await tx.select().from(s.experienceOptions).where(eq(s.experienceOptions.experienceId, savedId!)).orderBy(asc(s.experienceOptions.sort));
      for (let i = 0; i < Math.max(existing.length, options.length); i++) {
        const o = options[i];
        const ex = existing[i];
        if (o && ex) await tx.update(s.experienceOptions).set({ ...o, sort: i, isActive: true, isDefault: i === 0 }).where(eq(s.experienceOptions.id, ex.id));
        else if (o) await tx.insert(s.experienceOptions).values({ ...o, experienceId: savedId!, sort: i, isDefault: i === 0 });
        else if (ex) await tx.update(s.experienceOptions).set({ isActive: false }).where(eq(s.experienceOptions.id, ex.id));
      }
      const oldLocations = await tx.select().from(s.experienceLocations).where(eq(s.experienceLocations.experienceId, savedId!)).orderBy(asc(s.experienceLocations.sort));
      for (let i = 0; i < Math.max(oldLocations.length, locations.length); i++) {
        const l = locations[i];
        const ex = oldLocations[i];
        if (l && ex) await tx.update(s.experienceLocations).set({ ...l, sort: i }).where(eq(s.experienceLocations.id, ex.id));
        else if (l) await tx.insert(s.experienceLocations).values({ ...l, experienceId: savedId!, sort: i });
        else if (ex) await tx.delete(s.experienceLocations).where(eq(s.experienceLocations.id, ex.id));
      }
    });
  } catch (err) {
    if (/experiences_slug_unique/.test(String(err))) return { error: "That URL slug is already used by another experience." };
    throw err;
  }
  revalidatePath("/admin/experiences");
  redirect(`/admin/experiences/${savedId}?saved=1`);
}

export async function toggleExperience(formData: FormData) {
  await requireAdmin();
  const db = await getDb();
  await db
    .update(s.experiences)
    .set({ isActive: formData.get("active") === "true" })
    .where(eq(s.experiences.id, Number(formData.get("id"))));
  revalidatePath("/admin/experiences");
}

async function run(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    if (err instanceof UserError) redirect(`?error=${encodeURIComponent(err.message)}`);
    throw err;
  }
}
