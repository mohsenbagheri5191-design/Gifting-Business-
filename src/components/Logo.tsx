import { site } from "@/lib/config";
import { cn } from "@/lib/ui";

/** The Cadeau mark: an arched doorway with a sprout — a moment opening up and growing. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 40" className={cn("h-8 w-auto", className)} aria-hidden fill="none">
      <path d="M3.5 38.5V16a12.5 12.5 0 0 1 25 0v22.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 35V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 26.5c-4.6 0-7.2-2.7-7.6-6.8 4.6 0 7.2 2.7 7.6 6.8Z" fill="currentColor" />
      <path d="M16 22.6c4.1-.2 6.5-2.7 6.8-6.4-4.1.2-6.5 2.7-6.8 6.4Z" fill="currentColor" opacity=".55" />
      <path d="M1 38.5h30" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Mark + wordmark. The wordmark is set in widely spaced capitals of the display face. */
export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-3", light ? "text-linen" : "text-moss", className)}>
      <LogoMark className="h-8" />
      {/* The negative right margin cancels the tracking after the last letter so the lockup stays optically centred. */}
      <span className="mr-[-0.26em] font-display text-[1.32rem] uppercase leading-none tracking-[0.26em]">{site.name}</span>
    </span>
  );
}
