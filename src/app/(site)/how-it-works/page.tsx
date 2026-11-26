import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Tabs } from "@/components/Tabs";
import { FaqList } from "@/components/sections";
import { Img } from "@/components/Img";
import { IMG } from "@/lib/db/seed-data";
import { faqSections } from "@/lib/faq";
import { packaging, rules } from "@/lib/config";

export const metadata: Metadata = {
  title: "How it works",
  description: "How Keepsake experience gifts work — for the giver, the lucky recipient, and anyone booking for themselves.",
};

type Step = { title: string; text: string; image: string };

function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-6">
      {steps.map((s, i) => (
        <li key={s.title} className="grid items-center gap-6 overflow-hidden rounded-[2rem] border border-line bg-paper md:grid-cols-2">
          <Img src={s.image} alt="" sizes="(min-width:768px) 50vw, 100vw" className={`aspect-[16/10] h-full w-full object-cover ${i % 2 ? "md:order-2" : ""}`} />
          <div className="p-8 sm:p-12">
            <p className="font-display text-5xl text-clay">0{i + 1}</p>
            <h3 className="mt-4 text-3xl sm:text-4xl">{s.title}</h3>
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const pick = (id: string) => faqSections.find((s) => s.id === id)!.items;

export default function HowItWorksPage() {
  return (
    <>
      <section className="container-page grid items-center gap-10 pb-12 pt-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">How it works</p>
          <h1 className="mt-4 text-[2.8rem] leading-[1.03] sm:text-7xl">Simple for you. Special for them.</h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Keepsake turns a tasting menu, a sunrise balloon flight or a morning at the pottery wheel into a beautiful gift — and lets them choose the one that feels right.
          </p>
        </div>
        <div className="hidden lg:col-span-5 lg:block">
          <div className="arch ml-auto aspect-[4/5] max-w-[380px]">
            <Img src={IMG.friendsHug} alt="" priority sizes="380px" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="container-page">
        <Tabs
          tabs={[
            {
              id: "giving",
              label: "I'm giving a gift",
              content: (
                <>
                  <Steps
                    steps={[
                      { title: `Choose up to ${rules.maxGiftItems} experiences`, text: "Fill one gift with a few ideas they might love. Not sure? Add more — it costs nothing extra.", image: IMG.potteryWheel },
                      { title: "Pay for just one", text: "The price of the gift is the most expensive experience in it. If they choose something cheaper, the rest stays on their code for another experience.", image: IMG.wineToast },
                      { title: "Choose how it arrives", text: `${packaging.box.description} Or an e-certificate delivered by email at the exact moment you choose.`, image: IMG.kraftGift },
                      { title: "They choose and book", text: "With their 14-character code they choose an experience and dates on our site. We confirm with the venue — and they get to be delighted twice.", image: IMG.coupleBikes },
                    ]}
                  />
                  <div className="mt-16 grid gap-10 lg:grid-cols-12">
                    <h2 className="text-4xl lg:col-span-4">Questions from givers</h2>
                    <FaqList className="lg:col-span-8" items={[...pick("ordering"), ...pick("delivery").slice(0, 3)]} />
                  </div>
                  <Link href="/experiences" className="btn btn-primary mt-12">
                    Start a gift <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ),
            },
            {
              id: "received",
              label: "I received a gift",
              content: (
                <>
                  <Steps
                    steps={[
                      { title: "Choose your experience", text: "Enter your code at Redeem a gift. Pick one of the ideas chosen for you — or swap for anything else up to the gift's value. Want something bigger? Pay the difference.", image: IMG.saxophone },
                      { title: "Pick your dates", text: "Choose two preferred dates and times, and the venue that suits you best if there's more than one.", image: IMG.lakeDock },
                      { title: "We confirm", text: "We arrange everything with the venue and email your confirmation with all the details: where to go, what to bring, what to wear.", image: IMG.diningRoom },
                      { title: "Enjoy every minute", text: "We'll remind you the day before — and afterwards, we'd love to hear how it went.", image: IMG.balloons },
                    ]}
                  />
                  <div className="mt-16 grid gap-10 lg:grid-cols-12">
                    <h2 className="text-4xl lg:col-span-4">Using your gift</h2>
                    <FaqList className="lg:col-span-8" items={pick("using")} />
                  </div>
                  <Link href="/redeem" className="btn btn-primary mt-12">
                    Redeem a gift <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ),
            },
            {
              id: "booking",
              label: "I'm booking for myself",
              content: (
                <>
                  <Steps
                    steps={[
                      { title: "Choose an experience", text: "Browse the collection or start from an idea — date night, a weekend away, a day for yourself.", image: IMG.brunchTable },
                      { title: "Tell us your dates", text: "Choose the option, the venue and two preferred dates and times.", image: IMG.torontoIslands },
                      { title: "Pay securely", text: "Pay online by card, Apple Pay or Google Pay. You'll get a code to manage your booking.", image: IMG.latteCheers },
                      { title: "Receive your confirmation", text: "We confirm with the venue and email you every detail, usually within a few hours.", image: IMG.yacht },
                    ]}
                  />
                  <Link href="/for-yourself" className="btn btn-primary mt-12">
                    Find something for yourself <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ),
            },
          ]}
        />
      </section>
    </>
  );
}
