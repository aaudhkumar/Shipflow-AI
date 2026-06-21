import { Inngest, EventSchemas } from "inngest";
import { z } from "zod";
import { GithubPrOpenedEventSchema, GithubReleaseDraftedSchema, BillingPaymentSuccessSchema } from "./events";

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
};

export const inngest = new Inngest({
  id: "shipflow-ai",
  schemas: new EventSchemas().fromRecord<Events>(),
});
