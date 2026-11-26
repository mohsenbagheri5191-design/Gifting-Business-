import type { Metadata } from "next";
import { CodeForm } from "@/components/redeem/CodeForm";
import { FaqList } from "@/components/sections";
import { Img } from "@/components/Img";
import { IMG } from "@/lib/db/seed-data";
import { rules } from "@/lib/config";

export const metadata: Metadata = {
  title: "Redeem a gift",
  description: "Received a Keepsake? Enter your 14-character code to choose your experience and book a date.",
};

const steps = [
  ["Enter your code", "It's on your gift card or in your email — 14 letters and numbers."],
  ["Choose your experience", "Pick one of the ideas chosen for you, or swap for anything else up to your gift's value."],
  ["Pick your dates", "Tell us two preferred dates and times. Where there are several venues, choose the one that suits you."],
  ["We confirm", "We arrange it with the venue and email your confirmation, usually within a few hours."],
];

export default async function RedeemPage({ searchParams }: { searchParams: Promise<{ check?: string }> }) {
  const { check } = await searchParams;
  const isCheck = check === "1";
  return (
    <>
      <section className="container-page grid items-center gap-12 pb-16 pt-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">{isCheck ? "Check your balance" : "Redeem a gift"}</p>
          <h1 className="mt-4 text-[2.8rem] leading-[1.03] sm:text-7xl">{isCheck ? "How much is left on your gift?" : "Someone thought of you."}</h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            {isCheck ? "Enter your code to see the remaining balance." : "Enter your gift code to see what's inside — then choose the experience you'd love and the dates that suit you."}
          </p>
          <div className="mt-10 max-w-xl">
            <CodeForm mode={isCheck ? "check" : "redeem"} />
          </div>
        </div>
        <div className="hidden lg:col-span-5 lg:block">
          <div className="arch mx-auto aspect-[4/5] max-w-[420px]">
            <Img src={IMG.kraftGift} alt="Hands holding a wrapped gift" priority sizes="420px" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="bg-sand/60 py-20">
        <div className="container-page">
          <h2 className="text-4xl sm:text-5xl">How redeeming works</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([t, d], i) => (
              <li key={t} className="rounded-[1.75rem] bg-paper p-7">
                <span className="font-display text-4xl text-clay">0{i + 1}</span>
                <h3 className="mt-4 text-2xl">{t}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page mt-20 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="eyebrow">Not quite right?</p>
          <h2 className="mt-3 text-4xl">Your gift, your way</h2>
          <p className="mt-3 text-ink-soft">Every Keepsake is flexible. Here&apos;s what you can do with yours.</p>
        </div>
        <div className="lg:col-span-8">
          <FaqList
            items={[
              { q: "Choose something else, up to the gift's value", a: <p>Not feeling the ideas in your gift? Browse everything on Keepsake — anything priced up to your gift&apos;s value is fully covered.</p> },
              { q: "Upgrade by paying the difference", a: <p>Fallen for something bigger — or want the &ldquo;for two&rdquo; version? Choose it and pay only the difference online when you book.</p> },
              { q: "Split it across several experiences", a: <p>If you choose something that costs less than your gift, the rest stays on the same code. Use it for another experience whenever you like.</p> },
              {
                q: "How long do I have?",
                a: <p>{rules.certificateValidMonths ? `Your gift is valid for ${rules.certificateValidMonths} months from purchase.` : "Your gift never expires — take all the time you need."} Popular experiences book up, so we recommend choosing dates a few weeks ahead.</p>,
              },
              { q: "I lost my code", a: <p>No problem — contact us with the buyer&apos;s name or email and we&apos;ll find it for you.</p> },
            ]}
          />
        </div>
      </section>
    </>
  );
}
