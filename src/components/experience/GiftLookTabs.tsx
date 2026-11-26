"use client";

import { useState } from "react";
import { BoxColorPicker } from "../BoxColorPicker";
import { cn } from "@/lib/ui";

/** "What the gift looks like" — gift box vs. e-certificate (bodo's packaging tabs). */
export function GiftLookTabs({ certificate }: { certificate: React.ReactNode }) {
  const [tab, setTab] = useState<"box" | "ecert">("box");
  return (
    <div>
      <div className="mb-8 inline-flex rounded-full border border-line bg-paper p-1" role="tablist">
        {(
          [
            ["box", "Gift box"],
            ["ecert", "E-certificate"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn("rounded-full px-6 py-2.5 text-sm font-semibold transition", tab === id ? "bg-moss text-linen" : "text-ink-soft hover:text-ink")}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "box" ? (
        <div className="grid items-center gap-10 rounded-[2rem] bg-paper p-8 sm:p-12 lg:grid-cols-2">
          <BoxColorPicker />
          <div>
            <h3 className="text-3xl">Hand-finished, ribbon-tied</h3>
            <p className="mt-4 text-ink-soft">
              A linen-textured box in your choice of five colourways, tied with cotton ribbon. Inside: a letterpress certificate card with their 14-character code, the experiences you chose, and your message printed on a separate card.
            </p>
            <p className="mt-4 text-ink-soft">Same-day courier in Toronto, Canada Post Xpresspost anywhere in Canada, or pick it up from our studio.</p>
          </div>
        </div>
      ) : (
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {certificate}
          <div>
            <h3 className="text-3xl">Arrives at the perfect moment</h3>
            <p className="mt-4 text-ink-soft">
              Can&apos;t give it in person? Schedule the e-certificate for the exact date and time — midnight on their birthday, or the morning of your anniversary. It arrives with your message, and you receive a copy at the same moment.
            </p>
            <p className="mt-4 text-ink-soft">Prefer to print it yourself? Send it to your own email instead.</p>
          </div>
        </div>
      )}
    </div>
  );
}
