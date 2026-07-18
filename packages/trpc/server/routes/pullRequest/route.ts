import { router, orgMemberProcedure } from "../../trpc";
import { getInstallationOctokit } from "@shipflow/github";
import { z } from "zod";
import { db } from "@shipflow/db";
import { pullRequests, pullRequestReviews, reviewFindings } from "@shipflow/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { generatePath } from "../../utils/path-generator";
import {
  getPullRequestListOutputSchema,
  getPullRequestWithReviewsOutputSchema,
  updateFindingStatusOutputSchema,
  rateReviewOutputSchema,
  listReviewsOutputSchema,
  mergePullRequestOutputSchema
} from "@shipflow/services/pullRequest/model";

const TAGS = ["PullRequest"];
const getPath = generatePath("/pull-requests");

export const pullRequestRouter = router({
  list: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}"), tags: TAGS } })
    .input(z.object({ orgId: z.string() }))
    .output(getPullRequestListOutputSchema)
    .query(async ({ input }) => {
      const { repositories } = await import("@shipflow/db/schema");
      return await db
        .select({
          id: pullRequests.id,
          title: pullRequests.title,
          githubPrNumber: pullRequests.githubPrNumber,
          state: pullRequests.state,
          createdAt: pullRequests.createdAt,
          repoName: repositories.fullName,
          url: pullRequests.url,
        })
        .from(pullRequests)
        .leftJoin(repositories, eq(pullRequests.repositoryId, repositories.id))
        .where(eq(pullRequests.orgId, input.orgId))
        .orderBy(desc(pullRequests.createdAt));
    }),

  getWithReviews: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}/{githubPrNumber}"), tags: TAGS } })
    .input(z.object({ orgId: z.string(), githubPrNumber: z.number() }))
    .output(getPullRequestWithReviewsOutputSchema)
    .query(async ({ input }) => {
      const pr = await db.query.pullRequests.findFirst({
        where: and(
          eq(pullRequests.orgId, input.orgId),
          eq(pullRequests.githubPrNumber, input.githubPrNumber)
        ),
        with: {
          reviews: {
            with: {
              findings: true
            },
            orderBy: desc(pullRequestReviews.createdAt)
          },
          featureRequest: true,
        }
      });

      if (!pr) throw new TRPCError({ code: "NOT_FOUND", message: "Pull Request not found" });
      return pr;
    }),
  getByFeatureId: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}/feature/{featureId}"), tags: TAGS } })
    .input(z.object({ orgId: z.string(), featureId: z.string() }))
    .output(z.array(getPullRequestWithReviewsOutputSchema))
    .query(async ({ input }) => {
      return await db.query.pullRequests.findMany({
        where: and(
          eq(pullRequests.orgId, input.orgId),
          eq(pullRequests.featureRequestId, input.featureId)
        ),
        with: {
          reviews: {
            with: {
              findings: true
            },
            orderBy: desc(pullRequestReviews.createdAt)
          },
          featureRequest: true,
        }
      });
    }),
  updateFindingStatus: orgMemberProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/{orgId}/findings/{findingId}/status"), tags: TAGS } })
    .input(z.object({ orgId: z.string(), findingId: z.string(), status: z.string() }))
    .output(updateFindingStatusOutputSchema)
    .mutation(async ({ input }) => {
      const [updated] = await db.update(reviewFindings)
        .set({ status: input.status })
        .where(eq(reviewFindings.id, input.findingId))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Finding not found" });
      return updated;
    }),

  rateReview: orgMemberProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/reviews/{reviewId}/rate"), tags: TAGS } })
    .input(z.object({ orgId: z.string(), reviewId: z.string(), isCorrect: z.boolean() }))
    .output(rateReviewOutputSchema)
    .mutation(async ({ input }) => {
      const review = await db.query.pullRequestReviews.findFirst({
        where: eq(pullRequestReviews.id, input.reviewId)
      });
      if (!review) throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });

      const currentMeta = (review.reviewMeta as any) || {};
      currentMeta.userRating = input.isCorrect ? 'CORRECT' : 'INCORRECT';

      await db.update(pullRequestReviews)
        .set({ reviewMeta: currentMeta })
        .where(eq(pullRequestReviews.id, input.reviewId));
        
      const newStatus = input.isCorrect ? "ADDRESSED" : "IGNORED";
      await db.update(reviewFindings)
        .set({ status: newStatus })
        .where(eq(reviewFindings.reviewId, input.reviewId));
        
      return { success: true };
    }),

  listReviews: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}/reviews"), tags: TAGS } })
    .input(z.object({ orgId: z.string(), filter: z.enum(["ALL", "BLOCKING", "CLEAN"]).optional().default("ALL") }))
    .output(listReviewsOutputSchema)
    .query(async ({ input }) => {
      const reviews = await db.query.pullRequestReviews.findMany({
        orderBy: desc(pullRequestReviews.createdAt),
        limit: 50,
        with: {
          pullRequest: {
            with: {
              repository: true
            }
          },
          findings: true
        }
      });

      const orgReviews = reviews.filter(r => r.pullRequest?.orgId === input.orgId);

      return orgReviews.map(review => {
        const blockingCount = review.findings.filter(f => f.isBlocking).length;
        const nonBlockingCount = review.findings.length - blockingCount;
        return {
          id: review.id,
          commitSha: review.commitSha,
          createdAt: review.createdAt,
          pullRequest: {
            id: review.pullRequest.id,
            title: review.pullRequest.title,
            githubPrNumber: review.pullRequest.githubPrNumber,
          },
          repository: {
            fullName: review.pullRequest.repository?.fullName || 'Unknown repo',
          },
          findingCounts: {
            total: review.findings.length,
            blocking: blockingCount,
            nonBlocking: nonBlockingCount,
          }
        };
      }).filter(r => {
        if (input.filter === "BLOCKING") return r.findingCounts.blocking > 0;
        if (input.filter === "CLEAN") return r.findingCounts.blocking === 0;
        return true;
      });
    }),

  merge: orgMemberProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/{pullRequestId}/merge"), tags: TAGS } })
    .input(z.object({ 
      orgId: z.string(), 
      pullRequestId: z.string(),
      repoOwner: z.string(),
      repoName: z.string(),
      githubPrNumber: z.number(),
      installationId: z.number()
    }))
    .output(mergePullRequestOutputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const octokit = await getInstallationOctokit(input.installationId);
        
        const response = await octokit.rest.pulls.merge({
          owner: input.repoOwner,
          repo: input.repoName,
          pull_number: input.githubPrNumber,
          commit_title: `Merge PR #${input.githubPrNumber} via ShipFlow AI`,
          merge_method: "squash"
        });

        if (response.status === 200 && response.data.merged) {
          // Update local DB status if needed
          await db.update(pullRequests)
            .set({ state: "MERGED" })
            .where(eq(pullRequests.id, input.pullRequestId));
            
          return { success: true, message: "Pull Request successfully merged" };
        } else {
          throw new Error("GitHub reported PR was not merged");
        }
      } catch (error: any) {
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: error.message || "Failed to merge Pull Request" 
        });
      }
    })
});
