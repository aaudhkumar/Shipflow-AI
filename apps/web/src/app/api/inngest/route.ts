import { serve } from "inngest/next";
import { 
  inngest, 
  generateReleaseNotesWorkflow, 
  billingSyncWorkflow, 
  syncRepositoryWorkflow, 
  reviewPullRequestWorkflow,
  featurePrdGenerated,
  featureTasksGenerated,
  featurePlanApproved,
  featureReviewFailed,
  featureHumanApproved,
  releaseReadinessWorkflow
} from "@shipflow/workflow";


export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
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
  ],
});
