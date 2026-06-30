import { TRPCError } from "@trpc/server";
import { billingService } from "@shipflow/billing";
import { tRPCContext } from "../trpc";

export const enforceBillingLimit = tRPCContext.middleware(async ({ ctx, next, input }) => {
  const orgId = (input as any)?.orgId as string | undefined;
  if (!orgId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "orgId is required for billing check" });
  }

  try {
    // This will throw if limits are exceeded for AI review usage, etc.
    // For now, we'll just rely on incrementAiReviewUsage or checkRepositoryLimit 
    // inside the services, or we can check here explicitly before the action runs.
    // Let's explicitly check AI limits since this guard is typically on AI routes.
    const sub = await billingService.getSubscription(orgId);
    if (sub.plan === "FREE") {
      if (sub.usageCount >= sub.usageLimit) {
        throw new TRPCError({ code: "PAYMENT_REQUIRED", message: "AI review credits exhausted. Please upgrade your plan." });
      }
    }
  } catch (error: any) {
    throw new TRPCError({ code: "PAYMENT_REQUIRED", message: error.message || "Billing limit exceeded" });
  }

  return next({ ctx });
});
