import { inngest } from "../../../services/src/workflow/client";
import { runCodeReview } from "@shipflow/ai";
import { getInstallationOctokit } from "@shipflow/github";
import { fetchPrFiles } from "@shipflow/services/github/files";
import { searchRecords, getRepoNamespace } from "@shipflow/services/pinecone/vector";
import { postReviewComment } from "@shipflow/services/github/comments";
import { saveAiReviewToDatabase } from "@shipflow/services/db/reviews";
import { db } from "@shipflow/db";
import { pullRequests, pullRequestReviews } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

/**
 * Durable workflow to review a GitHub Pull Request.
 * Triggered on `github.pr.opened` or `synchronize`.
 *
 * Steps:
 *  1. Fetch PR diff files.
 *  2. Search Pinecone for similar context chunks in the repository codebase.
 *  3. Run the AI reviewer prompt with the diff and RAG context.
 *  4. Save the results to our database for the dashboard.
 *  5. Post the inline comments back to the GitHub PR.
 */
export const reviewPullRequestWorkflow = inngest.createFunction(
  {
    id: "review-pull-request",
    retries: 2,
    idempotency: "event.data.deliveryId",
  },
  { event: "github.pr.opened" },
  async ({ event, step }) => {
    const {
      action,
      pullRequestId,
      repositoryId,
      githubPrNumber,
      repoOwner,
      repoName,
      headSha,
      installationId,
    } = event.data;

    // 0. Dismiss stale reviews on synchronize
    if (action === "synchronize") {
      await step.run("dismiss-stale-reviews", async () => {
        const octokit = await getInstallationOctokit(installationId);
        const { data: reviews } = await octokit.rest.pulls.listReviews({ 
          owner: repoOwner, 
          repo: repoName, 
          pull_number: githubPrNumber 
        });
        const aiReviews = reviews.filter(r => r.user?.type === "Bot" && r.state === "CHANGES_REQUESTED");
        for (const review of aiReviews) {
          await octokit.rest.pulls.dismissReview({
            owner: repoOwner, 
            repo: repoName, 
            pull_number: githubPrNumber, 
            review_id: review.id,
            message: `Superseded by new review for commit ${headSha}`
          });
        }
      });
    }

    // 1. Fetch PR Diff Patches
    const prFiles = await step.run("fetch-pr-files", async () => {
      const octokit = await getInstallationOctokit(installationId);
      return fetchPrFiles(octokit, repoOwner, repoName, githubPrNumber);
    });

    const diffContent = prFiles
      .map((f: any) => `File: ${f.filename}\nPatch:\n${f.patch}`)
      .join("\n\n");

    if (!diffContent.trim()) {
      return { skipped: "No diff content" };
    }

    // 2. RAG Context Retrieval
    const contextSnippets = await step.run("fetch-rag-context", async () => {
      try {
        const repoNamespace = getRepoNamespace(repositoryId);
        // We use the combined patch diff to query Pinecone for the most relevant architecture/patterns
        const results = await searchRecords(repoNamespace, diffContent, 10);
        return results.map((r: any) => r.text);
      } catch (e) {
        console.warn("RAG retrieval failed, proceeding without context", e);
        return []; // Proceed without context if Pinecone fails or is empty
      }
    });

    // 3. Fetch PRD for context
    const prWithFeature = await step.run("fetch-feature-prd", async () => {
      return db.query.pullRequests.findFirst({
        where: eq(pullRequests.id, pullRequestId),
        with: {
          featureRequest: {
            with: {
              prds: {
                with: {
                  currentVersion: true
                }
              }
            }
          }
        }
      });
    });
    
    const prdObj = prWithFeature?.featureRequest?.prds?.[0]?.currentVersion?.content;
    const prd = typeof prdObj === "string" ? prdObj : (prdObj ? JSON.stringify(prdObj) : undefined);

    const previousFindings = await step.run("fetch-previous-findings", async () => {
      const prevReview = await db.query.pullRequestReviews.findFirst({
        where: eq(pullRequestReviews.pullRequestId, pullRequestId),
        orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
        with: { findings: true },
      });
      return prevReview?.findings.map(f => 
        `[${f.isBlocking ? 'BLOCKER' : 'non-blocking'}] ${f.filePath}:${f.lineNumber} — ${f.description}`
      ).join('\n') || undefined;
    });

    // 4. AI Generation
    const reviewResult: any = await step.run("run-ai-review", async () => {
      const { result } = await runCodeReview(diffContent, contextSnippets, prd ?? undefined, previousFindings ?? undefined);
      return result;
    });

    // 4. Save to Database
    const savedReview = await step.run("save-review-to-db", async () => {
      return saveAiReviewToDatabase(pullRequestId, headSha, reviewResult);
    });

    // 5. Post to GitHub
    const githubReview = await step.run("post-github-comments", async () => {
      const octokit = await getInstallationOctokit(installationId);
      return postReviewComment(
        octokit,
        repoOwner,
        repoName,
        githubPrNumber,
        headSha,
        reviewResult,
        prFiles,
      );
    });

    // 6. Persist the GitHub review id and keep the PR state fresh.
    await step.run("link-github-review", async () => {
      const hasBlockingFindings = reviewResult.comments.some((c: any) => c.isBlocking);

      const [updatedPr] = await db
        .update(pullRequests)
        .set({ state: hasBlockingFindings ? "CHANGES_REQUESTED" : "IN_REVIEW" })
        .where(eq(pullRequests.id, pullRequestId))
        .returning();

      await db
        .update(pullRequestReviews)
        .set({ 
          githubReviewId: githubReview.id,
          state: githubReview.state === "CHANGES_REQUESTED" ? "CHANGES_REQUESTED" : "COMMENTED"
        })
        .where(eq(pullRequestReviews.id, savedReview.id));

      if (updatedPr && updatedPr.featureRequestId) {
        const { featureService } = await import("../../../services/src/feature/feature.service");
        try {
          // Ensure we hit IN_REVIEW state first to satisfy transition rules
          await featureService.markInReview(updatedPr.featureRequestId, updatedPr.orgId);
          
          if (hasBlockingFindings) {
            await featureService.failReview(updatedPr.featureRequestId, updatedPr.orgId, "SYSTEM");
          } else {
            await featureService.markReviewPassed(updatedPr.featureRequestId, updatedPr.orgId);
          }
        } catch (e) {
          console.warn("Failed to update feature status based on review findings", e);
        }
      }
    });

    return { success: true, commentsGenerated: reviewResult.comments.length };
  },
);
