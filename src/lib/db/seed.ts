import { count } from "drizzle-orm";
import type { DB, Tx } from "./index";
import * as s from "./schema";
import { SAMPLE_REVIEW_EMAIL, seedCategories, seedCities, seedExperiences } from "./seed-data";

/**
 * Fills an empty catalog with the sample Toronto experiences.
 * Must run inside the caller's transaction (see runSetup in ./index.ts).
 */
export async function seedIfEmpty(exec: DB | Tx) {
  const [{ n }] = await exec.select({ n: count() }).from(s.experiences);
  if (n > 0) return false;
  await seedCatalog(exec);
  return true;
}

/** A handful of multi-row inserts, so the first start stays quick against a remote database. */
async function seedCatalog(exec: DB | Tx) {
  await exec.insert(s.cities).values(seedCities).onConflictDoNothing();
  await exec.insert(s.categories).values(seedCategories).onConflictDoNothing();

  const now = Date.now();
  const rows = await exec
    .insert(s.experiences)
    .values(
      seedExperiences.map((e, i) => {
        const sort = i + 1;
        const ratings = e.reviews.map((r) => r[1]);
        const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 5;
        return {
          slug: e.slug,
          title: e.title,
          summary: e.summary,
          description: e.description,
          whyWeLoveIt: e.whyWeLoveIt,
          included: e.included,
          goodToKnow: e.goodToKnow,
          citySlug: e.city,
          categorySlugs: e.categories,
          recipientTags: e.recipients,
          occasionTags: e.occasions,
          images: e.images,
          rating: Math.round(avg * 10) / 10,
          reviewCount: ratings.length,
          isBestseller: !!e.bestseller,
          isNew: !!e.isNew,
          seasonNote: e.seasonNote ?? null,
          minAge: e.minAge ?? null,
          sort,
          createdAt: new Date(now - (e.isNew ? 5 : 60 + sort) * 86400_000),
        };
      }),
    )
    .returning({ id: s.experiences.id, slug: s.experiences.slug });
  const idOf = new Map(rows.map((r) => [r.slug, r.id]));

  await exec.insert(s.experienceOptions).values(
    seedExperiences.flatMap((e) =>
      e.options.map(([label, people, duration, price], i) => ({
        experienceId: idOf.get(e.slug)!,
        label,
        people,
        duration,
        priceCents: price * 100,
        isDefault: i === 0,
        sort: i,
      })),
    ),
  );
  await exec.insert(s.experienceLocations).values(
    seedExperiences.flatMap((e) =>
      e.locations.map(([name, address, schedule], i) => ({ experienceId: idOf.get(e.slug)!, name, address, schedule, sort: i })),
    ),
  );
  const reviews = seedExperiences.flatMap((e) =>
    e.reviews.map(([authorName, rating, body, daysAgo]) => ({
      experienceId: idOf.get(e.slug)!,
      authorName,
      authorEmail: SAMPLE_REVIEW_EMAIL,
      rating,
      body,
      isPublished: true,
      createdAt: new Date(now - daysAgo * 86400_000),
    })),
  );
  if (reviews.length) await exec.insert(s.reviews).values(reviews);
}
