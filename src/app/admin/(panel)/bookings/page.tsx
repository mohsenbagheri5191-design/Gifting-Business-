import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { formatCode } from "@/lib/codes";
import { formatDateTime, formatMoney } from "@/lib/format";
import { completeBooking, confirmBooking, declineBooking } from "../../actions";
import { AdminTitle, Badge, ErrorBanner, FilterLinks, Panel } from "../ui";

export const metadata = { title: "Bookings" };

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const { status = "requested", error } = await searchParams;
  const db = await getDb();
  const rows = await db
    .select({ r: s.redemptions, code: s.certificates.code, kind: s.certificates.kind })
    .from(s.redemptions)
    .innerJoin(s.certificates, eq(s.redemptions.certificateId, s.certificates.id))
    .where(status === "all" ? undefined : eq(s.redemptions.status, status as s.RedemptionStatus))
    .orderBy(desc(s.redemptions.createdAt))
    .limit(200);

  return (
    <>
      <AdminTitle title="Bookings" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-ink-soft">
        Recipients choose an experience and two preferred times. Call or message the venue, then confirm the slot here — the guest is emailed automatically. Declining returns the amount to their gift balance.
      </p>
      <ErrorBanner message={error} />
      <FilterLinks
        base="/admin/bookings"
        current={status}
        options={[
          ["requested", "To confirm"],
          ["awaiting_payment", "Awaiting top-up"],
          ["confirmed", "Confirmed"],
          ["completed", "Completed"],
          ["declined", "Declined"],
          ["cancelled", "Cancelled"],
          ["all", "All"],
        ]}
      />
      <div className="mt-6 space-y-4">
        {rows.map(({ r, code, kind }) => (
          <Panel key={r.id} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={r.status === "confirmed" || r.status === "completed" ? "good" : r.status === "requested" ? "warn" : "neutral"}>{r.status.replace("_", " ")}</Badge>
                  <span className="text-xs text-muted">
                    {r.reference} · {formatDateTime(r.createdAt)} · {kind === "self" ? "self booking" : "gift"}{" "}
                    <Link href={`/admin/certificates/${code}`} className="text-moss">
                      {formatCode(code)}
                    </Link>
                  </span>
                </div>
                <h2 className="mt-2 text-2xl">{r.title}</h2>
                <p className="text-sm text-ink-soft">
                  {r.optionLabel} · {r.duration} · {r.locationName ?? "single location"}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-display text-2xl">{formatMoney(r.priceCents)}</p>
                <p className="text-muted">
                  gift {formatMoney(r.fromBalanceCents)}
                  {r.topUpCents > 0 && ` + top-up ${formatMoney(r.topUpCents)} (${r.topUpStatus})`}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Guest</p>
                <p className="mt-1 font-semibold">
                  {r.guestFirstName} {r.guestLastName}
                </p>
                <p>{r.guestEmail}</p>
                <p>{r.guestPhone}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Preferred</p>
                <p className="mt-1">
                  1. {r.preferredDate1} at {r.preferredTime1}
                </p>
                {r.preferredDate2 && (
                  <p>
                    2. {r.preferredDate2} at {r.preferredTime2}
                  </p>
                )}
                {r.scheduledFor && <p className="mt-1 font-semibold text-moss">Confirmed: {r.scheduledFor}</p>}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Notes</p>
                <p className="mt-1">{r.notes || "—"}</p>
                {r.adminNote && <p className="mt-1 text-muted">Internal: {r.adminNote}</p>}
              </div>
            </div>
            {r.status === "requested" && (
              <div className="mt-5 grid gap-3 border-t border-line pt-5 lg:grid-cols-2">
                <form action={confirmBooking} className="flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input name="scheduledFor" required placeholder="e.g. Saturday, March 14 at 7:00 pm" defaultValue={`${r.preferredDate1} at ${r.preferredTime1}`} className="input min-h-10 flex-1 py-2 text-sm" />
                  <input name="note" placeholder="Note for the guest (optional)" className="input min-h-10 flex-1 py-2 text-sm" />
                  <button className="btn btn-primary btn-sm">Confirm & email</button>
                </form>
                <form action={declineBooking} className="flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input name="note" placeholder="Reason / other available times" className="input min-h-10 flex-1 py-2 text-sm" />
                  <button className="btn btn-outline btn-sm">Decline & restore balance</button>
                </form>
              </div>
            )}
            {r.status === "confirmed" && (
              <form action={completeBooking} className="mt-5 border-t border-line pt-5">
                <input type="hidden" name="id" value={r.id} />
                <button className="btn btn-outline btn-sm">Mark as completed</button>
              </form>
            )}
          </Panel>
        ))}
        {rows.length === 0 && <Panel className="p-10 text-center text-muted">Nothing here.</Panel>}
      </div>
    </>
  );
}
