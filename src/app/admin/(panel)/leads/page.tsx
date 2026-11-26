import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";
import { setLeadStatus } from "../../actions";
import { AdminTitle, Badge, Panel } from "../ui";

export const metadata = { title: "Enquiries" };

export default async function LeadsPage() {
  const db = await getDb();
  const rows = await db.select().from(s.leads).orderBy(desc(s.leads.createdAt)).limit(200);
  return (
    <>
      <AdminTitle title="Enquiries" />
      <div className="space-y-3">
        {rows.map((l) => (
          <Panel key={l.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone={l.type === "corporate" ? "good" : "neutral"}>{l.type}</Badge>
                  <span className="font-semibold">{l.name}</span>
                  {l.company && <span>· {l.company}</span>}
                  <span className="text-muted">· {formatDateTime(l.createdAt)}</span>
                </p>
                <p className="mt-1 text-sm">
                  <a href={`mailto:${l.email}`} className="text-moss">
                    {l.email}
                  </a>{" "}
                  {l.phone && <span className="text-muted">· {l.phone}</span>}
                </p>
                {l.message && <p className="mt-3 max-w-3xl whitespace-pre-line text-[0.95rem]">{l.message}</p>}
              </div>
              <form action={setLeadStatus} className="flex gap-2">
                <input type="hidden" name="id" value={l.id} />
                <select name="status" defaultValue={l.status} className="select min-h-9 py-1.5 text-sm">
                  <option value="new">New</option>
                  <option value="in_progress">In progress</option>
                  <option value="closed">Closed</option>
                </select>
                <button className="btn btn-outline btn-sm">Save</button>
              </form>
            </div>
          </Panel>
        ))}
        {rows.length === 0 && <Panel className="p-10 text-center text-muted">No enquiries yet.</Panel>}
      </div>
    </>
  );
}
