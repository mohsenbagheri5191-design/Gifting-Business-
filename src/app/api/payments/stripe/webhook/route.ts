import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { markOrderPaid } from "@/lib/orders";
import { stripe } from "@/lib/payments";
import { markTopUpPaid } from "@/lib/redemptions";

/**
 * Stripe webhook — add this endpoint in the Stripe dashboard:
 *   https://YOUR-DOMAIN/api/payments/stripe/webhook   (event: checkout.session.completed)
 * and set STRIPE_WEBHOOK_SECRET. Fulfilment is idempotent, so it is safe alongside
 * the success-page check.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Stripe is not configured" }, { status: 400 });

  const signature = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      const { purpose, referenceId } = session.metadata ?? {};
      try {
        if (purpose === "order" && referenceId) await markOrderPaid(referenceId, { provider: "stripe", ref: session.id });
        if (purpose === "topup" && referenceId) await markTopUpPaid(Number(referenceId), { provider: "stripe", ref: session.id });
      } catch (err) {
        console.error("[cadeau] webhook fulfilment failed", err);
        return NextResponse.json({ error: "Fulfilment failed" }, { status: 500 });
      }
    }
  }
  return NextResponse.json({ received: true });
}
