import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, Clock, MapPin, Quote, Sparkles, Sun, Users } from "lucide-react";
import { getCategories, getExperienceBySlug, listExperiences } from "@/lib/catalog";
import { toCards } from "@/lib/cards";
import { delivery, rules, site } from "@/lib/config";
import { formatDate, formatMoney, peopleLabel } from "@/lib/format";
import { Img } from "@/components/Img";
import { Stars } from "@/components/Stars";
import { ExperienceCard } from "@/components/ExperienceCard";
import { CertificateCard } from "@/components/CertificateCard";
import { Benefits, FaqList, HowItWorksStrip, SectionHeading } from "@/components/sections";
import { PurchasePanel } from "@/components/experience/PurchasePanel";
import { GiftLookTabs } from "@/components/experience/GiftLookTabs";
import { ReviewForm } from "@/components/experience/ReviewForm";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await getExperienceBySlug((await params).slug);
  if (!e) return {};
  return {
    title: `${e.title} — experience gift`,
    description: e.summary,
    openGraph: { title: e.title, description: e.summary, images: e.images[0] ? [`${e.images[0]}?auto=format&fit=crop&w=1200&q=70`] : [] },
  };
}

export default async function ExperiencePage({ params }: Props) {
  const { slug } = await params;
  const e = await getExperienceBySlug(slug);
  if (!e) notFound();

  const categories = await getCategories();
  const primarySlug = e.categorySlugs.find((c) => c !== "signature" && c !== "romance") ?? e.categorySlugs[0];
  const primary = categories.find((c) => c.slug === primarySlug);
  const similarItems = (await listExperiences({ category: primarySlug })).filter((x) => x.id !== e.id).slice(0, 3);
  const similar = await toCards(similarItems);
  const cheapest = Math.min(...e.options.map((o) => o.priceCents));
  const maxPeople = Math.max(...e.options.map((o) => o.people));

  const facts = [
    { icon: Users, label: "Group size", value: maxPeople > 1 ? `1 – ${maxPeople} people` : "1 person" },
    { icon: Clock, label: "Duration", value: e.options[0].duration },
    { icon: CalendarDays, label: "Validity", value: rules.certificateValidMonths ? `${rules.certificateValidMonths} months` : "Never expires" },
    e.minAge ? { icon: Sparkles, label: "Ages", value: `${e.minAge}+` } : null,
    e.seasonNote ? { icon: Sun, label: "Season", value: e.seasonNote.replace(/^Available /, "") } : null,
  ].filter((f): f is NonNullable<typeof f> => !!f);

  const sections = [
    ["about", "About"],
    ["location", "Location"],
    ["reviews", "Reviews"],
    ["how", "How it works"],
    ["gift", "The gift"],
    ["delivery", "Delivery"],
    ["faq", "FAQ"],
  ];

  const faq = [
    { q: "How long does it last?", a: <p>{e.options.map((o) => `${o.label}: ${o.duration}`).join(" · ")}.</p> },
    { q: "How many people can take part?", a: <p>{e.options.map((o) => `${o.label}: ${peopleLabel(o.people).toLowerCase()}`).join(" · ")}.</p> },
    {
      q: "How do I pay?",
      a: <p>Securely online by card, Apple Pay or Google Pay. Companies can also pay by invoice — see <Link href="/corporate">corporate gifts</Link>.</p>,
    },
    {
      q: "Can it be delivered?",
      a: (
        <p>
          Yes — as an e-certificate by email (free, within minutes or at the time you choose) or as a gift box by same-day courier in Toronto, Canada Post Xpresspost, or pickup. See <Link href="/delivery">delivery</Link>.
        </p>
      ),
    },
    {
      q: "What if they'd prefer something else?",
      a: <p>They can swap for any experience up to the gift&apos;s value, keep any leftover balance for later, or top up for something bigger — all online at <Link href="/redeem">Redeem a gift</Link>.</p>,
    },
  ];

  return (
    <article className="pb-16 lg:pb-0">
      <nav aria-label="Breadcrumb" className="container-page pt-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
          </li>
          <ChevronRight className="h-3.5 w-3.5" />
          {primary && (
            <>
              <li>
                <Link href={`/category/${primary.slug}`} className="hover:text-ink">
                  {primary.name}
                </Link>
              </li>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
          <li className="text-ink-soft">{e.title}</li>
        </ol>
      </nav>

      <div className="container-page mt-6 grid gap-10 lg:grid-cols-12">
        {/* gallery */}
        <div className="lg:col-span-7">
          <div className="grid gap-3 sm:grid-cols-[1fr_0.42fr]">
            <div className="overflow-hidden rounded-[2rem] bg-sand sm:row-span-2">
              <Img src={e.images[0]} alt={e.title} priority sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[4/3] h-full w-full object-cover sm:aspect-auto" />
            </div>
            {e.images.slice(1, 3).map((src, i) => (
              <div key={src} className="hidden overflow-hidden rounded-[1.5rem] bg-sand sm:block">
                <Img src={src} alt={`${e.title} — photo ${i + 2}`} sizes="22vw" className="aspect-square h-full w-full object-cover" />
              </div>
            ))}
            {e.images.length < 3 && <div className="hidden rounded-[1.5rem] bg-sage-mist sm:block" aria-hidden />}
            {e.images.length < 2 && <div className="hidden rounded-[1.5rem] bg-clay-mist sm:block" aria-hidden />}
          </div>
        </div>

        {/* purchase */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <div className="flex flex-wrap gap-2">
              {e.isBestseller && <span className="chip">Bestseller</span>}
              {e.isNew && <span className="chip">New</span>}
              {e.categorySlugs.includes("signature") && <span className="chip">Signature</span>}
              <span className="chip">
                <MapPin className="h-3.5 w-3.5" /> {e.city?.name}
              </span>
            </div>
            <h1 className="mt-4 text-[2.5rem] leading-[1.05] sm:text-5xl">{e.title}</h1>
            {e.reviewCount > 0 && (
              <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
                <Stars value={e.rating} /> {e.rating.toFixed(1)} · {e.reviewCount} review{e.reviewCount === 1 ? "" : "s"}
              </a>
            )}
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">{e.summary}</p>
            <p className="mt-2 text-sm text-muted">From {formatMoney(cheapest)}</p>
            <div className="mt-6">
              <PurchasePanel
                experience={{
                  id: e.id,
                  slug: e.slug,
                  title: e.title,
                  image: e.images[0] ?? null,
                  options: e.options.map((o) => ({ id: o.id, label: o.label, people: o.people, duration: o.duration, priceCents: o.priceCents })),
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* section nav */}
      <nav className="sticky top-[7.6rem] z-20 mt-14 border-y border-line bg-linen/90 backdrop-blur-md" aria-label="On this page">
        <div className="container-page flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
          {sections.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-full px-4 py-2 text-sm text-ink-soft transition hover:bg-sand hover:text-ink">
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="container-page">
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {facts.map((f) => (
            <li key={f.label} className="rounded-[1.5rem] border border-line bg-paper p-5">
              <f.icon className="h-5 w-5 text-clay" strokeWidth={1.6} />
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted">{f.label}</p>
              <p className="mt-1 font-semibold">{f.value}</p>
            </li>
          ))}
        </ul>

        <section id="about" className="mt-16 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-3">About the experience</p>
            <h2 className="text-4xl">What to expect</h2>
            <div className="prose-calm mt-6 text-[1.05rem]">
              {e.description.split(/\n\n+/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {e.included.length > 0 && (
              <>
                <h3 className="mt-10 text-2xl">What&apos;s included</h3>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {e.included.map((i) => (
                    <li key={i} className="flex gap-3 rounded-2xl bg-paper px-4 py-3 text-[0.95rem]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" /> {i}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <aside className="space-y-6 lg:col-span-5">
            {e.whyWeLoveIt && (
              <div className="rounded-[2rem] bg-sage-mist p-8">
                <Quote className="h-7 w-7 text-moss" strokeWidth={1.4} />
                <p className="mt-4 font-display text-2xl leading-snug">{e.whyWeLoveIt}</p>
                <p className="mt-4 text-sm text-ink-soft">— Why we chose it</p>
              </div>
            )}
            {e.goodToKnow.length > 0 && (
              <div className="rounded-[2rem] border border-line bg-paper p-8">
                <h3 className="text-2xl">Good to know</h3>
                <ul className="mt-4 space-y-2.5 text-[0.95rem] text-ink-soft">
                  {e.goodToKnow.map((g) => (
                    <li key={g} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" /> {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </section>

        <section id="location" className="mt-20">
          <SectionHeading eyebrow="Where" title={`Location${e.locations.length > 1 ? "s" : ""}`} description="The exact address and arrival details are in the booking confirmation. Where there's more than one venue, the recipient chooses." />
          <div className="grid gap-4 md:grid-cols-2">
            {e.locations.map((l) => (
              <div key={l.id} className="rounded-[1.75rem] border border-line bg-paper p-7">
                <MapPin className="h-5 w-5 text-clay" strokeWidth={1.6} />
                <h3 className="mt-4 text-2xl">{l.name}</h3>
                <p className="mt-1 text-ink-soft">{l.address}</p>
                {l.schedule && <p className="mt-3 text-sm text-muted">Bookable: {l.schedule}</p>}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address.split("—")[0])}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-moss underline underline-offset-4"
                >
                  View area on map
                </a>
              </div>
            ))}
          </div>
        </section>

        <section id="reviews" className="mt-20">
          <SectionHeading
            eyebrow="Reviews"
            title={e.reviewCount ? `${e.rating.toFixed(1)} from ${e.reviewCount} review${e.reviewCount === 1 ? "" : "s"}` : "Be the first to review"}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {e.reviews.map((r) => (
              <figure key={r.id} className="card p-6">
                <div className="flex items-center justify-between">
                  <Stars value={r.rating} />
                  <span className="text-xs text-muted">{formatDate(r.createdAt, { year: undefined })}</span>
                </div>
                <blockquote className="mt-3 text-[0.98rem] leading-relaxed">{r.body}</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">{r.authorName}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8">
            <ReviewForm experienceId={e.id} />
          </div>
        </section>

        <section id="how" className="mt-20">
          <SectionHeading eyebrow="Giving it" title="How gifting works" action={{ href: "/how-it-works", label: "More detail" }} />
          <HowItWorksStrip />
          <div className="mt-6">
            <Benefits />
          </div>
        </section>

        <section id="gift" className="mt-20">
          <SectionHeading eyebrow="Presentation" title="What the gift looks like" />
          <GiftLookTabs
            certificate={
              <CertificateCard
                recipientName="Someone lovely"
                fromName="You"
                message="I thought of you the moment I saw this."
                items={[{ title: e.title, optionLabel: e.options[0].label }]}
              />
            }
          />
        </section>

        <section id="delivery" className="mt-20">
          <SectionHeading eyebrow="Delivery" title="How it arrives" action={{ href: "/delivery", label: "Delivery & payment" }} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.values(delivery).map((d) => (
              <div key={d.id} className="rounded-[1.75rem] border border-line bg-paper p-6">
                <p className="font-display text-xl">{d.name}</p>
                <p className="mt-2 text-sm text-ink-soft">{d.eta}</p>
                <p className="mt-4 font-semibold">{d.priceCents ? formatMoney(d.priceCents) : "Free"}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mt-20">
          <SectionHeading eyebrow="Questions" title="Good questions" />
          <FaqList items={faq} />
        </section>

        {similar.length > 0 && (
          <section className="mt-24">
            <SectionHeading eyebrow="You may also like" title={`More ${primary?.name.toLowerCase() ?? "experiences"}`} action={primary ? { href: `/category/${primary.slug}`, label: "See all" } : undefined} />
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {similar.map((c) => (
                <ExperienceCard key={c.id} e={c} />
              ))}
            </div>
          </section>
        )}
        <p className="sr-only">Sold by {site.name}</p>
      </div>
    </article>
  );
}
