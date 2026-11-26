import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { paymentMode, retrievePaidStripeSession } from "@/lib/payments";
import { clientIp } from "@/lib/rate-limit";
import { lookupCertificate, markTopUpPaid } from "@/lib/redemptions";
import { rules } from "@/lib/config";
import { StatusChip } from "@/components/redeem/StatusChip";
import { TopUpActions } from "@/components/redeem/TopUpActions";
import { Img } from "@/components/Img";
import { cn } from "@/lib/ui";

export const metadata: Metadata = { title: "Your booking", robots: { index: false } };

type Props = { params: Promise<{ code: string; reference: string }>; searchParams: Promise<{ session_id?: string; cancelled?: string }> };

function prettyDay(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { code, reference } = await params;
  const sp = await searchParams;
  const ip = clientIp(await headers());
  let result = await lookupCertificate(code, ip);
  if (!result.ok) redirect("/redeem");
  let r = result.certificate.redemptions.find((x) => x.reference === reference);
  if (!r) notFound();

  if (r.status === "awaiting_payment" && sp.session_id && paymentMode() === "stripe") {
    try {
      const session = await retrievePaidStripeSession(sp.session_id);
      if (session.paid && session.purpose === "topup" && session.referenceId === String(r.id)) {
        await markTopUpPaid(r.id, { provider: "stripe", ref: session.ref });
        result = await lookupCertificate(code, ip);
        if (result.ok) r = result.certificate.redemptions.find((x) => x.reference === reference) ?? r;
      }
    } catch (err) {
      console.error("[keepsake] stripe top-up check failed", err);
    }
  }
  const cert = result.ok ? result.certificate : null;
  if (!cert) redirect("/redeem");

  const stepIndex = { awaiting_payment: 0, requested: 1, confirmed: 2, completed: 3, declined: 1, cancelled: 0 }[r.status];
  const headline = {
    awaiting_payment: "One last step",
    requested: "Your request is in",
    confirmed: "You're booked",
    completed: "We hope it was wonderful",
    declined: "Let's find another time",
    cancelled: "This booking was cancelled",
  }[r.status];

  return (
    <div className="container-page max-w-5xl pb-10 pt-8">
      <Link href={`/redeem/${cert.code}`} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to your gift
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <StatusChip status={r.status} />
          <h1 className="mt-4 text-5xl sm:text-6xl">{headline}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            {r.status === "awaiting_payment" &&
              `${r.title} costs ${formatMoney(r.priceCents)}. Your gift covers ${formatMoney(r.fromBalanceCents)} — pay the remaining ${formatMoney(r.topUpCents)} to send your request. We'll hold your balance for ${rules.topUpHoldMinutes} minutes.`}
            {r.status === "requested" && "We're checking availability with the venue and will confirm by email within a few hours (or the next morning for late requests)."}
            {r.status === "confirmed" && `Everything is set. Your confirmation has been emailed to ${r.guestEmail}.`}
            {r.status === "completed" && "Thank you for choosing Keepsake. We'd love to hear how it went."}
            {r.status === "declined" && `Your preferred times weren't available. ${formatMoney(r.fromBalanceCents)} is back on your gift — choose new dates or something new.`}
            {r.status === "cancelled" && "No problem — any amount taken from your gift has been returned to its balance."}
          </p>
          {sp.cancelled && r.status === "awaiting_payment" && <p className="mt-4 rounded-xl bg-clay-mist px-4 py-3 text-sm text-clay-deep">Payment was cancelled — nothing was charged.</p>}
          {r.adminNote && r.status !== "cancelled" && <p className="mt-4 rounded-xl bg-paper px-4 py-3 text-ink-soft">“{r.adminNote}”</p>}
          {r.status === "awaiting_payment" && <TopUpActions code={cert.code} reference={r.reference} amountLabel={formatMoney(r.topUpCents)} />}
          {(r.status === "declined" || r.status === "cancelled") && (
            <Link href={`/redeem/${cert.code}`} className="btn btn-primary mt-6">
              Choose again
            </Link>
          )}

          {r.status !== "cancelled" && r.status !== "declined" && (
            <ol className="mt-10 grid grid-cols-3 gap-2 text-sm">
              {["Paid & sent", "Confirming", "Confirmed"].map((label, i) => (
                <li key={label}>
                  <span className={cn("block h-1 rounded-full", i <= stepIndex ? "bg-moss" : "bg-line")} />
                  <span className={cn("mt-2 block", i <= stepIndex ? "text-ink" : "text-muted")}>{label}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="overflow-hidden rounded-[2rem] border border-line bg-paper">
            <Img src={r.image} alt="" sizes="(min-width:1024px) 420px, 100vw" className="aspect-[16/10] w-full object-cover" />
            <div className="p-7">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Reference {r.reference}</p>
              <h2 className="mt-2 text-3xl">{r.title}</h2>
              <ul className="mt-5 space-y-3 text-[0.95rem]">
                <li className="flex gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-sage" /> {r.optionLabel} · {r.duration}
                </li>
                <li className="flex gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                  <span>
                    {r.status === "confirmed" && r.scheduledFor ? (
                      <strong>{r.scheduledFor}</strong>
                    ) : (
                      <>
                        {prettyDay(r.preferredDate1)} at {r.preferredTime1}
                        {r.preferredDate2 && (
                          <>
                            <br />
                            or {prettyDay(r.preferredDate2)} at {r.preferredTime2}
                          </>
                        )}
                      </>
                    )}
                  </span>
                </li>
                {r.locationName && (
                  <li className="flex gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                    <span>
                      {r.locationName}
                      <br />
                      <span className="text-muted">{r.locationAddress}</span>
                    </span>
                  </li>
                )}
              </ul>
              <dl className="mt-6 space-y-1 border-t border-line pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Experience</dt>
                  <dd>{formatMoney(r.priceCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">From your gift</dt>
                  <dd>{formatMoney(r.fromBalanceCents)}</dd>
                </div>
                {r.topUpCents > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Top-up {r.topUpStatus === "paid" ? "(paid)" : ""}</dt>
                    <dd>{formatMoney(r.topUpCents)}</dd>
                  </div>
                )}
                <div className="flex justify-between pt-1 font-semibold">
                  <dt>Left on your gift</dt>
                  <dd>{formatMoney(cert.balanceCents)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
