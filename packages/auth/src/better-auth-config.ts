import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@shipflow/db";
import * as schema from "@shipflow/db/schema";

import { dash } from "@better-auth/infra";

export const auth = betterAuth({
  plugins: [dash()],
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
});
