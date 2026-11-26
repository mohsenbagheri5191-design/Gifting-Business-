/** Tiny className joiner. */
export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Builds a sized Unsplash/imgix URL (other URLs are returned unchanged). */
export function imageUrl(src: string | null | undefined, width = 1200, height?: number) {
  if (!src) return "";
  if (!src.startsWith("https://images.unsplash.com/")) return src;
  const h = height ? `&h=${height}` : "";
  return `${src}?auto=format&fit=crop&w=${width}${h}&q=72`;
}

/** Serializable experience data for client components (cards, gift box). */
export type CardOption = { id: number; label: string; people: number; duration: string; priceCents: number };
export type CardData = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  image: string | null;
  rating: number;
  reviewCount: number;
  badge: "Bestseller" | "New" | "Signature" | null;
  categoryName: string;
  cityName: string;
  seasonNote: string | null;
  options: CardOption[];
};
