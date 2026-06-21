import { WorkspaceRepository } from "./workspace.repository";

export class WorkspaceService {
  constructor(private readonly workspaceRepo: WorkspaceRepository) {}

  async createWorkspace(name: string, slug: string, userId: string) {
    return await this.workspaceRepo.createWorkspace({
      id: crypto.randomUUID(),
      name,
      slug,
    }, userId);
  }

  async getUserWorkspaces(userId: string) {
    return await this.workspaceRepo.listWorkspacesForUser(userId);
  }
}

export const workspaceService = new WorkspaceService(new WorkspaceRepository());
