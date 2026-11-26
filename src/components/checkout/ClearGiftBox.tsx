"use client";

import { useEffect, useRef } from "react";
import { useGiftBox } from "../gift-box/GiftBoxProvider";

/** Empties the gift box once an order has been paid (runs once). */
export function ClearGiftBox() {
  const { clear, hydrated } = useGiftBox();
  const done = useRef(false);
  useEffect(() => {
    if (!hydrated || done.current) return;
    done.current = true;
    clear();
    try {
      sessionStorage.removeItem("keepsake.checkout.v1");
    } catch {}
  }, [hydrated, clear]);
  return null;
}
