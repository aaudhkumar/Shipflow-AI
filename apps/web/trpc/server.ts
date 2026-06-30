import { serverRouter, createContext, createCallerFactory } from "@shipflow/trpc/server";
import { headers } from "next/headers";
import { cache } from "react";

const createCaller = createCallerFactory(serverRouter);

const getCaller = cache(async () => {
  const h = await headers();
  return createCaller(await createContext({ headers: h }));
});

const createRecursiveProxy = (path: string[] = []): any => {
  return new Proxy(() => {}, {
    get(_, prop) {
      if (typeof prop === "string") {
        return createRecursiveProxy([...path, prop]);
      }
      return undefined;
    },
    async apply(_, __, args) {
      const caller = await getCaller();
      
      // Remove 'query' or 'mutate' from the end of the path
      const actualPath = [...path];
      const lastProp = actualPath[actualPath.length - 1];
      if (lastProp === "query" || lastProp === "mutate") {
        actualPath.pop();
      }

      // Traverse the caller to get the actual tRPC function
      let tRPCFunction: any = caller;
      for (const p of actualPath) {
        tRPCFunction = tRPCFunction[p];
      }

      return tRPCFunction(...args);
    },
  });
};

import { createTRPCProxyClient } from "@shipflow/trpc/client";
import type { ServerRouter } from "@shipflow/trpc/server";

export const api = createRecursiveProxy() as ReturnType<typeof createTRPCProxyClient<ServerRouter>>;
export const apiStreaming = api;
