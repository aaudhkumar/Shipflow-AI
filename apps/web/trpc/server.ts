import type { ServerRouter } from "@shipflow/trpc/client";
import { createTRPCProxyClient } from "@shipflow/trpc/client";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client";
import { headers } from "next/headers";

export const api = createTRPCProxyClient<ServerRouter>({
  links: [createTRPCHttpBatchClientClient({
    get headers() {
      return async () => {
        const h = await headers();
        const heads = Object.fromEntries(h.entries());
        delete heads["host"];
        delete heads["connection"];
        return heads;
      };
    }
  })],
});

export const apiStreaming = createTRPCProxyClient<ServerRouter>({
  links: [createTRPCHttpBatchClientClient({
    enableStreaming: true,
    get headers() {
      return async () => {
        const h = await headers();
        const heads = Object.fromEntries(h.entries());
        delete heads["host"];
        delete heads["connection"];
        return heads;
      };
    }
  })],
});
