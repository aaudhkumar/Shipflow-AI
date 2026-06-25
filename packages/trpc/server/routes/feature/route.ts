import { router, orgMemberProcedure } from "../../trpc";
import { z } from "zod";
import { featureService } from "../../../../services/src/feature/feature.service";

export const featureRouter = router({
  list: orgMemberProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      return await featureService.listFeatures(input.orgId);
    }),

  getById: orgMemberProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .query(async ({ input }) => {
      return await featureService.getFeatureById(input.featureId, input.orgId);
    }),

  create: orgMemberProcedure
    .input(z.object({
      orgId: z.string(),
      projectId: z.string(),
      title: z.string().min(3),
      rawDescription: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.createFeature(
        input.orgId,
        input.projectId,
        ctx.session.user.id,
        input.title,
        input.rawDescription
      );
    }),

  generatePRD: orgMemberProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.generatePRD(input.featureId, input.orgId, ctx.session.user.id);
    }),

  generateTasks: orgMemberProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.generateTasks(input.featureId, input.orgId, ctx.session.user.id);
    }),

  approvePlan: orgMemberProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.approvePlan(input.featureId, input.orgId, ctx.session.user.id);
    }),

  failReview: orgMemberProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.failReview(input.featureId, input.orgId, ctx.session.user.id);
    }),

  approveHumanRelease: orgMemberProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.approveHumanRelease(input.featureId, input.orgId, ctx.session.user.id);
    }),

  addClarificationReply: orgMemberProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string(), replyContent: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.processClarificationReply(input.featureId, input.orgId, ctx.session.user.id, input.replyContent);
    }),

  getReleaseReadiness: orgMemberProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .query(async ({ input }) => {
      const { db } = await import("@shipflow/db");
      const { releaseReadiness } = await import("@shipflow/db/schema");
      const { eq, desc } = await import("drizzle-orm");
      
      const readiness = await db.query.releaseReadiness.findFirst({
        where: eq(releaseReadiness.featureRequestId, input.featureId),
        orderBy: desc(releaseReadiness.createdAt)
      });
      return readiness || null;
    }),
});
