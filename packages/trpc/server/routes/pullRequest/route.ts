import { router, orgMemberProcedure } from "../../trpc";
import { z } from "zod";
import { db } from "@shipflow/db";
import { pullRequests, pullRequestReviews, reviewFindings } from "@shipflow/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const pullRequestRouter = router({
  list: orgMemberProcedure
    .input(z.object({ orgId: z.string() }))
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
    .input(z.object({ orgId: z.string(), githubPrNumber: z.number() }))
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
  updateFindingStatus: orgMemberProcedure
    .input(z.object({ orgId: z.string(), findingId: z.string(), status: z.string() }))
    .mutation(async ({ input }) => {
      const [updated] = await db.update(reviewFindings)
        .set({ status: input.status })
        .where(eq(reviewFindings.id, input.findingId))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Finding not found" });
      return updated;
    }),

  listReviews: orgMemberProcedure
    .input(z.object({ orgId: z.string(), filter: z.enum(["ALL", "BLOCKING", "CLEAN"]).optional().default("ALL") }))
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
    })
});
