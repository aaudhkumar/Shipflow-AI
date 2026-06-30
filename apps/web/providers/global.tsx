"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import React, { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { PaymentRequiredModal } from "@/components/billing/PaymentRequiredModal";

import { trpc } from "~/trpc/client";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client";

const handleGlobalError = (error: unknown) => {
  const err = error as any;
  const isPaymentRequired = 
    err?.data?.code === "PAYMENT_REQUIRED" || 
    err?.shape?.data?.code === "PAYMENT_REQUIRED" || 
    err?.error?.data?.code === "PAYMENT_REQUIRED" ||
    (typeof err?.message === "string" && err.message.includes("AI review credits exhausted"));

  if (isPaymentRequired) {
    toast.error("Limit reached. Please increase your plan.");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("payment_required"));
    }
  }
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleGlobalError,
  }),
  mutationCache: new MutationCache({
    onError: handleGlobalError,
  }),
  defaultOptions: {
    queries: {
      refetchOnMount: true,
      staleTime: Infinity,
    },
  },
});

export const GlobalProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [createTRPCHttpBatchClientClient()],
    }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <trpc.Provider queryClient={queryClient} client={trpcClient}>
          {children}
          <Toaster />
          <PaymentRequiredModal />
        </trpc.Provider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
};
