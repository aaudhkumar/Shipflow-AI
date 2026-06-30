import { z } from "zod";
import { router, orgMemberProcedure } from "../../trpc";
import { db } from "@shipflow/db";
import { deployments, repositories } from "@shipflow/db/schema";
import { eq, desc } from "drizzle-orm";
import { getDeploymentListOutputSchema } from "@shipflow/services/deployment/model";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Deployment"];
const getPath = generatePath("/deployments");

export const deploymentRouter = router({
  list: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}"), tags: TAGS } })
    .input(z.object({ orgId: z.string() }))
    .output(getDeploymentListOutputSchema)
    .query(async ({ input }) => {
      // Find top 10 recent deployments for all repositories in the org
      const records = await db
        .select({
          id: deployments.id,
          environment: deployments.environment,
          commitSha: deployments.commitSha,
          status: deployments.status,
          deploymentUrl: deployments.deploymentUrl,
          createdAt: deployments.createdAt,
          repositoryName: repositories.fullName,
        })
        .from(deployments)
        .innerJoin(repositories, eq(deployments.repositoryId, repositories.id))
        .where(eq(repositories.orgId, input.orgId))
        .orderBy(desc(deployments.createdAt))
        .limit(10);
        
      return records.map(r => ({
        id: r.id,
        environment: r.environment,
        commitSha: r.commitSha,
        status: r.status,
        url: r.deploymentUrl,
        deployedAt: r.createdAt.toISOString(),
        repositoryName: r.repositoryName,
      }));
    }),
});
