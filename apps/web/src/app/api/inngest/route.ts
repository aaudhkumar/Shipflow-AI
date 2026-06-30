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
  releaseStaleClaims
} from "@shipflow/workflow";


export const { GET, POST, PUT } = serve({
  client: inngest,
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
    releaseStaleClaims
  ],
});
