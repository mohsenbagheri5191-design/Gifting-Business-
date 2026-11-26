import type { Metadata } from "next";
import { GiftBoxView } from "@/components/checkout/GiftBoxView";

export const metadata: Metadata = { title: "Your gift", robots: { index: false } };

export default function GiftBoxPage() {
  return <GiftBoxView />;
}
