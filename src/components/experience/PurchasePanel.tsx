"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Gift, Heart, ShieldCheck } from "lucide-react";
import { useGiftBox } from "../gift-box/GiftBoxProvider";
import { formatMoney, peopleLabel } from "@/lib/format";
import { rules } from "@/lib/config";
import { cn, type CardOption } from "@/lib/ui";

export function PurchasePanel({
  experience,
}: {
  experience: { id: number; slug: string; title: string; image: string | null; options: CardOption[] };
}) {
  const { add, has, lines, wishlist, toggleWish, openDrawer, hydrated } = useGiftBox();
  const [optionId, setOptionId] = useState(experience.options[0].id);
  const option = experience.options.find((o) => o.id === optionId) ?? experience.options[0];
  const inGift = hydrated && has(experience.id);
  const wished = hydrated && wishlist.includes(experience.id);
  const slotsLeft = rules.maxGiftItems - (hydrated ? lines.length : 0);

  function addToGift() {
    openDrawer(
      add({
        experienceId: experience.id,
        optionId: option.id,
        slug: experience.slug,
        title: experience.title,
        image: experience.image,
        optionLabel: option.label,
        people: option.people,
        duration: option.duration,
        priceCents: option.priceCents,
      }),
    );
  }

  return (
    <>
      <div className="card p-6 sm:p-7">
        <fieldset>
          <legend className="label mb-3">Choose an option</legend>
          <div className="space-y-2">
            {experience.options.map((o) => (
              <label
                key={o.id}
                className={cn(
                  "flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3.5 transition",
                  o.id === optionId ? "border-moss bg-sage-mist/50" : "border-line bg-paper hover:border-sage",
                )}
              >
                <input type="radio" name="option" className="sr-only" checked={o.id === optionId} onChange={() => setOptionId(o.id)} />
                <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border", o.id === optionId ? "border-moss bg-moss" : "border-line")}>
                  {o.id === optionId && <span className="h-2 w-2 rounded-full bg-linen" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{o.label}</span>
                  <span className="block text-sm text-muted">
                    {peopleLabel(o.people)} · {o.duration}
                  </span>
                </span>
                <span className="font-display text-xl">{formatMoney(o.priceCents)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
          <button onClick={addToGift} className={cn("btn", inGift ? "btn-outline" : "btn-primary")}>
            {inGift ? <Check className="h-4 w-4" /> : <Gift className="h-4 w-4" strokeWidth={1.8} />}
            {inGift ? "In your gift — update option" : "Add to gift"}
          </button>
          <button
            onClick={() => toggleWish(experience.id)}
            className="btn btn-outline w-12 px-0"
            aria-pressed={wished}
            aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
          >
            <Heart className={cn("h-5 w-5", wished && "fill-clay text-clay")} strokeWidth={1.7} />
          </button>
        </div>
        <Link href={`/book/${experience.slug}?option=${option.id}`} className="btn btn-outline mt-2 w-full">
          Book it for myself
        </Link>
        <p className="mt-4 text-center text-sm text-muted">
          {slotsLeft > 0
            ? `Add up to ${slotsLeft} more experience${slotsLeft === 1 ? "" : "s"} to this gift — you pay only for the most expensive.`
            : "Your gift is full — they'll choose one of five."}
        </p>
        <ul className="mt-5 space-y-2 border-t border-line pt-5 text-sm text-ink-soft">
          {["Same price as booking with the venue", "Tried and tested by our team", rules.certificateValidMonths ? `Valid for ${rules.certificateValidMonths} months` : "Never expires — swap anytime"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sage" strokeWidth={1.8} /> {t}
            </li>
          ))}
        </ul>
      </div>

      {/* sticky purchase bar on phones */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted">{option.label}</p>
            <p className="font-display text-xl leading-none">{formatMoney(option.priceCents)}</p>
          </div>
          <button onClick={addToGift} className="btn btn-primary">
            <Gift className="h-4 w-4" /> {inGift ? "In your gift" : "Add to gift"}
          </button>
        </div>
      </div>
    </>
  );
}
