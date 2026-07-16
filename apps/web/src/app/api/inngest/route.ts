import { serve } from "inngest/next";
import { 
  inngest, 
  generateReleaseNotesWorkflow, 
  billingSyncWorkflow, 
  syncRepositoryWorkflow, 
  reviewPullRequestWorkflow,
  featureCreated,
  featurePrdGenerated,
  featureTasksGenerated,
  featurePlanApproved,
  featureReviewFailed,
  featureHumanApproved,
  releaseReadinessWorkflow,
  githubIssueOpenedWorkflow,
  githubIssueClosedWorkflow,
  githubIssueCommentCreatedWorkflow,
  implementFeatureTasks,
  releaseStaleClaims,
  generateProjectContextWorkflow
} from "@shipflow/workflow";


export const { GET, POST, PUT } = serve({
  client: inngest,
  // Tell the Inngest dev server where this serve handler lives
  // so it can discover and invoke the registered functions
  ...(process.env.NODE_ENV === "development" ? { serveHost: "http://localhost:3000", servePath: "/api/inngest" } : {}),
  functions: [
    featureCreated,
    reviewPullRequestWorkflow,
    generateReleaseNotesWorkflow,
    billingSyncWorkflow,
    syncRepositoryWorkflow,
    featurePrdGenerated,
    featureTasksGenerated,
    featurePlanApproved,
    featureReviewFailed,
    featureHumanApproved,
    releaseReadinessWorkflow,
    githubIssueOpenedWorkflow,
    githubIssueClosedWorkflow,
    githubIssueCommentCreatedWorkflow,
    implementFeatureTasks,
    releaseStaleClaims,
    generateProjectContextWorkflow
  ],
});
