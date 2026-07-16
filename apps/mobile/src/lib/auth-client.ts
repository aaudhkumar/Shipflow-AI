import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

/**
 * Same backend as apps/web. On the server side (apps/web/src/lib/auth.ts)
 * you need to add the `expo()` plugin and put your app scheme in
 * trustedOrigins, e.g.:
 *
 *   import { expo } from "@better-auth/expo";
 *   export const auth = betterAuth({
 *     ...existing config,
 *     plugins: [...existingPlugins, expo()],
 *     trustedOrigins: ["shipflow://"],
 *   });
 */

function getApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(":")[0];
    if (localhost) {
      return `http://${localhost}:3000`; 
    }
  }
  return "https://shipflow.me";
}

const API_BASE_URL = getApiBaseUrl();

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    expoClient({
      scheme: (Constants.expoConfig?.scheme as string) ?? "shipflow",
      storagePrefix: "shipflow",
      storage: SecureStore,
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
