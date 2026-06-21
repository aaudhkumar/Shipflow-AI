import { z } from "zod";

export const GithubPrOpenedEventSchema = z.object({
  pullRequestId: z.string(), 
  repositoryId: z.string(),  
  githubPrNumber: z.number(),
  orgId: z.string(),
});

export const GithubReleaseDraftedSchema = z.object({
  repositoryId: z.string(),
  tagName: z.string(),
  orgId: z.string(),
});

export const BillingPaymentSuccessSchema = z.object({
  subscriptionId: z.string(),
  paymentId: z.string(),
  amount: z.number(),
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

export const ShipflowEvents = {
  "github.pr.opened": {
    data: GithubPrOpenedEventSchema,
  },
  "github.release.drafted": {
    data: GithubReleaseDraftedSchema,
  },
  "billing.payment.success": {
    data: BillingPaymentSuccessSchema,
  },
  "deployment.failed": {
    data: DeploymentFailedSchema,
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
};
