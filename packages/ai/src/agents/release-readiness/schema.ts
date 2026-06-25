import { z } from "zod";

export const releaseReadinessSchema = z.object({
  isReady: z.boolean().describe("Whether the feature is ready to be shipped"),
  overallScore: z.number().min(0).max(100).describe("Overall readiness score from 0 to 100"),
  blockers: z.array(z.string()).describe("List of blocking issues preventing release"),
  warnings: z.array(z.string()).describe("List of non-blocking warnings or risks"),
  recommendation: z.string().describe("A short summary recommendation for the approver"),
  releaseNotesDraft: z.string().describe("Draft of the release notes for this feature"),
});

export type ReleaseReadinessResult = z.infer<typeof releaseReadinessSchema>;
