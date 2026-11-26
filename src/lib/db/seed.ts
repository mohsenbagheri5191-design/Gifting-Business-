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

async function seedCatalog(exec: DB | Tx) {
  await exec.insert(s.cities).values(seedCities).onConflictDoNothing();
  await exec.insert(s.categories).values(seedCategories).onConflictDoNothing();

  let sort = 0;
  for (const e of seedExperiences) {
    sort += 1;
    const ratings = e.reviews.map((r) => r[1]);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 5;
    const [row] = await exec
      .insert(s.experiences)
      .values({
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
        createdAt: new Date(Date.now() - (e.isNew ? 5 : 60 + sort) * 86400_000),
      })
      .returning({ id: s.experiences.id });

    await exec.insert(s.experienceOptions).values(
      e.options.map(([label, people, duration, price], i) => ({
        experienceId: row.id,
        label,
        people,
        duration,
        priceCents: price * 100,
        isDefault: i === 0,
        sort: i,
      })),
    );
    await exec.insert(s.experienceLocations).values(
      e.locations.map(([name, address, schedule], i) => ({ experienceId: row.id, name, address, schedule, sort: i })),
    );
    if (e.reviews.length) {
      await exec.insert(s.reviews).values(
        e.reviews.map(([authorName, rating, body, daysAgo]) => ({
          experienceId: row.id,
          authorName,
          authorEmail: SAMPLE_REVIEW_EMAIL,
          rating,
          body,
          isPublished: true,
          createdAt: new Date(Date.now() - daysAgo * 86400_000),
        })),
      );
    }
  }
}
