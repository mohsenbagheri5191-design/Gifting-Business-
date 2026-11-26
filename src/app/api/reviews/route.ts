import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { body, json, limitOrThrow } from "@/lib/api";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { LIMITS } from "@/lib/rate-limit";
import { UserError, firstIssue, zEmail, zId, zName } from "@/lib/validation";

const schema = z.object({
  experienceId: zId,
  rating: z.number().int().min(1).max(5),
  authorName: zName,
  authorEmail: zEmail,
  body: z.string().trim().min(10, "Please write at least a sentence.").max(1500),
  consent: z.literal(true),
});

/** Stores a review for moderation (published by an admin). */
export async function POST(req: Request) {
  return json(async () => {
    limitOrThrow(req, "review", LIMITS.forms.limit, LIMITS.forms.windowMs);
    const parsed = schema.safeParse(await body(req));
    if (!parsed.success) throw new UserError(firstIssue(parsed.error));
    const db = await getDb();
    const [exp] = await db.select({ id: s.experiences.id }).from(s.experiences).where(and(eq(s.experiences.id, parsed.data.experienceId), eq(s.experiences.isActive, true)));
    if (!exp) throw new UserError("Experience not found.", 404);
    const { consent: _consent, ...review } = parsed.data;
    await db.insert(s.reviews).values({ ...review, isPublished: false });
    return { ok: true };
  }, 201);
}
