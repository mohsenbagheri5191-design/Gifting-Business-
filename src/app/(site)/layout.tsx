import { GiftBoxProvider } from "@/components/gift-box/GiftBoxProvider";
import { GiftDrawer } from "@/components/gift-box/GiftDrawer";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HelpWidget } from "@/components/HelpWidget";
import { paymentMode } from "@/lib/payments";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const testMode = paymentMode() === "test";
  return (
    <GiftBoxProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-paper focus:px-4 focus:py-2">
        Skip to content
      </a>
      {testMode && (
        <div className="no-print bg-clay-mist px-4 py-1.5 text-center text-xs font-semibold text-clay-deep">
          Test mode — payments are simulated and no cards are charged. Add Stripe keys to go live.
        </div>
      )}
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <GiftDrawer />
      <HelpWidget />
    </GiftBoxProvider>
  );
}
