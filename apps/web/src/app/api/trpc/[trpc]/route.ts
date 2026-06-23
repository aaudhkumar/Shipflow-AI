import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { serverRouter, createContext } from "@shipflow/trpc/server";

const setCorsHeaders = (res: Response, req: Request) => {
  const origin = req.headers.get("origin") || "*";
  res.headers.set("Access-Control-Allow-Origin", origin === "null" ? "*" : origin);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, ngrok-skip-browser-warning"
  );
  return res;
};

const handler = async (req: Request) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: serverRouter,
    createContext: () => createContext({ headers: req.headers }),
  });
  return setCorsHeaders(response, req);
};

export async function OPTIONS(req: Request) {
  const response = new Response(null, { status: 204 });
  return setCorsHeaders(response, req);
}

export { handler as GET, handler as POST };
