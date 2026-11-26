"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";
import { useGiftBox, type GiftLine } from "../gift-box/GiftBoxProvider";
import { Img } from "../Img";
import { Stepper } from "./Stepper";
import { formatMoney } from "@/lib/format";
import { rules } from "@/lib/config";
import { cn } from "@/lib/ui";

/** Step 1 — the gift's contents (bodo's "Наповнення подарунка"). */
export function GiftBoxView() {
  const { lines, hydrated, remove, replaceAll, valueCents } = useGiftBox();
  const [notice, setNotice] = useState("");
  const synced = useRef(false);

  // Re-read prices/availability from the server once.
  useEffect(() => {
    if (!hydrated || synced.current || lines.length === 0) return;
    synced.current = true;
    fetch("/api/cart", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lines: lines.map(({ experienceId, optionId }) => ({ experienceId, optionId })) }) })
      .then((r) => r.json())
      .then((data: { lines?: GiftLine[] }) => {
        if (!data.lines) return;
        const fresh = data.lines;
        const changed = fresh.length !== lines.length || fresh.some((f, i) => f.priceCents !== lines[i]?.priceCents);
        if (changed) {
          replaceAll(fresh);
          setNotice(fresh.length < lines.length ? "One experience is no longer available and was removed." : "Prices have been updated.");
        }
      })
      .catch(() => {});
  }, [hydrated, lines, replaceAll]);

  const top = lines.reduce<GiftLine | null>((m, l) => (!m || l.priceCents > m.priceCents ? l : m), null);

  return (
    <div className="container-page pb-10 pt-8">
      <Stepper current={0} />
      <Link href="/experiences" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Keep browsing
      </Link>
      <h1 className="mt-4 text-5xl sm:text-6xl">Your gift</h1>
      <ul className="mt-4 space-y-1 text-[0.95rem] text-ink-soft">
        <li>· They choose one experience — or swap it for anything else up to the gift&apos;s value.</li>
        <li>· {rules.certificateValidMonths ? `Valid for ${rules.certificateValidMonths} months from purchase.` : "It never expires, and any leftover balance stays on their code."}</li>
      </ul>

      {notice && <p className="mt-6 rounded-2xl bg-clay-mist px-5 py-3 text-sm text-clay-deep">{notice}</p>}

      {!hydrated ? (
        <div className="mt-10 h-48 animate-pulse rounded-[2rem] bg-sand/70" />
      ) : lines.length === 0 ? (
        <div className="mt-10 rounded-[2rem] border border-dashed border-line px-6 py-20 text-center">
          <p className="font-display text-4xl">Your gift is waiting to be filled</p>
          <p className="mx-auto mt-3 max-w-md text-ink-soft">Add up to {rules.maxGiftItems} experiences. They&apos;ll choose one, and you only pay for the most expensive.</p>
          <Link href="/experiences" className="btn btn-primary mt-7">
            Find experiences
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ul className="space-y-4">
              {lines.map((l) => (
                <li key={l.experienceId} className="flex flex-col gap-4 rounded-[1.75rem] border border-line bg-paper p-4 sm:flex-row sm:items-center">
                  <Link href={`/experiences/${l.slug}`} className="shrink-0">
                    <Img src={l.image} alt="" sizes="220px" className="aspect-[4/3] w-full rounded-2xl object-cover sm:w-48" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link href={`/experiences/${l.slug}`} className="font-display text-2xl leading-snug hover:text-moss">
                          {l.title}
                        </Link>
                        <p className="mt-1 text-sm text-muted">
                          {l.optionLabel} · {l.duration}
                        </p>
                        {top?.experienceId === l.experienceId && lines.length > 1 && <span className="chip mt-3 border-sage bg-sage-mist text-moss">Sets the gift&apos;s value</span>}
                      </div>
                      <button onClick={() => remove(l.experienceId)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink" aria-label={`Remove ${l.title}`}>
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Link href={`/experiences/${l.slug}`} className="text-sm text-moss underline-offset-4 hover:underline">
                        Change option
                      </Link>
                      <span className="font-display text-2xl">{formatMoney(l.priceCents)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {lines.length < rules.maxGiftItems && (
              <div className="mt-8 rounded-[1.75rem] bg-sage-mist/60 p-7">
                <p className="font-display text-2xl">Add more and pay for just one</p>
                <p className="mt-2 text-ink-soft">
                  You can add {rules.maxGiftItems - lines.length} more experience{rules.maxGiftItems - lines.length === 1 ? "" : "s"}. They&apos;ll choose one — anything left over stays on their code for another experience.
                </p>
                <Link href="/experiences" className="btn btn-outline mt-5 bg-paper">
                  <Plus className="h-4 w-4" /> Add another experience
                </Link>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-32 rounded-[2rem] bg-moss p-8 text-linen">
              <p className="text-sm text-linen/75">Gift value</p>
              <p className="mt-1 font-display text-5xl">{formatMoney(valueCents)}</p>
              <p className="mt-3 text-sm leading-relaxed text-linen/80">
                {lines.length > 1
                  ? `${lines.length} experiences to choose from — you pay only for the most expensive.`
                  : "Add more ideas to this gift at no extra cost — you pay only for the most expensive."}
              </p>
              <div className="mt-6 flex gap-1.5" aria-hidden>
                {Array.from({ length: rules.maxGiftItems }).map((_, i) => (
                  <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < lines.length ? "bg-linen" : "bg-linen/20")} />
                ))}
              </div>
              <Link href="/checkout" className="btn btn-light mt-7 w-full">
                Choose packaging <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-4 text-center text-xs text-linen/60">Packaging and delivery are chosen next.</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
