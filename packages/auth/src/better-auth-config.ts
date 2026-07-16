import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@shipflow/db";
import * as schema from "@shipflow/db/schema";
import { sendPasswordResetEmail } from "@shipflow/email";

import { dash } from "@better-auth/infra";
import { expo } from "@better-auth/expo";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [...(process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(",").map(o => o.trim()) : []), "shipflow://"],
  plugins: [dash(), expo()],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
    user: schema.users,
    session: schema.sessions,
    account: schema.accounts,
    verification: schema.verifications,
  },
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: url,
      });
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET || "",
    },
    google: {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
});
