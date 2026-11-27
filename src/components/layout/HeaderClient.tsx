"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Gift, Heart, Menu, Search, X } from "lucide-react";
import { Logo } from "../Logo";
import { useGiftBox } from "../gift-box/GiftBoxProvider";
import { occasions, priceBands, recipients, selfCollections } from "@/lib/taxonomy";
import { rules } from "@/lib/config";
import { cn } from "@/lib/ui";

type Cat = { slug: string; name: string; tagline: string };
type MenuId = "gifts" | "self" | null;

function budgetHref(min?: number, max?: number) {
  const p = new URLSearchParams();
  if (min) p.set("min", String(min));
  if (max) p.set("max", String(max));
  return `/experiences?${p}`;
}

export function HeaderClient({ categories }: { categories: Cat[] }) {
  const pathname = usePathname();
  const { lines, wishlist, hydrated } = useGiftBox();
  const [menu, setMenu] = useState<MenuId>(null);
  const [mobile, setMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMenu(null);
    setMobile(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        setMobile(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
  }, [mobile]);

  const open = (id: MenuId) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenu(id);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setMenu(null), 140);
  };

  const giftCount = hydrated ? lines.length : 0;
  const wishCount = hydrated ? wishlist.length : 0;
  const groups = ["For her", "For him", "Together", "For kids"] as const;

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-moss text-linen">
        <div className="container-page flex h-9 items-center justify-center gap-6 text-[0.78rem] tracking-wide sm:justify-between">
          <p className="truncate">
            Up to {rules.maxGiftItems} experiences in one gift — <span className="text-sage-mist">you pay for just one</span>
          </p>
          <p className="hidden items-center gap-5 sm:flex">
            <span>{rules.certificateValidMonths > 0 ? `Valid ${rules.certificateValidMonths} months` : "Gifts never expire"}</span>
            <span className="opacity-40">·</span>
            <span>E-certificates in minutes</span>
            <span className="opacity-40">·</span>
            <Link href="/redeem" className="underline-offset-4 hover:underline">
              Redeem a gift
            </Link>
          </p>
        </div>
      </div>

      <div className="border-b border-line/80 bg-linen/85 backdrop-blur-md" onMouseLeave={scheduleClose}>
        <div className="container-page flex h-[4.5rem] items-center gap-4">
          <button className="-ml-2 grid h-11 w-11 place-items-center rounded-full hover:bg-sand lg:hidden" aria-label="Open menu" onClick={() => setMobile(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" aria-label="Cadeau — home" className="shrink-0">
            <Logo />
          </Link>

          <nav className="ml-8 hidden items-center gap-1 lg:flex" aria-label="Main">
            <button
              className={cn("flex items-center gap-1 rounded-full px-4 py-2 text-[0.95rem] transition hover:bg-sand", menu === "gifts" && "bg-sand")}
              aria-expanded={menu === "gifts"}
              onMouseEnter={() => open("gifts")}
              onClick={() => setMenu(menu === "gifts" ? null : "gifts")}
            >
              Gift ideas <ChevronDown className={cn("h-4 w-4 transition", menu === "gifts" && "rotate-180")} />
            </button>
            <button
              className={cn("flex items-center gap-1 rounded-full px-4 py-2 text-[0.95rem] transition hover:bg-sand", menu === "self" && "bg-sand")}
              aria-expanded={menu === "self"}
              onMouseEnter={() => open("self")}
              onClick={() => setMenu(menu === "self" ? null : "self")}
            >
              For yourself <ChevronDown className={cn("h-4 w-4 transition", menu === "self" && "rotate-180")} />
            </button>
            <Link href="/how-it-works" className="rounded-full px-4 py-2 text-[0.95rem] transition hover:bg-sand" onMouseEnter={() => open(null)}>
              How it works
            </Link>
            <Link href="/corporate" className="rounded-full px-4 py-2 text-[0.95rem] transition hover:bg-sand" onMouseEnter={() => open(null)}>
              Corporate
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link href="/redeem" className="btn btn-outline btn-sm hidden xl:inline-flex">
              Redeem a gift
            </Link>
            <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-sand" aria-label="Search" onClick={() => setSearchOpen((v) => !v)}>
              <Search className="h-5 w-5" strokeWidth={1.7} />
            </button>
            <Link href="/wishlist" className="relative hidden h-11 w-11 place-items-center rounded-full hover:bg-sand sm:grid" aria-label={`Wishlist (${wishCount})`}>
              <Heart className="h-5 w-5" strokeWidth={1.7} />
              {wishCount > 0 && <span className="absolute right-1.5 top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-clay px-1 text-[10px] font-bold text-white">{wishCount}</span>}
            </Link>
            <Link href="/gift-box" className="relative flex h-11 items-center gap-2 rounded-full pl-3 pr-3 hover:bg-sand" aria-label={`Your gift (${giftCount} experiences)`}>
              <Gift className="h-5 w-5" strokeWidth={1.7} />
              <span className="hidden text-[0.95rem] sm:inline">Your gift</span>
              {giftCount > 0 && <span className="grid h-[20px] min-w-[20px] place-items-center rounded-full bg-moss px-1 text-[11px] font-bold text-linen">{giftCount}</span>}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-line bg-paper">
            <form action="/experiences" className="container-page flex items-center gap-3 py-4">
              <Search className="h-5 w-5 text-muted" />
              <input
                autoFocus
                name="q"
                placeholder="Search experiences — try “spa”, “sailing” or “pasta”"
                className="h-12 flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
                aria-label="Search experiences"
              />
              <button className="btn btn-primary btn-sm">Search</button>
            </form>
          </div>
        )}

        {menu === "gifts" && (
          <div className="absolute inset-x-0 top-full hidden animate-fade border-b border-line bg-paper shadow-[0_30px_60px_-40px_rgba(31,36,30,0.45)] lg:block" onMouseEnter={() => open("gifts")}>
            <div className="container-page grid grid-cols-12 gap-8 py-10">
              <div className="col-span-5">
                <p className="eyebrow mb-4">Who it&apos;s for</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  {groups.map((g) => (
                    <div key={g}>
                      <p className="mb-2 text-sm font-semibold text-ink">{g}</p>
                      <ul className="space-y-1.5">
                        {recipients
                          .filter((r) => r.group === g)
                          .map((r) => (
                            <li key={r.slug}>
                              <Link href={`/gifts/${r.slug}`} className="text-[0.92rem] text-ink-soft hover:text-moss">
                                {r.label}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <p className="eyebrow mb-4">Occasions</p>
                <ul className="space-y-1.5">
                  {occasions.map((o) => (
                    <li key={o.slug}>
                      <Link href={`/occasions/${o.slug}`} className="text-[0.92rem] text-ink-soft hover:text-moss">
                        {o.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-3">
                <p className="eyebrow mb-4">Categories</p>
                <ul className="grid grid-cols-1 gap-y-1.5">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/category/${c.slug}`} className="text-[0.92rem] text-ink-soft hover:text-moss">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-2">
                <p className="eyebrow mb-4">By budget</p>
                <ul className="space-y-1.5">
                  {priceBands.map((b) => (
                    <li key={b.label}>
                      <Link href={budgetHref(b.min, b.max)} className="text-[0.92rem] text-ink-soft hover:text-moss">
                        {b.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/experiences" className="mt-6 inline-block text-sm font-semibold text-moss underline underline-offset-4">
                  Browse all experiences
                </Link>
              </div>
            </div>
          </div>
        )}

        {menu === "self" && (
          <div className="absolute inset-x-0 top-full hidden animate-fade border-b border-line bg-paper shadow-[0_30px_60px_-40px_rgba(31,36,30,0.45)] lg:block" onMouseEnter={() => open("self")}>
            <div className="container-page grid grid-cols-12 items-center gap-8 py-10">
              <div className="col-span-4">
                <p className="eyebrow mb-3">Book for yourself</p>
                <p className="font-display text-3xl">Not a gift? Treat yourself.</p>
                <p className="mt-3 text-ink-soft">Pick an experience, choose your dates and we&apos;ll handle the booking.</p>
                <Link href="/for-yourself" className="btn btn-primary btn-sm mt-5">
                  See all ideas
                </Link>
              </div>
              <ul className="col-span-8 grid grid-cols-3 gap-3">
                {selfCollections.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/experiences?${new URLSearchParams(c.query as Record<string, string>)}&for=self`}
                      className="block rounded-2xl border border-line bg-linen/60 px-5 py-4 text-[0.95rem] transition hover:border-sage hover:bg-sage-mist/60"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-ink/30" aria-label="Close menu" onClick={() => setMobile(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm animate-fade flex-col overflow-y-auto bg-paper">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo />
              <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-sand" aria-label="Close menu" onClick={() => setMobile(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action="/experiences" className="px-5 pt-5">
              <input name="q" className="input" placeholder="Search experiences" aria-label="Search experiences" />
            </form>
            <nav className="flex-1 px-5 py-4" aria-label="Mobile">
              <Link href="/redeem" className="btn btn-primary mb-4 w-full">
                Redeem a gift
              </Link>
              <MobileGroup title="Who it's for">
                {recipients
                  .filter((r) => r.image || r.group === "For kids")
                  .map((r) => (
                    <Link key={r.slug} href={`/gifts/${r.slug}`} className="block py-1.5 text-ink-soft">
                      {r.label}
                    </Link>
                  ))}
              </MobileGroup>
              <MobileGroup title="Occasions">
                {occasions.map((o) => (
                  <Link key={o.slug} href={`/occasions/${o.slug}`} className="block py-1.5 text-ink-soft">
                    {o.label}
                  </Link>
                ))}
              </MobileGroup>
              <MobileGroup title="Categories">
                {categories.map((c) => (
                  <Link key={c.slug} href={`/category/${c.slug}`} className="block py-1.5 text-ink-soft">
                    {c.name}
                  </Link>
                ))}
              </MobileGroup>
              {[
                ["/experiences", "All experiences"],
                ["/for-yourself", "Book for yourself"],
                ["/how-it-works", "How it works"],
                ["/corporate", "Corporate gifts"],
                ["/delivery", "Delivery & payment"],
                ["/faq", "Help & FAQ"],
                ["/wishlist", "Wishlist"],
                ["/contact", "Contact"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="block border-b border-line py-3.5 font-display text-xl">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-line py-1">
      <summary className="flex items-center justify-between py-3 font-display text-xl">
        {title}
        <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
      </summary>
      <div className="pb-3 pl-1">{children}</div>
    </details>
  );
}
