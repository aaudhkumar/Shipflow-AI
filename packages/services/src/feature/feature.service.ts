import { FeatureRepository } from "./feature.repository";
import { inngest } from "@shipflow/workflow";

export class FeatureService {
  constructor(private readonly featureRepo: FeatureRepository) {}

  async generatePRD(featureId: string, orgId: string, userId: string) {
    const feature = await this.featureRepo.getFeatureById(featureId);
    if (!feature) throw new Error("Feature not found");
    if (feature.status !== "CLARIFIED" && feature.status !== "SUBMITTED") {
      throw new Error("Invalid state transition to PRD_GENERATED");
    }

    // Trigger workflow event
    await inngest.send({
      name: "feature.prd.generated",
      data: { featureId, orgId, previousState: feature.status, newState: "PRD_GENERATED", actorId: userId }
    });
    
    return { status: "PROCESSING" };
  }

  async generateTasks(featureId: string, orgId: string, userId: string) {
    const feature = await this.featureRepo.getFeatureById(featureId);
    if (!feature) throw new Error("Feature not found");
    if (feature.status !== "PRD_GENERATED") {
      throw new Error("Invalid state transition to TASKS_GENERATED");
    }

    await inngest.send({
      name: "feature.tasks.generated",
      data: { featureId, orgId, previousState: feature.status, newState: "TASKS_GENERATED", actorId: userId }
    });

    return { status: "PROCESSING" };
  }

  async approvePlan(featureId: string, orgId: string, userId: string) {
    const role = await this.featureRepo.getMemberRole(orgId, userId);
    if (role !== "ADMIN" && role !== "OWNER" && role !== "PM") {
      throw new Error("Unauthorized: Only PM, ADMIN, or OWNER can approve plans");
    }

    const feature = await this.featureRepo.getFeatureById(featureId);
    if (!feature) throw new Error("Feature not found");
    if (feature.status !== "TASKS_GENERATED") {
      throw new Error("Invalid state transition to PLAN_APPROVED");
    }

    await inngest.send({
      name: "feature.plan.approved",
      data: { featureId, orgId, previousState: feature.status, newState: "PLAN_APPROVED", actorId: userId }
    });

    return { status: "PROCESSING" };
  }

  async failReview(featureId: string, orgId: string, userId: string) {
    // Both Reviewer and automated agents can fail reviews
    const role = await this.featureRepo.getMemberRole(orgId, userId);
    if (role !== "REVIEWER" && role !== "ADMIN" && role !== "OWNER") {
      throw new Error("Unauthorized: Only REVIEWER, ADMIN, or OWNER can manually fail reviews");
    }

    const feature = await this.featureRepo.getFeatureById(featureId);
    if (!feature) throw new Error("Feature not found");
    if (feature.status !== "IN_REVIEW") {
      throw new Error("Invalid state transition to FIX_NEEDED");
    }

    await inngest.send({
      name: "feature.review.failed",
      data: { featureId, orgId, previousState: feature.status, newState: "FIX_NEEDED", actorId: userId }
    });

    return { status: "PROCESSING" };
  }

  async approveHumanRelease(featureId: string, orgId: string, userId: string) {
    const role = await this.featureRepo.getMemberRole(orgId, userId);
    if (role !== "REVIEWER" && role !== "ADMIN" && role !== "OWNER") {
      throw new Error("Unauthorized: Only REVIEWER, ADMIN, or OWNER can approve releases");
    }

    const feature = await this.featureRepo.getFeatureById(featureId);
    if (!feature) throw new Error("Feature not found");
    if (feature.status !== "AWAITING_HUMAN_APPROVAL") {
      throw new Error("Invalid state transition to SHIPPED");
    }

    await inngest.send({
      name: "feature.human.approved",
      data: { featureId, orgId, previousState: feature.status, newState: "SHIPPED", actorId: userId }
    });

    return { status: "PROCESSING" };
  }
}

export const featureService = new FeatureService(new FeatureRepository());
