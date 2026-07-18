import { inngest } from "../../../services/src/workflow/client";
import { db } from "@shipflow/db";
import { featureRequests, prdVersions, tasks, pullRequests, pullRequestReviews, reviewFindings, epics, prds } from "@shipflow/db/schema";
import { eq, desc, inArray, and, notInArray } from "@shipflow/db";

import { runReleaseReadinessAgent } from "@shipflow/ai";

export const releaseReadinessWorkflow = inngest.createFunction(
  { id: "release-readiness-workflow" },
  { event: "feature.awaiting.approval" },
  async ({ event, step }) => {
    const { featureId } = event.data;

    const result = await step.run("evaluate-release-readiness", async () => {
      // Fetch feature request
      const feature = await db.query.featureRequests.findFirst({
        where: (f, { eq }) => eq(f.id, featureId),
      });

      if (!feature) {
        return { skipped: "Feature not found" };
      }

      // Fetch PRD Context
      const prd = await db.query.prds.findFirst({
        where: (p, { eq }) => eq(p.featureRequestId, featureId)
      });
      const prdVersion = prd ? await db.query.prdVersions.findFirst({
        where: (pv, { eq }) => eq(pv.prdId, prd.id),
        orderBy: (pv, { desc }) => [desc(pv.versionNumber)],
      }) : null;

      const prdContext = prdVersion?.content ? JSON.stringify(prdVersion.content) : "No PRD found for this feature.";

      // Fetch Tasks Context
      let featureTasks: any[] = [];
      if (prd) {
        const featureEpics = await db.query.epics.findMany({ where: (e, { eq }) => eq(e.prdId, prd.id) });
        const epicIds = featureEpics.map(e => e.id);
        if (epicIds.length > 0) {
          featureTasks = await db.query.tasks.findMany({ where: (t, { inArray }) => inArray(t.epicId, epicIds) });
        }
      }
      
      const completedTasks = featureTasks.filter(t => t.status === "DONE").length;
      const tasksContext = `Total Tasks: ${featureTasks.length}, Completed: ${completedTasks}. Pending: ${featureTasks.filter(t => t.status !== "DONE").map(t => t.title).join(", ") || "None"}`;

      // Fetch Code Review Context
      const prs = await db.select({ id: pullRequests.id, taskId: pullRequests.taskId, title: pullRequests.title, state: pullRequests.state, createdAt: pullRequests.createdAt })
        .from(pullRequests)
        .where(
          and(
            eq(pullRequests.featureRequestId, featureId),
            notInArray(pullRequests.state, ["MERGED", "CLOSED"])
          )
        );

      let reviewContext = "No pull requests found.";
      let pullRequestState = "No PRs.";

      if (prs.length > 0) {
        // Group by taskId to find the latest PR for each task
        const latestPrByTask = new Map<string, typeof prs[0]>();
        
        for (const pr of prs) {
          const groupId = pr.taskId || "unassigned";
          const existing = latestPrByTask.get(groupId);
          if (!existing || new Date(pr.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
            latestPrByTask.set(groupId, pr);
          }
        }

        const latestPrs = Array.from(latestPrByTask.values());
        const prIds = latestPrs.map(pr => pr.id);
        pullRequestState = `Found ${prIds.length} latest PRs across tasks. States: ${latestPrs.map(pr => pr.state).join(", ")}`;
        
        let totalBlocking = 0;
        let totalNonBlocking = 0;
        let totalFindings = 0;

        for (const prId of prIds) {
          const latestReview = await db.query.pullRequestReviews.findFirst({
            where: (r, { eq }) => eq(r.pullRequestId, prId),
            orderBy: (r, { desc }) => [desc(r.createdAt)],
            with: { findings: true }
          });
          if (latestReview && (latestReview as any).findings?.length > 0) {
            const findings = (latestReview as any).findings;
            totalFindings += findings.length;
            totalBlocking += findings.filter((f: any) => f.isBlocking).length;
            totalNonBlocking += findings.filter((f: any) => !f.isBlocking).length;
          }
        }
        
        if (totalFindings > 0) {
          reviewContext = `Found ${totalFindings} issues across latest PRs. Blocking: ${totalBlocking}, Non-blocking: ${totalNonBlocking}.`;
        } else {
          reviewContext = "No review findings in latest PRs.";
        }
      }

      // Run AI
      return await runReleaseReadinessAgent({
        prdContext,
        tasksContext,
        reviewContext,
        pullRequestState
      });
    });

    if ("skipped" in result) {
      return result;
    }

    // Save result to the database
    await step.run("save-release-readiness", async () => {
      const { releaseReadiness } = await import("@shipflow/db/schema");
      
      await db.insert(releaseReadiness).values({
        featureRequestId: featureId,
        isReady: result.isReady,
        overallScore: result.overallScore,
        blockers: result.blockers,
        warnings: result.warnings,
        recommendation: result.recommendation,
        releaseNotes: result.releaseNotesDraft,
      });
    });

    return result;
  }
);
