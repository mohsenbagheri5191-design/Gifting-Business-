import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships a WASM build of Postgres; keep it (and pg) out of the server bundle.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // The SQL migrations are read from disk when the app first connects to the database,
  // so serverless hosts (Vercel, Netlify…) must ship them with every server function.
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
