import { requireEnv } from "@shipflow/utils";
import { FeatureRepository } from "./feature.repository";
import { inngest } from "../workflow/client";
import { db } from "@shipflow/db";
import { pullRequests, pullRequestReviews, reviewFindings, approvals, clarificationThreads, clarificationMessages, featureRequests } from "@shipflow/db/schema";
import { eq, and } from "drizzle-orm";
import * as crypto from "crypto";
import { createAuditLog, AuditAction } from "../audit/audit.service";
import { createNotification, notifyOrgRoles } from "../notification/notification.service";
import { organizations, members } from "@shipflow/db/schema";

const APPROVAL_SECRET = requireEnv("APPROVAL_SECRET");

export class FeatureService {
  constructor(private readonly featureRepo: FeatureRepository) {}

  async getFeatureById(featureId: string, orgId: string) {
    return await this.featureRepo.getFeatureById(featureId, orgId);
  }

  async listFeatures(orgId: string, channel?: "IN_APP" | "EMAIL" | "TICKET" | "CALL", projectId?: string) {
    return await this.featureRepo.getFeaturesByOrg(orgId, channel, projectId);
  }

  async deleteFeature(featureId: string, orgId: string, actorId: string) {
    const role = await this.featureRepo.getMemberRole(orgId, actorId);
    if (!role || !["OWNER", "ADMIN", "PM"].includes(role)) {
      throw new Error("Unauthorized to delete feature");
    }
    return await this.featureRepo.deleteFeature(featureId, orgId);
  }

