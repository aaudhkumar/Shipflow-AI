import { z } from "zod";

export const getMemberMeOutputSchema = z.any() as z.ZodType<Record<string, any>>;
export const getMemberListOutputSchema = z.any() as z.ZodType<Record<string, any>[]>;
export const getMemberInvitationsOutputSchema = z.any() as z.ZodType<Record<string, any>[]>;
export const inviteMemberOutputSchema = z.object({ status: z.string() });
export const acceptInvitationOutputSchema = z.object({ success: z.boolean(), orgId: z.string() });
export const revokeInvitationOutputSchema = z.object({ success: z.boolean() });
export const updateRoleOutputSchema = z.object({ success: z.boolean() });
export const removeMemberOutputSchema = z.object({ success: z.boolean() });
