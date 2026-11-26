import Link from "next/link";
import { delivery, packaging, rules, site } from "./config";
import { formatMoney } from "./format";

/** All help-centre content in one place (used by /faq, /how-it-works and /redeem). */

const validity = () =>
  rules.certificateValidMonths > 0
    ? `Every gift is valid for ${rules.certificateValidMonths} months from the date of purchase.`
    : "Keepsake gifts never expire. Take all the time you need.";

export const faqSections: { id: string; title: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    id: "ordering",
    title: "Ordering",
    items: [
      {
        q: "How does a Keepsake gift work?",
        a: (
          <p>
            Add up to {rules.maxGiftItems} experiences to one gift. You pay only for the most expensive one — that becomes the gift&apos;s value. The person you&apos;re celebrating receives a unique 14-character code,
            chooses the experience they&apos;d love (or anything else up to the value) and picks their dates. We confirm the booking with the venue.
          </p>
        ),
      },
      {
        q: "Can I give an amount instead of specific experiences?",
        a: (
          <p>
            Our gifts are always built around experiences — it&apos;s more personal. But the recipient is never limited to your picks: they can choose anything on {site.name} up to the gift&apos;s value. So simply choose a few ideas in your budget.
          </p>
        ),
      },
      {
        q: "I want the experience to happen on a specific date. Can I book it as a gift?",
        a: (
          <p>
            Yes — use <Link href="/for-yourself">Book for yourself</Link>: choose the experience and your preferred dates and we&apos;ll confirm the booking. Gift packaging isn&apos;t included with direct bookings.
          </p>
        ),
      },
      { q: "How long is a gift valid?", a: <p>{validity()}</p> },
      {
        q: "What if the price of the experience goes up?",
        a: <p>Prices are locked in when you buy. If an experience in your gift becomes more expensive later, the recipient still doesn&apos;t pay anything extra.</p>,
      },
      {
        q: "What if I don't guess right?",
        a: (
          <p>
            You can&apos;t really get it wrong. Recipients can swap for anything else up to the gift&apos;s value, keep any leftover balance for another experience, or top up for something bigger — all online at{" "}
            <Link href="/redeem">Redeem a gift</Link>.
          </p>
        ),
      },
    ],
  },
  {
    id: "payment",
    title: "Payment",
    items: [
      { q: "How can I pay?", a: <p>Securely online with Visa, Mastercard, American Express, Apple Pay or Google Pay. Companies can also pay by invoice.</p> },
      { q: "Is paying online safe?", a: <p>Card payments are processed by Stripe, a certified PCI Level 1 payment provider. We never see or store your card number.</p> },
      { q: "Can my company pay by invoice?", a: <p>Yes. For corporate orders, <Link href="/corporate">get in touch</Link> and we&apos;ll send a quote and an invoice.</p> },
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    items: [
      {
        q: "How quickly can I get a gift?",
        a: <p>E-certificates arrive within minutes of payment — or at the exact date and time you choose. Gift boxes can be delivered the same day in Toronto when ordered before 2 pm.</p>,
      },
      {
        q: "What are the delivery options?",
        a: (
          <ul>
            {Object.values(delivery).map((d) => (
              <li key={d.id}>
                {d.name} — {d.priceCents ? formatMoney(d.priceCents) : "free"} ({d.eta.toLowerCase()})
              </li>
            ))}
          </ul>
        ),
      },
      {
        q: "The recipient lives in another city. How do I send a gift?",
        a: <p>Send an e-certificate straight to their inbox at the moment you choose, or send a gift box by Canada Post Xpresspost anywhere in Canada.</p>,
      },
      { q: "What's inside the gift box?", a: <p>{packaging.box.description}</p> },
    ],
  },
  {
    id: "using",
    title: "Using a gift",
    items: [
      {
        q: "How do I use my gift?",
        a: (
          <p>
            Go to <Link href="/redeem">Redeem a gift</Link>, enter your 14-character code, choose your experience and two preferred dates. We confirm with the venue by email, usually within a few hours.
          </p>
        ),
      },
      { q: "How far ahead should I book?", a: <p>As early as you can — popular experiences and weekends fill up weeks ahead, especially in summer and December.</p> },
      { q: "Do I have to book through Keepsake?", a: <p>Yes. Venues only accept Keepsake bookings that come through us, so please don&apos;t turn up without a confirmation.</p> },
      { q: "Can I choose something more expensive?", a: <p>Of course — choose it while redeeming and pay only the difference online.</p> },
      { q: "What happens to the rest if I choose something cheaper?", a: <p>The remaining balance stays on the same code. Use it for another experience whenever you like.</p> },
      { q: "Can I change or cancel my booking?", a: <p>Yes, with at least 48 hours&apos; notice (some venues need more — it&apos;s stated in your confirmation). Later changes may not be possible.</p> },
      { q: "What if the experience depends on the weather?", a: <p>Weather-dependent experiences (sailing, balloon flights, track days…) are rescheduled free of charge if conditions aren&apos;t safe.</p> },
      { q: "I've lost my code.", a: <p>Contact us with the buyer&apos;s name or email address and the occasion, and we&apos;ll find it for you.</p> },
      { q: "Can someone else use my gift?", a: <p>Yes — gifts are transferable. Simply pass on the code, or tell us the new guest&apos;s name when booking.</p> },
    ],
  },
  {
    id: "refunds",
    title: "Refunds",
    items: [
      {
        q: "Can I get a refund?",
        a: (
          <p>
            The buyer can request a full refund within 14 days of purchase, as long as the gift hasn&apos;t been used. After that, gifts can&apos;t be refunded — but they never lose their value. See our <Link href="/legal/refunds">refund policy</Link>.
          </p>
        ),
      },
      { q: "I received a gift and would prefer something else.", a: <p>Swap it for any other experience at <Link href="/redeem">Redeem a gift</Link>. Refunds go only to the original buyer.</p> },
    ],
  },
  {
    id: "trust",
    title: "Why trust us",
    items: [
      { q: "How do you choose experiences?", a: <p>Someone from our team tries every experience before it&apos;s listed. Only the ones that meet our standard make it into the collection.</p> },
      { q: "Are the prices higher than booking directly?", a: <p>No. Our prices match what the venue charges when you book with them directly.</p> },
      { q: "Who do I talk to if something goes wrong?", a: <p>Us — {site.supportHours.toLowerCase()} at {site.supportPhone} or {site.supportEmail}. We&apos;ll make it right.</p> },
    ],
  },
];
