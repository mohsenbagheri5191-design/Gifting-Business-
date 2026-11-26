"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { priceBands, recipients, sortOptions } from "@/lib/taxonomy";
import { cn } from "@/lib/ui";

type Opt = { value: string; label: string };

export function FilterBar({
  cities,
  categories,
  hide = [],
  total,
}: {
  cities: Opt[];
  categories: Opt[];
  hide?: ("city" | "category" | "recipient" | "price")[];
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  }

  const priceValue = (() => {
    const min = params.get("min") ?? "";
    const max = params.get("max") ?? "";
    return min || max ? `${min}-${max}` : "";
  })();

  const active = ["city", "category", "recipient", "min", "max", "people", "q"].some((k) => params.get(k));
  const groups = ["For her", "For him", "Together", "For kids"] as const;

  return (
    <div className={cn("sticky top-[7.6rem] z-20 -mx-4 border-y border-line bg-linen/90 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-[1.5rem] sm:border sm:px-4", pending && "opacity-80")}>
      <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] lg:grid lg:grid-cols-6 lg:overflow-visible">
        <span className="hidden shrink-0 items-center gap-2 pl-1 pr-2 text-sm font-semibold text-ink-soft sm:flex lg:hidden">
          <SlidersHorizontal className="h-4 w-4" /> Filter
        </span>
        {!hide.includes("city") && (
          <Select label="Location" value={params.get("city") ?? ""} onChange={(v) => update({ city: v })} options={[{ value: "", label: "All locations" }, ...cities]} />
        )}
        {!hide.includes("recipient") && (
          <label className="min-w-[9.5rem] shrink-0 lg:min-w-0">
            <span className="sr-only">Who it&apos;s for</span>
            <select className="select min-h-11 bg-paper py-2 text-[0.9rem]" value={params.get("recipient") ?? ""} onChange={(e) => update({ recipient: e.target.value || undefined })}>
              <option value="">Who it&apos;s for</option>
              {groups.map((g) => (
                <optgroup key={g} label={g}>
                  {recipients
                    .filter((r) => r.group === g)
                    .map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.label}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
        )}
        {!hide.includes("category") && (
          <Select label="Category" value={params.get("category") ?? ""} onChange={(v) => update({ category: v })} options={[{ value: "", label: "All categories" }, ...categories]} />
        )}
        {!hide.includes("price") && (
          <Select
            label="Price"
            value={priceValue}
            onChange={(v) => {
              const [min, max] = (v || "-").split("-");
              update({ min: min || undefined, max: max || undefined });
            }}
            options={[{ value: "", label: "Any price" }, ...priceBands.map((b) => ({ value: `${b.min ?? ""}-${b.max ?? ""}`, label: b.label }))]}
          />
        )}
        <Select
          label="Group size"
          value={params.get("people") ?? ""}
          onChange={(v) => update({ people: v })}
          options={[
            { value: "", label: "Any group size" },
            { value: "2", label: "For 2 or more" },
            { value: "4", label: "For 4 or more" },
            { value: "6", label: "For 6 or more" },
          ]}
        />
        <Select label="Sort" value={params.get("sort") ?? ""} onChange={(v) => update({ sort: v })} options={[{ value: "", label: "Sort: most loved" }, ...sortOptions.slice(1).map((s) => ({ value: s.value, label: `Sort: ${s.label.toLowerCase()}` }))]} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 px-1 text-sm text-muted">
        <span aria-live="polite">
          {pending ? "Updating…" : `${total} experience${total === 1 ? "" : "s"}`}
          {params.get("q") && (
            <>
              {" "}
              for “<span className="text-ink">{params.get("q")}</span>”
            </>
          )}
        </span>
        {active && (
          <button className="inline-flex items-center gap-1 font-semibold text-moss hover:underline" onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}>
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string | undefined) => void; options: Opt[] }) {
  return (
    <label className="min-w-[9.5rem] shrink-0 lg:min-w-0">
      <span className="sr-only">{label}</span>
      <select className="select min-h-11 bg-paper py-2 text-[0.9rem]" value={value} onChange={(e) => onChange(e.target.value || undefined)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
