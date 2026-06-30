import { router, orgMemberProcedure } from "../../trpc";
import { enforceBillingLimit } from "../../middleware/billingGuard";
import { z } from "zod";
import { featureService } from "@shipflow/services/feature";
import { generatePath } from "../../utils/path-generator";
import {
  getFeatureListOutputSchema,
  getFeatureOutputSchema,
  createFeatureOutputSchema,
  getReleaseReadinessOutputSchema,
  getReviewFindingsOutputSchema,
  getLinkedIssuesOutputSchema,
  actionSuccessOutputSchema,
  deleteFeatureOutputSchema,
  generatePRDOutputSchema,
  startClarificationOutputSchema,
  generateTasksOutputSchema,
  approvePlanOutputSchema,
  submitForReviewOutputSchema,
  redoExecutionPlanOutputSchema,
  failReviewOutputSchema,
  approveHumanReleaseOutputSchema,
  addClarificationReplyOutputSchema,
  submitClarificationAnswersOutputSchema
} from "@shipflow/services/feature/model";

const TAGS = ["Feature"];
const getPath = generatePath("/features");

const userStorySchema = z.object({
  role: z.string(),
  goal: z.string(),
  benefit: z.string()
});

export const featureRouter = router({
  list: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}"), tags: TAGS } })
    .input(z.object({ 
      orgId: z.string(), 
      channel: z.enum(["IN_APP", "EMAIL", "TICKET", "CALL"]).optional(),
      projectId: z.string().optional()
    }))
    .output(getFeatureListOutputSchema)
    .query(async ({ input }) => {
      return await featureService.listFeatures(input.orgId, input.channel, input.projectId);
    }),

  getById: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}/{featureId}"), tags: TAGS } })
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .output(getFeatureOutputSchema)
    .query(async ({ input }) => {
      return await featureService.getFeatureById(input.featureId, input.orgId);
    }),

  delete: orgMemberProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/{orgId}/{featureId}"), tags: TAGS } })
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .output(deleteFeatureOutputSchema)
    .mutation(async ({ ctx, input }) => {
      return await featureService.deleteFeature(input.featureId, input.orgId, ctx.session.user.id);
    }),

  create: orgMemberProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}"), tags: TAGS } })
    .input(z.object({
      orgId: z.string(),
      projectId: z.string(),
      title: z.string().min(3),
      rawDescription: z.string().min(10),
      sourceChannel: z.enum(["IN_APP", "EMAIL", "TICKET", "CALL"]).default("IN_APP"),
    }))
    .output(createFeatureOutputSchema)
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
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/{featureId}/generate-prd"), tags: TAGS } })
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .output(generatePRDOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { billingService } = await import("@shipflow/billing");
      await billingService.incrementAiReviewUsage(input.orgId);
      return await featureService.generatePRD(input.featureId, input.orgId, ctx.session!.user.id);
    }),

  startClarification: orgMemberProcedure
    .use(enforceBillingLimit)
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/{featureId}/start-clarification"), tags: TAGS } })
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .output(startClarificationOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { billingService } = await import("@shipflow/billing");
      await billingService.incrementAiReviewUsage(input.orgId);
      return await featureService.startClarification(input.featureId, input.orgId, ctx.session!.user.id);
    }),

  generateTasks: orgMemberProcedure
    .use(enforceBillingLimit)
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/{featureId}/generate-tasks"), tags: TAGS } })
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .output(generateTasksOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { billingService } = await import("@shipflow/billing");
      await billingService.incrementAiReviewUsage(input.orgId);
      return await featureService.generateTasks(input.featureId, input.orgId, ctx.session!.user.id);
    }),

  approvePlan: orgMemberProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/{featureId}/approve-plan"), tags: TAGS } })
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .output(approvePlanOutputSchema)
    .mutation(async ({ ctx, input }) => {
      return await featureService.approvePlan(input.featureId, input.orgId, ctx.session.user.id);
    }),

  submitForReview: orgMemberProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/{featureId}/submit-review"), tags: TAGS } })
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .output(submitForReviewOutputSchema)
    .mutation(async ({ ctx, input }) => {
      await featureService.markInReview(input.featureId, input.orgId);
      return await featureService.markReviewPassed(input.featureId, input.orgId);
    }),

  redoExecutionPlan: orgMemberProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/{featureId}/redo-execution"), tags: TAGS } })
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .output(redoExecutionPlanOutputSchema)
    .mutation(async ({ ctx, input }) => {
      return await featureService.redoExecutionPlan(input.featureId, input.orgId, ctx.session.user.id);
    }),

  failReview: orgMemberProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/{featureId}/fail-review"), tags: TAGS } })
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .output(failReviewOutputSchema)
    .mutation(async ({ ctx, input }) => {
      return await featureService.failReview(input.featureId, input.orgId, ctx.session.user.id);
    }),

  approveHumanRelease: orgMemberProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/{featureId}/approve-human-release"), tags: TAGS } })
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .output(approveHumanReleaseOutputSchema)
    .mutation(async ({ ctx, input }) => {
      return await featureService.approveHumanRelease(input.featureId, input.orgId, ctx.session.user.id);
    }),

  addClarificationReply: orgMemberProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/{featureId}/clarification-reply"), tags: TAGS } })
    .input(z.object({ featureId: z.string(), orgId: z.string(), replyContent: z.string().min(1) }))
    .output(addClarificationReplyOutputSchema)
    .mutation(async ({ ctx, input }) => {
      return await featureService.processClarificationReply(input.featureId, input.orgId, ctx.session.user.id, input.replyContent);
    }),

  submitClarificationAnswers: orgMemberProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/{featureId}/clarification-answers"), tags: TAGS } })
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
    .output(submitClarificationAnswersOutputSchema)
    .mutation(async ({ ctx, input }) => {
      return await featureService.submitClarificationAnswers(input.featureId, input.orgId, ctx.session.user.id, input.answers);
    }),

  getReleaseReadiness: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}/{featureId}/release-readiness"), tags: TAGS } })
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .output(getReleaseReadinessOutputSchema)
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

  getReviewFindings: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}/{featureId}/review-findings"), tags: TAGS } })
    .input(z.object({ featureId: z.string(), orgId: z.string() }))
    .output(getReviewFindingsOutputSchema)
    .query(async ({ input }) => {
      const { db } = await import("@shipflow/db");
      const { pullRequests, pullRequestReviews, reviewFindings } = await import("@shipflow/db/schema");
      const { eq, inArray, desc } = await import("drizzle-orm");

      // 1. Get PRs for this feature
      const prs = await db.select({ id: pullRequests.id })
        .from(pullRequests)
        .where(eq(pullRequests.featureRequestId, input.featureId));
        
      if (prs.length === 0) return [];

      const prIds = prs.map(pr => pr.id);

      // 2. Get latest reviews for these PRs
      const reviews = await db.select({ id: pullRequestReviews.id })
        .from(pullRequestReviews)
        .where(inArray(pullRequestReviews.pullRequestId, prIds))
        .orderBy(desc(pullRequestReviews.createdAt))
        .limit(10); // get a bunch, but normally there's 1-2 per PR

      if (reviews.length === 0) return [];

      const reviewIds = reviews.map(r => r.id);

      // 3. Get findings from these reviews
      const findings = await db.query.reviewFindings.findMany({
        where: inArray(reviewFindings.reviewId, reviewIds)
      });

      return findings;
    }),

  updatePrd: orgMemberProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/{orgId}/{featureId}/prd"), tags: TAGS } })
    .input(z.object({
      featureId: z.string(),
      orgId: z.string(),
      field: z.enum(['problemStatement', 'goals', 'nonGoals', 'userStories', 'acceptanceCriteria', 'edgeCases', 'successMetrics']),
      value: z.union([z.string(), z.array(z.string()), z.array(userStorySchema)]),
    }))
    .output(actionSuccessOutputSchema)
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
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/{featureId}/issues/{issueId}"), tags: TAGS } })
    .input(z.object({
      orgId: z.string(),
      featureId: z.string(),
      issueId: z.string()
    }))
    .output(actionSuccessOutputSchema)
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
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}/{featureId}/issues"), tags: TAGS } })
    .input(z.object({ orgId: z.string(), featureId: z.string() }))
    .output(getLinkedIssuesOutputSchema)
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
