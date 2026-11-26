import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";
import { AdminTitle, Badge, Panel } from "../../ui";

export const metadata = { title: "Email" };

export default async function EmailPreview({ params }: { params: Promise<{ id: string }> }) {
  const db = await getDb();
  const [m] = await db.select().from(s.emails).where(eq(s.emails.id, Number((await params).id)));
  if (!m) notFound();
  return (
    <>
      <Link href="/admin/emails" className="text-sm text-muted hover:text-ink">
        ← Emails
      </Link>
      <AdminTitle title={m.subject}>
        <Badge tone={m.status === "failed" ? "bad" : m.status === "scheduled" ? "warn" : "good"}>{m.status}</Badge>
      </AdminTitle>
      <p className="-mt-4 mb-6 text-sm text-muted">
        To {m.toAddress} · {m.status === "scheduled" ? `scheduled for ${formatDateTime(m.scheduledFor)}` : formatDateTime(m.sentAt ?? m.createdAt)}
        {m.error && <span className="block text-clay-deep">Error: {m.error}</span>}
      </p>
      <Panel className="overflow-hidden">
        <iframe title="Email preview" srcDoc={m.html} sandbox="" className="h-[80vh] w-full bg-white" />
      </Panel>
    </>
  );
}
