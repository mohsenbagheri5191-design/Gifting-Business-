import "server-only";
import { getCategories, type CatalogItem } from "./catalog";
import type { CardData } from "./ui";

/** Turns catalog rows into the small, serializable shape client cards need. */
export async function toCards(items: CatalogItem[]): Promise<CardData[]> {
  const categories = await getCategories();
  const names = new Map(categories.map((c) => [c.slug, c.name]));
  return items.map((e) => {
    const primary = e.categorySlugs.find((c) => c !== "signature" && c !== "romance") ?? e.categorySlugs[0];
    return {
      id: e.id,
      slug: e.slug,
      title: e.title,
      summary: e.summary,
      image: e.images[0] ?? null,
      rating: e.rating,
      reviewCount: e.reviewCount,
      badge: e.isBestseller ? "Bestseller" : e.isNew ? "New" : e.categorySlugs.includes("signature") ? "Signature" : null,
      categoryName: (primary && names.get(primary)) || "",
      cityName: e.cityName,
      seasonNote: e.seasonNote,
      options: e.options.map((o) => ({ id: o.id, label: o.label, people: o.people, duration: o.duration, priceCents: o.priceCents })),
    };
  });
}
