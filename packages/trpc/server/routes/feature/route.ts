import { router, orgMemberProcedure } from "../../trpc";
import { enforceBillingLimit } from "../../middleware/billingGuard";
import { z } from "zod";
import { featureService } from "../../../../services/src/feature/feature.service";

const userStorySchema = z.object({
  role: z.string(),
  goal: z.string(),
  benefit: z.string()
});

export const featureRouter = router({
  list: orgMemberProcedure
    .input(z.object({ 
      orgId: z.string(), 
      channel: z.enum(["IN_APP", "EMAIL", "TICKET", "CALL"]).optional(),
      projectId: z.string().optional()
    }))
    .query(async ({ input }) => {
      return await featureService.listFeatures(input.orgId, input.channel, input.projectId);
    }),

  getById: orgMemberProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .query(async ({ input }) => {
      return await featureService.getFeatureById(input.featureId, input.orgId);
    }),

  delete: orgMemberProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.deleteFeature(input.featureId, input.orgId, ctx.session.user.id);
    }),

  create: orgMemberProcedure
    .input(z.object({
      orgId: z.string(),
      projectId: z.string(),
      title: z.string().min(3),
      rawDescription: z.string().min(10),
      sourceChannel: z.enum(["IN_APP", "EMAIL", "TICKET", "CALL"]).default("IN_APP"),
    }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.createFeature(
        input.orgId,
        input.projectId,
        ctx.session.user.id,
        input.title,
        input.rawDescription,
        input.sourceChannel
      );
    }),

  generatePRD: orgMemberProcedure
    .use(enforceBillingLimit)
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { billingService } = await import("@shipflow/billing");
      await billingService.incrementAiReviewUsage(input.orgId);
      return await featureService.generatePRD(input.featureId, input.orgId, ctx.session!.user.id);
    }),

  startClarification: orgMemberProcedure
    .use(enforceBillingLimit)
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { billingService } = await import("@shipflow/billing");
      await billingService.incrementAiReviewUsage(input.orgId);
      return await featureService.startClarification(input.featureId, input.orgId, ctx.session!.user.id);
    }),

  generateTasks: orgMemberProcedure
    .use(enforceBillingLimit)
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { billingService } = await import("@shipflow/billing");
      await billingService.incrementAiReviewUsage(input.orgId);
      return await featureService.generateTasks(input.featureId, input.orgId, ctx.session!.user.id);
    }),

  approvePlan: orgMemberProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.approvePlan(input.featureId, input.orgId, ctx.session.user.id);
    }),

  submitForReview: orgMemberProcedure
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.markInReview(input.featureId, input.orgId);
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

  submitClarificationAnswers: orgMemberProcedure
    .input(z.object({
      featureId: z.string(),
      orgId: z.string(),
      answers: z.array(z.object({
        question: z.string(),
        recommendation: z.string(),
        accepted: z.boolean(),
        feedback: z.string().optional()
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      return await featureService.submitClarificationAnswers(input.featureId, input.orgId, ctx.session.user.id, input.answers);
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

  updatePrd: orgMemberProcedure
    .input(z.object({
      featureId: z.string(),
      orgId: z.string(),
      field: z.enum(['problemStatement', 'goals', 'nonGoals', 'userStories', 'acceptanceCriteria', 'edgeCases', 'successMetrics']),
      value: z.union([z.string(), z.array(z.string()), z.array(userStorySchema)]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db } = await import("@shipflow/db");
      const { prds, prdVersions } = await import("@shipflow/db/schema");
      const { eq, and, desc } = await import("drizzle-orm");

      const prd = await db.query.prds.findFirst({
        where: and(
          eq(prds.featureRequestId, input.featureId),
          eq(prds.orgId, input.orgId)
        ),
      });
      if (!prd) throw new (await import("@trpc/server")).TRPCError({ code: "NOT_FOUND", message: "PRD not found" });

      const latestVersion = await db.query.prdVersions.findFirst({
        where: eq(prdVersions.prdId, prd.id),
        orderBy: desc(prdVersions.versionNumber),
      });

      if (!latestVersion) throw new (await import("@trpc/server")).TRPCError({ code: "NOT_FOUND", message: "PRD Version not found" });

      const updatedContent = {
        ...(latestVersion.content as any),
        [input.field]: input.value,
      };

      await db.update(prdVersions).set({ content: updatedContent }).where(eq(prdVersions.id, latestVersion.id));
      return { success: true };
    }),

  linkIssue: orgMemberProcedure
    .input(z.object({
      orgId: z.string(),
      featureId: z.string(),
      issueId: z.string()
    }))
    .mutation(async ({ input }) => {
      const { db } = await import("@shipflow/db");
      const { githubIssues } = await import("@shipflow/db/schema");
      const { eq, and } = await import("drizzle-orm");

      await db
        .update(githubIssues)
        .set({ featureRequestId: input.featureId })
        .where(
          and(
            eq(githubIssues.id, input.issueId),
            eq(githubIssues.orgId, input.orgId)
          )
        );

      return { success: true };
    }),

  getLinkedIssues: orgMemberProcedure
    .input(z.object({ orgId: z.string(), featureId: z.string() }))
    .query(async ({ input }) => {
      const { db } = await import("@shipflow/db");
      const { githubIssues, repositories } = await import("@shipflow/db/schema");
      const { eq, and } = await import("drizzle-orm");

      const issues = await db
        .select({
          id: githubIssues.id,
          state: githubIssues.state,
          issueNumber: githubIssues.issueNumber,
          title: githubIssues.title,
          repoFullName: repositories.fullName,
        })
        .from(githubIssues)
        .innerJoin(repositories, eq(githubIssues.repositoryId, repositories.id))
        .where(
          and(
            eq(githubIssues.orgId, input.orgId),
            eq(githubIssues.featureRequestId, input.featureId)
          )
        );

      return issues;
    }),
});
