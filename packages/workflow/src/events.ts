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

export const ShipflowEvents = {
  "github.pr.opened": {
    data: GithubPrOpenedEventSchema,
  },
  "github.release.drafted": {
    data: GithubReleaseDraftedSchema,
  },
};
