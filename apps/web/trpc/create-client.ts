import { httpLink, httpBatchStreamLink } from "@shipflow/trpc/client";


interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  const getUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return `${process.env.NEXT_PUBLIC_API_URL}/trpc`;
    }
    if (typeof window !== "undefined") return "/api/trpc";
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/trpc`;
    return `http://localhost:${process.env.PORT ?? 3000}/api/trpc`;
  };

  return c({
    url: getUrl(),
    headers: opts?.headers as any,
    fetch(url, options) {
      // Extract Better Auth token to send as Bearer for cross-domain backend (Render)
      let cookieStr = "";
      if (typeof document !== "undefined") {
        cookieStr = document.cookie;
      } else {
        cookieStr = (options?.headers as any)?.cookie || "";
      }

      const tokenMatch = cookieStr.match(/(?:^| )(__Secure-)?better-auth\.session_token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[2] : null;

      const newHeaders = { ...options?.headers } as any;
      if (token) {
        newHeaders["Authorization"] = `Bearer ${token}`;
      }

      return fetch(url, {
        ...options,
        credentials: "omit", // Rely on Bearer token instead of cross-domain cookies
        headers: newHeaders,
      });
    },
  });
};
