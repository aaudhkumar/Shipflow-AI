import { db } from "@shipflow/db";
import type { Database } from "@shipflow/db";
import { getSession } from "@shipflow/auth";
import { drizzle } from "drizzle-orm/node-postgres/driver";

export interface Context {
  db: Database;
  session: Awaited<ReturnType<typeof getSession>>;
}

export async function createContext(
  opts: { headers: Headers }
): Promise<Context> {
  const session = await getSession(opts.headers);

  return {
    db,
    session,
  };
}