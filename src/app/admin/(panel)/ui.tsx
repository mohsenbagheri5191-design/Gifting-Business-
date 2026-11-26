import Link from "next/link";
import { cn } from "@/lib/ui";

export function AdminTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-4xl">{title}</h1>
      {children}
    </div>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-[1.5rem] border border-line bg-paper", className)}>{children}</div>;
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted", className)}>{children}</th>;
}
export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-t border-line px-4 py-3 align-top text-sm", className)}>{children}</td>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const t = { neutral: "bg-sand text-ink-soft", good: "bg-sage-mist text-moss", warn: "bg-clay-mist text-clay-deep", bad: "bg-clay text-white" }[tone];
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", t)}>{children}</span>;
}

export function FilterLinks({ base, current, options }: { base: string; current?: string; options: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([value, label]) => (
        <Link
          key={value}
          href={value ? `${base}?status=${value}` : base}
          className={cn("rounded-full border px-3.5 py-1.5 text-sm", (current ?? "") === value ? "border-moss bg-moss text-linen" : "border-line bg-paper hover:border-sage")}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mb-6 rounded-2xl bg-clay-mist px-5 py-3 text-sm text-clay-deep">{message}</p>;
}
