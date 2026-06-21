import { z } from "zod";

export const GithubPrOpenedEventSchema = z.object({
  pullRequestId: z.string(), 
  repositoryId: z.string(),  
  githubPrNumber: z.number(),
  orgId: z.string(),
});

export const ShipflowEvents = {
  "github.pr.opened": {
    data: GithubPrOpenedEventSchema,
  },
};
