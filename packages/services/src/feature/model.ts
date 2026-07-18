import { z } from "zod";
import type { FeatureService } from "./feature.service";
import type { reviewFindings } from "@shipflow/db/schema";
import type { InferSelectModel } from "@shipflow/db";


declare const featureService: FeatureService;

export const getFeatureListOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.listFeatures>>>>;
export const getFeatureOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.getFeatureById>>>>;
export const createFeatureOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.createFeature>>>>;
export const getReleaseReadinessOutputSchema = z.any() as z.ZodType<any>; // Inline query in feature router
export const getReviewFindingsOutputSchema = z.any() as z.ZodType<InferSelectModel<typeof reviewFindings>[]>; 
export const getLinkedIssuesOutputSchema = z.any() as z.ZodType<any>; // Inline query in feature router
export const actionSuccessOutputSchema = z.object({ success: z.boolean() }).optional(); // For simple success responses
export const deleteFeatureOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.deleteFeature>>>>;

export const generatePRDOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.generatePRD>>>>;
export const startClarificationOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.startClarification>>>>;
export const generateTasksOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.generateTasks>>>>;
export const approvePlanOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.approvePlan>>>>;
export const submitForReviewOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.markReviewPassed>>>>;
export const redoExecutionPlanOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.redoExecutionPlan>>>>;
export const failReviewOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.failReview>>>>;
export const approveHumanReleaseOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.approveHumanRelease>>>>;
export const addClarificationReplyOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.processClarificationReply>>>>;
export const submitClarificationAnswersOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.submitClarificationAnswers>>>>;
export const generateExecutionPlanOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.generateExecutionPlan>>>>;
export const updateExecutionPlanOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof featureService.updateExecutionPlan>>>>;
