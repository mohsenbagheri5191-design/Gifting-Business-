import { delivery, packaging, type DeliveryId, type PackagingId } from "./config";

/**
 * The core Keepsake rule (same as bodo): a gift can hold several experiences,
 * and the giver pays only for the most expensive one. That price becomes the
 * certificate's value.
 */
export function certificateValueCents(items: { priceCents: number }[]): number {
  return items.reduce((max, i) => Math.max(max, i.priceCents), 0);
}

export type OrderTotals = {
  certificateValueCents: number;
  packagingFeeCents: number;
  deliveryFeeCents: number;
  totalCents: number;
};

export function giftOrderTotals(
  items: { priceCents: number }[],
  pack: PackagingId,
  deliveryId: DeliveryId,
): OrderTotals {
  const value = certificateValueCents(items);
  const packagingFee = packaging[pack].priceCents;
  const deliveryFee = delivery[deliveryId].priceCents;
  return {
    certificateValueCents: value,
    packagingFeeCents: packagingFee,
    deliveryFeeCents: deliveryFee,
    totalCents: value + packagingFee + deliveryFee,
  };
}

/**
 * How a recipient's choice is paid for:
 * - covered by the balance → the rest stays on the code for another experience
 * - more expensive → the balance is used up and they pay the difference ("top-up")
 */
export function splitRedemption(priceCents: number, balanceCents: number) {
  const fromBalanceCents = Math.min(priceCents, Math.max(0, balanceCents));
  const topUpCents = priceCents - fromBalanceCents;
  return { fromBalanceCents, topUpCents, remainingBalanceCents: balanceCents - fromBalanceCents };
}

/** Delivery methods allowed for a packaging choice. */
export function deliveryOptionsFor(pack: PackagingId): DeliveryId[] {
  return (Object.keys(delivery) as DeliveryId[]).filter((d) => delivery[d].packaging === pack);
}
