import { and, arrayContains, arrayOverlaps, asc, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "./db";
import * as s from "./db/schema";
import { occasions, recipients } from "./taxonomy";

export type CatalogSort = "popular" | "new" | "price-asc" | "price-desc" | "rating";

export type CatalogFilters = {
  q?: string;
  city?: string;
  category?: string;
  recipient?: string; // a recipient slug from taxonomy (e.g. "for-her", "for-brother")
  occasion?: string;
  minPrice?: number; // dollars
  maxPrice?: number; // dollars
  people?: number; // minimum group size
  sort?: CatalogSort;
  ids?: number[];
};

export type CatalogItem = s.Experience & {
  options: s.ExperienceOption[];
  fromPriceCents: number;
  cityName: string;
};

/** Experiences with their options, filtered and sorted for catalog pages. */
export async function listExperiences(filters: CatalogFilters = {}): Promise<CatalogItem[]> {
  const db = await getDb();
  const where: SQL[] = [eq(s.experiences.isActive, true)];

  if (filters.ids?.length) where.push(inArray(s.experiences.id, filters.ids));
  if (filters.city) where.push(eq(s.experiences.citySlug, filters.city));
  if (filters.category) where.push(arrayContains(s.experiences.categorySlugs, [filters.category]));
  if (filters.recipient) {
    const r = recipients.find((x) => x.slug === filters.recipient);
    if (r) where.push(arrayOverlaps(s.experiences.recipientTags, r.tags));
  }
  if (filters.occasion) {
    const o = occasions.find((x) => x.slug === filters.occasion);
    if (o?.tag) where.push(arrayContains(s.experiences.occasionTags, [o.tag]));
  }
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim().replace(/[%_]/g, "")}%`;
    where.push(or(ilike(s.experiences.title, term), ilike(s.experiences.summary, term), ilike(s.experiences.description, term))!);
  }

  // Price / group-size filters apply to the experience's active options.
  const optionConds: SQL[] = [eq(s.experienceOptions.isActive, true)];
  if (filters.minPrice) optionConds.push(gte(s.experienceOptions.priceCents, filters.minPrice * 100));
  if (filters.maxPrice) optionConds.push(lte(s.experienceOptions.priceCents, filters.maxPrice * 100));
  if (filters.people) optionConds.push(gte(s.experienceOptions.people, filters.people));
  if (optionConds.length > 1) {
    const matching = await db
      .selectDistinct({ id: s.experienceOptions.experienceId })
      .from(s.experienceOptions)
      .where(and(...optionConds));
    if (!matching.length) return [];
    where.push(inArray(s.experiences.id, matching.map((m) => m.id)));
  }

  const rows = await db.query.experiences.findMany({
    where: and(...where),
    with: {
      options: { where: eq(s.experienceOptions.isActive, true), orderBy: [asc(s.experienceOptions.sort)] },
      city: true,
    },
    orderBy: [asc(s.experiences.sort)],
  });

  const items: CatalogItem[] = rows
    .filter((r) => r.options.length > 0)
    .map(({ city, ...r }) => ({
      ...r,
      cityName: city?.name ?? "",
      fromPriceCents: Math.min(...r.options.map((o) => o.priceCents)),
    }));

  const sort = filters.sort ?? "popular";
  const score = (e: CatalogItem) => (e.isBestseller ? 1000 : 0) + e.reviewCount * 10 + e.rating;
  items.sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.fromPriceCents - b.fromPriceCents;
      case "price-desc":
        return b.fromPriceCents - a.fromPriceCents;
      case "new":
        return +b.createdAt - +a.createdAt;
      case "rating":
        return b.rating - a.rating || b.reviewCount - a.reviewCount;
      default:
        return score(b) - score(a) || a.sort - b.sort;
    }
  });
  return items;
}

export type ExperienceDetail = s.Experience & {
  options: s.ExperienceOption[];
  locations: s.ExperienceLocation[];
  reviews: s.Review[];
  city: s.City | null;
};

export async function getExperienceBySlug(slug: string): Promise<ExperienceDetail | null> {
  const db = await getDb();
  const row = await db.query.experiences.findFirst({
    where: and(eq(s.experiences.slug, slug), eq(s.experiences.isActive, true)),
    with: {
      options: { where: eq(s.experienceOptions.isActive, true), orderBy: [asc(s.experienceOptions.sort)] },
      locations: { orderBy: [asc(s.experienceLocations.sort)] },
      reviews: { where: eq(s.reviews.isPublished, true), orderBy: [desc(s.reviews.createdAt)], limit: 20 },
      city: true,
    },
  });
  if (!row || row.options.length === 0) return null;
  return row as ExperienceDetail;
}

export async function getCategories() {
  const db = await getDb();
  return db.select().from(s.categories).orderBy(asc(s.categories.sort));
}

export async function getCategory(slug: string) {
  const db = await getDb();
  const [row] = await db.select().from(s.categories).where(eq(s.categories.slug, slug));
  return row ?? null;
}

export async function getCities() {
  const db = await getDb();
  return db.select().from(s.cities).where(eq(s.cities.isActive, true)).orderBy(asc(s.cities.sort));
}

export async function getRecentReviews(limit = 9) {
  const db = await getDb();
  return db
    .select({
      id: s.reviews.id,
      authorName: s.reviews.authorName,
      rating: s.reviews.rating,
      body: s.reviews.body,
      createdAt: s.reviews.createdAt,
      experienceTitle: s.experiences.title,
      experienceSlug: s.experiences.slug,
    })
    .from(s.reviews)
    .innerJoin(s.experiences, eq(s.reviews.experienceId, s.experiences.id))
    .where(and(eq(s.reviews.isPublished, true), eq(s.experiences.isActive, true)))
    .orderBy(desc(s.reviews.createdAt))
    .limit(limit);
}

export async function getReviewStats() {
  const db = await getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int`, avg: sql<number>`coalesce(avg(${s.reviews.rating}), 0)::float` })
    .from(s.reviews)
    .where(eq(s.reviews.isPublished, true));
  return { count: row?.n ?? 0, average: Math.round((row?.avg ?? 0) * 10) / 10 };
}

/** Minimal data for the client-side gift box (validated again at checkout). */
export async function getCartLines(lines: { experienceId: number; optionId: number }[]) {
  if (!lines.length) return [];
  const db = await getDb();
  const optionIds = lines.map((l) => l.optionId);
  const rows = await db
    .select({
      experienceId: s.experiences.id,
      slug: s.experiences.slug,
      title: s.experiences.title,
      image: sql<string | null>`${s.experiences.images}[1]`,
      optionId: s.experienceOptions.id,
      optionLabel: s.experienceOptions.label,
      people: s.experienceOptions.people,
      duration: s.experienceOptions.duration,
      priceCents: s.experienceOptions.priceCents,
    })
    .from(s.experienceOptions)
    .innerJoin(s.experiences, eq(s.experienceOptions.experienceId, s.experiences.id))
    .where(
      and(
        inArray(s.experienceOptions.id, optionIds),
        eq(s.experienceOptions.isActive, true),
        eq(s.experiences.isActive, true),
      ),
    );
  // keep the caller's order, drop anything inconsistent
  return lines
    .map((l) => rows.find((r) => r.optionId === l.optionId && r.experienceId === l.experienceId))
    .filter((r): r is NonNullable<typeof r> => !!r);
}
