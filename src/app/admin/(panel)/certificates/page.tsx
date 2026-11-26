import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { formatCode, isValidCode, normalizeCode } from "@/lib/codes";
import { formatDateTime, formatMoney } from "@/lib/format";
import { certificateStatus } from "@/lib/redemptions";
import { AdminTitle, Badge, Panel, Td, Th } from "../ui";

export const metadata = { title: "Gift codes" };

export default async function CertificatesPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  if (code) {
    const c = normalizeCode(code);
    if (isValidCode(c)) redirect(`/admin/certificates/${c}`);
  }
  const db = await getDb();
  const rows = await db.select().from(s.certificates).orderBy(desc(s.certificates.issuedAt)).limit(200);

  return (
    <>
      <AdminTitle title="Gift codes">
        <form className="flex gap-2">
          <input name="code" placeholder="Look up a 14-character code" className="input min-h-10 w-72 py-2 font-mono text-sm uppercase" />
          <button className="btn btn-outline btn-sm">Find</button>
        </form>
      </AdminTitle>
      {code && <p className="mb-4 text-sm text-clay-deep">“{code}” isn&apos;t a valid 14-character code.</p>}
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>For</Th>
              <Th>Value</Th>
              <Th>Balance</Th>
              <Th>Status</Th>
              <Th>Issued</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const st = certificateStatus(c);
              return (
                <tr key={c.id}>
                  <Td>
                    <Link href={`/admin/certificates/${c.code}`} className="font-mono font-semibold tracking-wider text-moss">
                      {formatCode(c.code)}
                    </Link>
                  </Td>
                  <Td>
                    {c.recipientName} {c.kind === "self" && <span className="text-muted">(self)</span>}
                  </Td>
                  <Td>{formatMoney(c.valueCents)}</Td>
                  <Td>{formatMoney(c.balanceCents)}</Td>
                  <Td>
                    <Badge tone={st === "active" ? "good" : st === "used" ? "neutral" : "warn"}>{st}</Badge>
                  </Td>
                  <Td>{formatDateTime(c.issuedAt)}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-8 text-center text-muted">No gift codes yet — they are created automatically when an order is paid.</p>}
      </Panel>
    </>
  );
}
