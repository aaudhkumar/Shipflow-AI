import { router, protectedProcedure } from "../../trpc";
import { z } from "zod";
import { featureService } from "@shipflow/services/src/feature/feature.service";

export const featureRouter = router({
  generatePRD: protectedProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.generatePRD(input.featureId, input.orgId, ctx.session.user.id);
    }),

  generateTasks: protectedProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.generateTasks(input.featureId, input.orgId, ctx.session.user.id);
    }),

  approvePlan: protectedProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.approvePlan(input.featureId, input.orgId, ctx.session.user.id);
    }),

  failReview: protectedProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.failReview(input.featureId, input.orgId, ctx.session.user.id);
    }),

  approveHumanRelease: protectedProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.approveHumanRelease(input.featureId, input.orgId, ctx.session.user.id);
    }),
});
