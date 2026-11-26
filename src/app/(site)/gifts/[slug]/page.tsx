import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/CatalogView";
import { findRecipient, recipients } from "@/lib/taxonomy";
import type { SP } from "@/lib/search-params";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = findRecipient((await params).slug);
  return r ? { title: r.title, description: `${r.title}: experience gifts they'll remember. Add up to five, pay for one.` } : {};
}

export default async function RecipientPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const r = findRecipient(slug);
  if (!r) notFound();
  const image = r.image ?? recipients.find((x) => x.group === r.group && x.image)?.image;
  return (
    <CatalogView
      searchParams={await searchParams}
      fixed={{ recipient: slug }}
      hide={["recipient"]}
      eyebrow={`Gift ideas · ${r.group}`}
      title={r.title}
      description="Not sure which one they'd love? Add a few to one gift — you pay only for the most expensive, and they choose."
      image={image}
    />
  );
}
