import { auth } from "./better-auth-config";

export async function getSession(requestHeaders: Headers) {
  return await auth.api.getSession({
    headers: requestHeaders
  });
}
