-- Generated from drizzle/0000_init.sql by scripts/sync-netlify-migrations.mjs. Never edit once deployed.
CREATE TABLE "categories" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"description" text,
	"image" text,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificate_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"certificate_id" integer NOT NULL,
	"experience_id" integer,
	"option_id" integer,
	"title" text NOT NULL,
	"option_label" text NOT NULL,
	"people" integer NOT NULL,
	"duration" text NOT NULL,
	"price_cents" integer NOT NULL,
	"image" text,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(14) NOT NULL,
	"order_id" uuid,
	"kind" text NOT NULL,
	"value_cents" integer NOT NULL,
	"balance_cents" integer NOT NULL,
	"currency" text DEFAULT 'CAD' NOT NULL,
	"recipient_name" text,
	"from_name" text,
	"message" text,
	"expires_at" timestamp with time zone,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"first_viewed_at" timestamp with time zone,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"to_address" text NOT NULL,
	"subject" text NOT NULL,
	"html" text NOT NULL,
	"text" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"scheduled_for" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"error" text,
	"order_id" uuid,
	"certificate_id" integer,
	"redemption_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"experience_id" integer NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"schedule" text,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"experience_id" integer NOT NULL,
	"label" text NOT NULL,
	"people" integer DEFAULT 1 NOT NULL,
	"duration" text NOT NULL,
	"price_cents" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"why_we_love_it" text,
	"included" text[] DEFAULT '{}'::text[] NOT NULL,
	"good_to_know" text[] DEFAULT '{}'::text[] NOT NULL,
	"city_slug" text NOT NULL,
	"category_slugs" text[] DEFAULT '{}'::text[] NOT NULL,
	"recipient_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"occasion_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"images" text[] DEFAULT '{}'::text[] NOT NULL,
	"rating" real DEFAULT 5 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"gifted_count" integer DEFAULT 0 NOT NULL,
	"is_bestseller" boolean DEFAULT false NOT NULL,
	"is_new" boolean DEFAULT false NOT NULL,
	"season_note" text,
	"min_age" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "experiences_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"message" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"experience_id" integer,
	"option_id" integer,
	"title" text NOT NULL,
	"option_label" text NOT NULL,
	"people" integer NOT NULL,
	"duration" text NOT NULL,
	"price_cents" integer NOT NULL,
	"image" text,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"mode" text NOT NULL,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"buyer_first_name" text NOT NULL,
	"buyer_last_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_phone" text NOT NULL,
	"packaging" text NOT NULL,
	"box_color" text,
	"delivery_method" text NOT NULL,
	"ship_name" text,
	"ship_line1" text,
	"ship_line2" text,
	"ship_city" text,
	"ship_province" text,
	"ship_postal_code" text,
	"ship_phone" text,
	"ship_notes" text,
	"recipient_name" text,
	"recipient_email" text,
	"send_to" text,
	"send_at" timestamp with time zone,
	"from_name" text,
	"message" text,
	"booking_details" jsonb,
	"certificate_value_cents" integer NOT NULL,
	"packaging_fee_cents" integer DEFAULT 0 NOT NULL,
	"delivery_fee_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"currency" text DEFAULT 'CAD' NOT NULL,
	"payment_provider" text NOT NULL,
	"payment_ref" text,
	"paid_at" timestamp with time zone,
	"fulfillment_status" text DEFAULT 'none' NOT NULL,
	"tracking_number" text,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"certificate_id" integer NOT NULL,
	"experience_id" integer,
	"option_id" integer,
	"location_id" integer,
	"title" text NOT NULL,
	"option_label" text NOT NULL,
	"people" integer NOT NULL,
	"duration" text NOT NULL,
	"location_name" text,
	"location_address" text,
	"image" text,
	"was_in_gift" boolean DEFAULT false NOT NULL,
	"price_cents" integer NOT NULL,
	"from_balance_cents" integer NOT NULL,
	"top_up_cents" integer DEFAULT 0 NOT NULL,
	"top_up_status" text DEFAULT 'none' NOT NULL,
	"top_up_provider" text,
	"top_up_ref" text,
	"top_up_paid_at" timestamp with time zone,
	"guest_first_name" text NOT NULL,
	"guest_last_name" text NOT NULL,
	"guest_email" text NOT NULL,
	"guest_phone" text NOT NULL,
	"preferred_date_1" text NOT NULL,
	"preferred_time_1" text NOT NULL,
	"preferred_date_2" text,
	"preferred_time_2" text,
	"notes" text,
	"status" text NOT NULL,
	"scheduled_for" text,
	"admin_note" text,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redemptions_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"experience_id" integer NOT NULL,
	"author_name" text NOT NULL,
	"author_email" text,
	"rating" integer NOT NULL,
	"body" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certificate_items" ADD CONSTRAINT "certificate_items_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_items" ADD CONSTRAINT "certificate_items_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_items" ADD CONSTRAINT "certificate_items_option_id_experience_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."experience_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_locations" ADD CONSTRAINT "experience_locations_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_options" ADD CONSTRAINT "experience_options_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_city_slug_cities_slug_fk" FOREIGN KEY ("city_slug") REFERENCES "public"."cities"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_option_id_experience_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."experience_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_option_id_experience_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."experience_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_location_id_experience_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."experience_locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "emails_due_idx" ON "emails" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "experiences_city_idx" ON "experiences" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_email_idx" ON "orders" USING btree ("buyer_email");--> statement-breakpoint
CREATE INDEX "redemptions_certificate_idx" ON "redemptions" USING btree ("certificate_id");--> statement-breakpoint
CREATE INDEX "redemptions_status_idx" ON "redemptions" USING btree ("status");