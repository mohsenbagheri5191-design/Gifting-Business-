import { z } from "zod";
import { body, json, limitOrThrow } from "@/lib/api";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { adminNotifyAddress, dispatchDueEmails, queueEmail } from "@/lib/email";
import { adminNotice } from "@/lib/email/templates";
import { LIMITS } from "@/lib/rate-limit";
import { site } from "@/lib/config";
import { UserError, firstIssue, zEmail, zName } from "@/lib/validation";

const schema = z.object({
  type: z.enum(["corporate", "contact", "partner"]),
  name: zName,
  email: zEmail,
  phone: z.string().trim().max(30).optional().default(""),
  company: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().max(3000).optional().default(""),
  website: z.string().max(0).optional(), // honeypot: must stay empty
});

/** Corporate enquiries, contact messages and partner applications. */
export async function POST(req: Request) {
  return json(async () => {
    limitOrThrow(req, "lead", LIMITS.forms.limit, LIMITS.forms.windowMs);
    const parsed = schema.safeParse(await body(req));
    if (!parsed.success) throw new UserError(firstIssue(parsed.error));
    const { website: _hp, ...lead } = parsed.data;
    const db = await getDb();
    const [row] = await db
      .insert(s.leads)
      .values({ ...lead, phone: lead.phone || null, company: lead.company || null, message: lead.message || null })
      .returning();
    const admin = adminNotifyAddress();
    if (admin) {
      await queueEmail(db, {
        ...adminNotice(`New ${row.type} enquiry from ${row.name}`, [`${row.name} <${row.email}> ${row.phone ?? ""}`, row.company ?? "", row.message ?? ""], `${site.url}/admin/leads`),
        kind: "admin_new_lead",
        to: admin,
      });
      void dispatchDueEmails().catch(() => {});
    }
    return { ok: true };
  }, 201);
}
