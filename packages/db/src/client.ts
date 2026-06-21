import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  console.warn("DATABASE_URL is not set");
}

const pool = new pg.Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
