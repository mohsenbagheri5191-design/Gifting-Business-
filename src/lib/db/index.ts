import path from "node:path";
import { mkdirSync } from "node:fs";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export { schema };

type Holder = { promise?: Promise<{ db: DB; close: () => Promise<void> }> };
const holder = globalThis as unknown as { __keepsakeDb?: Holder };
holder.__keepsakeDb ??= {};

const migrationsFolder = path.join(process.cwd(), "drizzle");

/**
 * Connects lazily on first use.
 * - DATABASE_URL set  → any Postgres (Supabase, Neon, Render, RDS…)
 * - otherwise         → embedded Postgres (PGlite) stored in ./.data/pglite
 * Pending migrations are applied automatically, and an empty catalog is
 * filled with the sample Toronto experiences (disable with SEED_SAMPLE_DATA=false).
 */
export function getDb(): Promise<DB> {
  const h = holder.__keepsakeDb!;
  h.promise ??= connect().catch((err) => {
    h.promise = undefined;
    throw err;
  });
  return h.promise.then((c) => c.db);
}

export async function closeDb() {
  const h = holder.__keepsakeDb!;
  if (!h.promise) return;
  const c = await h.promise;
  h.promise = undefined;
  await c.close();
}

async function connect(): Promise<{ db: DB; close: () => Promise<void> }> {
  const url = process.env.DATABASE_URL;
  let conn: { db: DB; close: () => Promise<void> };

  if (url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const needsSsl = !/localhost|127\.0\.0\.1/.test(url) && !/sslmode=disable/.test(url);
    const pool = new Pool({ connectionString: url, ssl: needsSsl ? { rejectUnauthorized: false } : undefined, max: 5 });
    const db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder });
    conn = { db: db as unknown as DB, close: () => pool.end() };
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
    let client: InstanceType<typeof PGlite>;
    if (dir === "memory://") {
      client = new PGlite();
    } else {
      mkdirSync(dir, { recursive: true });
      client = new PGlite(dir);
    }
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder });
    conn = { db: db as unknown as DB, close: () => client.close() };
  }

  if (process.env.SEED_SAMPLE_DATA !== "false") {
    const { seedIfEmpty } = await import("./seed");
    await seedIfEmpty(conn.db);
  }
  return conn;
}
