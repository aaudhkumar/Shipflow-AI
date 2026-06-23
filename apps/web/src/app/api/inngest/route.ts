import { serve } from "inngest/next";
import { inngest, generateReleaseNotesWorkflow, billingSyncWorkflow, syncRepositoryWorkflow, reviewPullRequestWorkflow } from "@shipflow/workflow";


export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    reviewPullRequestWorkflow,
    generateReleaseNotesWorkflow,
    billingSyncWorkflow,
    syncRepositoryWorkflow,
  ],
});
