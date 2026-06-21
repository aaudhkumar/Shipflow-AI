import { db } from "@shipflow/db";
import { organizations, members } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

export class OrganizationRepository {
  async createOrganization(data: typeof organizations.$inferInsert, userId: string) {
    return await db.transaction(async (tx) => {
      const [organization] = await tx.insert(organizations).values(data).returning();
      if (!organization) throw new Error("Failed to create organization");
      
      await tx.insert(members).values({
        id: crypto.randomUUID(),
        orgId: organization.id,
        userId: userId,
        role: "OWNER"
      });
      
      return organization;
    });
  }

  async listOrganizationsForUser(userId: string) {
    const userMemberships = await db.select({
      organization: organizations
    })
    .from(members)
    .innerJoin(organizations, eq(members.orgId, organizations.id))
    .where(eq(members.userId, userId));

    return userMemberships.map(m => m.organization);
  }
}
