import { db } from "@shipflow/db";
import { featureRequests, workspaceMembers } from "@shipflow/db/schema";
import { eq, and } from "drizzle-orm";

export class FeatureRepository {
  async getFeatureById(featureId: string) {
    return await db.query.featureRequests.findFirst({
      where: eq(featureRequests.id, featureId),
    });
  }

  async getMemberRole(orgId: string, userId: string) {
    const member = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, orgId),
        eq(workspaceMembers.userId, userId)
      ),
    });
    return member?.role;
  }

  async updateFeatureStatus(featureId: string, status: string) {
    return await db.update(featureRequests)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(featureRequests.id, featureId))
      .returning();
  }
}
