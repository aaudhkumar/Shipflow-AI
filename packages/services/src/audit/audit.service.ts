import { db } from "@shipflow/db";
import { auditLogs, members } from "@shipflow/db/schema";
import { eq, and } from "drizzle-orm";
import * as crypto from "crypto";

export const AuditAction = {
  FEATURE_CREATED: 'FEATURE_CREATED',
  FEATURE_PRD_GENERATED: 'FEATURE_PRD_GENERATED',
  FEATURE_TASKS_GENERATED: 'FEATURE_TASKS_GENERATED',
  FEATURE_PLAN_APPROVED: 'FEATURE_PLAN_APPROVED',
  FEATURE_IN_DEVELOPMENT: 'FEATURE_IN_DEVELOPMENT',
  FEATURE_REVIEW_STARTED: 'FEATURE_REVIEW_STARTED',
  FEATURE_FIX_NEEDED: 'FEATURE_FIX_NEEDED',
  FEATURE_HUMAN_APPROVAL_REQUESTED: 'FEATURE_HUMAN_APPROVAL_REQUESTED',
  FEATURE_APPROVED: 'FEATURE_APPROVED',
  FEATURE_REJECTED: 'FEATURE_REJECTED',
  FEATURE_SHIPPED: 'FEATURE_SHIPPED',
  ORG_MEMBER_INVITED: 'ORG_MEMBER_INVITED',
  ORG_MEMBER_REMOVED: 'ORG_MEMBER_REMOVED',
  REPO_CONNECTED: 'REPO_CONNECTED',
  REPO_DISCONNECTED: 'REPO_DISCONNECTED',
  AI_REVIEW_COMPLETED: 'AI_REVIEW_COMPLETED',
  PROJECT_CREATED: 'PROJECT_CREATED',
} as const;

export async function createAuditLog(params: {
  orgId: string;
  actorId?: string | null;
  action: keyof typeof AuditAction;
  resourceType: 'FEATURE' | 'REPOSITORY' | 'ORGANIZATION' | 'PULL_REQUEST' | 'MEMBER' | 'PROJECT';
  resourceId: string;
  metadata?: Record<string, unknown>;
}) {
  let finalActorId = null;

  if (params.actorId) {
    // actorId provided by the application is the userId.
    // The database schema for auditLogs.actorId references members.id, not users.id.
    // We must resolve the userId to the corresponding memberId for this organization.
    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.userId, params.actorId), eq(members.orgId, params.orgId)))
      .limit(1);
    
    if (member) {
      finalActorId = member.id;
    }
  }

  return await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    orgId: params.orgId,
    actorId: finalActorId,
    action: params.action,
    targetEntity: params.resourceType,
    targetEntityId: params.resourceId,
    metadata: params.metadata ?? {},
    timestamp: new Date(),
  });
}
