import { httpLink, httpBatchStreamLink } from "@shipflow/trpc/client";
import { env } from "~/env.js";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  const getUrl = () => {
    if (typeof window !== "undefined") return "/api/trpc";
    if (env.NEXT_PUBLIC_API_URL) return `${env.NEXT_PUBLIC_API_URL}/trpc`;
    if (process.env.NEXT_PUBLIC_APP_URL) return `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`;
    return `http://localhost:${process.env.PORT ?? 3000}/api/trpc`;
  };

  return c({
    url: getUrl(),
    headers: opts?.headers as any,
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          ...options?.headers,
          "ngrok-skip-browser-warning": "true",
        },
      });
    },
  });
};
