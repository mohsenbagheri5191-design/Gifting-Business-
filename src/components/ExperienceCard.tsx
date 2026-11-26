"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Gift, Heart } from "lucide-react";
import { Img } from "./Img";
import { useGiftBox } from "./gift-box/GiftBoxProvider";
import { formatMoney, peopleLabel } from "@/lib/format";
import { cn, type CardData } from "@/lib/ui";

export type RedeemContext = { code: string; balanceCents: number };

export function ExperienceCard({
  e,
  redeem,
  priority,
  mode = "gift",
}: {
  e: CardData;
  redeem?: RedeemContext;
  priority?: boolean;
  /** "self" swaps the main button to "Book for me" (bodo's "for yourself" catalog). */
  mode?: "gift" | "self";
}) {
  const { add, has, wishlist, toggleWish, openDrawer, hydrated } = useGiftBox();
  const [optionId, setOptionId] = useState(e.options[0].id);
  const option = e.options.find((o) => o.id === optionId) ?? e.options[0];
  const inGift = hydrated && has(e.id);
  const wished = hydrated && wishlist.includes(e.id);

  function addToGift() {
    const result = add({
      experienceId: e.id,
      optionId: option.id,
      slug: e.slug,
      title: e.title,
      image: e.image,
      optionLabel: option.label,
      people: option.people,
      duration: option.duration,
      priceCents: option.priceCents,
    });
    openDrawer(result);
  }

  const topUp = redeem ? Math.max(0, option.priceCents - redeem.balanceCents) : 0;

  return (
    <article className="group relative flex h-full flex-col">
      <Link href={`/experiences/${e.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-sand">
        <Img
          src={e.image}
          alt={e.title}
          priority={priority}
          sizes="(min-width: 1280px) 400px, (min-width: 768px) 45vw, 92vw"
          className="h-full w-full object-cover transition duration-[900ms] ease-[var(--ease-soft)] group-hover:scale-[1.04]"
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
        {e.badge && (
          <span className="absolute left-4 top-4 rounded-full bg-paper/90 px-3 py-1 text-[0.72rem] font-semibold tracking-wide text-moss backdrop-blur">
            {e.badge}
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={() => toggleWish(e.id)}
        aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={wished}
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-paper/90 text-ink backdrop-blur transition hover:scale-105"
      >
        <Heart className={cn("h-[18px] w-[18px]", wished && "fill-clay text-clay")} strokeWidth={1.7} />
      </button>

      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
          {e.categoryName}
          {e.cityName && <span className="font-medium"> · {e.cityName}</span>}
        </p>
        <h3 className="mt-1.5 text-[1.42rem] leading-snug">
          <Link href={`/experiences/${e.slug}`} className="link-underline">
            {e.title}
          </Link>
        </h3>
        {e.reviewCount > 0 && (
          <p className="mt-1 flex items-center gap-1.5 text-[0.82rem] text-muted">
            <span className="text-gold">★</span>
            <span className="font-semibold text-ink-soft">{e.rating.toFixed(1)}</span>
            <span>
              ({e.reviewCount} review{e.reviewCount === 1 ? "" : "s"})
            </span>
          </p>
        )}
        <p className="mt-2 line-clamp-2 text-[0.94rem] leading-relaxed text-ink-soft">{e.summary}</p>
        {e.seasonNote && <p className="mt-2 text-[0.78rem] text-clay-deep">{e.seasonNote}</p>}

        <div className="mt-auto pt-4">
          <div className="flex items-baseline justify-between gap-3 border-t border-line pt-4">
            <p className="font-display text-[1.5rem] leading-none">{formatMoney(option.priceCents)}</p>
            <p className="text-right text-[0.8rem] text-muted">
              {peopleLabel(option.people)} · {option.duration}
            </p>
          </div>
          {e.options.length > 1 ? (
            <label className="mt-3 block">
              <span className="sr-only">Choose an option for {e.title}</span>
              <select className="select min-h-11 py-2 text-[0.9rem]" value={optionId} onChange={(ev) => setOptionId(Number(ev.target.value))}>
                {e.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label} — {formatMoney(o.priceCents)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="mt-3 flex min-h-11 items-center rounded-[0.95rem] border border-dashed border-line px-4 text-[0.9rem] text-ink-soft">{option.label}</p>
          )}

          {redeem ? (
            <div className="mt-3">
              <p className={cn("mb-2 text-[0.8rem] font-semibold", topUp ? "text-clay-deep" : "text-moss")}>
                {topUp ? `Your gift covers ${formatMoney(redeem.balanceCents)} · pay ${formatMoney(topUp)} more` : "Fully covered by your gift"}
              </p>
              <Link href={`/redeem/${redeem.code}/choose/${e.slug}?option=${option.id}`} className="btn btn-primary w-full">
                Choose with your gift
              </Link>
            </div>
          ) : mode === "self" ? (
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <Link href={`/book/${e.slug}?option=${option.id}`} className="btn btn-primary">
                Book for me
              </Link>
              <button type="button" onClick={addToGift} className="btn btn-outline px-4" title="Add to a gift instead">
                {inGift ? <Check className="h-4 w-4" /> : <Gift className="h-4 w-4" strokeWidth={1.8} />}
                <span className="sr-only">{inGift ? "In your gift" : "Add to gift"}</span>
              </button>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <button type="button" onClick={addToGift} className={cn("btn", inGift ? "btn-outline" : "btn-primary")}>
                {inGift ? <Check className="h-4 w-4" /> : <Gift className="h-4 w-4" strokeWidth={1.8} />}
                {inGift ? "In your gift" : "Add to gift"}
              </button>
              <Link href={`/book/${e.slug}?option=${option.id}`} className="btn btn-outline px-4" title="Book this experience for yourself">
                For me
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
