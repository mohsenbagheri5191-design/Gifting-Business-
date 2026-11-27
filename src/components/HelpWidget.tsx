"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { site } from "@/lib/config";
import { cn } from "@/lib/ui";

/** Netlify's free-plan "Powered by Netlify" badge: a fixed, 64px-high frame in the bottom-right corner. */
const HOST_BADGE_ID = "nl-badge-frame";

/** Floating "Questions?" button (bodo's chat bubble), quiet and out of the way. */
export function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [lifted, setLifted] = useState(false);

  // Sit above the hosting badge whenever one is shown, so it never covers the button.
  useEffect(() => {
    const check = () => setLifted(!!document.getElementById(HOST_BADGE_ID));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn("no-print fixed right-5 z-30 transition-[bottom] duration-300", lifted ? "bottom-[5.25rem]" : "bottom-5")}>
      {open && (
        <div className="mb-3 w-72 animate-rise rounded-3xl border border-line bg-paper p-5 shadow-[0_30px_60px_-30px_rgba(31,36,30,0.5)]">
          <p className="font-display text-xl">How can we help?</p>
          <p className="mt-1 text-sm text-muted">{site.supportHours}</p>
          <ul className="mt-4 space-y-2 text-[0.95rem]">
            <li>
              <a className="block rounded-xl bg-linen px-4 py-3 hover:bg-sand" href={`tel:${site.supportPhone.replace(/[^\d+]/g, "")}`}>
                Call {site.supportPhone}
              </a>
            </li>
            <li>
              <a className="block rounded-xl bg-linen px-4 py-3 hover:bg-sand" href={`mailto:${site.supportEmail}`}>
                Email us
              </a>
            </li>
            <li>
              <Link className="block rounded-xl bg-linen px-4 py-3 hover:bg-sand" href="/faq" onClick={() => setOpen(false)}>
                Read the FAQ
              </Link>
            </li>
            <li>
              <Link className="block rounded-xl bg-linen px-4 py-3 hover:bg-sand" href="/redeem" onClick={() => setOpen(false)}>
                Redeem a gift
              </Link>
            </li>
          </ul>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="ml-auto flex h-12 w-12 items-center justify-center gap-2 rounded-full bg-forest text-linen shadow-[0_18px_40px_-18px_rgba(31,36,30,0.8)] transition hover:bg-moss-deep sm:h-14 sm:w-auto sm:px-5"
        aria-expanded={open}
        aria-label={open ? "Close help" : "Questions? Get help"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" strokeWidth={1.7} />}
        <span className="hidden text-[0.92rem] font-semibold sm:inline">{open ? "Close" : "Questions?"}</span>
      </button>
    </div>
  );
}
