import { db } from "@shipflow/db";
import { workspaces, workspaceMembers } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

export class WorkspaceRepository {
  async createWorkspace(data: typeof workspaces.$inferInsert, userId: string) {
    return await db.transaction(async (tx) => {
      const [workspace] = await tx.insert(workspaces).values(data).returning();
      if (!workspace) throw new Error("Failed to create workspace");
      
      await tx.insert(workspaceMembers).values({
        id: crypto.randomUUID(),
        workspaceId: workspace.id,
        userId: userId,
        role: "OWNER"
      });
      
      return workspace;
    });
  }

  async listWorkspacesForUser(userId: string) {
    const userMemberships = await db.select({
      workspace: workspaces
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId));

    return userMemberships.map(m => m.workspace);
  }
}
