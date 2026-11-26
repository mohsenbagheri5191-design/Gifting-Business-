import { body, json, limitOrThrow } from "@/lib/api";
import { LIMITS } from "@/lib/rate-limit";
import { createRedemption } from "@/lib/redemptions";

/** The recipient confirms which experience they want (and their preferred dates). */
export async function POST(req: Request) {
  return json(async () => {
    limitOrThrow(req, "redeem", LIMITS.checkout.limit, LIMITS.checkout.windowMs);
    return createRedemption(await body(req));
  });
}
