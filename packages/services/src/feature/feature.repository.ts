import { db } from "@shipflow/db";
import { featureRequests, members } from "@shipflow/db/schema";
import { eq, and } from "drizzle-orm";

export class FeatureRepository {
  async createFeature(orgId: string, projectId: string, authorId: string, title: string, rawDescription: string, sourceChannel: "IN_APP" | "EMAIL" | "TICKET" | "CALL") {
    const [feature] = await db.insert(featureRequests).values({
      orgId,
      projectId,
      authorId,
      title,
      rawDescription,
      sourceChannel,
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
        prds: { 
          orderBy: (prds, { desc }) => [desc(prds.createdAt)],
          with: { currentVersion: true } 
        },
        clarificationThreads: {
          with: {
            messages: {
              orderBy: (messages, { asc }) => [asc(messages.createdAt)]
            }
          },
          limit: 1,
        }
      }
    });
  }

  async getFeaturesByOrg(orgId: string, channel?: "IN_APP" | "EMAIL" | "TICKET" | "CALL", projectId?: string) {
    return await db.query.featureRequests.findMany({
      where: and(
        eq(featureRequests.orgId, orgId),
        channel ? eq(featureRequests.sourceChannel, channel) : undefined,
        projectId ? eq(featureRequests.projectId, projectId) : undefined
      ),
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

  async deleteFeature(featureId: string, orgId: string) {
    return await db.delete(featureRequests)
      .where(and(
        eq(featureRequests.id, featureId),
        eq(featureRequests.orgId, orgId)
      ))
      .returning();
  }
}
