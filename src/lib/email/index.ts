import nodemailer, { type Transporter } from "nodemailer";
import { and, asc, eq, lte } from "drizzle-orm";
import { getDb, type DB, type Tx } from "../db";
import { emails } from "../db/schema";
import { site } from "../config";
import type { EmailContent } from "./templates";

/**
 * Outgoing email.
 * - SMTP_URL set → sent through your provider (Postmark, SendGrid, Resend, Mailgun, Gmail… all support SMTP).
 * - otherwise    → stored with status "logged" and viewable in Admin → Emails (handy in development).
 * Every message is also kept in the `emails` table, which makes scheduled sending possible.
 */

let transporter: Transporter | null | undefined;
function getTransport(): Transporter | null {
  if (transporter !== undefined) return transporter;
  transporter = process.env.SMTP_URL ? nodemailer.createTransport(process.env.SMTP_URL) : null;
  return transporter;
}

export const mailFrom = () => process.env.MAIL_FROM ?? `${site.name} <${site.supportEmail}>`;

export async function queueEmail(
  exec: DB | Tx,
  e: EmailContent & {
    kind: string;
    to: string;
    scheduledFor?: Date | null;
    orderId?: string | null;
    certificateId?: number | null;
    redemptionId?: number | null;
  },
) {
  await exec.insert(emails).values({
    kind: e.kind,
    toAddress: e.to,
    subject: e.subject,
    html: e.html,
    text: e.text,
    status: "scheduled",
    scheduledFor: e.scheduledFor ?? new Date(),
    orderId: e.orderId ?? null,
    certificateId: e.certificateId ?? null,
    redemptionId: e.redemptionId ?? null,
  });
}

let running = false;

/** Sends every email whose time has come. Safe to call often (it never runs twice at once). */
export async function dispatchDueEmails(): Promise<number> {
  if (running) return 0;
  running = true;
  try {
    const db = await getDb();
    const due = await db
      .select()
      .from(emails)
      .where(and(eq(emails.status, "scheduled"), lte(emails.scheduledFor, new Date())))
      .orderBy(asc(emails.scheduledFor))
      .limit(25);
    const transport = getTransport();
    for (const e of due) {
      if (!transport) {
        await db.update(emails).set({ status: "logged", sentAt: new Date() }).where(eq(emails.id, e.id));
        continue;
      }
      try {
        await transport.sendMail({ from: mailFrom(), to: e.toAddress, subject: e.subject, html: e.html, text: e.text, replyTo: site.supportEmail });
        await db.update(emails).set({ status: "sent", sentAt: new Date(), error: null }).where(eq(emails.id, e.id));
      } catch (err) {
        await db
          .update(emails)
          .set({ status: "failed", error: err instanceof Error ? err.message : String(err) })
          .where(eq(emails.id, e.id));
      }
    }
    return due.length;
  } finally {
    running = false;
  }
}

export function adminNotifyAddress() {
  return process.env.ADMIN_NOTIFY_EMAIL || null;
}
