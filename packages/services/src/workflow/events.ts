import { z } from "zod";

export const GithubPrOpenedEventSchema = z.object({
  pullRequestId: z.string(),
  repositoryId: z.string(),
  githubPrNumber: z.number(),
  orgId: z.string(),
  repoOwner: z.string(),
  repoName: z.string(),
  headSha: z.string(),
  installationId: z.number(),
  action: z.enum(["opened", "synchronize", "reopened"]),
  deliveryId: z.string(),
});

export const GithubReleasePublishedSchema = z.object({
  repositoryId: z.string(),
  tagName: z.string(),
  orgId: z.string(),
  releaseId: z.number(),
  publishedAt: z.string().nullable(),
});

export const BillingPaymentSuccessSchema = z.object({
  subscriptionId: z.string().nullable(),
  paymentId: z.string(),
  amount: z.number(),
  orgId: z.string().nullable(),
  planId: z.string().nullable(),
});

export const DeploymentFailedSchema = z.object({
  deploymentId: z.string(),
  repositoryId: z.string(),
  commitSha: z.string(),
  environment: z.string(),
});

export const FeatureStateTransitionSchema = z.object({
  featureId: z.string(),
  orgId: z.string(),
  previousState: z.string(),
  newState: z.string(),
  actorId: z.string(),
});

export const TasksApprovedForDevSchema = z.object({
  prdId: z.string(),
  orgId: z.string(),
  taskIds: z.array(z.string()),
});

export const FeatureCreatedEventSchema = z.object({
  featureId: z.string(),
  orgId: z.string(),
  actorId: z.string(),
});

export const RepoSyncRequestedSchema = z.object({
  repositoryId: z.string(),
  orgId: z.string(),
  installationId: z.number(),
  repoOwner: z.string(),
  repoName: z.string(),
  defaultBranch: z.string(),
});

export const GitHubRepositoriesSyncSchema = z.object({
  orgId: z.string(),
  actorId: z.string(),
});

export const GithubIssueOpenedSchema = z.object({
  orgId: z.string(),
  repositoryId: z.string(),
  issueNumber: z.number(),
  title: z.string(),
  body: z.string(),
  state: z.string(),
  authorLogin: z.string(),
  actionAt: z.string(),
});

export const GithubIssueClosedSchema = z.object({
  orgId: z.string(),
  repositoryId: z.string(),
  issueNumber: z.number(),
  title: z.string(),
  body: z.string(),
  state: z.string(),
  authorLogin: z.string(),
  actionAt: z.string(),
});

export const GithubIssueCommentCreatedSchema = z.object({
  orgId: z.string(),
  repositoryId: z.string(),
  issueNumber: z.number(),
  githubCommentId: z.number(),
  body: z.string(),
  authorLogin: z.string(),
  createdAt: z.string(),
});

export const ProjectContextGenerateSchema = z.object({
  projectId: z.string(),
  orgId: z.string(),
});

export const TaskImplementationCompletedSchema = z.object({
  taskId: z.string(),
  success: z.boolean(),
  branch: z.string().optional(),
  commitSha: z.string().optional(),
  error: z.string().optional(),
});

export const ShipflowEvents = {
  "github.pr.opened": {
    data: GithubPrOpenedEventSchema,
  },
  "github.release.published": {
    data: GithubReleasePublishedSchema,
  },
  "billing.payment.success": {
    data: BillingPaymentSuccessSchema,
  },
  "deployment.failed": {
    data: DeploymentFailedSchema,
  },
  "feature.created": {
    data: FeatureCreatedEventSchema,
  },
  "feature.prd.generated": {
    data: FeatureStateTransitionSchema,
  },
  "feature.tasks.generated": {
    data: FeatureStateTransitionSchema,
  },
  "feature.plan.approved": {
    data: FeatureStateTransitionSchema,
  },
  "feature.review.failed": {
    data: FeatureStateTransitionSchema,
  },
  "feature.human.approved": {
    data: FeatureStateTransitionSchema,
  },
  "feature.awaiting.approval": {
    data: FeatureStateTransitionSchema,
  },
  "repo.sync.requested": {
    data: RepoSyncRequestedSchema,
  },
  "github.repositories.sync": {
    data: GitHubRepositoriesSyncSchema,
  },
  "github.issue.opened": {
    data: GithubIssueOpenedSchema,
  },
  "github.issue.closed": {
    data: GithubIssueClosedSchema,
  },
  "github.issue_comment.created": {
    data: GithubIssueCommentCreatedSchema,
  },
  "tasks.approved_for_dev": {
    data: TasksApprovedForDevSchema,
  },
  "project.context.generate": {
    data: ProjectContextGenerateSchema,
  },
  "tasks.implementation.completed": {
    data: TaskImplementationCompletedSchema,
  },
};
