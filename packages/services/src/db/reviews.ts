import { db } from "@shipflow/db";
import { pullRequestReviews, reviewFindings } from "@shipflow/db/schema";
import { and, eq } from "drizzle-orm";

type ReviewComment = {
  filePath: string;
  lineNumber: number | null;
  findingType:
    | "SECURITY"
    | "PERFORMANCE"
    | "ARCHITECTURE"
    | "PRD_DEVIATION"
    | "CODE_QUALITY"
    | "EDGE_CASE"
    | "TEST_COVERAGE";
  isBlocking: boolean;
  severity: "BLOCKER" | "MAJOR" | "MINOR" | "SUGGESTION";
  comment: string;
  suggestedFix?: string;
};

type CodeReviewResult = {
  comments: ReviewComment[];
  summary: string;
  reviewMeta?: {
    toolCallCount: number;
    toolsUsed: string[];
    reflectionApplied: boolean;
    modelUsed: string;
    shouldMerge?: boolean;
  };
};

/**
 * Saves the AI review results into the database to be displayed on the dashboard.
 */
export async function saveAiReviewToDatabase(
  pullRequestId: string,
  commitSha: string,
  reviewResult: CodeReviewResult,
): Promise<{ id: string; pullRequestId: string; commitSha: string }> {
  const existingReview = await db
    .select()
    .from(pullRequestReviews)
    .where(
      and(
        eq(pullRequestReviews.pullRequestId, pullRequestId),
        eq(pullRequestReviews.commitSha, commitSha),
      ),
    )
    .limit(1);

  if (existingReview[0]) {
    return {
      id: existingReview[0].id,
      pullRequestId: existingReview[0].pullRequestId,
      commitSha: existingReview[0].commitSha,
    };
  }

  const hasBlockingFindings = reviewResult.comments.some((c) => c.isBlocking);

  // 1. Create the parent review record
  const [review] = await db
    .insert(pullRequestReviews)
    .values({
      pullRequestId,
      isAiReview: true,
      state: hasBlockingFindings ? "CHANGES_REQUESTED" : "COMMENTED",
      commitSha,
      reviewMeta: reviewResult.reviewMeta,
    })
    .returning();

  if (!review) {
    throw new Error("Failed to insert PR review record");
  }

  if (reviewResult.comments.length === 0) {
    return {
      id: review.id,
      pullRequestId: review.pullRequestId,
      commitSha: review.commitSha,
    };
  }

  // 2. Insert all individual findings
  await db.insert(reviewFindings).values(
    reviewResult.comments.map((comment) => ({
      reviewId: review.id,
      filePath: comment.filePath,
      lineNumber: comment.lineNumber,
      findingType: comment.findingType,
      isBlocking: comment.isBlocking,
      severity: comment.severity,
      description: comment.comment,
      suggestion: comment.suggestedFix,
      status: "OPEN",
    })),
  );

  return {
    id: review.id,
    pullRequestId: review.pullRequestId,
    commitSha: review.commitSha,
  };
}
