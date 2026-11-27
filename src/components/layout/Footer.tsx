import Link from "next/link";
import { Logo } from "../Logo";
import { site } from "@/lib/config";

const columns: { title: string; links: [string, string][] }[] = [
  {
    title: "Gift ideas",
    links: [
      ["/gifts/for-her", "For her"],
      ["/gifts/for-him", "For him"],
      ["/gifts/for-couples", "For couples"],
      ["/occasions/birthday", "Birthday gifts"],
      ["/occasions/anniversary", "Anniversary gifts"],
      ["/experiences", "All experiences"],
    ],
  },
  {
    title: "Cadeau",
    links: [
      ["/about", "Our story"],
      ["/how-it-works", "How it works"],
      ["/delivery", "Delivery & payment"],
      ["/corporate", "Corporate gifts"],
      ["/reviews", "Reviews"],
      ["/contact", "Contact"],
    ],
  },
  {
    title: "Help",
    links: [
      ["/redeem", "Redeem a gift"],
      ["/redeem?check=1", "Check your balance"],
      ["/faq", "FAQ"],
      ["/legal/terms", "Terms of sale"],
      ["/legal/privacy", "Privacy policy"],
      ["/legal/refunds", "Refunds & exchanges"],
    ],
  },
];

function Social({ href, label, path }: { href: string; label: string; path: string }) {
  return (
    <a href={href} aria-label={label} className="grid h-10 w-10 place-items-center rounded-full border border-linen/20 transition hover:bg-linen/10" target="_blank" rel="noreferrer">
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d={path} />
      </svg>
    </a>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-forest text-linen">
      <svg className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] text-moss/40" viewBox="0 0 200 200" aria-hidden>
        <path fill="currentColor" d="M45.7,-58.4C58.2,-48.1,66.6,-32.8,70.1,-16.3C73.6,0.2,72.1,17.9,64.2,32.1C56.3,46.3,42,57,26.1,63.6C10.2,70.3,-7.3,72.9,-23.9,68.5C-40.6,64.1,-56.5,52.6,-65.6,37.1C-74.7,21.6,-77.1,2,-72.4,-15.1C-67.7,-32.2,-55.8,-46.8,-41.4,-56.8C-27,-66.8,-10.2,-72.2,4.7,-77.8C19.5,-83.4,33.2,-68.8,45.7,-58.4Z" transform="translate(100 100)" />
      </svg>
      <div className="container-page relative grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo light />
          <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-linen/75">
            Experience gifts for the people you love. Choose up to five, pay only for the most expensive, and let them pick the one that feels right.
          </p>
          <div className="mt-6 space-y-1 text-[0.92rem] text-linen/80">
            <p>
              <a href={`tel:${site.supportPhone.replace(/[^\d+]/g, "")}`} className="hover:text-linen">
                {site.supportPhone}
              </a>
            </p>
            <p>
              <a href={`mailto:${site.supportEmail}`} className="hover:text-linen">
                {site.supportEmail}
              </a>
            </p>
            <p className="text-linen/60">{site.supportHours}</p>
          </div>
          <div className="mt-6 flex gap-2">
            <Social href={site.social.instagram} label="Instagram" path="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM17.5 6.5h.01" />
            <Social href={site.social.pinterest} label="Pinterest" path="M12 3a9 9 0 0 0-3.3 17.4c-.1-.8-.1-2 0-2.8l1.2-4.9s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.5 2.1-.8 3.3-.2 1 .5 1.8 1.5 1.8 1.8 0 3.1-1.9 3.1-4.6 0-2.4-1.7-4.1-4.2-4.1-2.9 0-4.5 2.2-4.5 4.4 0 .9.3 1.8.8 2.3" />
            <Social href={site.social.tiktok} label="TikTok" path="M14 3v11.5a3.5 3.5 0 1 1-3-3.46M14 3c.5 2.6 2.3 4.4 5 4.6" />
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title} className="lg:col-span-2">
            <p className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-sage">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-[0.95rem] text-linen/80 transition hover:text-linen">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="lg:col-span-2">
          <p className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-sage">Visit</p>
          <p className="text-[0.95rem] text-linen/80">{site.studio.name}</p>
          <p className="text-[0.95rem] text-linen/60">{site.studio.address}</p>
          <p className="mt-1 text-[0.85rem] text-linen/60">{site.studio.hours}</p>
          <div className="mt-6 flex flex-wrap gap-1.5 text-[0.7rem] font-semibold tracking-wide text-linen/70">
            {["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"].map((p) => (
              <span key={p} className="rounded-md border border-linen/20 px-2 py-1">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="relative border-t border-linen/10">
        <div className="container-page flex flex-col gap-2 py-6 text-[0.8rem] text-linen/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. Made in Toronto.
          </p>
          <p>Prices in Canadian dollars.</p>
        </div>
      </div>
    </footer>
  );
}
