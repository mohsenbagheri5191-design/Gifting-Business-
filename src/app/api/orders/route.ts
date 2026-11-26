import { body, json, limitOrThrow } from "@/lib/api";
import { createOrder } from "@/lib/orders";
import { LIMITS } from "@/lib/rate-limit";

/** Creates a pending order (prices re-read from the database) and returns the payment URL. */
export async function POST(req: Request) {
  return json(async () => {
    limitOrThrow(req, "checkout", LIMITS.checkout.limit, LIMITS.checkout.windowMs);
    return createOrder(await body(req));
  });
}
