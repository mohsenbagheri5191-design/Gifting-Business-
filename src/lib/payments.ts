import Stripe from "stripe";
import { market, site } from "./config";
import { UserError } from "./validation";

/**
 * Payments
 * - STRIPE_SECRET_KEY set  → real card payments with Stripe Checkout (cards, Apple Pay, Google Pay).
 * - otherwise              → TEST MODE: a built-in test payment page, no money moves.
 *   Test mode is always available in development; in production it must be
 *   switched on explicitly with ALLOW_TEST_PAYMENTS=true (so a live site can
 *   never hand out free gifts by accident).
 */

export type PaymentPurpose = "order" | "topup";
export type PaymentMode = "stripe" | "test" | "disabled";

export function paymentMode(): PaymentMode {
  if (process.env.STRIPE_SECRET_KEY) return "stripe";
  if (process.env.NODE_ENV !== "production" || process.env.ALLOW_TEST_PAYMENTS === "true") return "test";
  return "disabled";
}

let stripeClient: Stripe | null = null;
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

export type CheckoutRequest = {
  purpose: PaymentPurpose;
  referenceId: string;
  lineItems: { name: string; amountCents: number }[];
  customerEmail?: string;
  /** Path to return to after payment, e.g. /order/abc. */
  successPath: string;
  cancelPath: string;
};

export type CheckoutSession = { provider: "stripe" | "test"; url: string; ref: string | null };

export async function createCheckout(req: CheckoutRequest): Promise<CheckoutSession> {
  const mode = paymentMode();
  if (mode === "disabled") {
    throw new UserError("Online payments aren't switched on yet. Please contact us to complete your order.", 503);
  }
  const items = req.lineItems.filter((li) => li.amountCents > 0);

  if (mode === "stripe") {
    const sep = req.successPath.includes("?") ? "&" : "?";
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: items.map((li) => ({
        quantity: 1,
        price_data: {
          currency: market.currency.toLowerCase(),
          unit_amount: li.amountCents,
          product_data: { name: li.name },
        },
      })),
      customer_email: req.customerEmail,
      success_url: `${site.url}${req.successPath}${sep}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site.url}${req.cancelPath}`,
      metadata: { purpose: req.purpose, referenceId: req.referenceId },
      payment_intent_data: { metadata: { purpose: req.purpose, referenceId: req.referenceId } },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { provider: "stripe", url: session.url, ref: session.id };
  }

  return {
    provider: "test",
    url: `/pay/test?purpose=${req.purpose}&ref=${encodeURIComponent(req.referenceId)}`,
    ref: null,
  };
}

/** Confirms a Stripe Checkout Session directly with Stripe (used on the success redirect). */
export async function retrievePaidStripeSession(sessionId: string) {
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  return {
    paid: session.payment_status === "paid",
    purpose: session.metadata?.purpose as PaymentPurpose | undefined,
    referenceId: session.metadata?.referenceId,
    ref: session.id,
  };
}
