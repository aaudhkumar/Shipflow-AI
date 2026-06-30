import { OrganizationRepository } from "./organization.repository";

export class OrganizationService {
  constructor(private readonly organizationRepo: OrganizationRepository) {}

  async createOrganization(name: string, slug: string, userId: string) {
    return await this.organizationRepo.createOrganization({
      id: crypto.randomUUID(),
      name,
      slug,
    }, userId);
  }

  async getUserOrganizations(userId: string) {
    return await this.organizationRepo.listOrganizationsForUser(userId);
  }

  async getOrganizationBySlug(slug: string) {
    return await this.organizationRepo.getBySlug(slug);
  }

  async getStats(orgId: string) {
    return await this.organizationRepo.getStats(orgId);
  }

  async getRecentActivity(orgId: string) {
    return await this.organizationRepo.getRecentActivity(orgId);
  }

  async getChartData(orgId: string) {
    return await this.organizationRepo.getChartData(orgId);
  }

  async getAnalytics(orgId: string, days: number = 7) {
    return await this.organizationRepo.getAnalytics(orgId, days);
  }
  async updateSettings(orgId: string, data: { name?: string; retentionDays?: number }) {
    return await this.organizationRepo.updateSettings(orgId, data);
  }

  async inviteMember(orgId: string, email: string, role: string) {
    return await this.organizationRepo.inviteMember(orgId, email, role);
  }

  async updateMemberRole(orgId: string, memberId: string, newRole: string) {
    return await this.organizationRepo.updateMemberRole(orgId, memberId, newRole);
  }

  async removeMember(orgId: string, memberId: string) {
    return await this.organizationRepo.removeMember(orgId, memberId);
  }

  async getMembers(orgId: string) {
    return await this.organizationRepo.getMembers(orgId);
  }
}

export const organizationService = new OrganizationService(new OrganizationRepository());
