import { router, orgMemberProcedure } from "../../trpc";
import { z } from "zod";
import { db } from "@shipflow/db";
import { repositories, githubInstallations } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "@shipflow/workflow";
import { getInstallationOctokit } from "@shipflow/github";
import { TRPCError } from "@trpc/server";

export const repositoryRouter = router({
  list: orgMemberProcedure
    .input(z.object({ orgId: z.string() }))
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
    .input(z.object({ orgId: z.string(), githubRepoId: z.string() }))
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
    .mutation(async ({ input }) => {
      await db.insert(repositories).values({
        orgId: input.orgId,
        githubRepoId: input.repo.id,
        fullName: input.repo.fullName,
        isPrivate: input.repo.private,
        defaultBranch: input.repo.defaultBranch,
      });
      return { success: true };
    }),
  disconnect: orgMemberProcedure
    .input(z.object({ orgId: z.string(), githubRepoId: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .delete(repositories)
        .where(eq(repositories.githubRepoId, input.githubRepoId));
      return { success: true };
    })
});
