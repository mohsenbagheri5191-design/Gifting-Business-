import Link from "next/link";
import { ArrowRight, BadgeCheck, Gift, Hourglass, Layers, Repeat2, Sparkles, Ticket, Wallet } from "lucide-react";
import { rules } from "@/lib/config";
import { cn } from "@/lib/ui";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: { href: string; label: string };
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("mb-10 flex flex-col gap-5 sm:mb-12", align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between", className)}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="text-[2.1rem] sm:text-5xl">{title}</h2>
        {description && <p className="mt-4 text-[1.05rem] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="group inline-flex shrink-0 items-center gap-2 font-semibold text-moss">
          {action.label}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

export const giftSteps = [
  { icon: Layers, title: `Choose up to ${rules.maxGiftItems}`, text: `Fill one gift with up to ${rules.maxGiftItems} experiences they might love — so you never have to guess.` },
  { icon: Wallet, title: "Pay for just one", text: "The price is the most expensive experience in the gift. Nothing more." },
  { icon: Gift, title: "We wrap it beautifully", text: "A hand-finished gift box, or an e-certificate delivered to the minute you choose." },
  { icon: Ticket, title: "They choose & book", text: "With their 14-character code they pick one, choose a date, and we arrange the rest." },
];

export function HowItWorksStrip({ className }: { className?: string }) {
  return (
    <ol className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {giftSteps.map((s, i) => (
        <li key={s.title} className="relative rounded-[1.75rem] border border-line bg-paper p-7">
          <div className="flex items-center justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-sage-mist text-moss">
              <s.icon className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <span className="font-display text-4xl text-line">0{i + 1}</span>
          </div>
          <h3 className="mt-6 text-2xl">{s.title}</h3>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

export const benefits = [
  { icon: BadgeCheck, title: "Tried by us first", text: "Every experience is visited by our team before it's listed. Honest descriptions, real conditions, partner prices." },
  {
    icon: Hourglass,
    title: rules.certificateValidMonths > 0 ? `${rules.certificateValidMonths} months to choose` : "Never expires",
    text: rules.certificateValidMonths > 0 ? "Plenty of time to choose, book and enjoy." : "No rush, no fine print. Their gift keeps its full value until they're ready.",
  },
  { icon: Sparkles, title: `Up to ${rules.maxGiftItems} to choose from`, text: "Add several ideas to one gift. They choose the one that feels right; you pay for one." },
  { icon: Repeat2, title: "Swap, split or upgrade", text: "Anything up to the gift's value is theirs to choose. Leftover balance stays for later; bigger ideas just need a top-up." },
];

export function Benefits({ dark = false }: { dark?: boolean }) {
  return (
    <ul className="grid gap-px overflow-hidden rounded-[2rem] sm:grid-cols-2 lg:grid-cols-4">
      {benefits.map((b) => (
        <li key={b.title} className={cn("p-8", dark ? "bg-linen/[0.06]" : "bg-paper")}>
          <b.icon className={cn("h-7 w-7", dark ? "text-sage" : "text-clay")} strokeWidth={1.4} />
          <h3 className={cn("mt-6 text-[1.6rem]", dark && "text-linen")}>{b.title}</h3>
          <p className={cn("mt-2 text-[0.95rem] leading-relaxed", dark ? "text-linen/70" : "text-ink-soft")}>{b.text}</p>
        </li>
      ))}
    </ul>
  );
}

export function FaqList({ items, className }: { items: { q: string; a: React.ReactNode }[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((f) => (
        <details key={f.q} className="group py-1">
          <summary className="flex items-center justify-between gap-6 py-5 text-left font-display text-[1.25rem] leading-snug">
            {f.q}
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line transition group-open:rotate-45 group-open:bg-sand" aria-hidden>
              +
            </span>
          </summary>
          <div className="prose-calm max-w-3xl pb-6 text-[0.98rem]">{f.a}</div>
        </details>
      ))}
    </div>
  );
}

export function PageHero({ eyebrow, title, description, children }: { eyebrow?: string; title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="container-page pb-10 pt-12 sm:pt-16">
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h1 className="max-w-4xl text-[2.6rem] sm:text-6xl">{title}</h1>
      {description && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{description}</p>}
      {children}
    </section>
  );
}
