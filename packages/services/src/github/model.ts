import { z } from "zod";

export const ensureBranchInputSchema = z.object({
  installationId: z.number(),
  owner: z.string(),
  repo: z.string(),
  branch: z.string(),
  defaultBranch: z.string().default("main"),
});
export type EnsureBranchInput = z.infer<typeof ensureBranchInputSchema>;

export const openOrUpdatePrInputSchema = z.object({
  installationId: z.number(),
  owner: z.string(),
  repo: z.string(),
  branch: z.string(),
  defaultBranch: z.string().default("main"),
  title: z.string(),
  summary: z.string(),
  featureRequestId: z.string().uuid(),
  prdId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  draft: z.boolean().optional().default(false),
});
export type OpenOrUpdatePrInput = z.infer<typeof openOrUpdatePrInputSchema>;
