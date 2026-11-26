import { z } from "zod";
import { body, json } from "@/lib/api";
import { clientIp } from "@/lib/rate-limit";
import { lookupCertificate } from "@/lib/redemptions";
import { UserError } from "@/lib/validation";

const schema = z.object({ code: z.string().max(40) });

/** Checks a gift code typed on /redeem. Failed attempts are rate-limited per IP. */
export async function POST(req: Request) {
  return json(async () => {
    const parsed = schema.safeParse(await body(req));
    if (!parsed.success) throw new UserError("Please enter your 14-character gift code.");
    const result = await lookupCertificate(parsed.data.code, clientIp(req.headers));
    if (!result.ok) {
      if (result.reason === "rate_limited") throw new UserError("Too many attempts. Please wait 15 minutes, or contact us and we'll help.", 429);
      if (result.reason === "invalid") throw new UserError("Gift codes are 14 letters and numbers — please check and try again.");
      throw new UserError("We couldn't find that code. Please check it and try again.", 404);
    }
    const c = result.certificate;
    return { code: c.code, status: c.status, balanceCents: c.balanceCents, valueCents: c.valueCents, expiresAt: c.expiresAt };
  });
}
