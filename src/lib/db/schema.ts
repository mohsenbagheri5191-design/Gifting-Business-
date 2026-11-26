import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
const textArray = (name: string) => text(name).array().notNull().default(sql`'{}'::text[]`);

/* ------------------------------------------------------------------ catalog */

export const cities = pgTable("cities", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  region: text("region"),
  sort: integer("sort").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  description: text("description"),
  image: text("image"),
  sort: integer("sort").notNull().default(0),
});

export const experiences = pgTable(
  "experiences",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    whyWeLoveIt: text("why_we_love_it"),
    included: textArray("included"),
    goodToKnow: textArray("good_to_know"),
    citySlug: text("city_slug")
      .notNull()
      .references(() => cities.slug),
    categorySlugs: textArray("category_slugs"),
    recipientTags: textArray("recipient_tags"),
    occasionTags: textArray("occasion_tags"),
    images: textArray("images"),
    rating: real("rating").notNull().default(5),
    reviewCount: integer("review_count").notNull().default(0),
    giftedCount: integer("gifted_count").notNull().default(0),
    isBestseller: boolean("is_bestseller").notNull().default(false),
    isNew: boolean("is_new").notNull().default(false),
    seasonNote: text("season_note"),
    minAge: integer("min_age"),
    isActive: boolean("is_active").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("experiences_city_idx").on(t.citySlug)],
);

