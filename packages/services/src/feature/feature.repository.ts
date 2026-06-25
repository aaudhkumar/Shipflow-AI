import { db } from "@shipflow/db";
import { featureRequests, members } from "@shipflow/db/schema";
import { eq, and } from "drizzle-orm";

export class FeatureRepository {
  async createFeature(orgId: string, projectId: string, authorId: string, title: string, rawDescription: string) {
    const [feature] = await db.insert(featureRequests).values({
      orgId,
      projectId,
      authorId,
      title,
      rawDescription,
      status: "SUBMITTED"
    }).returning();
    return feature;
  }

  async getFeatureById(featureId: string, orgId: string) {
    return await db.query.featureRequests.findFirst({
      where: and(
        eq(featureRequests.id, featureId),
        eq(featureRequests.orgId, orgId)
      ),
      with: {
        prds: { with: { currentVersion: true } },
      }
    });
  }

  async getFeaturesByOrg(orgId: string) {
    return await db.query.featureRequests.findMany({
      where: eq(featureRequests.orgId, orgId),
      orderBy: (featureRequests, { desc }) => [desc(featureRequests.createdAt)],
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

  async updateFeatureStatus(featureId: string, orgId: string, status: string) {
    return await db.update(featureRequests)
      .set({ status: status as any, updatedAt: new Date() })
      .where(and(
        eq(featureRequests.id, featureId),
        eq(featureRequests.orgId, orgId)
      ))
      .returning();
  }
}
