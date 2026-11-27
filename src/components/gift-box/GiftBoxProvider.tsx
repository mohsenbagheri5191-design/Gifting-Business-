"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { rules } from "@/lib/config";

/**
 * The visitor's gift box (bodo's "cart in gift mode") and wishlist, kept in the browser.
 * Prices here are for display only — the server re-reads every price at checkout.
 */
export type GiftLine = {
  experienceId: number;
  optionId: number;
  slug: string;
  title: string;
  image: string | null;
  optionLabel: string;
  people: number;
  duration: string;
  priceCents: number;
};

type AddResult = "added" | "updated" | "full";

type Ctx = {
  hydrated: boolean;
  lines: GiftLine[];
  valueCents: number;
  add: (line: GiftLine) => AddResult;
  remove: (experienceId: number) => void;
  replaceAll: (lines: GiftLine[]) => void;
  clear: () => void;
  has: (experienceId: number) => boolean;
  wishlist: number[];
  toggleWish: (experienceId: number) => void;
  drawer: { open: boolean; last?: AddResult };
  openDrawer: (last?: AddResult) => void;
  closeDrawer: () => void;
};

const GiftBoxContext = createContext<Ctx | null>(null);
const GIFT_KEY = "cadeau.gift.v1";
const WISH_KEY = "cadeau.wish.v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode etc. — the box still works for this visit */
  }
}

export function GiftBoxProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [lines, setLines] = useState<GiftLine[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [drawer, setDrawer] = useState<{ open: boolean; last?: AddResult }>({ open: false });

  useEffect(() => {
    setLines(read<GiftLine[]>(GIFT_KEY, []).slice(0, rules.maxGiftItems));
    setWishlist(read<number[]>(WISH_KEY, []));
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === GIFT_KEY) setLines(read<GiftLine[]>(GIFT_KEY, []));
      if (e.key === WISH_KEY) setWishlist(read<number[]>(WISH_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (hydrated) write(GIFT_KEY, lines);
  }, [lines, hydrated]);
  useEffect(() => {
    if (hydrated) write(WISH_KEY, wishlist);
  }, [wishlist, hydrated]);

  const add = useCallback(
    (line: GiftLine): AddResult => {
      const existing = lines.find((l) => l.experienceId === line.experienceId);
      if (existing) {
        setLines((prev) => prev.map((l) => (l.experienceId === line.experienceId ? line : l)));
        return "updated";
      }
      if (lines.length >= rules.maxGiftItems) return "full";
      setLines((prev) => [...prev, line]);
      return "added";
    },
    [lines],
  );

  // Stable callbacks: effects that depend on them must not re-run on every render.
  const remove = useCallback((id: number) => setLines((prev) => prev.filter((l) => l.experienceId !== id)), []);
  const replaceAll = useCallback((next: GiftLine[]) => setLines(next.slice(0, rules.maxGiftItems)), []);
  const clear = useCallback(() => setLines((prev) => (prev.length ? [] : prev)), []);
  const toggleWish = useCallback((id: number) => setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])), []);
  const openDrawer = useCallback((last?: AddResult) => setDrawer({ open: true, last }), []);
  const closeDrawer = useCallback(() => setDrawer({ open: false }), []);

  const value = useMemo<Ctx>(
    () => ({
      hydrated,
      lines,
      valueCents: lines.reduce((m, l) => Math.max(m, l.priceCents), 0),
      add,
      remove,
      replaceAll,
      clear,
      has: (id) => lines.some((l) => l.experienceId === id),
      wishlist,
      toggleWish,
      drawer,
      openDrawer,
      closeDrawer,
    }),
    [hydrated, lines, add, remove, replaceAll, clear, wishlist, toggleWish, drawer, openDrawer, closeDrawer],
  );

  return <GiftBoxContext.Provider value={value}>{children}</GiftBoxContext.Provider>;
}

export function useGiftBox() {
  const ctx = useContext(GiftBoxContext);
  if (!ctx) throw new Error("useGiftBox must be used inside <GiftBoxProvider>");
  return ctx;
}
