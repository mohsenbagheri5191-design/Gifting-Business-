import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/CatalogView";
import { findOccasion } from "@/lib/taxonomy";
import type { SP } from "@/lib/search-params";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const o = findOccasion((await params).slug);
  return o ? { title: o.title, description: `${o.blurb} ${o.title} in Toronto — add up to five experiences, pay for one.` } : {};
}

export default async function OccasionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const o = findOccasion(slug);
  if (!o) notFound();
  return (
    <CatalogView
      searchParams={await searchParams}
      fixed={{ occasion: slug }}
      eyebrow="Occasion"
      title={o.title}
      description={`${o.blurb} Put a few ideas in one gift and let them choose — you pay only for the most expensive.`}
      image={o.image}
    />
  );
}
