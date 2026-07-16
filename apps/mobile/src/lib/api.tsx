import React, { useState } from "react";
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ServerRouter } from "@shipflow/trpc/client";
import { authClient } from "./auth-client";

// Same router type the web app uses — apps/web/trpc/client.ts. One backend, one contract.
export const trpc = createTRPCReact<ServerRouter>();

import Constants from "expo-constants";

function getApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  if (__DEV__) {
    // Dynamically grab the local IP from Expo during development
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(":")[0];
    if (localhost) {
      return `http://${localhost}:3000`; // Points to the web app running locally
    }
  }
  return "https://shipflow.me";
}

const API_BASE_URL = getApiBaseUrl();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${API_BASE_URL}/api/trpc`,
          headers() {
            const cookie = authClient.getCookie();
            return cookie ? { Cookie: cookie } : {};
          },
          // Cookie is attached manually above — 'include' would fight with that on native.
          fetch(input, init) {
            return fetch(input, { ...init, credentials: "omit" });
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
