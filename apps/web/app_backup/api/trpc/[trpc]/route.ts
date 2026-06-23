import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { serverRouter, createContext } from "@shipflow/trpc/server";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: serverRouter,
    createContext: () => createContext({ headers: req.headers }),
  });

export { handler as GET, handler as POST };
