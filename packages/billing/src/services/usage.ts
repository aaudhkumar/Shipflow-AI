import { db } from "@shipflow/db";
import { usageRecords, organizations } from "@shipflow/db/schema";
import { eq, sql } from "drizzle-orm";
import { BILLING_PLANS, PlanId } from "../config/plans";

export async function checkAIAccess(orgId: string, tokensNeeded: number = 0): Promise<boolean> {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    with: {
      subscription: true,
      usageRecords: {
        orderBy: (usageRecords: any, { desc }: any) => [desc(usageRecords.monthStart)],
        limit: 1,
      }
    }
  });

  if (!organization) return false;

  const planId = (organization.subscription?.planId as PlanId) || organization.billingPlan || "FREE";
  const limits = BILLING_PLANS[planId].limits;

  const currentUsage = organization.usageRecords[0];
  if (!currentUsage) return true;

  if (currentUsage.tokenUsage + tokensNeeded > limits.maxAiTokensPerMonth) {
    return false;
  }

  return true;
}

export async function incrementTokenUsage(orgId: string, tokens: number) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  await db.insert(usageRecords)
    .values({
      id: crypto.randomUUID(),
      orgId,
      tokenUsage: tokens,
      monthStart,
    })
    .onConflictDoUpdate({
      target: [usageRecords.orgId, usageRecords.monthStart],
      set: {
        tokenUsage: sql`${usageRecords.tokenUsage} + ${tokens}`,
        updatedAt: new Date(),
      }
    });
}
