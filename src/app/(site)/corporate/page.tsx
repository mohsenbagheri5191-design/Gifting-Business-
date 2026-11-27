import type { Metadata } from "next";
import Link from "next/link";
import { Award, Briefcase, CalendarHeart, Gift, Handshake, HeartHandshake, PartyPopper, Sparkles, Trophy } from "lucide-react";
import { getCategories } from "@/lib/catalog";
import { site } from "@/lib/config";
import { IMG } from "@/lib/db/seed-data";
import { Img } from "@/components/Img";
import { LeadForm } from "@/components/LeadForm";
import { FaqList, SectionHeading } from "@/components/sections";

export const metadata: Metadata = {
  title: "Corporate gifts",
  description: "Experience gifts for employees, clients and partners — branded certificates, bulk codes and one invoice.",
};

const uses = [
  [CalendarHeart, "Birthdays & milestones"],
  [Trophy, "Recognition & awards"],
  [Award, "Long-service anniversaries"],
  [Gift, "Holiday gifts"],
  [PartyPopper, "Event prizes & giveaways"],
  [Sparkles, "Sales incentives"],
  [HeartHandshake, "Employee benefits"],
  [Handshake, "Client & partner thank-yous"],
  [Briefcase, "Onboarding & welcome gifts"],
] as const;

export default async function CorporatePage() {
  const categories = (await getCategories()).filter((c) => ["spa", "dining", "workshops", "tastings", "adventure", "getaways", "nights-out", "cooking"].includes(c.slug));
  return (
    <>
      <section className="relative overflow-hidden bg-forest text-linen">
        <Img src={IMG.friendsDinner} alt="" priority className="absolute inset-0 h-full w-full object-cover opacity-30" sizes="100vw" />
        <div className="container-page relative py-24 sm:py-32">
          <p className="eyebrow !text-sage">Corporate gifts</p>
          <h1 className="mt-4 max-w-3xl text-[2.8rem] leading-[1.03] text-linen sm:text-7xl">Gifts your team will actually remember</h1>
          <p className="mt-5 max-w-xl text-lg text-linen/80">
            Thank, reward and celebrate with experiences instead of things. Everyone chooses what they love — you get one simple order and one invoice.
          </p>
          <a href="#enquire" className="btn btn-light mt-8">
            Request a proposal
          </a>
        </div>
      </section>

      <section className="container-page mt-20">
        <SectionHeading eyebrow="Popular choices" title="Experiences that suit every team" />
        <div className="scroll-row -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="group w-[220px]">
              <div className="arch aspect-[3/4] bg-sand">
                <Img src={c.image} alt="" sizes="220px" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <p className="mt-3 text-center font-display text-lg">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page mt-24">
        <SectionHeading eyebrow="When teams use Cadeau" title="For every reason to say thank you" />
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {uses.map(([Icon, label]) => (
            <li key={label} className="flex items-center gap-4 rounded-[1.5rem] border border-line bg-paper p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage-mist text-moss">
                <Icon className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <span className="font-semibold">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-24 bg-sand/60 py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Gift formats" title="Three ways to give" />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["A choice of experiences", "Curate up to five experiences per gift. Each person chooses the one they love — you pay for one."],
              ["One signature experience", "The same unforgettable experience for everyone: a team sail, a tasting menu, a spa day."],
              ["Mixed budgets, one order", "Different values for different people, branded with your logo and message, delivered as bulk codes or printed boxes."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-[2rem] bg-paper p-8">
                <h3 className="text-3xl">{t}</h3>
                <p className="mt-3 text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              ["You choose", "Pick experiences, budgets and branding with your account manager."],
              ["We deliver", "Codes by email or spreadsheet, or printed gift boxes to your office or each recipient."],
              ["They choose", "Recipients pick their experience and dates on our site."],
              ["They go", "We confirm with the venue. You get the glory."],
            ].map(([t, d], i) => (
              <div key={t} className="rounded-[1.5rem] border border-line bg-paper p-6">
                <p className="font-display text-3xl text-clay">0{i + 1}</p>
                <h4 className="mt-3 text-xl">{t}</h4>
                <p className="mt-1 text-sm text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="enquire" className="container-page mt-24 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow">Let&apos;s talk</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">Request a proposal</h2>
          <p className="mt-4 text-ink-soft">Tell us about your team, budget and timing. We&apos;ll reply within one business day with ideas and pricing.</p>
          <p className="mt-6 text-sm text-ink-soft">
            Prefer email? <a href={`mailto:${site.corporateEmail}`} className="underline underline-offset-4">{site.corporateEmail}</a>
          </p>
        </div>
        <div className="lg:col-span-7">
          <LeadForm type="corporate" showCompany submitLabel="Request a proposal" messageLabel="Team size, budget per person, occasion and timing" />
        </div>
      </section>

      <section className="container-page mt-24 grid gap-10 lg:grid-cols-12">
        <h2 className="text-4xl lg:col-span-4">Corporate questions</h2>
        <FaqList
          className="lg:col-span-8"
          items={[
            { q: "Can you add our logo and message?", a: <p>Yes — certificates, emails and boxes can carry your logo, colours and a personal message from your leadership team.</p> },
            { q: "How do we pay?", a: <p>By card online, or by invoice with net-30 terms for approved companies.</p> },
            { q: "Can recipients swap their experience?", a: <p>Always. Every recipient can choose anything up to their gift&apos;s value, top up for something bigger, or keep the balance for later.</p> },
            { q: "Is there a minimum order?", a: <p>Corporate pricing and branding start from ten gifts. For fewer, simply order online.</p> },
          ]}
        />
      </section>
    </>
  );
}
