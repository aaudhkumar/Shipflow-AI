import { projectRepository } from "./project.repository";
import { createAuditLog } from "../audit/audit.service";
import { db } from "@shipflow/db";
import { members } from "@shipflow/db/schema";
import { eq, and } from "drizzle-orm";

export class ProjectService {
  async createProject(data: {
    orgId: string;
    userId: string;
    name: string;
    description?: string;
    repositoryIds?: string[];
    memberIds?: string[];
  }) {
    // 1. Authorize: Check if user is OWNER, ADMIN, or PM
    const [member] = await db
      .select({ role: members.role })
      .from(members)
      .where(and(eq(members.userId, data.userId), eq(members.orgId, data.orgId)))
      .limit(1);

    if (!member) {
      throw new Error("UNAUTHORIZED: User is not a member of this organization");
    }

    if (member.role !== "OWNER" && member.role !== "ADMIN" && member.role !== "PM") {
      throw new Error("FORBIDDEN: Only Owners, Admins, or PMs can create projects");
    }

    // 2. Create the project using the repository
    const project = await projectRepository.createProject({
      orgId: data.orgId,
      name: data.name,
      description: data.description,
      repositoryIds: data.repositoryIds,
      memberIds: data.memberIds,
    });

    // 3. Write to Audit Log
    await createAuditLog({
      orgId: data.orgId,
      actorId: data.userId,
      action: "PROJECT_CREATED",
      resourceType: "PROJECT",
      resourceId: project.id,
      metadata: { 
        name: project.name,
        repositoryCount: data.repositoryIds?.length || 0,
        memberCount: data.memberIds?.length || 0
      },
    });

    return project;
  }

  async listProjects(orgId: string) {
    return projectRepository.listProjects(orgId);
  }

  async getProjectWithDetails(projectId: string) {
    return projectRepository.getProjectWithDetails(projectId);
  }
}

export const projectService = new ProjectService();
