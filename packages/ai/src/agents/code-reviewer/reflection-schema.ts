import { z } from "zod";
import { CodeReviewResultSchema } from "./schema";

export const ReflectionSchema = z.object({
  missedCriteria: z.array(z.string()).describe("Criteria from PRD that were completely ignored"),
  coveragePercentage: z.number().describe("Percentage of acceptance criteria covered by the current findings"),
  additionalFindings: CodeReviewResultSchema.shape.comments,
});

export type ReflectionResult = z.infer<typeof ReflectionSchema>;
