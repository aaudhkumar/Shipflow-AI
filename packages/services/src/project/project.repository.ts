import { db } from "@shipflow/db";
import { projects, projectRepositories, projectMembers } from "@shipflow/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

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

  async listProjects(orgId: string, memberId?: string, isPrivileged: boolean = false) {
    let whereClause = eq(projects.orgId, orgId);

    if (memberId && !isPrivileged) {
      // Find projects where the user is explicitly a member
      const userProjects = await db.select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.memberId, memberId));
      
      const projectIds = userProjects.map(up => up.projectId);
      if (projectIds.length === 0) {
        return [];
      }
      
      whereClause = and(eq(projects.orgId, orgId), inArray(projects.id, projectIds)) as any;
    }

    return await db.query.projects.findMany({
      where: whereClause,
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
  async updateMembers(projectId: string, memberIds: string[]) {
    return await db.transaction(async (tx) => {
      // 1. Remove all existing members from this project
      await tx.delete(projectMembers).where(eq(projectMembers.projectId, projectId));

      // 2. Insert new members
      if (memberIds.length > 0) {
        await tx.insert(projectMembers).values(
          memberIds.map((memberId) => ({
            projectId,
            memberId,
          }))
        );
      }

      return true;
    });
  }
}

export const projectRepository = new ProjectRepository();
