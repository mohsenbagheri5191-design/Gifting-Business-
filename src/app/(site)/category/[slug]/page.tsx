import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/CatalogView";
import { getCategory } from "@/lib/catalog";
import type { SP } from "@/lib/search-params";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCategory((await params).slug);
  return c ? { title: `${c.name} experience gifts`, description: `${c.tagline}. ${c.name} experiences to give or book in Toronto.` } : {};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  return (
    <CatalogView
      searchParams={await searchParams}
      fixed={{ category: slug }}
      hide={["category"]}
      eyebrow="Category"
      title={category.name}
      description={category.description ?? `${category.tagline}. Give one as a gift — or put several in one gift and let them choose.`}
      image={category.image}
    />
  );
}
