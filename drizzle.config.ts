import { defineConfig } from "drizzle-kit";

// `npm run db:generate` turns changes in schema.ts into SQL migrations in ./drizzle and mirrors
// them into netlify/database/migrations. Netlify applies those on every deploy; on other hosts
// (and locally) the app applies ./drizzle itself when it connects to the database.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
});
