/**
 * Mirrors the Drizzle migrations in ./drizzle into netlify/database/migrations, the folder
 * Netlify Database applies automatically on every deploy (before it goes live).
 *
 * Runs as part of `npm run db:generate`. Each migration becomes
 *   netlify/database/migrations/<UTC yyyymmddhhmmss of its Drizzle timestamp>_<drizzle tag>.sql
 * Existing files are never rewritten: Netlify checksums applied migrations, so a changed file
 * would fail the next deploy. Write a new migration instead.
 *
 * Usage: node scripts/sync-netlify-migrations.mjs [--check]
 *   --check  exit with an error if a migration is missing or differs (used by the tests)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "drizzle");
const target = path.join(root, "netlify", "database", "migrations");
const check = process.argv.includes("--check");

function netlifyMigrationName(entry) {
  const stamp = new Date(entry.when).toISOString().replace(/\D/g, "").slice(0, 14);
  return `${stamp}_${entry.tag}`;
}

function netlifyMigrationSql(entry) {
  const sql = readFileSync(path.join(source, `${entry.tag}.sql`), "utf8");
  return `-- Generated from drizzle/${entry.tag}.sql by scripts/sync-netlify-migrations.mjs. Never edit once deployed.\n${sql}`;
}

const journal = JSON.parse(readFileSync(path.join(source, "meta", "_journal.json"), "utf8"));
const problems = [];
mkdirSync(target, { recursive: true });
for (const entry of journal.entries) {
  const name = netlifyMigrationName(entry);
  if (!/^\d+_[a-z0-9_-]+$/.test(name)) problems.push(`${name}: Netlify needs <number>_<slug> with a slug of a-z, 0-9, _ and -`);
  const file = path.join(target, `${name}.sql`);
  const sql = netlifyMigrationSql(entry);
  if (existsSync(file)) {
    if (readFileSync(file, "utf8") !== sql) problems.push(`${path.relative(root, file)} differs from drizzle/${entry.tag}.sql`);
  } else if (check) {
    problems.push(`${path.relative(root, file)} is missing — run npm run db:generate`);
  } else {
    writeFileSync(file, sql);
    console.log(`wrote ${path.relative(root, file)}`);
  }
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
