import { listExperiences } from "@/lib/catalog";
import { toCards } from "@/lib/cards";
import { json } from "@/lib/api";

/** Card data for a list of experience ids (used by the wishlist). */
export async function GET(req: Request) {
  return json(async () => {
    const ids = (new URL(req.url).searchParams.get("ids") ?? "")
      .split(",")
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0)
      .slice(0, 60);
    if (!ids.length) return { items: [] };
    return { items: await toCards(await listExperiences({ ids })) };
  });
}
