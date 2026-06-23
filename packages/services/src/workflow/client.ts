import { Inngest, EventSchemas } from "inngest";
import { z } from "zod";
import { GithubPrOpenedEventSchema, GithubReleaseDraftedSchema, BillingPaymentSuccessSchema, DeploymentFailedSchema, FeatureStateTransitionSchema, RepoSyncRequestedSchema } from "./events";

type Events = {
  "github.pr.opened": {
    data: z.infer<typeof GithubPrOpenedEventSchema>;
  };
  "github.release.drafted": {
    data: z.infer<typeof GithubReleaseDraftedSchema>;
  };
  "billing.payment.success": {
    data: z.infer<typeof BillingPaymentSuccessSchema>;
  };
  "deployment.failed": {
    data: z.infer<typeof DeploymentFailedSchema>;
  };
  "feature.prd.generated": {
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
  "repo.sync.requested": {
    data: z.infer<typeof RepoSyncRequestedSchema>;
  };
};

export const inngest = new Inngest({
  id: "shipflow-ai",
  schemas: new EventSchemas().fromRecord<Events>(),
});
