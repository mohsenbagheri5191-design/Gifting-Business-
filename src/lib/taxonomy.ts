/**
 * Gift-finding taxonomy (mirrors bodo's "by recipient / by occasion / for yourself" menus).
 * Experiences carry simple tags (her, him, couple, friends, family, kids, parents, team);
 * each landing page maps to one or more of those tags.
 */

const U = (id: string) => `https://images.unsplash.com/photo-${id}`;

export type Recipient = { slug: string; label: string; title: string; group: "For her" | "For him" | "Together" | "For kids"; tags: string[]; image?: string };

export const recipients: Recipient[] = [
  { slug: "for-her", label: "For her", title: "Experience gifts for her", group: "For her", tags: ["her"], image: U("1438761681033-6461ffad8d80") },
  { slug: "for-wife", label: "Wife", title: "Gifts for your wife", group: "For her", tags: ["her", "couple"] },
  { slug: "for-girlfriend", label: "Girlfriend", title: "Gifts for your girlfriend", group: "For her", tags: ["her", "couple"] },
  { slug: "for-mom", label: "Mom", title: "Gifts for Mom", group: "For her", tags: ["parents", "her"] },
  { slug: "for-sister", label: "Sister", title: "Gifts for your sister", group: "For her", tags: ["her", "friends"] },
  { slug: "for-grandma", label: "Grandma", title: "Gifts for Grandma", group: "For her", tags: ["parents"] },
  { slug: "for-him", label: "For him", title: "Experience gifts for him", group: "For him", tags: ["him"], image: U("1507003211169-0a1dd7228f2d") },
  { slug: "for-husband", label: "Husband", title: "Gifts for your husband", group: "For him", tags: ["him", "couple"] },
  { slug: "for-boyfriend", label: "Boyfriend", title: "Gifts for your boyfriend", group: "For him", tags: ["him", "couple"] },
  { slug: "for-dad", label: "Dad", title: "Gifts for Dad", group: "For him", tags: ["parents", "him"] },
  { slug: "for-brother", label: "Brother", title: "Gifts for your brother", group: "For him", tags: ["him", "friends"] },
  { slug: "for-grandpa", label: "Grandpa", title: "Gifts for Grandpa", group: "For him", tags: ["parents"] },
  { slug: "for-couples", label: "Couples", title: "Experiences for two", group: "Together", tags: ["couple"], image: U("1474552226712-ac0f0961a954") },
  { slug: "for-friends", label: "Friends", title: "Gifts for friends", group: "Together", tags: ["friends"], image: U("1511632765486-a01980e01a18") },
  { slug: "for-family", label: "Family", title: "Family experiences", group: "Together", tags: ["family"], image: U("1511895426328-dc8714191300") },
  { slug: "for-parents", label: "Parents", title: "Gifts for parents", group: "Together", tags: ["parents"], image: U("1510812431401-41d2bd2722f3") },
  { slug: "for-colleagues", label: "Colleagues & teams", title: "Gifts for colleagues", group: "Together", tags: ["team"], image: U("1521737604893-d14cc237f11d") },
  { slug: "for-kids", label: "Kids & teens", title: "Experience gifts for kids", group: "For kids", tags: ["kids"], image: U("1503454537195-1dcabb73ffb9") },
];

export type Occasion = { slug: string; label: string; title: string; tag: string; image?: string; blurb: string };

export const occasions: Occasion[] = [
  { slug: "birthday", label: "Birthday", title: "Birthday experience gifts", tag: "birthday", image: U("1464349095431-e9a21285b5f3"), blurb: "Make this year the one they remember." },
  { slug: "anniversary", label: "Anniversary", title: "Anniversary experiences", tag: "anniversary", image: U("1516589091380-5d8e87df6999"), blurb: "Celebrate the years with a new memory together." },
  { slug: "valentines-day", label: "Valentine's Day", title: "Valentine's Day experiences", tag: "valentines", image: U("1518199266791-5375a83190b7"), blurb: "Skip the roses. Give an evening." },
  { slug: "holidays", label: "Holidays", title: "Holiday experience gifts", tag: "holidays", image: U("1607344645866-009c320b63e0"), blurb: "Nothing to wrap, everything to remember." },
  { slug: "mothers-day", label: "Mother's Day", title: "Mother's Day gifts", tag: "mothers-day", blurb: "For the woman who gave you everything." },
  { slug: "fathers-day", label: "Father's Day", title: "Father's Day gifts", tag: "fathers-day", blurb: "Better than another tie." },
  { slug: "weddings", label: "Weddings & engagements", title: "Wedding & engagement gifts", tag: "wedding", image: U("1522673607200-164d1b6ce486"), blurb: "Start their new chapter with an adventure." },
  { slug: "thank-you", label: "Thank you", title: "Thank-you gifts", tag: "thank-you", blurb: "Say it with something they'll feel." },
  { slug: "retirement", label: "Retirement", title: "Retirement gifts", tag: "retirement", blurb: "Plenty of time — here's how to spend it." },
  { slug: "graduation", label: "Graduation", title: "Graduation gifts", tag: "graduation", blurb: "For the next big leap." },
  { slug: "stag-and-stagette", label: "Stag & stagette", title: "Stag & stagette experiences", tag: "bachelor", blurb: "The night before the big day." },
  { slug: "just-because", label: "Just because", title: "Gifts for no reason at all", tag: "just-because", blurb: "The best gifts don't need an occasion." },
];

/** "Book for yourself" collections (bodo's "Враження для себе"). */
export const selfCollections = [
  { slug: "date-night", label: "Plan a date night", query: { recipient: "for-couples" } },
  { slug: "weekend", label: "Plan a weekend away", query: { category: "getaways" } },
  { slug: "with-friends", label: "Get the friends together", query: { recipient: "for-friends" } },
  { slug: "with-kids", label: "Spend a day with the kids", query: { recipient: "for-kids" } },
  { slug: "self-care", label: "Take a day for yourself", query: { category: "spa" } },
  { slug: "learn", label: "Learn something new", query: { category: "workshops" } },
] as const;

export const priceBands = [
  { label: "Under $100", min: undefined, max: 100 },
  { label: "$100 – $200", min: 100, max: 200 },
  { label: "$200 – $400", min: 200, max: 400 },
  { label: "$400 and up", min: 400, max: undefined },
] as const;

export const sortOptions = [
  { value: "popular", label: "Most loved" },
  { value: "new", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
] as const;

export function findRecipient(slug: string) {
  return recipients.find((r) => r.slug === slug) ?? null;
}
export function findOccasion(slug: string) {
  return occasions.find((o) => o.slug === slug) ?? null;
}
