import { inngest } from "@shipflow/services/src/workflow/client";
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

    // 3. AI Generation
    const reviewResult: any = await step.run("run-ai-review", async () => {
      const { result } = await runCodeReview(diffContent, contextSnippets);
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
      await db
        .update(pullRequests)
        .set({ state: action === "synchronize" ? "IN_REVIEW" : "IN_REVIEW" })
        .where(eq(pullRequests.id, pullRequestId));

      await db
        .update(pullRequestReviews)
        .set({ githubReviewId: githubReview.id })
        .where(eq(pullRequestReviews.id, savedReview.id));
    });

    return { success: true, commentsGenerated: reviewResult.comments.length };
  },
);
