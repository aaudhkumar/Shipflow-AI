import { router, orgMemberProcedure } from "../../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { billingService } from "@shipflow/billing";

export const billingRouter = router({
  getSubscription: orgMemberProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      return billingService.getSubscription(input.orgId);
    }),
  createCheckoutSession: orgMemberProcedure
    .input(z.object({ orgId: z.string(), plan: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await billingService.createCheckoutSession({
        orgId: input.orgId,
        userId: ctx.session.user.id,
        planId: input.plan,
      });
      return { url: result.checkoutUrl };
    }),
  createOrder: orgMemberProcedure
    .input(z.object({ orgId: z.string(), amount: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const shortOrg = input.orgId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 10);
        return await billingService.createOrder(input.amount, "INR", `rcpt_${shortOrg}_${Date.now()}`);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create order",
        });
      }
    }),
  verifyPayment: orgMemberProcedure
    .input(
      z.object({
        orgId: z.string(),
        orderId: z.string(),
        paymentId: z.string(),
        signature: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const isValid = await billingService.verifyPayment(
          input.orderId,
          input.paymentId,
          input.signature
        );
        
        if (!isValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid payment signature",
          });
        }
        
        // Example logic: credit 50 AI usages if they buy credits
        // (You can expand on this based on what they're actually buying)
        await billingService.incrementAiReviewUsage(input.orgId);
        
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Payment verification failed",
        });
      }
    }),
});
