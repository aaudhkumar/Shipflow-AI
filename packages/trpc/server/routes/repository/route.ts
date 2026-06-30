import { router, orgMemberProcedure } from "../../trpc";
import { z } from "zod";
import { db } from "@shipflow/db";
import { repositories, githubInstallations } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "@shipflow/workflow";
import { getInstallationOctokit } from "@shipflow/github";
import { TRPCError } from "@trpc/server";
import { createAuditLog, AuditAction } from "@shipflow/services/audit";
import { generatePath } from "../../utils/path-generator";
import {
  getConnectedListOutputSchema,
  getRepositoryListOutputSchema,
  syncRepositoryOutputSchema,
  connectRepositoryOutputSchema,
  disconnectRepositoryOutputSchema
} from "@shipflow/services/repository/model";

const TAGS = ["Repository"];
const getPath = generatePath("/repositories");

export const repositoryRouter = router({
  connectedList: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}/connected"), tags: TAGS } })
    .input(z.object({ orgId: z.string() }))
    .output(getConnectedListOutputSchema)
    .query(async ({ input }) => {
      return await db
        .select()
        .from(repositories)
        .where(eq(repositories.orgId, input.orgId));
    }),
  list: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}"), tags: TAGS } })
    .input(z.object({ orgId: z.string() }))
    .output(getRepositoryListOutputSchema)
    .query(async ({ input }) => {
      const [installation] = await db
        .select()
        .from(githubInstallations)
        .where(eq(githubInstallations.orgId, input.orgId))
        .limit(1);

      if (!installation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No GitHub installation found" });
      }

      const octokit = await getInstallationOctokit(installation.installationId);
      const { data } = await octokit.request("GET /installation/repositories", { per_page: 100 });
      return data.repositories.map((repo: any) => ({
        id: String(repo.id),
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url,
        description: repo.description,
        language: repo.language,
        updatedAt: repo.updated_at,
      }));
    }),
  sync: orgMemberProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/sync/{githubRepoId}"), tags: TAGS } })
    .input(z.object({ orgId: z.string(), githubRepoId: z.string() }))
    .output(syncRepositoryOutputSchema)
    .mutation(async ({ input }) => {
      // Find the repository DB row
      const [repo] = await db
        .select()
        .from(repositories)
        .where(eq(repositories.githubRepoId, input.githubRepoId))
        .limit(1);

      if (!repo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not connected" });
      }

      // Find the installation ID
      const [installation] = await db
        .select()
        .from(githubInstallations)
        .where(eq(githubInstallations.orgId, input.orgId))
        .limit(1);

      if (!installation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "GitHub App not installed" });
      }

      const parts = repo.fullName.split("/");
      const repoOwner = parts[0] || "";
      const repoName = parts[1] || "";

      await inngest.send({
        name: "repo.sync.requested",
        data: {
          orgId: input.orgId,
          repositoryId: repo.id,
          installationId: installation.installationId,
          repoOwner,
          repoName,
          defaultBranch: repo.defaultBranch,
        }
      });
      return { status: "PROCESSING" };
    }),
  connect: orgMemberProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/connect"), tags: TAGS } })
    .input(z.object({
      orgId: z.string(),
      repo: z.object({
        id: z.string(),
        name: z.string(),
        fullName: z.string(),
        private: z.boolean(),
        defaultBranch: z.string(),
        htmlUrl: z.string(),
        description: z.string().nullable(),
        language: z.string().nullable(),
      })
    }))
    .output(connectRepositoryOutputSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.member.role !== "OWNER") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only organization owners can connect repositories" });
      }

      // Free plan limit check
      const { subscriptions } = await import("@shipflow/db/schema");
      const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.orgId, input.orgId)).limit(1);
      
      if (!sub || sub.planId === "FREE") {
        const repoCountResult = await db.select({ count: db.$count(repositories) })
                                      .from(repositories)
                                      .where(eq(repositories.orgId, input.orgId));
        const currentRepoCount = repoCountResult[0]?.count || 0;
        
        if (currentRepoCount >= 3) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Upgrade to Pro to connect more repositories" });
        }
      }

      const [newRepo] = await db.insert(repositories).values({
        orgId: input.orgId,
        githubRepoId: input.repo.id,
        fullName: input.repo.fullName,
        isPrivate: input.repo.private,
        defaultBranch: input.repo.defaultBranch,
      }).returning({ id: repositories.id });
      
      await createAuditLog({
        orgId: input.orgId,
        actorId: ctx.session.user.id,
        action: AuditAction.REPO_CONNECTED,
        resourceType: 'REPOSITORY',
        resourceId: newRepo!.id
      });
      
      return { success: true };
    }),
  disconnect: orgMemberProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/{orgId}/{githubRepoId}"), tags: TAGS } })
    .input(z.object({ orgId: z.string(), githubRepoId: z.string() }))
    .output(disconnectRepositoryOutputSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.member.role !== "OWNER") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only organization owners can disconnect repositories" });
      }

      await db
        .delete(repositories)
        .where(eq(repositories.githubRepoId, input.githubRepoId));
        
      await createAuditLog({
        orgId: input.orgId,
        actorId: ctx.session.user.id,
        action: AuditAction.REPO_DISCONNECTED,
        resourceType: 'REPOSITORY',
        resourceId: input.githubRepoId
      });
      return { success: true };
    })
});
