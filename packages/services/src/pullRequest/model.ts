import { z } from "zod";

export const getPullRequestListOutputSchema = z.any() as z.ZodType<Record<string, any>[]>;
export const getPullRequestWithReviewsOutputSchema = z.any() as z.ZodType<Record<string, any>>;
export const updateFindingStatusOutputSchema = z.any() as z.ZodType<Record<string, any>>;
export const rateReviewOutputSchema = z.object({ success: z.boolean() });
export const listReviewsOutputSchema = z.any() as z.ZodType<Record<string, any>[]>;
export const mergePullRequestOutputSchema = z.object({ success: z.boolean(), message: z.string() });
