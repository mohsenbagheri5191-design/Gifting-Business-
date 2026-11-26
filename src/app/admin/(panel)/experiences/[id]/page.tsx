import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { getCategories, getCities } from "@/lib/catalog";
import { occasions } from "@/lib/taxonomy";
import { AdminTitle } from "../../ui";
import { ExperienceForm } from "./ExperienceForm";

export const metadata = { title: "Edit experience" };

const recipientTags = ["her", "him", "couple", "friends", "family", "kids", "parents", "team"];

export default async function EditExperience({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const { saved } = await searchParams;
  const db = await getDb();
  const [categories, cities] = await Promise.all([getCategories(), getCities()]);
  let experience: (s.Experience & { options: s.ExperienceOption[]; locations: s.ExperienceLocation[] }) | null = null;
  if (id !== "new") {
    const row = await db.query.experiences.findFirst({
      where: eq(s.experiences.id, Number(id)),
      with: { options: { where: eq(s.experienceOptions.isActive, true), orderBy: [asc(s.experienceOptions.sort)] }, locations: { orderBy: [asc(s.experienceLocations.sort)] } },
    });
    if (!row) notFound();
    experience = row;
  }

  return (
    <>
      <Link href="/admin/experiences" className="text-sm text-muted hover:text-ink">
        ← Experiences
      </Link>
      <AdminTitle title={experience ? experience.title : "New experience"}>
        {experience && (
          <Link href={`/experiences/${experience.slug}`} target="_blank" className="btn btn-outline btn-sm">
            View on site ↗
          </Link>
        )}
      </AdminTitle>
      {saved && <p className="mb-6 rounded-2xl bg-sage-mist px-5 py-3 text-sm text-moss">Saved.</p>}
      <ExperienceForm
        experience={
          experience && {
            id: experience.id,
            title: experience.title,
            slug: experience.slug,
            summary: experience.summary,
            description: experience.description,
            whyWeLoveIt: experience.whyWeLoveIt ?? "",
            included: experience.included.join("\n"),
            goodToKnow: experience.goodToKnow.join("\n"),
            citySlug: experience.citySlug,
            categories: experience.categorySlugs,
            recipients: experience.recipientTags,
            occasions: experience.occasionTags,
            images: experience.images.join("\n"),
            isBestseller: experience.isBestseller,
            isNew: experience.isNew,
            isActive: experience.isActive,
            seasonNote: experience.seasonNote ?? "",
            minAge: experience.minAge ? String(experience.minAge) : "",
            options: experience.options.map((o) => `${o.label} | ${o.people} | ${o.duration} | ${o.priceCents / 100}`).join("\n"),
            locations: experience.locations.map((l) => `${l.name} | ${l.address} | ${l.schedule ?? ""}`).join("\n"),
          }
        }
        categories={categories.map((c) => ({ value: c.slug, label: c.name }))}
        cities={cities.map((c) => ({ value: c.slug, label: c.name }))}
        recipientTags={recipientTags}
        occasionTags={occasions.map((o) => ({ value: o.tag, label: o.label }))}
      />
    </>
  );
}
