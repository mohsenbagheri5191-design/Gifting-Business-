import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { rules, site } from "@/lib/config";

/*
 * TEMPLATE LEGAL TEXT — a sensible starting point for an Ontario business.
 * It is NOT legal advice. Have a Canadian lawyer review and adapt it
 * (consumer protection, gift-card rules, privacy/PIPEDA, taxes) before launch.
 */

const updated = "November 2026";
const validity = rules.certificateValidMonths
  ? `Gift certificates are valid for ${rules.certificateValidMonths} months from the date of purchase.`
  : "Gift certificates do not expire.";

const pages: Record<string, { title: string; body: React.ReactNode }> = {
  terms: {
    title: "Terms of sale",
    body: (
      <>
        <p>These terms apply to purchases made on {site.name}. By placing an order you agree to them.</p>
        <h2>1. What you are buying</h2>
        <p>
          A {site.name} gift certificate entitles the holder to choose and book one or more experiences offered on our site, up to the certificate&apos;s value. When you add several experiences to one gift, the certificate&apos;s
          value equals the price of the most expensive experience in the gift. Experiences are provided by independent partner venues; {site.name} arranges the booking.
        </p>
        <h2>2. Validity and balance</h2>
        <p>
          {validity} Any value not used for a booking remains on the same certificate code. If the holder chooses an experience that costs more than the remaining balance, they may pay the difference online.
          Prices of experiences included in a gift are protected: later price increases never cost the holder extra for those experiences.
        </p>
        <h2>3. Bookings</h2>
        <p>
          Bookings must be requested through {site.name}. Confirmation depends on the partner&apos;s availability. Changes or cancellations require at least 48 hours&apos; notice unless stated otherwise in the confirmation;
          late cancellations and no-shows may forfeit the amount used for that booking. Weather-dependent experiences are rescheduled free of charge when conditions aren&apos;t safe.
        </p>
        <h2>4. If an experience becomes unavailable</h2>
        <p>If a partner stops offering an experience, the holder may choose any other experience up to the certificate&apos;s value.</p>
        <h2>5. Payment and delivery</h2>
        <p>Prices are in Canadian dollars. Payment is taken when you order. Delivery options and fees are shown at checkout.</p>
        <h2>6. Refunds</h2>
        <p>
          See our <Link href="/legal/refunds">refund policy</Link>.
        </p>
        <h2>7. Lost codes</h2>
        <p>A certificate code works like cash. Keep it safe. We can re-send a code to the buyer&apos;s email address on request.</p>
        <h2>8. Contact</h2>
        <p>
          {site.name} · {site.studio.address} · {site.supportEmail} · {site.supportPhone}
        </p>
      </>
    ),
  },
  refunds: {
    title: "Refunds & exchanges",
    body: (
      <>
        <p>We want every gift to land perfectly. Here&apos;s how refunds and exchanges work.</p>
        <h2>Exchanges — any time</h2>
        <p>The holder of a gift can swap it for any other experience up to its value, split it across several experiences, or top up for something more expensive, directly at <Link href="/redeem">Redeem a gift</Link>.</p>
        <h2>Refunds — within 14 days</h2>
        <p>
          The original buyer may request a full refund within 14 days of purchase, provided the certificate has not been used for a booking. Gift-box packaging and delivery fees are refundable only if the box is returned unopened.
          Email {site.supportEmail} with your order number. Refunds are issued to the original payment method within 7 business days.
        </p>
        <h2>Top-ups</h2>
        <p>If a booking paid partly with a top-up is cancelled with enough notice, the top-up is refunded to the original payment method and the gift amount returns to the certificate&apos;s balance.</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy policy",
    body: (
      <>
        <p>We collect only what we need to deliver your gift and arrange bookings, and we never sell your information.</p>
        <h2>What we collect</h2>
        <ul>
          <li>Buyer details: name, email, phone, and delivery address if you order a gift box.</li>
          <li>Recipient details you provide: name, email, and the message you write.</li>
          <li>Booking details: guest name, contact details, preferred dates and notes.</li>
          <li>Payment information is processed by Stripe; we do not see or store card numbers.</li>
        </ul>
        <h2>How we use it</h2>
        <p>To process orders, deliver certificates, arrange bookings with partner venues (who receive only what they need to host you), provide support, and meet legal obligations.</p>
        <h2>Storage and retention</h2>
        <p>Data is stored securely with our hosting providers. We keep order records as required for tax purposes and delete other data when no longer needed.</p>
        <h2>Your rights</h2>
        <p>You can ask to access, correct or delete your personal information at {site.supportEmail}.</p>
        <h2>Browser storage</h2>
        <p>We use your browser&apos;s local storage to remember your gift box and wishlist. We don&apos;t use advertising trackers.</p>
      </>
    ),
  },
  cookies: {
    title: "Cookies",
    body: (
      <>
        <p>{site.name} uses a minimal number of cookies and local storage.</p>
        <ul>
          <li>Essential: remembering your gift box, wishlist and checkout progress in your browser.</li>
          <li>Security: a session cookie for our team&apos;s admin area.</li>
          <li>Payments: Stripe may set cookies on its checkout page to prevent fraud.</li>
        </ul>
      </>
    ),
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = pages[(await params).slug];
  return p ? { title: p.title } : {};
}

export default async function LegalPage({ params }: Props) {
  const page = pages[(await params).slug];
  if (!page) notFound();
  return (
    <article className="container-page max-w-3xl py-14">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-4 text-5xl sm:text-6xl">{page.title}</h1>
      <p className="mt-3 text-sm text-muted">Last updated {updated}</p>
      <div className="prose-calm mt-10 text-[1.02rem]">{page.body}</div>
    </article>
  );
}
