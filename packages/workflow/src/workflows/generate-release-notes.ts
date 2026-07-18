import { inngest } from "../../../services/src/workflow/client";
import { runSummarizerAgent } from "@shipflow/ai";
import { db } from "@shipflow/db";
import { releaseNotes, pullRequests } from "@shipflow/db/schema";
import { eq, desc, and, isNotNull, gt } from "@shipflow/db";


export const generateReleaseNotesWorkflow = inngest.createFunction(
  { id: "generate-release-notes" },
  { event: "github.release.published" },
  async ({ event, step }) => {
    const prs = await step.run("fetch-merged-prs", async () => {
      console.log(`Fetching PRs for tag ${event.data.tagName}`);
      
      const lastRelease = await db.query.releaseNotes.findFirst({
        where: eq(releaseNotes.orgId, event.data.orgId),
        orderBy: [desc(releaseNotes.createdAt)],
      });
      
      const since = lastRelease?.createdAt ?? new Date(0);
      
      const dbPrs = await db.query.pullRequests.findMany({
        where: and(
          eq(pullRequests.orgId, event.data.orgId),
          isNotNull(pullRequests.mergedAt),
          gt(pullRequests.mergedAt, since),
        ),
        columns: { title: true, body: true },
      });

      return dbPrs.map(pr => ({
        title: pr.title,
        body: pr.body,
        commits: [] as string[],
      }));
    });

    if (prs.length === 0) {
      const emptyNotes = "No pull requests were merged since the last release.";
      await step.run("persist-empty-notes", async () => {
        await db.insert(releaseNotes).values({
          orgId: event.data.orgId,
          repositoryId: event.data.repositoryId,
          githubReleaseId: event.data.releaseId,
          tagName: event.data.tagName,
          content: emptyNotes,
        });
      });
      return { releaseNotes: emptyNotes };
    }

    const generatedNotes = await step.run("generate-notes", async () => {
      const { result } = await runSummarizerAgent(prs);
      return result;
    });

    await step.run("persist-notes", async () => {
      console.log(`Persisting release ${event.data.tagName} notes to DB`);
      await db.insert(releaseNotes).values({
        orgId: event.data.orgId,
        repositoryId: event.data.repositoryId,
        githubReleaseId: event.data.releaseId,
        tagName: event.data.tagName,
        content: generatedNotes,
      });
      return { success: true };
    });

    return { releaseNotes: generatedNotes };
  }
);
