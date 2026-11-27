import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { getCategories, getRecentReviews, getReviewStats, listExperiences } from "@/lib/catalog";
import { toCards } from "@/lib/cards";
import { IMG } from "@/lib/db/seed-data";
import { occasions, recipients, selfCollections } from "@/lib/taxonomy";
import { rules } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { ExperienceCard } from "@/components/ExperienceCard";
import { Img } from "@/components/Img";
import { CertificateCard } from "@/components/CertificateCard";
import { BoxColorPicker } from "@/components/BoxColorPicker";
import { Stars } from "@/components/Stars";
import { Benefits, HowItWorksStrip, SectionHeading } from "@/components/sections";

export default async function HomePage() {
  const [experiences, categories, reviews, stats] = await Promise.all([
    listExperiences({ sort: "popular" }),
    getCategories(),
    getRecentReviews(6),
    getReviewStats(),
  ]);
  const cards = await toCards(experiences.slice(0, 7));
  const finder = [
    ...recipients.filter((r) => r.image).map((r) => ({ href: `/gifts/${r.slug}`, label: r.label, image: r.image! })),
    ...occasions.filter((o) => o.image).map((o) => ({ href: `/occasions/${o.slug}`, label: o.label, image: o.image! })),
  ];
  const featuredCats = ["dining", "spa", "water", "workshops", "tastings", "getaways", "sky", "nights-out"]
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden">
        <svg className="pointer-events-none absolute -left-40 top-24 h-[560px] w-[560px] text-sand" viewBox="0 0 200 200" aria-hidden>
          <path fill="currentColor" d="M42.8,-55.4C55.1,-45.2,64.5,-31.4,68.4,-15.9C72.3,-0.4,70.7,16.8,63.3,30.9C55.9,45,42.7,56,27.7,62.6C12.7,69.2,-4.1,71.4,-20.7,67.6C-37.3,63.8,-53.7,54,-63.4,39.6C-73.1,25.2,-76.1,6.2,-71.9,-10.7C-67.7,-27.6,-56.3,-42.4,-42.4,-52.4C-28.5,-62.4,-12,-67.6,2.4,-70.5C16.8,-73.4,30.5,-65.6,42.8,-55.4Z" transform="translate(100 100)" />
        </svg>
        <div className="container-page relative grid items-center gap-14 pb-16 pt-10 sm:pt-14 lg:grid-cols-12 lg:pb-24">
          <div className="animate-rise lg:col-span-6">
            <p className="eyebrow">Experience gifts · Toronto</p>
            <h1 className="mt-5 text-[3.1rem] leading-[1.04] sm:text-7xl xl:text-[5.4rem]">
              Give a moment they&apos;ll <em className="not-italic text-clay">keep</em>.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
              Put up to {rules.maxGiftItems} experiences in one gift — a tasting menu, a spa day, a sail at sunset. You pay only for the most expensive. They choose the one they love.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/experiences" className="btn btn-primary px-7">
                Find a gift <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/redeem" className="btn btn-outline px-7">
                I received a gift
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Rated</dt>
                <dd className="mt-1 font-display text-3xl">
                  {stats.average.toFixed(1)}
                  <span className="ml-1 text-xl text-gold">★</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Experiences</dt>
                <dd className="mt-1 font-display text-3xl">{experiences.length}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Validity</dt>
                <dd className="mt-1 font-display text-3xl">{rules.certificateValidMonths > 0 ? `${rules.certificateValidMonths} mo` : "Forever"}</dd>
              </div>
            </dl>
          </div>

          <div className="relative lg:col-span-6">
            <div className="arch relative mx-auto aspect-[4/5] w-full max-w-[540px] lg:ml-auto lg:mr-0">
              <Img src={IMG.lakeDock} alt="A quiet dock on a forest lake at dawn" priority sizes="(min-width: 1024px) 540px, 92vw" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -left-2 bottom-8 w-[min(330px,80%)] animate-rise rounded-[1.6rem] border border-line bg-paper/95 p-5 shadow-[0_30px_60px_-30px_rgba(31,36,30,0.55)] backdrop-blur sm:left-0 lg:-left-10">
              <p className="eyebrow">For Yashar · from Dexter</p>
              <p className="mt-2 font-display text-[1.35rem] leading-snug">Choose one of three</p>
              <ul className="mt-3 space-y-1.5 text-[0.9rem] text-ink-soft">
                {["Lakeside Dinner with a View", "Comedy Night Out", "Pottery Wheel Workshop"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-sage" /> {t}
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-xl border border-dashed border-clay/60 bg-linen px-3 py-2 text-center font-mono text-sm tracking-[0.16em]">7KQ2M9X-RBWD4TH</p>
            </div>
            <div className="absolute right-2 top-2 hidden sm:block lg:-right-4">
              <RotatingBadge />
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- gift finder */}
      <section className="container-page" aria-label="Find a gift by recipient or occasion">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-3xl sm:text-4xl">Who are you celebrating?</h2>
          <Link href="/experiences" className="hidden font-semibold text-moss sm:inline">
            Browse everything
          </Link>
        </div>
        <div className="scroll-row -mx-4 px-4 sm:mx-0 sm:px-0">
          {finder.map((t) => (
            <Link key={t.href} href={t.href} className="group w-[168px] sm:w-[196px]">
              <div className="arch aspect-[3/4] bg-sand">
                <Img src={t.image} alt="" sizes="200px" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <p className="mt-3 text-center font-display text-lg">{t.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- how it works */}
      <section className="container-page mt-24">
        <SectionHeading
          eyebrow="How it works"
          title={<>One gift. Many possibilities.</>}
          description="Not sure what they'd love? You don't have to be. Add several ideas and let them choose — the price is only ever the most expensive one."
          action={{ href: "/how-it-works", label: "The details" }}
        />
        <HowItWorksStrip />
      </section>

      {/* ------------------------------------------------------ bestsellers */}
      <section className="container-page mt-24">
        <SectionHeading eyebrow="Most loved" title="Experiences people keep talking about" action={{ href: "/experiences", label: `All ${experiences.length} experiences` }} />
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
          {cards.slice(0, 3).map((c, i) => (
            <ExperienceCard key={c.id} e={c} priority={i < 2} />
          ))}
          <PromoTile />
          {cards.slice(3, 7).map((c) => (
            <ExperienceCard key={c.id} e={c} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- categories */}
      <section className="container-page mt-28">
        <SectionHeading eyebrow="Browse by mood" title="Every kind of good time" action={{ href: "/experiences", label: "See all categories" }} />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featuredCats.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="group relative overflow-hidden rounded-[1.75rem] bg-sand">
              <div className="aspect-[4/5]">
                <Img src={c.image} alt="" sizes="(min-width:1024px) 25vw, 50vw" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-forest/75 via-forest/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-linen">
                <p className="font-display text-2xl leading-tight">{c.name}</p>
                <p className="mt-1 text-sm text-linen/80">{c.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------- the gift itself */}
      <section className="mt-28 bg-sand/60 py-24">
        <div className="container-page">
          <SectionHeading
            align="center"
            eyebrow="Wrapped with care"
            title="A gift that feels like one"
            description="Hand-finished gift boxes in five quiet colourways — or an e-certificate that arrives at the exact minute you choose, with your words on it."
          />
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="rounded-[2rem] bg-paper p-8 sm:p-12">
              <BoxColorPicker />
              <ul className="mx-auto mt-8 max-w-sm space-y-2 text-[0.95rem] text-ink-soft">
                {["Linen-textured box with cotton ribbon", "Letterpress card with their 14-character code", "Your message, printed on a separate card", "Same-day courier in Toronto, or Xpresspost across Canada"].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-sage" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <CertificateCard
              recipientName="Yashar"
              fromName="Dexter"
              message="Happy birthday, brother. Pick the one that sounds like the best night out."
              items={[
                { title: "Lakeside Dinner with a View", optionLabel: "For two" },
                { title: "Comedy Night Out", optionLabel: "For two" },
                { title: "Pottery Wheel Workshop", optionLabel: "For two" },
              ]}
              code="7KQ2M9XRBWD4TH"
            />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- benefits */}
      <section className="relative overflow-hidden bg-forest py-24 text-linen">
        <div className="container-page">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow !text-sage">Why Cadeau</p>
            <h2 className="mt-3 text-[2.1rem] text-linen sm:text-5xl">Thoughtful by design</h2>
          </div>
          <Benefits dark />
        </div>
      </section>

      {/* --------------------------------------------------------- reviews */}
      {reviews.length > 0 && (
        <section className="container-page mt-24">
          <SectionHeading
            eyebrow="Kind words"
            title={
              <span className="flex flex-wrap items-baseline gap-x-4">
                {stats.average.toFixed(1)} out of 5
                <Stars value={stats.average} size={22} />
              </span>
            }
            description={`From ${stats.count} reviews by people who gave — and received — a Cadeau.`}
            action={{ href: "/reviews", label: "Read all reviews" }}
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="card flex flex-col p-7">
                <Stars value={r.rating} />
                <blockquote className="mt-4 flex-1 font-display text-[1.2rem] leading-relaxed">“{r.body}”</blockquote>
                <figcaption className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
                  <span className="font-semibold">{r.authorName}</span>
                  <Link href={`/experiences/${r.experienceSlug}`} className="truncate text-muted hover:text-moss">
                    {r.experienceTitle}
                  </Link>
                </figcaption>
                <p className="sr-only">{formatDate(r.createdAt)}</p>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------- yourself + corporate */}
      <section className="container-page mt-24 grid gap-5 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-[2rem] bg-sage-mist p-9 sm:p-12">
          <p className="eyebrow">Not a gift?</p>
          <h2 className="mt-3 text-4xl">Book something for yourself</h2>
          <p className="mt-3 max-w-md text-ink-soft">Choose an experience and your preferred dates — we&apos;ll confirm the booking for you.</p>
          <div className="mt-7 flex flex-wrap gap-2">
            {selfCollections.map((c) => (
              <Link key={c.slug} href={`/experiences?${new URLSearchParams(c.query as Record<string, string>)}&for=self`} className="chip bg-paper/80 px-4 py-2 text-[0.85rem] hover:border-sage">
                {c.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] bg-forest text-linen">
          <Img src={IMG.teamMeeting} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" sizes="(min-width:1024px) 50vw, 100vw" />
          <div className="relative p-9 sm:p-12">
            <p className="eyebrow !text-sage">For teams</p>
            <h2 className="mt-3 text-4xl text-linen">Corporate gifts people actually use</h2>
            <p className="mt-3 max-w-md text-linen/80">Reward, thank and celebrate with experiences — branded certificates, bulk codes and one invoice.</p>
            <Link href="/corporate" className="btn btn-light mt-7">
              Corporate gifting <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- SEO */}
      <section className="container-page mt-24">
        <details className="group rounded-[2rem] border border-line bg-paper p-8 sm:p-10">
          <summary className="flex items-center justify-between gap-6">
            <h2 className="text-2xl sm:text-3xl">Experience gifts in Toronto, explained</h2>
            <span className="chip shrink-0 group-open:hidden">Read more</span>
            <span className="chip hidden shrink-0 group-open:inline-flex">Close</span>
          </summary>
          <div className="prose-calm mt-6 grid gap-x-12 md:grid-cols-2">
            <div>
              <p>
                The best gifts aren&apos;t things — they&apos;re moments. A tasting menu at the chef&apos;s counter, a sunset sail past the Toronto Islands, an afternoon at the pottery wheel: experiences become stories, and stories are what people keep.
              </p>
              <p>
                Cadeau makes giving them simple. Instead of guessing, add up to {rules.maxGiftItems} experiences to one gift. You pay only for the most expensive one, and the person you&apos;re celebrating chooses the one that suits them — or swaps it for anything else up to the gift&apos;s value.
              </p>
            </div>
            <div>
              <p>
                Every gift carries a unique 14-character code. Your recipient enters it on our <Link href="/redeem">redeem page</Link>, chooses their experience and preferred dates, and our team confirms the booking with the venue. Anything left over stays on the same code for next time.
              </p>
              <p>
                Gifts arrive as an e-certificate — instantly or at the time you choose — or as a hand-finished gift box by same-day courier in Toronto, Canada Post across the country, or pickup from our studio. Looking for ideas? Browse gifts <Link href="/gifts/for-her">for her</Link>, <Link href="/gifts/for-him">for him</Link>, <Link href="/gifts/for-couples">for couples</Link> or for a <Link href="/occasions/birthday">birthday</Link>.
              </p>
            </div>
          </div>
        </details>
      </section>
    </>
  );
}

function PromoTile() {
  return (
    <div className="relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[1.75rem] bg-moss p-8 text-linen">
      <svg className="absolute -right-16 -top-10 h-72 w-72 text-sage/35" viewBox="0 0 200 200" aria-hidden>
        <path fill="currentColor" d="M48.9,-61.5C61.6,-49.2,69.1,-32.4,72.5,-14.7C75.9,3,75.2,21.6,66.8,35.6C58.4,49.6,42.3,59,25.2,65.9C8.1,72.8,-10,77.2,-27.4,72.8C-44.8,68.3,-61.5,55,-70.1,37.8C-78.7,20.6,-79.2,-0.5,-72.6,-18.6C-66,-36.7,-52.3,-51.8,-36.9,-63.4C-21.5,-75,-4.4,-83.1,12.4,-80.6C29.2,-78.1,36.2,-73.8,48.9,-61.5Z" transform="translate(100 100)" />
      </svg>
      <svg className="absolute right-8 top-8 h-16 w-16 text-linen/80" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <rect x="10" y="26" width="44" height="30" rx="3" />
        <path d="M6 18h52v8H6zM32 18v38M32 18c-6-10-18-10-16-2 1 4 10 3 16 2Zm0 0c6-10 18-10 16-2-1 4-10 3-16 2Z" />
      </svg>
      <p className="relative font-display text-[2rem] leading-tight">Can&apos;t decide? Don&apos;t.</p>
      <p className="relative mt-3 text-linen/80">
        Add up to {rules.maxGiftItems} experiences to one gift. They choose the one they love — you pay for one.
      </p>
      <Link href="/how-it-works" className="btn btn-light relative mt-6 self-start">
        How it works
      </Link>
    </div>
  );
}

function RotatingBadge() {
  return (
    <div className="relative grid h-32 w-32 place-items-center rounded-full bg-clay text-white shadow-lg">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-[spin_24s_linear_infinite]" aria-hidden>
        <defs>
          <path id="circle" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        {/* Spacing tuned so the phrase fills the 232-unit circle exactly; the no-break space keeps a gap before it repeats. */}
        <text fontSize="9.2" letterSpacing="2.1" fill="currentColor" fontFamily="var(--font-sans)" fontWeight="600">
          <textPath href="#circle">{"PAY FOR ONE · CHOOSE FROM FIVE · "}</textPath>
        </text>
      </svg>
      <span className="font-display text-3xl">5:1</span>
    </div>
  );
}
