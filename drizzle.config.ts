import { defineConfig } from "drizzle-kit";

// `npm run db:generate` turns changes in schema.ts into SQL migrations in ./drizzle.
// Migrations are applied automatically when the app connects to the database.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
});
