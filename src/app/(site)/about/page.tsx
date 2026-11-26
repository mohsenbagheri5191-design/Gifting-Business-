import type { Metadata } from "next";
import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { IMG } from "@/lib/db/seed-data";
import { rules, site } from "@/lib/config";
import { Img } from "@/components/Img";

export const metadata: Metadata = { title: "Our story", description: `Why ${site.name} exists, and the standards behind every experience we list.` };

export default async function AboutPage() {
  const db = await getDb();
  const [[{ n: experiences }], [{ n: categories }]] = await Promise.all([
    db.select({ n: count() }).from(s.experiences).where(eq(s.experiences.isActive, true)),
    db.select({ n: count() }).from(s.categories),
  ]);

  const standards = [
    ["We try it first", "Someone from our team experiences every listing before it goes live — the welcome, the venue, the details."],
    ["Honest pictures", "We describe things as they are, so expectations and reality match."],
    ["Fair prices", "Our prices match what the venue charges directly. No mark-ups for choosing us."],
    ["Wrapped with care", "Every box is hand-finished in our Toronto studio, and every e-certificate is designed to be kept."],
    [rules.certificateValidMonths ? `${rules.certificateValidMonths} months to choose` : "No expiry", rules.certificateValidMonths ? "Plenty of time to choose, book and enjoy." : "Gifts keep their full value until they're used — no rush, no fine print."],
    ["Freedom to choose", "Swap, split or upgrade: the person you're celebrating always gets something they truly want."],
  ];

  return (
    <>
      <section className="container-page grid items-center gap-12 pb-16 pt-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="eyebrow">Our story</p>
          <h1 className="mt-4 text-[2.8rem] leading-[1.03] sm:text-7xl">The best gifts are moments.</h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">
            Things get lost in drawers. Moments stay. {site.name} was created in Toronto to make giving experiences as easy — and as beautiful — as giving anything else, without ever having to guess what someone would love.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            So we built the gift around choice: put a few ideas in one gift, pay for just one, and let the person you&apos;re celebrating choose. It&apos;s thoughtful on your side and generous on theirs.
          </p>
        </div>
        <div className="lg:col-span-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="arch aspect-[3/4]">
              <Img src={IMG.potteryWheel} alt="" priority sizes="300px" className="h-full w-full object-cover" />
            </div>
            <div className="arch mt-16 aspect-[3/4]">
              <Img src={IMG.lakeDock} alt="" priority sizes="300px" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-forest py-20 text-linen">
        <div className="container-page grid gap-8 text-center sm:grid-cols-3">
          {[
            [String(experiences), "experiences, each tried by our team"],
            [String(categories), "ways to spend a good day"],
            [String(rules.maxGiftItems), "ideas per gift — you pay for one"],
          ].map(([n, label]) => (
            <div key={label}>
              <p className="font-display text-7xl text-linen">{n}</p>
              <p className="mt-2 text-linen/70">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-24">
        <p className="eyebrow">Our standards</p>
        <h2 className="mt-3 max-w-2xl text-4xl sm:text-5xl">What you can always count on</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {standards.map(([t, d], i) => (
            <div key={t} className="rounded-[2rem] border border-line bg-paper p-8">
              <p className="font-display text-3xl text-clay">0{i + 1}</p>
              <h3 className="mt-4 text-2xl">{t}</h3>
              <p className="mt-2 text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-24">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-sage-mist lg:grid-cols-2">
          <Img src={IMG.flowerShop} alt="" sizes="(min-width:1024px) 50vw, 100vw" className="aspect-[16/11] h-full w-full object-cover" />
          <div className="p-9 sm:p-12">
            <h2 className="text-4xl">Partner with us</h2>
            <p className="mt-3 text-ink-soft">Run a restaurant, studio, spa or adventure people never forget? We&apos;d love to meet you and introduce your experience to thoughtful gift-givers across Toronto.</p>
            <Link href="/contact" className="btn btn-primary mt-6">
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
