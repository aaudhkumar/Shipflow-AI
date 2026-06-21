import { db } from "@shipflow/db";
import { getSession } from "@shipflow/auth/middleware";

export async function createContext(opts: { headers: Headers }) {
  const session = await getSession(opts.headers);
  return {
    db,
    session,
  };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
