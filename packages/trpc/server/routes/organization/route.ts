import { requireEnv } from "@shipflow/utils";
import { router, protectedProcedure, orgMemberProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { organizationService } from "../../../../services/src/organization/organization.service";

const GITHUB_STATE_SECRET = requireEnv("GITHUB_STATE_SECRET");

export const organizationRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string(), slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await organizationService.createOrganization(input.name, input.slug, ctx.session.user.id);
    }),
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await organizationService.getUserOrganizations(ctx.session.user.id);
    }),
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const org = await organizationService.getOrganizationBySlug(input.slug);
      if (!org) throw new Error("Organization not found");
      return org;
    }),
  getStats: orgMemberProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      return await organizationService.getStats(input.orgId);
    }),
  getRecentActivity: orgMemberProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      return await organizationService.getRecentActivity(input.orgId);
    }),
  getChartData: orgMemberProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      return await organizationService.getChartData(input.orgId);
    }),
  getAnalytics: orgMemberProcedure
    .input(z.object({ orgId: z.string(), days: z.number().default(7) }))
    .query(async ({ input }) => {
      return await organizationService.getAnalytics(input.orgId, input.days);
    }),
  getGithubInstallUrl: orgMemberProcedure
    .input(z.object({ orgId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.member.role !== "OWNER") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only organization owners can install the GitHub App" });
      }

      const crypto = await import("crypto");
      const timestamp = Date.now().toString();
      const secret = GITHUB_STATE_SECRET;
      const hmac = crypto.createHmac("sha256", secret).update(`${input.orgId}:${timestamp}`).digest("hex");
      const stateString = `${input.orgId}:${timestamp}:${hmac}`;
      const stateBase64 = Buffer.from(stateString).toString("base64");
      
      const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME || "Shipflow-AI-App";
      return `https://github.com/apps/${appName}/installations/new?state=${stateBase64}`;
    }),
  getSettings: orgMemberProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      const org = await organizationService.getOrganizationBySlug(input.orgId); // Wait, bySlug uses slug. We need getById.
      // Wait, let's just use getOrganizationBySlug and pass slug as orgId or we just use getStats ? No, let's just get the org.
      // Let's implement getting the org using db directly if there is no getById.
      const { db } = await import("@shipflow/db");
      const { organizations } = await import("@shipflow/db/schema");
      const { eq } = await import("drizzle-orm");
      const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, input.orgId)
      });
      if (!organization) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      return organization;
    }),
  updateSettings: orgMemberProcedure
    .input(z.object({
      orgId: z.string(),
      name: z.string().min(1).optional(),
      retentionDays: z.number().min(1).max(3650).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.member.role !== "OWNER" && ctx.member.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only organization owners or admins can update settings" });
      }
      return await organizationService.updateSettings(input.orgId, { name: input.name, retentionDays: input.retentionDays });
    }),
  getMembers: orgMemberProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      return await organizationService.getMembers(input.orgId);
    }),
  inviteMember: orgMemberProcedure
    .input(z.object({ orgId: z.string(), email: z.string().email(), role: z.enum(["OWNER", "ADMIN", "PM", "ENGINEER", "REVIEWER", "VIEWER"]) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.member.role !== "OWNER" && ctx.member.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed to invite members" });
      }
      try {
        return await organizationService.inviteMember(input.orgId, input.email, input.role);
      } catch (error: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }
    }),
  updateMemberRole: orgMemberProcedure
    .input(z.object({ orgId: z.string(), memberId: z.string(), role: z.enum(["OWNER", "ADMIN", "PM", "ENGINEER", "REVIEWER", "VIEWER"]) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.member.role !== "OWNER" && ctx.member.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed to update roles" });
      }
      return await organizationService.updateMemberRole(input.orgId, input.memberId, input.role);
    }),
  removeMember: orgMemberProcedure
    .input(z.object({ orgId: z.string(), memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.member.role !== "OWNER" && ctx.member.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed to remove members" });
      }
      if (ctx.member.id === input.memberId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove yourself" });
      }
      return await organizationService.removeMember(input.orgId, input.memberId);
    })
});
