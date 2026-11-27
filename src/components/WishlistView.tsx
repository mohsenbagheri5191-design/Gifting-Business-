"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { useGiftBox } from "./gift-box/GiftBoxProvider";
import { ExperienceCard } from "./ExperienceCard";
import type { CardData } from "@/lib/ui";

/** Saved experiences — shareable as a link, like bodo's "share your wishes with friends". */
export function WishlistView() {
  const { wishlist, hydrated } = useGiftBox();
  const [items, setItems] = useState<CardData[] | null>(null);
  const [shared, setShared] = useState<number[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("ids");
    if (p) setShared(p.split(",").map(Number).filter(Boolean));
  }, []);

  const ids = shared ?? wishlist;

  useEffect(() => {
    if (!hydrated) return;
    if (!ids.length) {
      setItems([]);
      return;
    }
    fetch(`/api/experiences?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, [hydrated, ids.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  async function share() {
    const url = `${window.location.origin}/wishlist?ids=${wishlist.join(",")}`;
    try {
      if (navigator.share) await navigator.share({ title: "My Cadeau wishlist", url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {}
  }

  return (
    <div className="container-page pb-10 pt-12">
      <p className="eyebrow">{shared ? "A shared wishlist" : "Wishlist"}</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-5xl sm:text-6xl">{shared ? "Things they'd love" : "Saved for later"}</h1>
        {!shared && wishlist.length > 0 && (
          <button onClick={share} className="btn btn-outline">
            <Share2 className="h-4 w-4" /> {copied ? "Link copied" : "Share your wishlist"}
          </button>
        )}
      </div>
      {!shared && <p className="mt-3 max-w-xl text-ink-soft">Share it with friends and family — so the next gift is exactly right.</p>}

      {items === null ? (
        <div className="mt-10 h-64 animate-pulse rounded-[2rem] bg-sand/70" />
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-[2rem] border border-dashed border-line px-6 py-20 text-center">
          <p className="font-display text-3xl">Nothing saved yet</p>
          <p className="mt-2 text-ink-soft">Tap the heart on any experience to keep it here.</p>
          <Link href="/experiences" className="btn btn-primary mt-6">
            Explore experiences
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <ExperienceCard key={c.id} e={c} />
          ))}
        </div>
      )}
    </div>
  );
}
