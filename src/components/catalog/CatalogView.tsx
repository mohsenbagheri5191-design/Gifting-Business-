import Link from "next/link";
import { Suspense } from "react";
import { getCategories, getCities, listExperiences, type CatalogFilters } from "@/lib/catalog";
import { toCards } from "@/lib/cards";
import { PAGE_SIZE, parseCatalogParams, type SP } from "@/lib/search-params";
import { getCertificate } from "@/lib/redemptions";
import { formatCode } from "@/lib/codes";
import { formatMoney } from "@/lib/format";
import { ExperienceCard } from "../ExperienceCard";
import { FilterBar } from "./FilterBar";
import { Img } from "../Img";

/**
 * The shared catalog page (bodo's catalog with filters). Used by All experiences,
 * categories, recipients, occasions and "for yourself" — each passes `fixed` filters.
 */
export async function CatalogView({
  searchParams,
  fixed = {},
  eyebrow,
  title,
  description,
  image,
  hide = [],
}: {
  searchParams: SP;
  fixed?: Partial<CatalogFilters>;
  eyebrow?: string;
  title: string;
  description?: string;
  image?: string | null;
  hide?: ("city" | "category" | "recipient" | "price")[];
}) {
  const { filters, page, mode, redeem } = parseCatalogParams(searchParams);
  const merged = { ...filters, ...fixed };
  const [items, categories, cities, certificate] = await Promise.all([
    listExperiences(merged),
    getCategories(),
    getCities(),
    redeem ? getCertificate(redeem) : Promise.resolve(null),
  ]);
  const redeemCtx = certificate && certificate.status === "active" ? { code: certificate.code, balanceCents: certificate.balanceCents } : undefined;
  const shown = items.slice(0, page * PAGE_SIZE);
  const cards = await toCards(shown);

  const moreParams = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) if (typeof v === "string") moreParams.set(k, v);
  moreParams.set("page", String(page + 1));

  return (
    <>
      <section className="container-page grid items-end gap-8 pb-8 pt-10 sm:pt-14 lg:grid-cols-12">
        <div className={image ? "lg:col-span-8" : "lg:col-span-12"}>
          {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
          <h1 className="max-w-4xl text-[2.6rem] leading-[1.04] sm:text-6xl">{title}</h1>
          {description && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{description}</p>}
        </div>
        {image && (
          <div className="hidden lg:col-span-4 lg:block">
            <div className="arch ml-auto aspect-[4/5] w-full max-w-[300px]">
              <Img src={image} alt="" sizes="300px" className="h-full w-full object-cover" priority />
            </div>
          </div>
        )}
      </section>

      <section className="container-page">
        {redeemCtx && (
          <div className="mb-6 flex flex-col gap-3 rounded-[1.5rem] border border-sage/50 bg-sage-mist/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.95rem]">
              Choosing with gift <span className="font-mono tracking-wider">{formatCode(redeemCtx.code)}</span> —{" "}
              <strong>{formatMoney(redeemCtx.balanceCents)} available</strong>. Anything up to that is fully covered.
            </p>
            <Link href={`/redeem/${redeemCtx.code}`} className="btn btn-outline btn-sm bg-paper">
              Back to your gift
            </Link>
          </div>
        )}
        {mode === "self" && !redeemCtx && (
          <div className="mb-6 rounded-[1.5rem] border border-line bg-paper px-6 py-4 text-[0.95rem] text-ink-soft">
            <strong className="text-ink">Booking for yourself?</strong> Choose an experience, tell us your preferred dates and we&apos;ll confirm with the venue — usually within a few hours.
          </div>
        )}

        <Suspense>
          <FilterBar
            total={items.length}
            hide={hide}
            cities={cities.map((c) => ({ value: c.slug, label: c.name }))}
            categories={categories.map((c) => ({ value: c.slug, label: c.name }))}
          />
        </Suspense>

        {cards.length ? (
          <div className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((c, i) => (
              <ExperienceCard key={c.id} e={c} redeem={redeemCtx} mode={mode} priority={i < 3} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-[2rem] border border-dashed border-line px-6 py-20 text-center">
            <p className="font-display text-3xl">Nothing quite matches — yet.</p>
            <p className="mt-3 text-ink-soft">Try removing a filter or two, or browse everything.</p>
            <Link href="/experiences" className="btn btn-primary mt-6">
              Browse all experiences
            </Link>
          </div>
        )}

        {items.length > shown.length && (
          <div className="mt-14 flex flex-col items-center gap-3">
            <Link href={`?${moreParams}`} scroll={false} className="btn btn-outline px-8">
              Show more experiences
            </Link>
            <p className="text-sm text-muted">
              Showing {shown.length} of {items.length}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
