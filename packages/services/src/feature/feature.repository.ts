import { db } from "@shipflow/db";
import { featureRequests, members } from "@shipflow/db/schema";
import { eq, and } from "drizzle-orm";

export class FeatureRepository {
  async getFeatureById(featureId: string) {
    return await db.query.featureRequests.findFirst({
      where: eq(featureRequests.id, featureId),
    });
  }

  async getMemberRole(orgId: string, userId: string) {
    const member = await db.query.members.findFirst({
      where: and(
        eq(members.orgId, orgId),
        eq(members.userId, userId)
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
