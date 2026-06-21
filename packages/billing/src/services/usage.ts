import { db } from "@shipflow/db";
import { usageRecords, workspaces } from "@shipflow/db/schema";
import { eq, sql } from "drizzle-orm";
import { BILLING_PLANS, PlanId } from "../config/plans";

export async function checkAIAccess(workspaceId: string, tokensNeeded: number = 0): Promise<boolean> {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
    with: {
      subscription: true,
      usageRecords: {
        orderBy: (usageRecords: any, { desc }: any) => [desc(usageRecords.monthStart)],
        limit: 1,
      }
    }
  });

  if (!workspace) return false;

  const planId = (workspace.subscription?.planId as PlanId) || workspace.billingPlan || "FREE";
  const limits = BILLING_PLANS[planId].limits;

  const currentUsage = workspace.usageRecords[0];
  if (!currentUsage) return true;

  if (currentUsage.tokenUsage + tokensNeeded > limits.maxAiTokensPerMonth) {
    return false;
  }

  return true;
}

export async function incrementTokenUsage(workspaceId: string, tokens: number) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  await db.insert(usageRecords)
    .values({
      id: crypto.randomUUID(),
      workspaceId,
      tokenUsage: tokens,
      monthStart,
    })
    .onConflictDoUpdate({
      target: [usageRecords.workspaceId, usageRecords.monthStart],
      set: {
        tokenUsage: sql`${usageRecords.tokenUsage} + ${tokens}`,
        updatedAt: new Date(),
      }
    });
}
