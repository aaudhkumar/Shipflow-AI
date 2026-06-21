import { serve } from "inngest/next";
import { inngest, generateReleaseNotesWorkflow, billingSyncWorkflow } from "@shipflow/workflow";
import { runCodeReview } from "@shipflow/ai";

const reviewPullRequestWorkflow = inngest.createFunction(
  { id: "review-pull-request" },
  { event: "github.pr.opened" },
  async ({ event, step }) => {
    // 1. Fetch diff (stubbed for this milestone)
    const diff = await step.run("fetch-pr-diff", async () => {
      return `
      --- a/src/app/page.tsx
      +++ b/src/app/page.tsx
      @@ -1,5 +1,6 @@
       export default function Home() {
      -  return <div>Hello world</div>;
      +  // dangerous eval injection
      +  return <div dangerouslySetInnerHTML={{__html: eval('test')}} />;
       }
      `;
    });

    // 2. Run AI Review
    const reviewResult = await step.run("run-ai-review", async () => {
      const { result } = await runCodeReview(diff);
      return result;
    });

    // 3. Post to GitHub (stubbed)
    await step.run("post-review-comments", async () => {
      const result = reviewResult as any;
      console.log("Would post to GitHub PR", event.data.githubPrNumber, result);
      return { success: true, posted: result.comments.length };
    });

    return { reviewResult };
  }
);

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    reviewPullRequestWorkflow,
    generateReleaseNotesWorkflow,
    billingSyncWorkflow,
  ],
});
