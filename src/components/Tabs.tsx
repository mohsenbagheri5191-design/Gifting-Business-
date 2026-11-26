"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/ui";

/** Accessible tabs; the active tab is mirrored in the URL hash (e.g. /how-it-works#received). */
export function Tabs({ tabs, className }: { tabs: { id: string; label: string; content: React.ReactNode }[]; className?: string }) {
  const [active, setActive] = useState(tabs[0].id);
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === h)) setActive(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  return (
    <div className={className}>
      <div role="tablist" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => {
              setActive(t.id);
              history.replaceState(null, "", `#${t.id}`);
            }}
            className={cn("rounded-full px-6 py-3 text-[0.95rem] font-semibold transition", active === t.id ? "bg-moss text-linen" : "border border-line bg-paper text-ink-soft hover:border-sage")}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== t.id} className="mt-12">
          {t.content}
        </div>
      ))}
    </div>
  );
}
