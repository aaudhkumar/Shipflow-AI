import { FeatureRepository } from "./feature.repository";
import { inngest } from "../workflow/client";
import { db } from "@shipflow/db";
import { pullRequests, pullRequestReviews, reviewFindings, approvals, clarificationThreads, clarificationMessages, featureRequests } from "@shipflow/db/schema";
import { eq, and } from "drizzle-orm";
import * as crypto from "crypto";

export class FeatureService {
  constructor(private readonly featureRepo: FeatureRepository) {}

  async getFeatureById(featureId: string, orgId: string) {
    return await this.featureRepo.getFeatureById(featureId, orgId);
  }

  async listFeatures(orgId: string) {
    return await this.featureRepo.getFeaturesByOrg(orgId);
  }

  async createFeature(orgId: string, projectId: string, userId: string, title: string, rawDescription: string) {
    // Basic validation
    if (!title || title.trim().length < 3) {
      throw new Error("Title must be at least 3 characters long");
    }
    if (!rawDescription || rawDescription.trim().length < 10) {
      throw new Error("Description must be at least 10 characters long");
    }

    const feature = await this.featureRepo.createFeature(orgId, projectId, userId, title, rawDescription);
    
    // Create initial clarification thread
    const [thread] = await db.insert(clarificationThreads).values({
      featureRequestId: feature!.id,
    }).returning();

    // Automatically trigger clarification or PRD generation if description is very long/good.
    // For now, we'll just leave it as SUBMITTED, and user manually clicks "Generate PRD"
    return feature;
  }

  async processClarificationReply(featureId: string, orgId: string, userId: string, replyContent: string) {
    const feature = await this.featureRepo.getFeatureById(featureId, orgId);
    if (!feature) throw new Error("Feature not found");
    if (feature.status !== "SUBMITTED" && feature.status !== "CLARIFYING") {
      throw new Error("Feature is not in a state that accepts clarification");
    }

    let thread = await db.query.clarificationThreads.findFirst({
      where: eq(clarificationThreads.featureRequestId, featureId),
    });

    if (!thread) {
      const [newThread] = await db.insert(clarificationThreads).values({
        featureRequestId: featureId,
      }).returning();
      thread = newThread;
    }

    // Insert user reply
    await db.insert(clarificationMessages).values({
      threadId: thread!.id,
      sender: "USER",
      content: replyContent,
    });

    // Mark status as CLARIFYING
    if (feature.status === "SUBMITTED") {
      await db.update(featureRequests).set({ status: "CLARIFYING" }).where(eq(featureRequests.id, featureId));
    }

    // Get thread history
    const history = await db.query.clarificationMessages.findMany({
      where: eq(clarificationMessages.threadId, thread!.id),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });

    const threadStr = history.map(m => `[${m.sender}] ${m.content}`).join("\n");

    // We can also provide existing features context for duplicate detection
    const existingFeatures = await this.listFeatures(orgId);
    const existingFeaturesContext = existingFeatures
      .filter(f => f.id !== featureId)
      .map(f => `ID: ${f.id}\nTitle: ${f.title}\nDescription: ${f.rawDescription}`)
      .join("\n\n");

    // Call Clarifier Agent
    const { runClarifierAgent } = await import("@shipflow/ai");
    const aiResponse = await runClarifierAgent(feature.rawDescription, existingFeaturesContext, threadStr);

    // Insert AI reply
    await db.insert(clarificationMessages).values({
      threadId: thread!.id,
      sender: "AI",
      content: (aiResponse.result as any).message,
    });

    // Handle AI action
    const aiResult = aiResponse.result as any;
    if (aiResult.action === "mark_ready") {
      await db.update(featureRequests).set({ status: "CLARIFIED" }).where(eq(featureRequests.id, featureId));
      await db.update(clarificationThreads).set({ isResolved: true }).where(eq(clarificationThreads.id, thread!.id));
    } else if (aiResult.action === "mark_duplicate") {
      await db.update(featureRequests).set({ status: "REJECTED" }).where(eq(featureRequests.id, featureId));
      await db.update(clarificationThreads).set({ isResolved: true }).where(eq(clarificationThreads.id, thread!.id));
    }

    return aiResult;
  }

