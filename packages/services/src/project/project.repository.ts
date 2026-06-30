import { db } from "@shipflow/db";
import { projects, projectRepositories, projectMembers } from "@shipflow/db/schema";
import { eq, desc } from "drizzle-orm";

export class ProjectRepository {
  async createProject(data: {
    orgId: string;
    name: string;
    description?: string;
    repositoryIds?: string[];
    memberIds?: string[];
  }) {
    return await db.transaction(async (tx) => {
      const [newProject] = await tx
        .insert(projects)
        .values({
          orgId: data.orgId,
          name: data.name,
          description: data.description,
        })
        .returning();

      if (!newProject) {
        throw new Error("Failed to create project");
      }

      if (data.repositoryIds && data.repositoryIds.length > 0) {
        await tx.insert(projectRepositories).values(
          data.repositoryIds.map((repoId) => ({
            projectId: newProject.id,
            repositoryId: repoId,
          }))
        );
      }

      if (data.memberIds && data.memberIds.length > 0) {
        await tx.insert(projectMembers).values(
          data.memberIds.map((memberId) => ({
            projectId: newProject.id,
            memberId: memberId,
          }))
        );
      }

      return newProject;
    });
  }

  async listProjects(orgId: string) {
    return await db.query.projects.findMany({
      where: eq(projects.orgId, orgId),
      orderBy: [desc(projects.createdAt)],
      with: {
        members: {
          with: {
            member: {
              with: {
                user: true,
              }
            }
          }
        },
      }
    });
  }

  async getProjectWithDetails(projectId: string) {
    return await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      with: {
        members: {
          with: {
            member: {
              with: {
                user: true,
              }
            }
          }
        },
      }
    });
  }
}

export const projectRepository = new ProjectRepository();