export const experienceOptions = pgTable("experience_options", {
  id: serial("id").primaryKey(),
  experienceId: integer("experience_id")
    .notNull()
    .references(() => experiences.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  people: integer("people").notNull().default(1),
  duration: text("duration").notNull(),
  priceCents: integer("price_cents").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const experienceLocations = pgTable("experience_locations", {
  id: serial("id").primaryKey(),
  experienceId: integer("experience_id")
    .notNull()
    .references(() => experiences.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  schedule: text("schedule"),
  sort: integer("sort").notNull().default(0),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  experienceId: integer("experience_id")
    .notNull()
    .references(() => experiences.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email"),
  rating: integer("rating").notNull(),
  body: text("body").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: createdAt(),
});

/* ------------------------------------------------------------------ orders */

export type OrderMode = "gift" | "self";
export type OrderStatus = "pending_payment" | "paid" | "cancelled" | "refunded";
export type FulfillmentStatus = "none" | "to_pack" | "packed" | "shipped" | "delivered" | "picked_up";

export type SelfBookingDetails = {
  locationId: number | null;
  preferredDate1: string;
  preferredTime1: string;
  preferredDate2?: string | null;
  preferredTime2?: string | null;
  notes?: string | null;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").notNull().unique(),
    mode: text("mode").$type<OrderMode>().notNull(),
    status: text("status").$type<OrderStatus>().notNull().default("pending_payment"),

    buyerFirstName: text("buyer_first_name").notNull(),
    buyerLastName: text("buyer_last_name").notNull(),
    buyerEmail: text("buyer_email").notNull(),
    buyerPhone: text("buyer_phone").notNull(),

    packaging: text("packaging").$type<"ecert" | "box" | "none">().notNull(),
    boxColor: text("box_color"),
    deliveryMethod: text("delivery_method").$type<"email" | "courier" | "post" | "pickup" | "none">().notNull(),

    shipName: text("ship_name"),
    shipLine1: text("ship_line1"),
    shipLine2: text("ship_line2"),
    shipCity: text("ship_city"),
    shipProvince: text("ship_province"),
    shipPostalCode: text("ship_postal_code"),
    shipPhone: text("ship_phone"),
    shipNotes: text("ship_notes"),

    recipientName: text("recipient_name"),
    recipientEmail: text("recipient_email"),
    sendTo: text("send_to").$type<"recipient" | "me">(),
    sendAt: timestamp("send_at", { withTimezone: true }),
    fromName: text("from_name"),
    message: text("message"),
    bookingDetails: jsonb("booking_details").$type<SelfBookingDetails>(),

    certificateValueCents: integer("certificate_value_cents").notNull(),
    packagingFeeCents: integer("packaging_fee_cents").notNull().default(0),
    deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull().default("CAD"),

    paymentProvider: text("payment_provider").notNull(),
    paymentRef: text("payment_ref"),
    paidAt: timestamp("paid_at", { withTimezone: true }),

    fulfillmentStatus: text("fulfillment_status").$type<FulfillmentStatus>().notNull().default("none"),
    trackingNumber: text("tracking_number"),
    adminNote: text("admin_note"),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("orders_created_idx").on(t.createdAt), index("orders_email_idx").on(t.buyerEmail)],
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  experienceId: integer("experience_id").references(() => experiences.id, { onDelete: "set null" }),
  optionId: integer("option_id").references(() => experienceOptions.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  optionLabel: text("option_label").notNull(),
  people: integer("people").notNull(),
  duration: text("duration").notNull(),
  priceCents: integer("price_cents").notNull(),
  image: text("image"),
  sort: integer("sort").notNull().default(0),
});

/* ------------------------------------------------------------ certificates */

export type CertificateKind = "gift" | "self";

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  /** The random 14-character code the recipient enters on the website. */
  code: varchar("code", { length: 14 }).notNull().unique(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  kind: text("kind").$type<CertificateKind>().notNull(),
  valueCents: integer("value_cents").notNull(),
  balanceCents: integer("balance_cents").notNull(),
  currency: text("currency").notNull().default("CAD"),
  recipientName: text("recipient_name"),
  fromName: text("from_name"),
  message: text("message"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isCancelled: boolean("is_cancelled").notNull().default(false),
  firstViewedAt: timestamp("first_viewed_at", { withTimezone: true }),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
});

/** The experiences the giver put into the gift — "linked to the items that they purchased". */
export const certificateItems = pgTable("certificate_items", {
  id: serial("id").primaryKey(),
  certificateId: integer("certificate_id")
    .notNull()
    .references(() => certificates.id, { onDelete: "cascade" }),
  experienceId: integer("experience_id").references(() => experiences.id, { onDelete: "set null" }),
  optionId: integer("option_id").references(() => experienceOptions.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  optionLabel: text("option_label").notNull(),
  people: integer("people").notNull(),
  duration: text("duration").notNull(),
  /** Price locked at purchase: later price rises never cost the recipient extra. */
  priceCents: integer("price_cents").notNull(),
  image: text("image"),
  sort: integer("sort").notNull().default(0),
});

export type RedemptionStatus = "awaiting_payment" | "requested" | "confirmed" | "declined" | "cancelled" | "completed";

/** A recipient's booking: one experience chosen with the certificate. */
export const redemptions = pgTable(
  "redemptions",
  {
    id: serial("id").primaryKey(),
    reference: text("reference").notNull().unique(),
    certificateId: integer("certificate_id")
      .notNull()
      .references(() => certificates.id, { onDelete: "cascade" }),
    experienceId: integer("experience_id").references(() => experiences.id, { onDelete: "set null" }),
    optionId: integer("option_id").references(() => experienceOptions.id, { onDelete: "set null" }),
    locationId: integer("location_id").references(() => experienceLocations.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    optionLabel: text("option_label").notNull(),
    people: integer("people").notNull(),
    duration: text("duration").notNull(),
    locationName: text("location_name"),
    locationAddress: text("location_address"),
    image: text("image"),
    wasInGift: boolean("was_in_gift").notNull().default(false),

    priceCents: integer("price_cents").notNull(),
    fromBalanceCents: integer("from_balance_cents").notNull(),
    topUpCents: integer("top_up_cents").notNull().default(0),
    topUpStatus: text("top_up_status").$type<"none" | "pending" | "paid" | "refunded">().notNull().default("none"),
    topUpProvider: text("top_up_provider"),
    topUpRef: text("top_up_ref"),
    topUpPaidAt: timestamp("top_up_paid_at", { withTimezone: true }),

    guestFirstName: text("guest_first_name").notNull(),
    guestLastName: text("guest_last_name").notNull(),
    guestEmail: text("guest_email").notNull(),
    guestPhone: text("guest_phone").notNull(),
    preferredDate1: text("preferred_date_1").notNull(),
    preferredTime1: text("preferred_time_1").notNull(),
    preferredDate2: text("preferred_date_2"),
    preferredTime2: text("preferred_time_2"),
    notes: text("notes"),

    status: text("status").$type<RedemptionStatus>().notNull(),
    scheduledFor: text("scheduled_for"),
    adminNote: text("admin_note"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("redemptions_certificate_idx").on(t.certificateId), index("redemptions_status_idx").on(t.status)],
);

/* ----------------------------------------------------------- leads, email */

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  type: text("type").$type<"corporate" | "contact" | "partner">().notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  message: text("message"),
  status: text("status").$type<"new" | "in_progress" | "closed">().notNull().default("new"),
  createdAt: createdAt(),
});

export type EmailStatus = "scheduled" | "sent" | "logged" | "failed";

/** Every email the system sends (or would send). Doubles as the dev "outbox". */
export const emails = pgTable(
  "emails",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").notNull(),
    toAddress: text("to_address").notNull(),
    subject: text("subject").notNull(),
    html: text("html").notNull(),
    text: text("text").notNull(),
    status: text("status").$type<EmailStatus>().notNull().default("scheduled"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    error: text("error"),
    orderId: uuid("order_id"),
    certificateId: integer("certificate_id"),
    redemptionId: integer("redemption_id"),
    createdAt: createdAt(),
  },
  (t) => [index("emails_due_idx").on(t.status, t.scheduledFor)],
);

/* ---------------------------------------------------------------- relations */

export const experiencesRelations = relations(experiences, ({ many, one }) => ({
  options: many(experienceOptions),
  locations: many(experienceLocations),
  reviews: many(reviews),
  city: one(cities, { fields: [experiences.citySlug], references: [cities.slug] }),
}));
export const experienceOptionsRelations = relations(experienceOptions, ({ one }) => ({
  experience: one(experiences, { fields: [experienceOptions.experienceId], references: [experiences.id] }),
}));
export const experienceLocationsRelations = relations(experienceLocations, ({ one }) => ({
  experience: one(experiences, { fields: [experienceLocations.experienceId], references: [experiences.id] }),
}));
export const reviewsRelations = relations(reviews, ({ one }) => ({
  experience: one(experiences, { fields: [reviews.experienceId], references: [experiences.id] }),
}));
export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  certificates: many(certificates),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));
export const certificatesRelations = relations(certificates, ({ many, one }) => ({
  items: many(certificateItems),
  redemptions: many(redemptions),
  order: one(orders, { fields: [certificates.orderId], references: [orders.id] }),
}));
export const certificateItemsRelations = relations(certificateItems, ({ one }) => ({
  certificate: one(certificates, { fields: [certificateItems.certificateId], references: [certificates.id] }),
}));
export const redemptionsRelations = relations(redemptions, ({ one }) => ({
  certificate: one(certificates, { fields: [redemptions.certificateId], references: [certificates.id] }),
}));

export type Experience = typeof experiences.$inferSelect;
export type ExperienceOption = typeof experienceOptions.$inferSelect;
export type ExperienceLocation = typeof experienceLocations.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type City = typeof cities.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type CertificateItem = typeof certificateItems.$inferSelect;
export type Redemption = typeof redemptions.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type EmailRow = typeof emails.$inferSelect;
