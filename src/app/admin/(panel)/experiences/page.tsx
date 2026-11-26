import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { formatMoney } from "@/lib/format";
import { toggleExperience } from "../../actions";
import { AdminTitle, Badge, Panel, Td, Th } from "../ui";
import { Img } from "@/components/Img";

export const metadata = { title: "Experiences" };

export default async function ExperiencesAdmin() {
  const db = await getDb();
  const rows = await db.query.experiences.findMany({ with: { options: true, city: true }, orderBy: [asc(s.experiences.sort), asc(s.experiences.id)] });
  return (
    <>
      <AdminTitle title="Experiences">
        <Link href="/admin/experiences/new" className="btn btn-primary btn-sm">
          Add experience
        </Link>
      </AdminTitle>
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr>
              <Th />
              <Th>Experience</Th>
              <Th>Location</Th>
              <Th>From</Th>
              <Th>Reviews</Th>
              <Th>Gifted</Th>
              <Th>Visible</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const active = e.options.filter((o) => o.isActive);
              return (
                <tr key={e.id}>
                  <Td className="w-20">
                    <Img src={e.images[0]} alt="" sizes="80px" className="h-12 w-16 rounded-lg object-cover" />
                  </Td>
                  <Td>
                    <Link href={`/admin/experiences/${e.id}`} className="font-semibold text-moss">
                      {e.title}
                    </Link>
                    <div className="text-xs text-muted">{e.categorySlugs.join(", ")}</div>
                  </Td>
                  <Td>{e.city?.name}</Td>
                  <Td>{active.length ? formatMoney(Math.min(...active.map((o) => o.priceCents))) : "—"}</Td>
                  <Td>
                    {e.reviewCount} · {e.rating.toFixed(1)}
                  </Td>
                  <Td>{e.giftedCount}</Td>
                  <Td>
                    <form action={toggleExperience} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="active" value={e.isActive ? "false" : "true"} />
                      <Badge tone={e.isActive ? "good" : "warn"}>{e.isActive ? "live" : "hidden"}</Badge>
                      <button className="text-xs text-muted underline">{e.isActive ? "hide" : "publish"}</button>
                    </form>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
