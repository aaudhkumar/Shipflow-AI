import { router, orgMemberProcedure } from "../../trpc";
import { z } from "zod";
import { db } from "@shipflow/db";
import {
  featureRequests,
  pullRequests,
  githubIssues,
  pullRequestReviews,
  reviewFindings,
  repositories,
} from "@shipflow/db/schema";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Search"];
const getPath = generatePath("/search");

const MAX_RESULTS_PER_CATEGORY = 5;

export const searchRouter = router({
  global: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}"), tags: TAGS } })
    .input(
      z.object({
        orgId: z.string(),
        query: z.string().min(1).max(200),
      })
    )
    .output(
      z.object({
        features: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            status: z.string(),
            createdAt: z.date(),
          })
        ),
        pullRequests: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            githubPrNumber: z.number(),
            state: z.string(),
            repoName: z.string().nullable(),
            createdAt: z.date(),
          })
        ),
        issues: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            issueNumber: z.number(),
            state: z.string(),
            repoFullName: z.string(),
            authorLogin: z.string().nullable(),
          })
        ),
        reviews: z.array(
          z.object({
            id: z.string(),
            prTitle: z.string(),
            githubPrNumber: z.number(),
            findingCount: z.number(),
            createdAt: z.date(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      const pattern = `%${input.query}%`;

      // Run all four queries in parallel
      const [featuresResult, prsResult, issuesResult, reviewsResult] =
        await Promise.all([
          // 1. Feature Requests
          db
            .select({
              id: featureRequests.id,
              title: featureRequests.title,
              status: featureRequests.status,
              createdAt: featureRequests.createdAt,
            })
            .from(featureRequests)
            .where(
              and(
                eq(featureRequests.orgId, input.orgId),
                or(
                  ilike(featureRequests.title, pattern),
                  ilike(featureRequests.rawDescription, pattern)
                )
              )
            )
            .orderBy(desc(featureRequests.createdAt))
            .limit(MAX_RESULTS_PER_CATEGORY),

          // 2. Pull Requests
          db
            .select({
              id: pullRequests.id,
              title: pullRequests.title,
              githubPrNumber: pullRequests.githubPrNumber,
              state: pullRequests.state,
              repoName: repositories.fullName,
              createdAt: pullRequests.createdAt,
            })
            .from(pullRequests)
            .leftJoin(
              repositories,
              eq(pullRequests.repositoryId, repositories.id)
            )
            .where(
              and(
                eq(pullRequests.orgId, input.orgId),
                or(
                  ilike(pullRequests.title, pattern),
                  ilike(pullRequests.body, pattern)
                )
              )
            )
            .orderBy(desc(pullRequests.createdAt))
            .limit(MAX_RESULTS_PER_CATEGORY),

          // 3. GitHub Issues
          db
            .select({
              id: githubIssues.id,
              title: githubIssues.title,
              issueNumber: githubIssues.issueNumber,
              state: githubIssues.state,
              repoFullName: repositories.fullName,
              authorLogin: githubIssues.authorLogin,
            })
            .from(githubIssues)
            .innerJoin(
              repositories,
              eq(githubIssues.repositoryId, repositories.id)
            )
            .where(
              and(
                eq(githubIssues.orgId, input.orgId),
                or(
                  ilike(githubIssues.title, pattern),
                  ilike(githubIssues.body, pattern)
                )
              )
            )
            .orderBy(desc(githubIssues.createdAt))
            .limit(MAX_RESULTS_PER_CATEGORY),

          // 4. Reviews (via findings descriptions, joined to PR for title)
          db
            .select({
              id: pullRequestReviews.id,
              prTitle: pullRequests.title,
              githubPrNumber: pullRequests.githubPrNumber,
              findingCount:
                sql<number>`count(${reviewFindings.id})::int`.as(
                  "finding_count"
                ),
              createdAt: pullRequestReviews.createdAt,
            })
            .from(pullRequestReviews)
            .innerJoin(
              pullRequests,
              eq(pullRequestReviews.pullRequestId, pullRequests.id)
            )
            .leftJoin(
              reviewFindings,
              eq(reviewFindings.reviewId, pullRequestReviews.id)
            )
            .where(
              and(
                eq(pullRequests.orgId, input.orgId),
                or(
                  ilike(pullRequests.title, pattern),
                  ilike(reviewFindings.description, pattern)
                )
              )
            )
            .groupBy(
              pullRequestReviews.id,
              pullRequests.title,
              pullRequests.githubPrNumber,
              pullRequestReviews.createdAt
            )
            .orderBy(desc(pullRequestReviews.createdAt))
            .limit(MAX_RESULTS_PER_CATEGORY),
        ]);

      return {
        features: featuresResult,
        pullRequests: prsResult,
        issues: issuesResult,
        reviews: reviewsResult,
      };
    }),
});
