import { getCategories } from "@/lib/catalog";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const categories = await getCategories();
  return <HeaderClient categories={categories.map((c) => ({ slug: c.slug, name: c.name, tagline: c.tagline ?? "" }))} />;
}
