import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import type { SP } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "All experiences",
  description: "Browse every Keepsake experience in Toronto and beyond — dining, spa days, adventures, workshops, getaways and more.",
};

export default async function ExperiencesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  return (
    <CatalogView
      searchParams={sp}
      eyebrow={q ? "Search" : "The collection"}
      title={q ? `Experiences matching “${q}”` : "Every experience, chosen with care"}
      description={q ? undefined : "Dinners worth dressing up for, quiet spa days, wild adventures and hands-on workshops — each one tried by our team before it's listed."}
    />
  );
}
