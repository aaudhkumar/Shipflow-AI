import { db } from "@shipflow/db";
import { organizations, users, members } from "@shipflow/db/schema";
import { eq } from "@shipflow/db";

import { auth } from "@shipflow/auth";

export default async function globalSetup() {
  console.log("Running global setup...");
  const testOrgId = "test-org-e2e";
  const testEmail = "test@shipflow.me";

  const existingUser = await db.query.users.findFirst({ where: eq(users.email, testEmail) });
  if (!existingUser) {
    try {
      // Note: To login via UI, it's easier to create the user via BetterAuth
      await auth.api.signUpEmail({
        body: {
          email: testEmail,
          password: "password123",
          name: "Test User",
        },
      });
    } catch (err) {
      console.log("User might already exist in Auth provider", err);
    }
  }

  const newUser = await db.query.users.findFirst({ where: eq(users.email, testEmail) });
  if (newUser) {
    const existingOrg = await db.query.organizations.findFirst({ where: eq(organizations.slug, "test-org") });
    if (!existingOrg) {
      await db.insert(organizations).values({
        id: testOrgId,
        name: "Test Organization",
        slug: "test-org",
        stripeCustomerId: "cus_test",
      });

      await db.insert(members).values({
        id: "test-member-e2e",
        orgId: testOrgId,
        userId: newUser.id,
        role: "OWNER",
      });
    }
  }
}
