import { inngest } from "../../../services/src/workflow/client";
import { runCodeReviewerAgent } from "@shipflow/ai";
import { getInstallationOctokit } from "@shipflow/github";
import { fetchPrFiles } from "@shipflow/services/github/files";
import { searchRecords, getRepoNamespace } from "@shipflow/services/pinecone/vector";
import { postReviewComment } from "@shipflow/services/github/comments";
import { saveAiReviewToDatabase } from "@shipflow/services/db/reviews";
import { db } from "@shipflow/db";
import { pullRequests, pullRequestReviews, prds, epics, tasks, organizations } from "@shipflow/db/schema";
import { eq } from "@shipflow/db";


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
    const pullRequest = await step.run("fetch-pr", async () => {
      const pr = await db.query.pullRequests.findFirst({
        where: (prs, { eq }) => eq(prs.id, pullRequestId),
        with: {
          task: true,
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
      return pr;
    });

    if (!pullRequest) {
      throw new Error("Pull request not found");
    }

    const prdObj = pullRequest?.featureRequest?.prds?.[0]?.currentVersion?.content;
    const prd = typeof prdObj === "object" && prdObj !== null ? prdObj : (typeof prdObj === "string" ? JSON.parse(prdObj) : {});
    
    let subtasksData: any[] = [];
    if (pullRequest.taskId) {
      subtasksData = await db.query.subtasks.findMany({
        where: (st, { eq }) => eq(st.taskId, pullRequest.taskId!)
      });
    }

    const previousFindings = await step.run("fetch-previous-findings", async () => {
      const prevReview = await db.query.pullRequestReviews.findFirst({
        where: (r, { eq }) => eq(r.pullRequestId, pullRequestId),
        orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
        with: { findings: true },
      });
      return (prevReview as any)?.findings?.map((f: any) => ({
        filePath: f.filePath,
        lineNumber: f.lineNumber,
        description: f.description,
        isBlocking: f.isBlocking
      })) || [];
    });

    // 4. AI Generation
    const reviewResult: any = await step.run("run-ai-review", async () => {
      const octokit = await getInstallationOctokit(installationId);
      const repoNamespace = getRepoNamespace(repositoryId);
      const { result } = await runCodeReviewerAgent({
        octokit,
        repoOwner,
        repoName,
        repoNamespace,
        headSha,
        prd,
        task: pullRequest.task,
        subtasks: subtasksData,
        previousFindings,
        searchRecords: async (query, topK, filter) => {
          const res = await searchRecords(repoNamespace, query, topK, filter);
          return res.map((r: any) => ({ text: r.text, metadata: r.metadata, score: r.score }));
        }
      }, diffContent);
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
      const hasBlockingFindings = reviewResult.comments.some((c: any) => c.isBlocking || c.severity === 'BLOCKER');

      const [updatedPr] = await (db as any)
        .update(pullRequests)
        .set({ state: hasBlockingFindings ? "CHANGES_REQUESTED" : "IN_REVIEW" })
        .where(eq((pullRequests as any).id, pullRequestId))
        .returning();

      if (reviewResult.completedSubtaskIds && reviewResult.completedSubtaskIds.length > 0) {
        const { subtasks } = await import("@shipflow/db/schema");
        const { inArray } = await import("@shipflow/db");

        await (db as any).update(subtasks)
          .set({ isCompleted: true })
          .where(inArray(subtasks.id, reviewResult.completedSubtaskIds));
      }

      await (db as any)
        .update(pullRequestReviews)
        .set({ 
          githubReviewId: githubReview.id,
          state: githubReview.state === "CHANGES_REQUESTED" ? "CHANGES_REQUESTED" : "COMMENTED"
        })
        .where(eq((pullRequestReviews as any).id, savedReview.id));

      if (updatedPr && updatedPr.featureRequestId) {
        const { featureService } = await import("../../../services/src/feature/feature.service");
        try {
          if (hasBlockingFindings) {
            // Check autopilot to re-trigger implementation
            const org = await db.query.organizations.findFirst({ where: (orgs, { eq }) => eq(orgs.id, updatedPr.orgId) });
            
            if (org?.isAutopilotEnabled) {
              const prd = await db.query.prds.findFirst({ where: (p, { eq }) => eq(p.featureRequestId, updatedPr.featureRequestId) });
              if (prd) {
                const epic = await db.query.epics.findFirst({ where: (e, { eq }) => eq(e.prdId, prd.id) });
                if (epic) {
                  const commentsStr = reviewResult.comments.map((c: any) => `File: ${c.filePath}${c.lineNumber ? `:${c.lineNumber}` : ''}\nIssue: ${c.comment}${c.suggestedFix ? `\nSuggested Fix: ${c.suggestedFix}` : ''}`).join("\n\n");
                  await (db as any).update(tasks)
                    .set({ fixesPrompt: `[AI REVIEW FINDINGS]\n\n${commentsStr}`, status: "TODO" })
                    .where(eq((tasks as any).epicId, epic.id));
                  
                  const epicTasks = await db.query.tasks.findMany({ where: (t, { eq }) => eq(t.epicId, epic.id) });
                  const taskIds = epicTasks.map((t: any) => t.id);

                  await step.sendEvent("auto-retrigger-implementation", {
                    name: "tasks.approved_for_dev",
                    data: { prdId: prd.id, orgId: updatedPr.orgId, taskIds }
                  });
                }
              }
            }
          }
        } catch (e) {
          console.warn("Failed to trigger autopilot on review findings", e);
        }
      }
    });

    return { success: true, commentsGenerated: reviewResult.comments.length };
  },
);
