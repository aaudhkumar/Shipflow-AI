import type { ServerRouter } from "@shipflow/trpc/client";
import { createTRPCProxyClient } from "@shipflow/trpc/client";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client";

export const api = createTRPCProxyClient<ServerRouter>({
  links: [createTRPCHttpBatchClientClient()],
});

export const apiStreaming = createTRPCProxyClient<ServerRouter>({
  links: [createTRPCHttpBatchClientClient({ enableStreaming: true })],
});
