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
    if (error instanceof TRPCError) throw error;
    // Don't mask non-billing errors as PAYMENT_REQUIRED
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Billing check failed: ${error.message}` });
  }

  return next({ ctx });
});
