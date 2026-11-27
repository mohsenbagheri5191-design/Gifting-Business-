import type { Metadata, Viewport } from "next";
import "@fontsource/tenor-sans/index.css";
import "@fontsource-variable/figtree/index.css";
import "@fontsource-variable/figtree/wght-italic.css";
import "./globals.css";
import { site } from "@/lib/config";

// Every page reads live data (catalog, gifts, bookings), so render on request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Experience gifts in Toronto`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { title: `${site.name} — ${site.tagline}`, description: site.description, siteName: site.name, locale: "en_CA", type: "website" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#3f4a36",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
