import { projectRepository } from "./project.repository";
import { createAuditLog } from "../audit/audit.service";
import { db } from "@shipflow/db";
import { members } from "@shipflow/db/schema";
import { eq, and } from "@shipflow/db";


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
      .select({ id: members.id, role: members.role })
      .from(members)
      .where(and(eq(members.userId, data.userId), eq(members.orgId, data.orgId)))
      .limit(1);

    if (!member) {
      throw new Error("UNAUTHORIZED: User is not a member of this organization");
    }

    if (member.role !== "OWNER" && member.role !== "ADMIN" && member.role !== "PM") {
      throw new Error("FORBIDDEN: Only Owners, Admins, or PMs can create projects");
    }

    const memberIds = new Set(data.memberIds || []);
    if (memberIds.size === 0) {
      memberIds.add(member.id);
    }

    const project = await projectRepository.createProject({
      orgId: data.orgId,
      name: data.name,
      description: data.description,
      repositoryIds: data.repositoryIds,
      memberIds: Array.from(memberIds),
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

    // 4. Trigger initial context generation
    const { inngest } = await import("../workflow/client");
    await inngest.send({
      name: "project.context.generate",
      data: { projectId: project.id, orgId: data.orgId, actorId: data.userId }
    });

    return project;
  }

  async listProjects(orgId: string, userId: string) {
    const [member] = await db
      .select({ id: members.id, role: members.role })
      .from(members)
      .where(and(eq(members.userId, userId), eq(members.orgId, orgId)))
      .limit(1);

    if (!member) {
      throw new Error("UNAUTHORIZED: User is not a member of this organization");
    }

    const isPrivileged = member.role === "OWNER" || member.role === "ADMIN";
    return projectRepository.listProjects(orgId, member.id, isPrivileged);
  }

  async getProjectWithDetails(projectId: string, orgId?: string, userId?: string) {
    const project = await projectRepository.getProjectWithDetails(projectId);
    
    if (orgId && userId && project) {
      const [member] = await db
        .select({ id: members.id, role: members.role })
        .from(members)
        .where(and(eq(members.userId, userId), eq(members.orgId, orgId)))
        .limit(1);

      if (!member) {
        throw new Error("UNAUTHORIZED: User is not a member of this organization");
      }

      const isPrivileged = member.role === "OWNER" || member.role === "ADMIN";
      const isProjectMember = project.members.some(m => m.memberId === member.id);
      
      if (!isPrivileged && !isProjectMember) {
        throw new Error("FORBIDDEN: You do not have access to this project");
      }
    }
    
    return project;
  }
  async updateMembers(data: {
    orgId: string;
    projectId: string;
    userId: string;
    memberIds: string[];
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
      throw new Error("FORBIDDEN: Only Owners, Admins, or PMs can manage project members");
    }

    // 2. Verify project belongs to org
    const project = await this.getProjectWithDetails(data.projectId);
    if (!project || project.orgId !== data.orgId) {
      throw new Error("NOT_FOUND: Project not found in this organization");
    }

    // 3. Update members in repository
    await projectRepository.updateMembers(data.projectId, data.memberIds);

    // 4. Write to Audit Log
    await createAuditLog({
      orgId: data.orgId,
      actorId: data.userId,
      action: "PROJECT_MEMBERS_UPDATED",
      resourceType: "PROJECT",
      resourceId: project.id,
      metadata: { 
        projectName: project.name,
        newMemberCount: data.memberIds.length
      },
    });

    return true;
  }
  async regenerateContext(projectId: string, orgId: string, userId: string) {
    const [member] = await db
      .select({ id: members.id, role: members.role })
      .from(members)
      .where(and(eq(members.userId, userId), eq(members.orgId, orgId)))
      .limit(1);

    if (!member) {
      throw new Error("UNAUTHORIZED: User is not a member of this organization");
    }

    // Set contextDocument to null so the frontend shows loading state and polls
    const { projects } = await import("@shipflow/db/schema");
    await db.update(projects)
      .set({ contextDocument: null, updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));

    const { inngest } = await import("../workflow/client");
    
    await inngest.send({
      name: "project.context.generate",
      data: { projectId, orgId, actorId: userId }
    });

    return { success: true };
  }

  async deleteProject(projectId: string, orgId: string, userId: string) {
    // 1. Authorize: Check if user is OWNER, ADMIN, or PM
    const [member] = await db
      .select({ id: members.id, role: members.role })
      .from(members)
      .where(and(eq(members.userId, userId), eq(members.orgId, orgId)))
      .limit(1);

    if (!member) {
      throw new Error("UNAUTHORIZED: User is not a member of this organization");
    }

    if (member.role !== "OWNER" && member.role !== "ADMIN" && member.role !== "PM") {
      throw new Error("FORBIDDEN: Only Owners, Admins, or PMs can delete projects");
    }

    const deletedProject = await projectRepository.deleteProject(projectId);

    return { success: true, project: deletedProject };
  }
}

export const projectService = new ProjectService();
