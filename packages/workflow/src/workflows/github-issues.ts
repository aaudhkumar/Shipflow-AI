import { inngest } from "../../../services/src/workflow/client";
import { db } from "@shipflow/db";
import { githubIssues, githubIssueComments, featureRequests } from "@shipflow/db/schema";
import { eq, and, sql, notInArray } from "drizzle-orm";
import { getDefaultModel, generateObject } from "@shipflow/ai";
import { z } from "zod";

export const githubIssueOpenedWorkflow = inngest.createFunction(
  { id: "github-issue-opened" },
  { event: "github.issue.opened" },
  async ({ event, step }) => {
    // Stage 1: pg_trgm fast path matching
    const trgmMatch = await step.run("find-exact-feature-match", async () => {
      // Find the best match with similarity > 0.35 that isn't SHIPPED or REJECTED
      const res = await db.execute(sql`
        SELECT id, title, similarity(title, ${event.data.title}) AS sim
        FROM feature_requests
        WHERE org_id = ${event.data.orgId}
          AND status NOT IN ('SHIPPED', 'REJECTED')
          AND similarity(title, ${event.data.title}) > 0.35
        ORDER BY sim DESC
        LIMIT 1;
      `);
      return res.rows[0] as { id: string; title: string; sim: number } | undefined;
    });

    let featureRequestId: string | null = trgmMatch?.id || null;

    // Stage 2: LLM fallback
    if (!featureRequestId) {
      featureRequestId = await step.run("find-semantic-feature-match", async () => {
        const activeFeatures = await db.query.featureRequests.findMany({
          where: and(
            eq(featureRequests.orgId, event.data.orgId),
            notInArray(featureRequests.status, ["SHIPPED", "REJECTED"])
          ),
          columns: { id: true, title: true, rawDescription: true },
          limit: 50,
        });

        if (activeFeatures.length === 0) return null;

        const model = getDefaultModel();

        const result = await generateObject({
          model,
          schema: z.object({
            featureId: z.string().nullable(),
            confidence: z.number().min(0).max(1),
            reasoning: z.string(),
          }),
          prompt: `
You are matching a GitHub issue to a product feature in our backlog.

GitHub Issue:
Title: "${event.data.title}"
Body: "${event.data.body?.slice(0, 500) ?? "none"}"

Active Features:
${activeFeatures.map((f) => `- ID: ${f.id} | Title: ${f.title}`).join("\n")}

Which feature does this issue most likely relate to?
If no feature is a reasonable match, return featureId: null.
Only auto-link if confidence >= 0.7.
          `.trim(),
        });

        const obj = result.object as { featureId: string | null; confidence: number; reasoning: string };
        if (obj.featureId && obj.confidence >= 0.7) {
          return obj.featureId;
        }
        return null;
      });
    }

    await step.run("persist-issue", async () => {
      await db
        .insert(githubIssues)
        .values({
          orgId: event.data.orgId,
          repositoryId: event.data.repositoryId,
          issueNumber: event.data.issueNumber,
          title: event.data.title,
          body: event.data.body,
          state: event.data.state,
          authorLogin: event.data.authorLogin,
          featureRequestId,
          openedAt: new Date(event.data.actionAt),
        })
        .onConflictDoNothing(); // Prevent duplicates on retries
    });
  }
);

export const githubIssueClosedWorkflow = inngest.createFunction(
  { id: "github-issue-closed" },
  { event: "github.issue.closed" },
  async ({ event, step }) => {
    await step.run("update-issue-status", async () => {
      const closedAt = new Date(event.data.actionAt);
      
      const existing = await db.query.githubIssues.findFirst({
        where: and(
          eq(githubIssues.repositoryId, event.data.repositoryId),
          eq(githubIssues.issueNumber, event.data.issueNumber)
        )
      });
      
      if (existing) {
        await db
          .update(githubIssues)
          .set({ state: "closed", closedAt })
          .where(eq(githubIssues.id, existing.id));
      } else {
        // Just in case it wasn't tracked when opened
        await db.insert(githubIssues).values({
          orgId: event.data.orgId,
          repositoryId: event.data.repositoryId,
          issueNumber: event.data.issueNumber,
          title: event.data.title,
          body: event.data.body,
          state: "closed",
          authorLogin: event.data.authorLogin,
          openedAt: new Date(), // fallback
          closedAt,
        }).onConflictDoNothing();
      }
    });
  }
);

export const githubIssueCommentCreatedWorkflow = inngest.createFunction(
  { id: "github-issue-comment-created" },
  { event: "github.issue_comment.created" },
  async ({ event, step }) => {
    await step.run("persist-issue-comment", async () => {
      // Find the issue first
      const issue = await db.query.githubIssues.findFirst({
        where: and(
          eq(githubIssues.repositoryId, event.data.repositoryId),
          eq(githubIssues.issueNumber, event.data.issueNumber)
        )
      });

      if (!issue) {
        // If the issue doesn't exist in our DB, we can't tie a comment to it, skip.
        console.log("Issue not found, skipping comment insert.");
        return;
      }

      await db
        .insert(githubIssueComments)
        .values({
          issueId: issue.id,
          githubCommentId: event.data.githubCommentId,
          body: event.data.body,
          authorLogin: event.data.authorLogin,
          createdAt: new Date(event.data.createdAt),
        })
        .onConflictDoNothing();
    });
  }
);
