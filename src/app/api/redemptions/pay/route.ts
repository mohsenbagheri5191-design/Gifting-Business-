import { z } from "zod";
import { eq } from "drizzle-orm";
import { body, json } from "@/lib/api";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { createCheckout } from "@/lib/payments";
import { getRedemptionByReference } from "@/lib/redemptions";
import { UserError } from "@/lib/validation";

const schema = z.object({ code: z.string().max(40), reference: z.string().max(20) });

/** (Re)starts the payment for a recipient's top-up. */
export async function POST(req: Request) {
  return json(async () => {
    const parsed = schema.safeParse(await body(req));
    if (!parsed.success) throw new UserError("Invalid request.");
    const found = await getRedemptionByReference(parsed.data.code, parsed.data.reference);
    if (!found) throw new UserError("Booking not found.", 404);
    const r = found.redemption;
    if (r.status !== "awaiting_payment") throw new UserError("Nothing to pay for this booking.", 409);
    const path = `/redeem/${found.certificate.code}/booking/${r.reference}`;
    const session = await createCheckout({
      purpose: "topup",
      referenceId: String(r.id),
      lineItems: [{ name: `Top-up for ${r.title} (${r.optionLabel})`, amountCents: r.topUpCents }],
      customerEmail: r.guestEmail,
      successPath: path,
      cancelPath: `${path}?cancelled=1`,
    });
    const db = await getDb();
    await db.update(s.redemptions).set({ topUpProvider: session.provider, topUpRef: session.ref }).where(eq(s.redemptions.id, r.id));
    return { redirectUrl: session.url };
  });
}
