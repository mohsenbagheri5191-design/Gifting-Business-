import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { SAMPLE_REVIEW_EMAIL } from "@/lib/db/seed-data";
import { formatDateTime } from "@/lib/format";
import { deleteReview, deleteSampleReviews, setReviewPublished } from "../../actions";
import { AdminTitle, Badge, FilterLinks, Panel } from "../ui";

export const metadata = { title: "Reviews" };

export default async function ReviewsAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "pending" } = await searchParams;
  const db = await getDb();
  const [rows, [samples]] = await Promise.all([
    db
      .select({ r: s.reviews, title: s.experiences.title, slug: s.experiences.slug })
      .from(s.reviews)
      .innerJoin(s.experiences, eq(s.reviews.experienceId, s.experiences.id))
      .where(status === "all" ? undefined : eq(s.reviews.isPublished, status === "published"))
      .orderBy(desc(s.reviews.createdAt))
      .limit(200),
    db.select({ n: count() }).from(s.reviews).where(eq(s.reviews.authorEmail, SAMPLE_REVIEW_EMAIL)),
  ]);

  return (
    <>
      <AdminTitle title="Reviews">
        {samples.n > 0 && (
          <form action={deleteSampleReviews}>
            <button className="btn btn-outline btn-sm">Remove {samples.n} sample reviews</button>
          </form>
        )}
      </AdminTitle>
      {samples.n > 0 && (
        <p className="-mt-4 mb-6 max-w-2xl rounded-2xl bg-clay-mist px-5 py-3 text-sm text-clay-deep">
          The site currently shows sample reviews so it looks complete in development. Remove them before launch so only genuine reviews from your customers appear.
        </p>
      )}
      <FilterLinks
        base="/admin/reviews"
        current={status}
        options={[
          ["pending", "Waiting for approval"],
          ["published", "Published"],
          ["all", "All"],
        ]}
      />
      <div className="mt-6 space-y-3">
        {rows.map(({ r, title, slug }) => (
          <Panel key={r.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm">
                <span className="text-gold">{"★".repeat(r.rating)}</span> <span className="font-semibold">{r.authorName}</span>{" "}
                <span className="text-muted">
                  on{" "}
                  <Link href={`/experiences/${slug}`} className="text-moss" target="_blank">
                    {title}
                  </Link>{" "}
                  · {formatDateTime(r.createdAt)} {r.authorEmail === SAMPLE_REVIEW_EMAIL && "· sample"}
                </span>
              </p>
              <p className="mt-2 text-[0.95rem]">{r.body}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Badge tone={r.isPublished ? "good" : "warn"}>{r.isPublished ? "published" : "pending"}</Badge>
              <form action={setReviewPublished}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="publish" value={r.isPublished ? "false" : "true"} />
                <button className="btn btn-outline btn-sm">{r.isPublished ? "Unpublish" : "Publish"}</button>
              </form>
              <form action={deleteReview}>
                <input type="hidden" name="id" value={r.id} />
                <button className="btn btn-outline btn-sm">Delete</button>
              </form>
            </div>
          </Panel>
        ))}
        {rows.length === 0 && <Panel className="p-10 text-center text-muted">No reviews here.</Panel>}
      </div>
    </>
  );
}
