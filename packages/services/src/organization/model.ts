import { z } from "zod";
import type { OrganizationService } from "./organization.service";

declare const organizationService: OrganizationService;

export const getOrganizationOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof organizationService.getOrganizationBySlug>>>>;
export const getOrganizationStatsOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof organizationService.getStats>>>>;
export const getOrganizationRecentActivityOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof organizationService.getRecentActivity>>>>;
export const getOrganizationChartDataOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof organizationService.getChartData>>>>;
export const getOrganizationAnalyticsOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof organizationService.getAnalytics>>>>;
export const getMemberOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof organizationService.getMembers>>>>;
export const memberRoleUpdateOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof organizationService.updateMemberRole>>>>;
