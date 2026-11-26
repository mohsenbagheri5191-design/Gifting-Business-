import type { Metadata } from "next";
import Link from "next/link";
import { CatalogView } from "@/components/catalog/CatalogView";
import { selfCollections } from "@/lib/taxonomy";
import type { SP } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Book an experience for yourself",
  description: "Plan a date night, a weekend away or a day just for you. Choose an experience and your dates — we confirm the booking.",
};

export default async function ForYourselfPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  return (
    <>
      <CatalogView
        searchParams={{ ...sp, for: "self" }}
        eyebrow="For yourself"
        title="Plan something wonderful — for you"
        description="Date nights, weekends away, a day of doing nothing at all. Choose an experience and your preferred dates, and we'll confirm everything with the venue."
      />
      <section className="container-page mt-20">
        <p className="eyebrow mb-4">Quick ideas</p>
        <div className="flex flex-wrap gap-2">
          {selfCollections.map((c) => (
            <Link key={c.slug} href={`/experiences?${new URLSearchParams(c.query as Record<string, string>)}&for=self`} className="chip px-4 py-2 text-sm hover:border-sage">
              {c.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
