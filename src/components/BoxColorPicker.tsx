"use client";

import { useState } from "react";
import { GiftBoxArt } from "./GiftBoxArt";
import { boxColors } from "@/lib/config";
import { cn } from "@/lib/ui";

export function BoxColorPicker({ initial = "sage", onChange, className }: { initial?: string; onChange?: (id: string) => void; className?: string }) {
  const [color, setColor] = useState(initial);
  const current = boxColors.find((c) => c.id === color) ?? boxColors[0];
  return (
    <div className={className}>
      <GiftBoxArt color={color} className="mx-auto max-w-[380px]" />
      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="flex gap-2.5" role="radiogroup" aria-label="Box colour">
          {boxColors.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={color === c.id}
              aria-label={c.name}
              onClick={() => {
                setColor(c.id);
                onChange?.(c.id);
              }}
              className={cn("h-9 w-9 rounded-full border-2 transition", color === c.id ? "scale-110 border-ink" : "border-paper hover:scale-105")}
              style={{ background: `linear-gradient(135deg, ${c.lid} 0 50%, ${c.body} 50% 100%)` }}
            />
          ))}
        </div>
        <p className="text-sm text-muted">
          Colourway: <span className="font-semibold text-ink">{current.name}</span>
        </p>
      </div>
    </div>
  );
}
