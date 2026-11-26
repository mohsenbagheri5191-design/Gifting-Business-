import { z } from "zod";
import { getCartLines } from "@/lib/catalog";
import { body, json } from "@/lib/api";
import { rules } from "@/lib/config";
import { UserError, zId } from "@/lib/validation";

const schema = z.object({ lines: z.array(z.object({ experienceId: zId, optionId: zId })).max(rules.maxGiftItems * 2) });

/** Returns current titles/prices for the visitor's gift box (prices may have changed). */
export async function POST(req: Request) {
  return json(async () => {
    const parsed = schema.safeParse(await body(req));
    if (!parsed.success) throw new UserError("Invalid gift box.");
    return { lines: await getCartLines(parsed.data.lines) };
  });
}
