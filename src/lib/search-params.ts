import type { CatalogFilters, CatalogSort } from "./catalog";

export type SP = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? undefined;
const num = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export const PAGE_SIZE = 12;

export function parseCatalogParams(sp: SP) {
  const sort = one(sp.sort) as CatalogSort | undefined;
  const filters: CatalogFilters = {
    q: one(sp.q)?.slice(0, 80),
    city: one(sp.city),
    category: one(sp.category),
    recipient: one(sp.recipient),
    occasion: one(sp.occasion),
    minPrice: num(one(sp.min)),
    maxPrice: num(one(sp.max)),
    people: num(one(sp.people)),
    sort: sort && ["popular", "new", "price-asc", "price-desc", "rating"].includes(sort) ? sort : undefined,
  };
  return {
    filters,
    page: Math.min(20, num(one(sp.page)) ?? 1),
    mode: one(sp.for) === "self" ? ("self" as const) : ("gift" as const),
    redeem: one(sp.redeem),
  };
}
