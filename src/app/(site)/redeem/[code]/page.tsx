import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, Gift, Shuffle } from "lucide-react";
import { listExperiences } from "@/lib/catalog";
import { formatCode } from "@/lib/codes";
import { formatDate, formatMoney } from "@/lib/format";
import { clientIp } from "@/lib/rate-limit";
import { lookupCertificate, quoteFor } from "@/lib/redemptions";
import { CodeForm } from "@/components/redeem/CodeForm";
import { StatusChip } from "@/components/redeem/StatusChip";
import { Img } from "@/components/Img";
import { cn } from "@/lib/ui";

export const metadata: Metadata = { title: "Your gift", robots: { index: false } };

const reasons = {
  invalid: "Gift codes are 14 letters and numbers — please check yours.",
  not_found: "We couldn't find that code. Please check it and try again.",
  rate_limited: "Too many attempts. Please wait 15 minutes, or contact us and we'll help.",
};

export default async function RedeemCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const result = await lookupCertificate(code, clientIp(await headers()));

  if (!result.ok) {
    return (
      <div className="container-page max-w-2xl py-20">
        <h1 className="text-5xl">Let&apos;s try that again</h1>
        <div className="mt-8">
          <CodeForm initialError={reasons[result.reason]} />
        </div>
      </div>
    );
  }

  const cert = result.certificate;
  const live = await listExperiences({ ids: cert.items.map((i) => i.experienceId).filter((x): x is number => x != null) });
  const active = cert.status === "active";
  const isSelf = cert.kind === "self";
  const openBookings = cert.redemptions.filter((r) => r.status !== "cancelled");

  return (
    <div className="pb-10">
      <section className="relative overflow-hidden bg-sage-mist/60">
        <svg className="pointer-events-none absolute -right-32 -top-32 h-[460px] w-[460px] text-paper/70" viewBox="0 0 200 200" aria-hidden>
          <path fill="currentColor" d="M42.8,-55.4C55.1,-45.2,64.5,-31.4,68.4,-15.9C72.3,-0.4,70.7,16.8,63.3,30.9C55.9,45,42.7,56,27.7,62.6C12.7,69.2,-4.1,71.4,-20.7,67.6C-37.3,63.8,-53.7,54,-63.4,39.6C-73.1,25.2,-76.1,6.2,-71.9,-10.7C-67.7,-27.6,-56.3,-42.4,-42.4,-52.4C-28.5,-62.4,-12,-67.6,2.4,-70.5C16.8,-73.4,30.5,-65.6,42.8,-55.4Z" transform="translate(100 100)" />
        </svg>
        <div className="container-page relative grid gap-10 py-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow">Gift {formatCode(cert.code)}</p>
            <h1 className="mt-4 text-[2.8rem] leading-[1.03] sm:text-6xl">
              {isSelf ? "Your booking" : `${cert.recipientName ? `${cert.recipientName}, ` : ""}this is for you`}
            </h1>
            {!isSelf && cert.fromName && <p className="mt-3 text-lg text-ink-soft">A gift from {cert.fromName}.</p>}
            {cert.message && (
              <blockquote className="mt-6 max-w-xl border-l-2 border-clay pl-5 font-display text-2xl italic leading-snug text-ink-soft">“{cert.message}”</blockquote>
            )}
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-[2rem] bg-paper p-7 shadow-[0_30px_60px_-40px_rgba(31,36,30,0.5)]">
              <p className="text-sm text-muted">{active ? "Available to spend" : "Balance"}</p>
              <p className="mt-1 font-display text-5xl">{formatMoney(cert.balanceCents)}</p>
              <p className="mt-2 text-sm text-ink-soft">
                {cert.balanceCents !== cert.valueCents && <>of {formatMoney(cert.valueCents)} · </>}
                {cert.expiresAt ? `Valid until ${formatDate(cert.expiresAt)}` : "Never expires"}
              </p>
              {cert.status === "used" && <p className="mt-4 rounded-xl bg-sand px-4 py-3 text-sm">This gift has been fully used. Enjoy!</p>}
              {cert.status === "expired" && <p className="mt-4 rounded-xl bg-clay-mist px-4 py-3 text-sm text-clay-deep">This gift has expired. Contact us — we&apos;ll see what we can do.</p>}
              {cert.status === "cancelled" && <p className="mt-4 rounded-xl bg-clay-mist px-4 py-3 text-sm text-clay-deep">This gift was cancelled. Please contact us if that seems wrong.</p>}
              {active && (
                <Link href={`/experiences?redeem=${cert.code}`} className="btn btn-outline mt-5 w-full">
                  <Shuffle className="h-4 w-4" /> Browse everything else
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {openBookings.length > 0 && (
        <section className="container-page mt-14">
          <h2 className="text-3xl sm:text-4xl">{isSelf ? "Booking" : "Your bookings"}</h2>
          <ul className="mt-6 space-y-3">
            {openBookings.map((r) => (
              <li key={r.id}>
                <Link href={`/redeem/${cert.code}/booking/${r.reference}`} className="flex flex-col gap-4 rounded-[1.5rem] border border-line bg-paper p-5 transition hover:border-sage sm:flex-row sm:items-center">
                  <Img src={r.image} alt="" sizes="160px" className="aspect-[4/3] w-full rounded-xl object-cover sm:w-32" />
                  <div className="min-w-0 flex-1">
                    <StatusChip status={r.status} />
                    <p className="mt-2 font-display text-2xl">{r.title}</p>
                    <p className="text-sm text-muted">
                      {r.optionLabel} · {r.status === "confirmed" && r.scheduledFor ? r.scheduledFor : `Preferred ${r.preferredDate1} at ${r.preferredTime1}`} · Ref {r.reference}
                    </p>
                  </div>
                  <ArrowRight className="hidden h-5 w-5 text-muted sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!isSelf && cert.items.length > 0 && (
        <section className="container-page mt-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Chosen for you</p>
              <h2 className="mt-3 text-4xl sm:text-5xl">{cert.items.length > 1 ? `Pick one of ${cert.items.length}` : "Your experience"}</h2>
            </div>
            {active && <p className="max-w-md text-ink-soft">Anything left over stays on your code for another experience. Want something bigger? Just pay the difference.</p>}
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cert.items.map((item) => {
              const exp = live.find((e) => e.id === item.experienceId);
              const option = exp?.options.find((o) => o.id === item.optionId) ?? exp?.options[0];
              const q = option ? quoteFor(cert, cert.items, option) : null;
              return (
                <article key={item.id} className="flex flex-col overflow-hidden rounded-[1.75rem] border border-line bg-paper">
                  <Img src={item.image} alt="" sizes="(min-width:1280px) 400px, 50vw" className="aspect-[4/3] w-full object-cover" />
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-2xl">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {item.optionLabel} · {item.duration}
                    </p>
                    <div className="mt-auto pt-5">
                      {!exp ? (
                        <p className="rounded-xl bg-sand px-4 py-3 text-sm text-ink-soft">No longer available — browse everything else, your full balance still applies.</p>
                      ) : (
                        <>
                          <p className={cn("text-sm font-semibold", q && q.topUpCents ? "text-clay-deep" : "text-moss")}>
                            {!active ? "" : q && q.topUpCents ? `Pay ${formatMoney(q.topUpCents)} more` : "Fully covered by your gift"}
                          </p>
                          <div className="mt-3 flex gap-2">
                            {active && (
                              <Link href={`/redeem/${cert.code}/choose/${exp.slug}?option=${option?.id ?? ""}`} className="btn btn-primary flex-1">
                                <Gift className="h-4 w-4" /> Choose this
                              </Link>
                            )}
                            <Link href={`/experiences/${exp.slug}`} className="btn btn-outline">
                              Details
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {active && (
        <section className="container-page mt-16">
          <div className="flex flex-col items-start gap-5 rounded-[2rem] bg-forest p-9 text-linen sm:flex-row sm:items-center sm:justify-between sm:p-12">
            <div>
              <h2 className="text-3xl text-linen sm:text-4xl">Fancy something different?</h2>
              <p className="mt-2 max-w-xl text-linen/75">Swap for any experience on Keepsake. Up to {formatMoney(cert.balanceCents)} is covered; for anything more, you simply pay the difference.</p>
            </div>
            <Link href={`/experiences?redeem=${cert.code}`} className="btn btn-light shrink-0">
              Browse all experiences <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
