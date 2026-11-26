import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";
import { AdminTitle, Badge, Panel, Td, Th } from "../ui";

export const metadata = { title: "Emails" };

export default async function EmailsPage() {
  const db = await getDb();
  const rows = await db.select().from(s.emails).orderBy(desc(s.emails.createdAt)).limit(300);
  return (
    <>
      <AdminTitle title="Emails" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-ink-soft">
        Every email the site sends. Without SMTP configured, messages are kept here as <strong>logged</strong> so you can preview exactly what customers will receive.
      </p>
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr>
              <Th>Subject</Th>
              <Th>To</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>When</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <Td>
                  <Link href={`/admin/emails/${m.id}`} className="font-semibold text-moss">
                    {m.subject}
                  </Link>
                </Td>
                <Td>{m.toAddress}</Td>
                <Td className="text-muted">{m.kind}</Td>
                <Td>
                  <Badge tone={m.status === "failed" ? "bad" : m.status === "scheduled" ? "warn" : "good"}>{m.status}</Badge>
                </Td>
                <Td>{m.status === "scheduled" ? `due ${formatDateTime(m.scheduledFor)}` : formatDateTime(m.sentAt ?? m.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-8 text-center text-muted">No emails yet.</p>}
      </Panel>
    </>
  );
}
