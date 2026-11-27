import { LogoMark } from "./Logo";
import { formatCode } from "@/lib/codes";
import { formatDate } from "@/lib/format";
import { site } from "@/lib/config";
import { cn } from "@/lib/ui";

/**
 * The Cadeau certificate — used for the e-certificate, the printed card,
 * the order confirmation and the checkout preview.
 */
export function CertificateCard({
  recipientName,
  fromName,
  message,
  items,
  code,
  expiresAt,
  qrSvg,
  className,
}: {
  recipientName: string;
  fromName?: string | null;
  message?: string | null;
  items: { title: string; optionLabel?: string }[];
  code?: string | null;
  expiresAt?: Date | string | null;
  qrSvg?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-[2rem] border border-line bg-paper p-7 shadow-[0_40px_80px_-50px_rgba(31,36,30,0.55)] sm:p-10", className)}>
      <svg className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 text-sage-mist" viewBox="0 0 200 200" aria-hidden>
        <path fill="currentColor" d="M48.9,-61.5C61.6,-49.2,69.1,-32.4,72.5,-14.7C75.9,3,75.2,21.6,66.8,35.6C58.4,49.6,42.3,59,25.2,65.9C8.1,72.8,-10,77.2,-27.4,72.8C-44.8,68.3,-61.5,55,-70.1,37.8C-78.7,20.6,-79.2,-0.5,-72.6,-18.6C-66,-36.7,-52.3,-51.8,-36.9,-63.4C-21.5,-75,-4.4,-83.1,12.4,-80.6C29.2,-78.1,36.2,-73.8,48.9,-61.5Z" transform="translate(100 100)" />
      </svg>
      <svg className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 text-clay-mist" viewBox="0 0 200 200" aria-hidden>
        <path fill="currentColor" d="M39.5,-51.9C50.2,-41.6,57.4,-28.1,62.1,-12.8C66.8,2.5,69,19.6,61.9,31.5C54.8,43.5,38.4,50.3,22.4,56.6C6.4,62.9,-9.3,68.6,-24.9,65.4C-40.5,62.2,-56.1,50,-63.6,34.2C-71.1,18.4,-70.6,-1.1,-63.9,-17.3C-57.2,-33.5,-44.4,-46.4,-30.4,-55.8C-16.4,-65.2,-1.2,-71,13.1,-69C27.4,-67,28.8,-62.2,39.5,-51.9Z" transform="translate(100 100)" />
      </svg>

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-moss">
            <LogoMark className="h-7" />
            <span className="mr-[-0.26em] font-display text-[1.05rem] uppercase leading-none tracking-[0.26em]">{site.name}</span>
          </span>
          <span className="eyebrow">Gift certificate</span>
        </div>

        <p className="mt-8 text-sm text-muted">This is for</p>
        <p className="font-display text-[2.4rem] leading-none sm:text-5xl">{recipientName || "Someone special"}</p>
        {fromName && <p className="mt-2 text-sm text-ink-soft">with love from {fromName}</p>}

        {message && (
          <blockquote className="mt-6 border-l-2 border-clay pl-4 font-display text-lg leading-relaxed text-ink-soft">
            “{message}”
          </blockquote>
        )}

        <div className="mt-7">
          <p className="eyebrow mb-2">{items.length > 1 ? "Choose one of" : "Your experience"}</p>
          <ul className="divide-y divide-line border-y border-line">
            {items.map((i, idx) => (
              <li key={idx} className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="font-display text-[1.1rem]">{i.title}</span>
                {i.optionLabel && <span className="shrink-0 text-xs text-muted">{i.optionLabel}</span>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">…or anything else on {site.name} up to the gift&apos;s value.</p>
        </div>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-5 rounded-2xl border border-dashed border-clay/60 bg-linen/70 p-5">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted">Gift code</p>
            <p className="mt-1 font-mono text-[1.35rem] tracking-[0.14em] sm:text-2xl">{code ? formatCode(code) : "•••••••-•••••••"}</p>
            <p className="mt-2 text-xs text-ink-soft">
              Redeem at {site.url.replace(/^https?:\/\//, "")}/redeem ·{" "}
              {expiresAt ? `valid until ${formatDate(expiresAt)}` : "never expires"}
            </p>
          </div>
          {qrSvg && <div className="h-24 w-24 shrink-0 rounded-xl bg-white p-1.5" dangerouslySetInnerHTML={{ __html: qrSvg }} />}
        </div>
      </div>
    </div>
  );
}
