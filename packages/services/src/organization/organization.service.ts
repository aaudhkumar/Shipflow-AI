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
}

export const organizationService = new OrganizationService(new OrganizationRepository());
