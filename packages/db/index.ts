import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./models";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  console.warn("DATABASE_URL is not set");
}

// In Next.js development, hot-reloading can quickly exhaust DB connections
// by creating new pools over and over. We use a global singleton to prevent this.
const globalForDb = globalThis as unknown as {
  pool: pg.Pool | undefined;
};

const pool =
  globalForDb.pool ??
  new pg.Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export type Database = typeof db;

export * from "drizzle-orm";

