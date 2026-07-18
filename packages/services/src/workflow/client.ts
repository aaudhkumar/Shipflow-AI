import { Inngest, EventSchemas } from "inngest";
import { z } from "zod";
import { GithubPrOpenedEventSchema, GithubReleasePublishedSchema, BillingPaymentSuccessSchema, DeploymentFailedSchema, FeatureStateTransitionSchema, RepoSyncRequestedSchema, GitHubRepositoriesSyncSchema, GithubIssueOpenedSchema, GithubIssueClosedSchema, GithubIssueCommentCreatedSchema, FeatureCreatedEventSchema, TasksApprovedForDevSchema, ProjectContextGenerateSchema, TaskImplementationCompletedSchema } from "./events";

type Events = {
  "project.context.generate": {
    data: z.infer<typeof ProjectContextGenerateSchema>;
  };
  "github.pr.opened": {
    data: z.infer<typeof GithubPrOpenedEventSchema>;
  };
  "github.release.published": {
    data: z.infer<typeof GithubReleasePublishedSchema>;
  };
  "billing.payment.success": {
    data: z.infer<typeof BillingPaymentSuccessSchema>;
  };
  "deployment.failed": {
    data: z.infer<typeof DeploymentFailedSchema>;
  };
  "feature.created": {
    data: z.infer<typeof FeatureCreatedEventSchema>;
  };
  "feature.prd.generated": {
    data: z.infer<typeof FeatureStateTransitionSchema>;
  };
  "feature.execution_plan.generated": {
    data: z.infer<typeof FeatureStateTransitionSchema>;
  };
  "feature.tasks.generated": {
    data: z.infer<typeof FeatureStateTransitionSchema>;
  };
  "feature.plan.approved": {
    data: z.infer<typeof FeatureStateTransitionSchema>;
  };
  "feature.review.failed": {
    data: z.infer<typeof FeatureStateTransitionSchema>;
  };
  "feature.human.approved": {
    data: z.infer<typeof FeatureStateTransitionSchema>;
  };
  "feature.awaiting.approval": {
    data: z.infer<typeof FeatureStateTransitionSchema>;
  };
  "repo.sync.requested": {
    data: z.infer<typeof RepoSyncRequestedSchema>;
  };
  "github.repositories.sync": {
    data: z.infer<typeof GitHubRepositoriesSyncSchema>;
  };
  "github.issue.opened": {
    data: z.infer<typeof GithubIssueOpenedSchema>;
  };
  "github.issue.closed": {
    data: z.infer<typeof GithubIssueClosedSchema>;
  };
  "github.issue_comment.created": {
    data: z.infer<typeof GithubIssueCommentCreatedSchema>;
  };
  "tasks.approved_for_dev": {
    data: z.infer<typeof TasksApprovedForDevSchema>;
  };
  "tasks.implementation.completed": {
    data: z.infer<typeof TaskImplementationCompletedSchema>;
  };
};
const isDev = process.env.NODE_ENV === "development";

export const inngest = new Inngest({
  id: "shipflow-ai",
  schemas: new EventSchemas().fromRecord<Events>(),
  ...(isDev ? { baseUrl: "http://127.0.0.1:8288/", eventKey: "local" } : {})
});
