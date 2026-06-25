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
}

export const organizationService = new OrganizationService(new OrganizationRepository());
