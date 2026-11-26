"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Gift, X } from "lucide-react";
import { useGiftBox } from "./GiftBoxProvider";
import { Img } from "../Img";
import { formatMoney } from "@/lib/format";
import { rules } from "@/lib/config";
import { cn } from "@/lib/ui";

/** Slides in after "Add to gift" — the calm version of bodo's cart pop-up. */
export function GiftDrawer() {
  const { drawer, closeDrawer, lines, valueCents, remove } = useGiftBox();

  useEffect(() => {
    if (!drawer.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer.open, closeDrawer]);

  if (!drawer.open) return null;
  const full = lines.length >= rules.maxGiftItems;
  const headline =
    drawer.last === "full"
      ? "Your gift is full"
      : drawer.last === "updated"
        ? "Option updated"
        : lines.length === 1
          ? "Added to your gift"
          : "Added — they'll choose one";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Your gift">
      <button aria-label="Close" className="absolute inset-0 animate-fade bg-ink/30 backdrop-blur-[2px]" onClick={closeDrawer} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md animate-drawer flex-col bg-paper shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sage-mist text-moss">
              <Gift className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <div>
              <p className="font-display text-xl">{headline}</p>
              <p className="text-sm text-muted">
                {lines.length} of {rules.maxGiftItems} experiences
              </p>
            </div>
          </div>
          <button onClick={closeDrawer} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1.5 px-6 pt-4" aria-hidden>
          {Array.from({ length: rules.maxGiftItems }).map((_, i) => (
            <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < lines.length ? "bg-moss" : "bg-sand")} />
          ))}
        </div>

        {drawer.last === "full" && (
          <p className="mx-6 mt-4 rounded-2xl bg-clay-mist px-4 py-3 text-sm text-clay-deep">
            A gift can hold up to {rules.maxGiftItems} experiences. Remove one to make room for another.
          </p>
        )}

        <ul className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
          {lines.map((l) => (
            <li key={l.experienceId} className="flex gap-4 rounded-2xl border border-line bg-linen/50 p-3">
              <Img src={l.image} alt="" className="h-20 w-24 shrink-0 rounded-xl object-cover" sizes="120px" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-[1.05rem] leading-snug">{l.title}</p>
                <p className="text-xs text-muted">
                  {l.optionLabel} · {l.duration}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-semibold">{formatMoney(l.priceCents)}</span>
                  <button className="text-xs text-muted underline-offset-2 hover:text-clay-deep hover:underline" onClick={() => remove(l.experienceId)}>
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-line bg-linen/60 px-6 py-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink-soft">You pay only the most expensive</span>
            <span className="font-display text-2xl">{formatMoney(valueCents)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            They choose one. Anything left over stays on their code for another experience.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="btn btn-outline" onClick={closeDrawer}>
              {full ? "Close" : "Add another"}
            </button>
            <Link href="/gift-box" className="btn btn-primary" onClick={closeDrawer}>
              Review gift
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
