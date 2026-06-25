import { router, orgMemberProcedure } from "../../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
// We don't have a real billing service yet, so we mock it.
// In a real scenario we would import from @shipflow/billing/src/services/*

export const billingRouter = router({
  getSubscription: orgMemberProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      // Return a mock PRO subscription for now
      return {
        plan: "PRO",
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        usage: {
          used: 142,
          total: 500,
        }
      };
    }),
  createCheckoutSession: orgMemberProcedure
    .input(z.object({ orgId: z.string(), plan: z.string() }))
    .mutation(async ({ input }) => {
      // Return a mock checkout URL
      return { url: "https://billing.stripe.com/p/session/test_12345" };
    })
});