  async generatePRD(featureId: string, orgId: string, userId: string) {
    const feature = await this.featureRepo.getFeatureById(featureId, orgId);
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
    const feature = await this.featureRepo.getFeatureById(featureId, orgId);
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

    const feature = await this.featureRepo.getFeatureById(featureId, orgId);
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
    if (userId !== "SYSTEM") {
      const role = await this.featureRepo.getMemberRole(orgId, userId);
      if (role !== "REVIEWER" && role !== "ADMIN" && role !== "OWNER") {
        throw new Error("Unauthorized: Only REVIEWER, ADMIN, or OWNER can manually fail reviews");
      }
    }

    const feature = await this.featureRepo.getFeatureById(featureId, orgId);
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

    const feature = await this.featureRepo.getFeatureById(featureId, orgId);
    if (!feature) throw new Error("Feature not found");
    if (feature.status !== "AWAITING_HUMAN_APPROVAL") {
      throw new Error("Invalid state transition to SHIPPED");
    }

    // 1. Check for blocking findings
    const blockingFindings = await db
      .select({ id: reviewFindings.id })
      .from(reviewFindings)
      .innerJoin(pullRequestReviews, eq(pullRequestReviews.id, reviewFindings.reviewId))
      .innerJoin(pullRequests, eq(pullRequests.id, pullRequestReviews.pullRequestId))
      .where(
        and(
          eq(pullRequests.featureRequestId, featureId),
          eq(reviewFindings.isBlocking, true),
          eq(reviewFindings.status, "OPEN")
        )
      )
      .limit(1);

    if (blockingFindings.length > 0) {
      throw new Error("Cannot ship: Blocking issues remain unresolved");
    }

    // 2. Insert approvals
    const prs = await db.select().from(pullRequests).where(eq(pullRequests.featureRequestId, featureId));
    if (prs.length > 0) {
      const approvalData = prs.map(pr => ({
        pullRequestId: pr.id,
        approverId: userId,
        signature: crypto.createHmac("sha256", "shipflow_secret").update(`${pr.id}-${userId}-${Date.now()}`).digest("hex")
      }));
      await db.insert(approvals).values(approvalData);
    }

    await inngest.send({
      name: "feature.human.approved",
      data: { featureId, orgId, previousState: feature.status, newState: "SHIPPED", actorId: userId }
    });

    return { status: "PROCESSING" };
  }

  async linkPRToFeature(featureId: string, orgId: string, prId: string) {
    const feature = await this.featureRepo.getFeatureById(featureId, orgId);
    if (!feature) throw new Error("Feature not found");
    if (feature.status !== "PLAN_APPROVED") {
      throw new Error("Invalid state transition to IN_DEVELOPMENT");
    }

    // Direct update as it is a minor sync transition
    await this.featureRepo.updateFeatureStatus(featureId, orgId, "IN_DEVELOPMENT");
    return { status: "IN_DEVELOPMENT" };
  }

  async markReviewPassed(featureId: string, orgId: string) {
    const feature = await this.featureRepo.getFeatureById(featureId, orgId);
    if (!feature) throw new Error("Feature not found");
    if (feature.status !== "IN_REVIEW") {
      throw new Error("Invalid state transition to AWAITING_HUMAN_APPROVAL");
    }

    await this.featureRepo.updateFeatureStatus(featureId, orgId, "AWAITING_HUMAN_APPROVAL");

    await inngest.send({
      name: "feature.awaiting.approval",
      data: { featureId, orgId, previousState: feature.status, newState: "AWAITING_HUMAN_APPROVAL", actorId: "SYSTEM" }
    });

    return { status: "AWAITING_HUMAN_APPROVAL" };
  }

  async fixNeededToReview(featureId: string, orgId: string) {
    const feature = await this.featureRepo.getFeatureById(featureId, orgId);
    if (!feature) throw new Error("Feature not found");
    if (feature.status !== "FIX_NEEDED") {
      throw new Error("Invalid state transition to IN_REVIEW");
    }

    await this.featureRepo.updateFeatureStatus(featureId, orgId, "IN_REVIEW");
    return { status: "IN_REVIEW" };
  }

  async markInReview(featureId: string, orgId: string) {
    const feature = await this.featureRepo.getFeatureById(featureId, orgId);
    if (!feature) throw new Error("Feature not found");
    if (feature.status !== "IN_DEVELOPMENT" && feature.status !== "FIX_NEEDED") {
      throw new Error("Invalid state transition to IN_REVIEW");
    }

    await this.featureRepo.updateFeatureStatus(featureId, orgId, "IN_REVIEW");
    return { status: "IN_REVIEW" };
  }
}

export const featureService = new FeatureService(new FeatureRepository());
