import { router, protectedProcedure, orgMemberProcedure } from "../../trpc";
import { z } from "zod";
import { organizationService } from "../../../../services/src/organization/organization.service";

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
    .mutation(async ({ input }) => {
      const crypto = await import("crypto");
      const timestamp = Date.now().toString();
      const secret = process.env.SESSION_SECRET || "fallback_secret_for_dev";
      const hmac = crypto.createHmac("sha256", secret).update(`${input.orgId}:${timestamp}`).digest("hex");
      const stateString = `${input.orgId}:${timestamp}:${hmac}`;
      const stateBase64 = Buffer.from(stateString).toString("base64");
      
      const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME || "Shipflow-AI-App";
      return `https://github.com/apps/${appName}/installations/new?state=${stateBase64}`;
    })
});
