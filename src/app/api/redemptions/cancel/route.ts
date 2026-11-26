import { z } from "zod";
import { body, json } from "@/lib/api";
import { cancelRedemption, getRedemptionByReference } from "@/lib/redemptions";
import { UserError } from "@/lib/validation";

const schema = z.object({ code: z.string().max(40), reference: z.string().max(20) });

/** Lets a recipient abandon an unpaid top-up so the held balance is released immediately. */
export async function POST(req: Request) {
  return json(async () => {
    const parsed = schema.safeParse(await body(req));
    if (!parsed.success) throw new UserError("Invalid request.");
    const found = await getRedemptionByReference(parsed.data.code, parsed.data.reference);
    if (!found) throw new UserError("Booking not found.", 404);
    if (found.redemption.status !== "awaiting_payment") throw new UserError("This booking can't be cancelled online — please contact us.", 409);
    await cancelRedemption(found.redemption.id, "cancelled", "Cancelled by the recipient before paying the top-up.");
    return { ok: true };
  });
}
