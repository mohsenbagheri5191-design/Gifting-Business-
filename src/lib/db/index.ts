import path from "node:path";
import { mkdirSync } from "node:fs";
import { readMigrationFiles } from "drizzle-orm/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export { schema };

type Holder = { promise?: Promise<{ db: DB; close: () => Promise<void> }> };
const holder = globalThis as unknown as { __cadeauDb?: Holder };
holder.__cadeauDb ??= {};

const migrationsFolder = path.join(process.cwd(), "drizzle");
/** Any fixed number: serializes first-start setup when several servers boot at once. */
const SETUP_LOCK_KEY = 72417001;

const isServerless = !!(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);

/** Netlify Database's connection string (Netlify sets it in builds and functions). */
function netlifyDatabaseUrl(): string | undefined {
  const netlify = (globalThis as { Netlify?: { env?: { get(key: string): string | undefined } } }).Netlify;
  return netlify?.env?.get("NETLIFY_DB_URL") || process.env.NETLIFY_DB_URL || undefined;
}

/**
 * Connects lazily on first use.
 * - DATABASE_URL (or POSTGRES_URL) set → any Postgres (Neon, Supabase, Render, Railway, RDS…)
 * - on Netlify with Netlify Database   → NETLIFY_DB_URL
 * - otherwise                          → embedded Postgres (PGlite) stored in ./.data/pglite
 * The schema comes from the SQL migrations: Netlify applies netlify/database/migrations on every
 * deploy; everywhere else the app applies ./drizzle itself on first connect. An empty catalog is
 * then filled with the sample Toronto experiences (disable with SEED_SAMPLE_DATA=false).
 */
export function getDb(): Promise<DB> {
  const h = holder.__cadeauDb!;
  h.promise ??= connect().catch((err) => {
    h.promise = undefined;
    throw err;
  });
  return h.promise.then((c) => c.db);
}

export async function closeDb() {
  const h = holder.__cadeauDb!;
  if (!h.promise) return;
  const c = await h.promise;
  h.promise = undefined;
  await c.close();
}

export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || netlifyDatabaseUrl();
}

/** True when Netlify Database is in use: Netlify itself applies the migrations before each deploy goes live. */
function schemaManagedByNetlify(url: string) {
  return url === netlifyDatabaseUrl() && !process.env.DATABASE_URL && !process.env.POSTGRES_URL;
}

async function connect(): Promise<{ db: DB; close: () => Promise<void> }> {
  const url = databaseUrl();
  return url ? connectPostgres(url) : connectPglite();
}

type RawClient = { query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> };

/**
 * First-start setup in ONE transaction: migrations (unless the platform applies them), then the
 * sample catalog if the database is empty. A transaction-scoped advisory lock makes concurrent cold
 * starts wait for each other, and it is released automatically on commit — safe even through
 * connection poolers (Neon, Supabase, Netlify Database…).
 */
async function runSetup(raw: RawClient, setupDb: DB, opts: { lock: boolean; migrate: boolean }) {
  await raw.query("begin");
  try {
    if (opts.lock) await raw.query("select pg_advisory_xact_lock($1)", [SETUP_LOCK_KEY]);
    if (opts.migrate) await applyMigrations(raw);
    if (process.env.SEED_SAMPLE_DATA !== "false") {
      const { seedIfEmpty } = await import("./seed");
      await seedIfEmpty(setupDb);
    }
    await raw.query("commit");
  } catch (err) {
    await raw.query("rollback").catch(() => {});
    if (!opts.migrate && isUndefinedTable(err)) {
      throw new Error(
        "The database has no tables yet. Netlify applies netlify/database/migrations when a deploy is published — check the deploy log. " +
          "With `netlify dev`, run `netlify database migrations apply` first.",
        { cause: err },
      );
    }
    throw err;
  }
}

function isUndefinedTable(err: unknown) {
  for (let e = err as { code?: string; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (e.code === "42P01") return true;
  }
  return false;
}

/** Same bookkeeping as drizzle's migrator (drizzle.__drizzle_migrations), run inside our transaction. */
async function applyMigrations(raw: RawClient) {
  const migrations = readMigrationFiles({ migrationsFolder });
  await raw.query('create schema if not exists "drizzle"');
  await raw.query('create table if not exists "drizzle"."__drizzle_migrations" (id serial primary key, hash text not null, created_at bigint)');
  const { rows } = await raw.query('select created_at from "drizzle"."__drizzle_migrations" order by created_at desc limit 1');
  const last = rows[0] ? Number(rows[0].created_at) : -1;
  for (const m of migrations) {
    if (m.folderMillis <= last) continue;
    for (const statement of m.sql) if (statement.trim()) await raw.query(statement);
    await raw.query('insert into "drizzle"."__drizzle_migrations" ("hash", "created_at") values ($1, $2)', [m.hash, m.folderMillis]);
  }
}

async function connectPostgres(url: string) {
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");

  const managed = schemaManagedByNetlify(url);
  const u = new URL(url);
  const sslmode = u.searchParams.get("sslmode");
  u.searchParams.delete("sslmode");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  // Hosted Postgres needs TLS. Netlify Database (and sslmode=verify-*) gets full certificate checks, like
  // @netlify/database does. Some other providers' certificates aren't in Node's trust store, so for
  // those we encrypt without pinning the CA (the usual setting for managed databases).
  const verify = managed || sslmode === "verify-full" || sslmode === "verify-ca";
  const pool = new Pool({
    connectionString: u.toString(),
    ssl: local || sslmode === "disable" ? undefined : { rejectUnauthorized: verify },
    max: Number(process.env.DATABASE_POOL_MAX ?? (isServerless ? 3 : 5)),
  });

  const client = await pool.connect();
  try {
    await runSetup(client as unknown as RawClient, drizzle(client, { schema }) as unknown as DB, { lock: true, migrate: !managed });
  } finally {
    client.release();
  }
  const db = drizzle(pool, { schema });
  return { db: db as unknown as DB, close: () => pool.end() };
}

async function connectPglite() {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  // On serverless hosts only /tmp is writable — and it is wiped regularly, so data is temporary there.
  const defaultDir = isServerless ? "/tmp/cadeau-pglite" : path.join(process.cwd(), ".data", "pglite");
  const dir = process.env.PGLITE_DIR ?? defaultDir;
  if (isServerless && !process.env.PGLITE_DIR) {
    console.warn("[cadeau] No database configured: using a temporary database. Orders will be lost — connect Postgres before taking real orders.");
  }
  let client: InstanceType<typeof PGlite>;
  if (dir === "memory://") {
    client = new PGlite();
  } else {
    mkdirSync(dir, { recursive: true });
    client = new PGlite(dir);
  }
  const db = drizzle(client, { schema }) as unknown as DB;
  await runSetup(client as unknown as RawClient, db, { lock: false, migrate: true });
  return { db, close: () => client.close() };
}
