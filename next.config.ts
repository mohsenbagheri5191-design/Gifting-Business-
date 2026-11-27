import type { NextConfig } from "next";

// The site's public address, inlined for server and browser code (links in emails, QR codes, the
// certificate). Netlify provides URL during builds; set NEXT_PUBLIC_SITE_URL to override it.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NETLIFY === "true" ? process.env.URL : undefined);

const nextConfig: NextConfig = {
  ...(siteUrl ? { env: { NEXT_PUBLIC_SITE_URL: siteUrl } } : {}),
  // PGlite ships a WASM build of Postgres; keep it (and pg) out of the server bundle.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // Outside Netlify the SQL migrations are read from disk when the app first connects to the
  // database, so serverless hosts must ship them with every server function.
  outputFileTracingIncludes: {
    "/*": ["./drizzle/**/*"],
    "/**/*": ["./drizzle/**/*"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  poweredByHeader: false,
};

export default nextConfig;
