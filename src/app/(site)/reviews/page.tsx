import type { Metadata } from "next";
import Link from "next/link";
import { getRecentReviews, getReviewStats } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { Stars } from "@/components/Stars";
import { PageHero } from "@/components/sections";

export const metadata: Metadata = { title: "Reviews", description: "What people say after giving — and receiving — a Keepsake." };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const perPage = 24;
  const [reviews, stats] = await Promise.all([getRecentReviews(perPage * page + 1), getReviewStats()]);
  const shown = reviews.slice(0, perPage * page);

  return (
    <>
      <PageHero eyebrow="Reviews" title={`${stats.average.toFixed(1)} out of 5`} description={`From ${stats.count} reviews of Keepsake experiences.`}>
        <Stars value={stats.average} size={26} className="mt-6" />
      </PageHero>
      <section className="container-page columns-1 gap-5 md:columns-2 lg:columns-3">
        {shown.map((r) => (
          <figure key={r.id} className="card mb-5 break-inside-avoid p-7">
            <div className="flex items-center justify-between">
              <Stars value={r.rating} />
              <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
            </div>
            <blockquote className="mt-4 font-display text-[1.2rem] leading-relaxed">“{r.body}”</blockquote>
            <figcaption className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
              <span className="font-semibold">{r.authorName}</span>
              <Link href={`/experiences/${r.experienceSlug}#reviews`} className="truncate text-muted hover:text-moss">
                {r.experienceTitle}
              </Link>
            </figcaption>
          </figure>
        ))}
      </section>
      {reviews.length > shown.length && (
        <div className="container-page mt-10 text-center">
          <Link href={`/reviews?page=${page + 1}`} className="btn btn-outline">
            Show more reviews
          </Link>
        </div>
      )}
    </>
  );
}
