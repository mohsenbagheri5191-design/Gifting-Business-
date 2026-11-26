import { z } from "zod";
import { eq } from "drizzle-orm";
import { body, json } from "@/lib/api";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { markOrderPaid } from "@/lib/orders";
import { paymentMode } from "@/lib/payments";
import { markTopUpPaid } from "@/lib/redemptions";
import { UserError } from "@/lib/validation";

const schema = z.object({ purpose: z.enum(["order", "topup"]), ref: z.string().min(1).max(64) });

/** Completes a TEST-MODE payment. Refused whenever real payments (Stripe) are configured. */
export async function POST(req: Request) {
  return json(async () => {
    if (paymentMode() !== "test") throw new UserError("Test payments are disabled.", 403);
    const parsed = schema.safeParse(await body(req));
    if (!parsed.success) throw new UserError("Invalid payment request.");
    const { purpose, ref } = parsed.data;

    if (purpose === "order") {
      const { order, certificate } = await markOrderPaid(ref, { provider: "test", ref: `test_${Date.now()}` });
      return { redirectUrl: `/order/${order.id}`, code: certificate.code };
    }
    const id = Number(ref);
    if (!Number.isInteger(id)) throw new UserError("Invalid booking.");
    const r = await markTopUpPaid(id, { provider: "test", ref: `test_${Date.now()}` });
    const db = await getDb();
    const [cert] = await db.select().from(s.certificates).where(eq(s.certificates.id, r.certificateId));
    return { redirectUrl: `/redeem/${cert.code}/booking/${r.reference}` };
  });
}