  async createFeature(orgId: string, projectId: string, userId: string, title: string, rawDescription: string, sourceChannel: "IN_APP" | "EMAIL" | "TICKET" | "CALL") {
    // Basic validation
    if (!title || title.trim().length < 3) {
      throw new Error("Title must be at least 3 characters long");
    }
    if (!rawDescription || rawDescription.trim().length < 10) {
      throw new Error("Description must be at least 10 characters long");
    }

    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.userId, userId), eq(members.orgId, orgId)))
      .limit(1);

    if (!member) {
      throw new Error("User is not a member of this organization");
    }

    const feature = await this.featureRepo.createFeature(orgId, projectId, member.id, title, rawDescription, sourceChannel);
    
    await createAuditLog({
      orgId, actorId: userId, action: AuditAction.FEATURE_CREATED,
      resourceType: 'FEATURE', resourceId: feature!.id
    });
    
    // Create initial clarification thread
    const [thread] = await db.insert(clarificationThreads).values({
      featureRequestId: feature!.id,
    }).returning();

    // Trigger project context generation if this is the very first feature in the project
    const existingFeatures = await this.listFeatures(orgId, undefined, projectId);
    if (existingFeatures.length === 1) {
      await inngest.send({
        name: "project.context.generate",
        data: { projectId, orgId }
      });
    }

    // NOTE: Clarification is NOT auto-triggered here.
    // The user manually starts it via the "Run AI Clarifier" button on the feature detail page.

    return feature;
  }

  async startClarification(featureId: string, orgId: string, userId: string) {
    const feature = await this.featureRepo.getFeatureById(featureId, orgId);
    if (!feature) throw new Error("Feature not found");

    if (feature.status !== "SUBMITTED" && feature.status !== "CLARIFYING") {
      throw new Error("Invalid state transition to start clarification");
    }

    // Set status to CLARIFYING so the UI can show the background tracker
    if (feature.status === "SUBMITTED") {
      await db.update(featureRequests).set({ status: "CLARIFYING" }).where(eq(featureRequests.id, featureId));
    }

    console.log("[startClarification] Sending inngest event feature.created", { featureId, orgId, actorId: userId });
    console.log("[startClarification] NODE_ENV:", process.env.NODE_ENV);
    try {
      const sendResult = await inngest.send({
        name: "feature.created",
        data: { featureId, orgId, actorId: userId }
      });
      console.log("[startClarification] inngest.send() result:", JSON.stringify(sendResult));
    } catch (sendErr: any) {
      console.error("[startClarification] inngest.send() FAILED:", sendErr.message, sendErr);
      throw sendErr;
    }
    
    return { status: "PROCESSING" };
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

    // We can also provide existing features context for duplicate detection (scoped to project)
    const existingFeatures = await this.listFeatures(orgId, undefined, feature.projectId);
    const existingFeaturesContext = existingFeatures
      .filter(f => f.id !== featureId)
      .map(f => `ID: ${f.id}\nTitle: ${f.title}\nDescription: ${f.rawDescription}`)
      .join("\n\n");

    // Fetch project context
    const { projects } = await import("@shipflow/db/schema");
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, feature.projectId)
    });

    // Call Clarifier Agent
    const { runClarifierAgent } = await import("@shipflow/ai");
    const aiResponse = await runClarifierAgent(
      feature.title, 
      feature.rawDescription, 
      existingFeaturesContext, 
      threadStr,
      project?.contextDocument
    );

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
      await createAuditLog({
        orgId, actorId: userId, action: AuditAction.FEATURE_REJECTED,
        resourceType: 'FEATURE', resourceId: featureId,
        metadata: { reason: "marked_duplicate_by_ai" }
      });
    }

    return aiResult;
  }

  async generatePRD(featureId: string, orgId: string, userId: string) {
    const feature = await this.featureRepo.getFeatureById(featureId, orgId);
    if (!feature) throw new Error("Feature not found");
    if (feature.status !== "CLARIFIED" && feature.status !== "SUBMITTED") {
      throw new Error("Invalid state transition to PRD_GENERATED");
    }

    await inngest.send({
      name: "feature.prd.generated",
      data: { featureId, orgId, previousState: feature.status, newState: "PRD_GENERATED", actorId: userId }
    });
    
    await createAuditLog({
      orgId, actorId: userId, action: AuditAction.FEATURE_PRD_GENERATED,
      resourceType: 'FEATURE', resourceId: featureId
    });
    
    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
    await createNotification({
      userId: feature.authorId,
      orgId,
      type: "PRD_GENERATED",
      title: "PRD Generated",
      message: `The PRD for ${feature.title} has been generated.`,
      resourceType: "FEATURE",
      resourceId: featureId,
      actionUrl: `/org/${org?.slug}/features/${featureId}`
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

    await createAuditLog({
      orgId, actorId: userId, action: AuditAction.FEATURE_TASKS_GENERATED,
      resourceType: 'FEATURE', resourceId: featureId
    });

    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
    await createNotification({
      userId: feature.authorId,
      orgId,
      type: "TASKS_GENERATED",
      title: "Tasks Generated",
      message: `Implementation tasks for ${feature.title} are ready.`,
      resourceType: "FEATURE",
      resourceId: featureId,
      actionUrl: `/org/${org?.slug}/features/${featureId}`
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

    await createAuditLog({
      orgId, actorId: userId, action: AuditAction.FEATURE_PLAN_APPROVED,
      resourceType: 'FEATURE', resourceId: featureId
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

    await createAuditLog({
      orgId, actorId: userId === "SYSTEM" ? null : userId, action: AuditAction.FEATURE_FIX_NEEDED,
      resourceType: 'FEATURE', resourceId: featureId
    });

    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
    await createNotification({
      userId: feature.authorId, // Notify creator (or PR author if we had them)
      orgId,
      type: "FIX_NEEDED",
      title: "Review Failed",
      message: `${feature.title} requires fixes before shipping.`,
      resourceType: "FEATURE",
      resourceId: featureId,
      actionUrl: `/org/${org?.slug}/features/${featureId}`
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
        signature: crypto.createHmac("sha256", APPROVAL_SECRET).update(`${pr.id}-${userId}-${Date.now()}`).digest("hex")
      }));
      await db.insert(approvals).values(approvalData);
    }

    await this.featureRepo.updateFeatureStatus(featureId, orgId, "SHIPPED");

    await inngest.send({
      name: "feature.human.approved",
      data: { featureId, orgId, previousState: feature.status, newState: "SHIPPED", actorId: userId }
    });

    // Update project context since a new feature has been shipped
    await inngest.send({
      name: "project.context.generate",
      data: { projectId: feature.projectId, orgId }
    });

    await createAuditLog({
      orgId, actorId: userId, action: AuditAction.FEATURE_APPROVED,
      resourceType: 'FEATURE', resourceId: featureId
    });

    await createAuditLog({
      orgId, actorId: userId, action: AuditAction.FEATURE_SHIPPED,
      resourceType: 'FEATURE', resourceId: featureId
    });

    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
    await createNotification({
      userId: feature.authorId,
      orgId,
      type: "FEATURE_SHIPPED",
      title: "Feature Shipped!",
      message: `${feature.title} has been approved and shipped.`,
      resourceType: "FEATURE",
      resourceId: featureId,
      actionUrl: `/org/${org?.slug}/features/${featureId}`
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

    await createAuditLog({
      orgId, actorId: null, action: AuditAction.FEATURE_IN_DEVELOPMENT,
      resourceType: 'FEATURE', resourceId: featureId,
      metadata: { pullRequestId: prId }
    });

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

    await createAuditLog({
      orgId, actorId: null, action: AuditAction.AI_REVIEW_COMPLETED,
      resourceType: 'FEATURE', resourceId: featureId
    });

    await createAuditLog({
      orgId, actorId: null, action: AuditAction.FEATURE_HUMAN_APPROVAL_REQUESTED,
      resourceType: 'FEATURE', resourceId: featureId
    });

    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
    
    // Notify PM, Admin, Owner and Reviewer
    await notifyOrgRoles({
      orgId,
      roles: ["PM", "ADMIN", "OWNER", "REVIEWER"],
      notification: {
        type: "APPROVAL_REQUESTED",
        title: "Approval Requested",
        message: `${feature.title} is awaiting final human approval.`,
        resourceType: "FEATURE",
        resourceId: featureId,
        actionUrl: `/org/${org?.slug}/features/${featureId}`
      }
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
    await createAuditLog({
      orgId, actorId: null, action: AuditAction.FEATURE_REVIEW_STARTED,
      resourceType: 'FEATURE', resourceId: featureId,
    });
    return { status: "IN_REVIEW" };
  }

  async markInReview(featureId: string, orgId: string) {
    const feature = await this.featureRepo.getFeatureById(featureId, orgId);
    if (!feature) throw new Error("Feature not found");
    if (feature.status !== "IN_DEVELOPMENT" && feature.status !== "FIX_NEEDED") {
      throw new Error("Invalid state transition to IN_REVIEW");
    }

    await this.featureRepo.updateFeatureStatus(featureId, orgId, "IN_REVIEW");
    await createAuditLog({
      orgId, actorId: null, action: AuditAction.FEATURE_REVIEW_STARTED,
      resourceType: 'FEATURE', resourceId: featureId,
    });
    return { status: "IN_REVIEW" };
  }

  async redoExecutionPlan(featureId: string, orgId: string, userId: string) {
    const role = await this.featureRepo.getMemberRole(orgId, userId);
    if (role !== "ADMIN" && role !== "OWNER" && role !== "PM" && role !== "ENGINEER") {
      throw new Error("Unauthorized to redo execution plan");
    }

    const feature = await this.featureRepo.getFeatureById(featureId, orgId);
    if (!feature) throw new Error("Feature not found");
    if (feature.status !== "IN_DEVELOPMENT" && feature.status !== "FIX_NEEDED" && feature.status !== "IN_REVIEW") {
      throw new Error("Invalid state transition to PLAN_APPROVED for execution redo");
    }

    const { tasks, subtasks } = await import("@shipflow/db/schema");
    const { inArray, notInArray } = await import("drizzle-orm");

    // Fetch tasks belonging to this feature
    const schema = await import("@shipflow/db/schema");
    const prd = await db.query.prds.findFirst({
      where: eq(schema.prds.featureRequestId, featureId),
    });
    
    let epicTasks = null;
    if (prd) {
      epicTasks = await db.query.epics.findFirst({
        where: eq(schema.epics.prdId, prd.id),
        with: { tasks: true }
      });
    }

    if (epicTasks && epicTasks.tasks.length > 0) {
      const taskIds = epicTasks.tasks.map(t => t.id);
      
      // Update tasks that are NOT done back to TODO
      await db.update(tasks)
        .set({ status: "TODO", executionStatus: "ready" })
        .where(
          and(
            inArray(tasks.id, taskIds),
            notInArray(tasks.status, ["DONE"])
          )
        );
        
      // Reset subtask completions for non-done tasks
      const nonDoneTaskIds = epicTasks.tasks.filter(t => t.status !== "DONE").map(t => t.id);
      if (nonDoneTaskIds.length > 0) {
        await db.update(subtasks)
          .set({ isCompleted: false })
          .where(inArray(subtasks.taskId, nonDoneTaskIds));
      }
    }

    await this.featureRepo.updateFeatureStatus(featureId, orgId, "PLAN_APPROVED");
    
    await createAuditLog({
      orgId, actorId: userId, action: AuditAction.FEATURE_PLAN_APPROVED,
      resourceType: 'FEATURE', resourceId: featureId,
      metadata: { reason: "redo_execution_plan" }
    });

    return { status: "PLAN_APPROVED" };
  }

  async submitClarificationAnswers(featureId: string, orgId: string, userId: string, answers: Array<{ question: string, recommendation: string, accepted: boolean, feedback?: string }>) {
    const feature = await db.query.featureRequests.findFirst({
      where: and(eq(featureRequests.id, featureId), eq(featureRequests.orgId, orgId)),
      with: {
        clarificationThreads: {
          with: { messages: { orderBy: (messages, { asc }) => [asc(messages.createdAt)] } },
          limit: 1,
        }
      }
    });

    if (!feature || !feature.clarificationThreads || feature.clarificationThreads.length === 0) {
      throw new Error("Feature or clarification thread not found");
    }

    const thread = feature.clarificationThreads[0];
    if (!thread) throw new Error("Thread is undefined");

    // Build the Markdown block
    let markdownBlock = `\n\n### Clarification Update\n`;
    let userMessageContent = "";
    
    answers.forEach((ans, i) => {
      markdownBlock += `**Q:** ${ans.question}\n`;
      markdownBlock += `*(Recommendation: ${ans.recommendation})*\n`;
      if (ans.accepted) {
        markdownBlock += `**A:** Yes, proceed with recommendation.\n\n`;
        userMessageContent += `Q: ${ans.question}\nA: Accepted recommendation.\n\n`;
      } else {
        markdownBlock += `**A:** ${ans.feedback}\n\n`;
        userMessageContent += `Q: ${ans.question}\nA: ${ans.feedback}\n\n`;
      }
    });

    // Update feature description
    const updatedDescription = feature.rawDescription + markdownBlock;
    await db.update(featureRequests)
      .set({ rawDescription: updatedDescription, updatedAt: new Date() })
      .where(eq(featureRequests.id, featureId));

    // Save user's answers to the thread
    await db.insert(clarificationMessages).values({
      threadId: thread.id,
      sender: "USER",
      content: userMessageContent.trim(),
    });

    // Build transcript for AI
    const allMessages = [...(thread.messages || []), { sender: "USER", content: userMessageContent.trim() }];
    const transcript = allMessages.map(m => `${m.sender}: ${m.content}`).join("\n");

    // Build existing features context for duplicate detection
    const existingFeatures = await this.listFeatures(orgId, undefined, feature.projectId);
    const existingFeaturesContext = existingFeatures
      .filter(f => f.id !== featureId)
      .map(f => `ID: ${f.id}\nTitle: ${f.title}\nDescription: ${f.rawDescription}`)
      .join("\n\n");

    // Fetch project context
    const { projects } = await import("@shipflow/db/schema");
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, feature.projectId)
    });

    // Run clarifier agent
    const { runClarifierAgent } = await import("@shipflow/ai");
    const { result } = await runClarifierAgent(
      feature.title, 
      updatedDescription, 
      existingFeaturesContext, 
      transcript,
      project?.contextDocument
    );

    let nextContent = result.message || "";
    if (result.action === "ask_question" && result.questions) {
      nextContent = JSON.stringify({
        message: result.message,
        questions: result.questions
      });
    }

    await db.insert(clarificationMessages).values({
      threadId: thread.id,
      sender: result.action === "ask_question" ? "AI_QUESTIONS" : "AI",
      content: nextContent,
    });

    if (result.action === "ask_question") {
      await db.update(featureRequests).set({ status: "CLARIFYING", updatedAt: new Date() }).where(eq(featureRequests.id, featureId));
    } else if (result.action === "mark_ready") {
      await db.update(featureRequests).set({ status: "CLARIFIED", updatedAt: new Date() }).where(eq(featureRequests.id, featureId));
    } else if (result.action === "mark_duplicate") {
      await db.update(featureRequests).set({ status: "REJECTED", updatedAt: new Date() }).where(eq(featureRequests.id, featureId));
    }

    return feature;
  }
}

export const featureService = new FeatureService(new FeatureRepository());
