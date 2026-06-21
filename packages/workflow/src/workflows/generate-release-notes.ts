import { inngest } from "../client";
import { runSummarizerAgent } from "@shipflow/ai";

export const generateReleaseNotesWorkflow = inngest.createFunction(
  { id: "generate-release-notes" },
  { event: "github.release.drafted" },
  async ({ event, step }) => {
    const prs = await step.run("fetch-merged-prs", async () => {
      console.log(`Fetching PRs for tag ${event.data.tagName}`);
      return [
        {
          title: "feat: Add Inngest client and background job processing",
          body: "Configured the Inngest client to handle async code review jobs.",
          commits: ["feat: add inngest package", "fix: resolve type issue"],
        },
        {
          title: "fix: Webhook signature verification throwing 500",
          body: "The crypto.timingSafeEqual was crashing on invalid buffer lengths.",
          commits: ["fix: catch buffer errors in webhook verify"],
        },
        {
          title: "chore: Bump dependencies",
          body: null,
          commits: ["chore: update zod to 4.3.5"],
        },
      ];
    });

    const releaseNotes = await step.run("generate-notes", async () => {
      const { result } = await runSummarizerAgent(prs);
      return result;
    });

    await step.run("update-github-release", async () => {
      console.log(`Updating release ${event.data.tagName} with body:\n`, releaseNotes);
      return { success: true };
    });

    return { releaseNotes };
  }
);
