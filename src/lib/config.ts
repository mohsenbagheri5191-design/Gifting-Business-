/**
 * Central business configuration for Cadeau.
 * Everything a non-developer is likely to change lives here (or in .env).
 * Values read by the browser must use NEXT_PUBLIC_* env vars.
 */

/** The public address of the site: set NEXT_PUBLIC_SITE_URL, or let Vercel/Netlify provide it. */
function detectSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  if (process.env.NETLIFY && process.env.URL) return process.env.URL;
  return "http://localhost:3000";
}

export const site = {
  name: "Cadeau",
  tagline: "Experiences, beautifully given",
  description:
    "Experience gifts in Toronto. Choose up to five experiences, pay only for the most expensive, and let them choose the one they love.",
  url: detectSiteUrl().replace(/\/$/, ""),
  // TODO before launch: replace with your real contact details.
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@cadeau.example",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "(416) 555-0199",
  supportHours: "Every day, 9 am – 8 pm ET",
  corporateEmail: process.env.NEXT_PUBLIC_CORPORATE_EMAIL ?? "corporate@cadeau.example",
  studio: {
    name: "Cadeau Studio",
    address: "Ossington Avenue, Toronto, ON",
    hours: "Tuesday – Sunday, 11 am – 7 pm",
  },
  social: {
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/",
    pinterest: "https://pinterest.com/",
  },
} as const;

export const market = {
  country: "Canada",
  city: "Toronto",
  province: "ON",
  currency: "CAD",
  locale: "en-CA",
  timeZone: "America/Toronto",
} as const;

export const rules = {
  /** How many experiences a giver can put into one gift (bodo uses 5). */
  maxGiftItems: 5,
  /**
   * Certificate validity in months. 0 = never expires.
   * Ontario's Consumer Protection Act generally prohibits expiry dates on gift cards
   * with a dollar value, so the default is "no expiry". Confirm with your lawyer.
   */
  certificateValidMonths: Number(process.env.NEXT_PUBLIC_CERTIFICATE_VALID_MONTHS ?? 0),
  /** Minutes a recipient's balance is held while they pay a top-up difference. */
  topUpHoldMinutes: 60,
  /** Max greeting length on the card / e-certificate. */
  messageMaxLength: 600,
} as const;

export type PackagingId = "ecert" | "box";
export type DeliveryId = "email" | "courier" | "post" | "pickup";

export const packaging: Record<PackagingId, { id: PackagingId; name: string; short: string; priceCents: number; description: string }> = {
  ecert: {
    id: "ecert",
    name: "E-certificate",
    short: "Arrives by email",
    priceCents: 0,
    description:
      "A beautifully designed certificate delivered by email — right away or at the exact date and time you choose, with your personal message. You receive a copy too.",
  },
  box: {
    id: "box",
    name: "Cadeau gift box",
    short: "Delivery or pickup",
    priceCents: 1500,
    description:
      "A hand-finished linen-textured box with cotton ribbon, a letterpress certificate card with the code, and a printed card for your message.",
  },
};

export const boxColors = [
  { id: "sage", name: "Sage", body: "#8C9A7E", lid: "#A9B59C", ribbon: "#F4EFE6", accent: "#E3E8DA" },
  { id: "oat", name: "Oat", body: "#D8C9B0", lid: "#E6DAC6", ribbon: "#3F4A36", accent: "#F4EFE6" },
  { id: "terracotta", name: "Terracotta", body: "#B8714B", lid: "#C98A66", ribbon: "#F2E2D6", accent: "#F2E2D6" },
  { id: "forest", name: "Forest", body: "#2E3728", lid: "#3F4A36", ribbon: "#C8A96A", accent: "#C8A96A" },
  { id: "dusk", name: "Dusk", body: "#6E6A7C", lid: "#8A8698", ribbon: "#F4EFE6", accent: "#E7E3EE" },
] as const;

export type BoxColorId = (typeof boxColors)[number]["id"];

export const delivery: Record<DeliveryId, { id: DeliveryId; name: string; priceCents: number; eta: string; packaging: PackagingId; needsAddress: boolean }> = {
  email: { id: "email", name: "Email delivery", priceCents: 0, eta: "Within minutes, or at the time you choose", packaging: "ecert", needsAddress: false },
  courier: { id: "courier", name: "Same-day courier (Toronto)", priceCents: 2000, eta: "Order by 2 pm for delivery today", packaging: "box", needsAddress: true },
  post: { id: "post", name: "Canada Post Xpresspost", priceCents: 1500, eta: "1–3 business days, anywhere in Canada", packaging: "box", needsAddress: true },
  pickup: { id: "pickup", name: "Pick up at our studio", priceCents: 0, eta: "Ready within 2 hours", packaging: "box", needsAddress: false },
};

export const provinces = ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"] as const;

/** Greeting suggestions offered in checkout (a light version of bodo's greeting generator). */
export const greetingIdeas = [
  "Happy birthday! Life is made of moments — here's one more, chosen just for you.",
  "For all the memories we've made, and all the ones still waiting. Pick something that makes you smile.",
  "You deserve a day that's entirely yours. Choose whatever calls to you.",
  "Thank you for everything. I hope this becomes a story you'll love telling.",
  "Happy anniversary. Here's to more adventures, side by side.",
] as const;
