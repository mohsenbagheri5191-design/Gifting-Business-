"use client";

import { cn } from "@/lib/ui";

export const CHECKOUT_STEPS = ["Your gift", "Packaging", "Your details", "Recipient & delivery", "Review & pay"] as const;

export function Stepper({ current, onStep }: { current: number; onStep?: (i: number) => void }) {
  return (
    <ol className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Checkout progress">
      {CHECKOUT_STEPS.map((label, i) => {
        const done = i < current;
        const clickable = done && onStep && i > 0;
        return (
          <li key={label} className="min-w-[8.5rem] flex-1">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStep!(i)}
              className={cn("w-full text-left", clickable && "cursor-pointer")}
              aria-current={i === current ? "step" : undefined}
            >
              <span className={cn("block h-1 rounded-full", i <= current ? "bg-moss" : "bg-line")} />
              <span className={cn("mt-2 block text-[0.8rem]", i === current ? "font-semibold text-ink" : done ? "text-ink-soft" : "text-muted")}>
                0{i + 1} {label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
