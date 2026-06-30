import { db } from "@shipflow/db";
import { notifications, members } from "@shipflow/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import * as crypto from "crypto";

export const NotificationType = {
  PRD_GENERATED: "PRD_GENERATED",
  TASKS_GENERATED: "TASKS_GENERATED",
  FIX_NEEDED: "FIX_NEEDED",
  APPROVAL_REQUESTED: "APPROVAL_REQUESTED",
  FEATURE_SHIPPED: "FEATURE_SHIPPED",
  AI_REVIEW_COMPLETED: "AI_REVIEW_COMPLETED",
  MEMBER_INVITED: "MEMBER_INVITED",
} as const;

export type NotificationType = keyof typeof NotificationType;

export async function createNotification(params: {
  userId: string;
  orgId: string;
  type: NotificationType;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  actionUrl?: string;
}) {
  return await db.insert(notifications).values({
    id: crypto.randomUUID(),
    userId: params.userId,
    orgId: params.orgId,
    type: params.type,
    title: params.title,
    message: params.message,
    resourceType: params.resourceType || null,
    resourceId: params.resourceId || null,
    actionUrl: params.actionUrl || null,
    isRead: false,
    createdAt: new Date(),
  });
}

export async function notifyOrgRoles(params: {
  orgId: string;
  roles: string[];
  excludeUserId?: string;
  notification: Omit<Parameters<typeof createNotification>[0], "userId" | "orgId">;
}) {
  const orgMembers = await db.query.members.findMany({
    where: and(
      eq(members.orgId, params.orgId),
      inArray(members.role, params.roles as any)
    ),
  });

  const targetMembers = orgMembers.filter((m) => m.userId !== params.excludeUserId);

  await Promise.all(
    targetMembers.map((m) =>
      createNotification({
        userId: m.userId,
        orgId: params.orgId,
        ...params.notification,
      })
    )
  );
}
