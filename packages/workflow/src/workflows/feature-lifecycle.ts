import { inngest } from "../../../services/src/workflow/client";
import { db } from "@shipflow/db";
import { featureRequests, clarificationThreads, clarificationMessages, projects } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

export const featureCreated = inngest.createFunction(
  { id: "feature-created" },
  { event: "feature.created" },
  async ({ event, step }) => {
    const { featureId, orgId, actorId } = event.data;

    const featureData = await step.run("fetch-feature", async () => {
      const feature = await db.query.featureRequests.findFirst({
        where: eq(featureRequests.id, featureId),
        with: {
          clarificationThreads: true
        }
      });
      if (!feature) throw new Error("Feature not found");
      return feature;
    });

    const clarifierResult = await step.run("run-clarifier", async () => {
      // 1. Fetch existing features for duplicate detection (scoped to project)
      const { featureService } = await import("@shipflow/services/feature");
      const features = await featureService.listFeatures(orgId, undefined, featureData.projectId);
      const existingFeaturesContext = features
        .filter(f => f.id !== featureId)
        .map(f => `ID: ${f.id}\nTitle: ${f.title}\nDescription: ${f.rawDescription}`)
        .join("\n\n");

      // 2. Fetch project context
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, featureData.projectId),
      });

      // 3. Run clarifier agent
      const { runClarifierAgent } = await import("@shipflow/ai");
      // Run with empty transcript since it's the first time
      const { result } = await runClarifierAgent(
        featureData.title, 
        featureData.rawDescription, 
        existingFeaturesContext, 
        "",
        project?.contextDocument
      );
      return result;
    });

    await step.run("save-clarifier-response", async () => {
      const thread = featureData.clarificationThreads?.[0];
      if (!thread) throw new Error("Thread not found");

      let content = clarifierResult.message || "";
      if (clarifierResult.action === "ask_question" && clarifierResult.questions) {
        content = JSON.stringify({
          message: clarifierResult.message,
          questions: clarifierResult.questions
        });
      }

      await db.insert(clarificationMessages).values({
        threadId: thread.id,
        sender: clarifierResult.action === "ask_question" ? "AI_QUESTIONS" : "AI",
        content,
      });

      // Optionally update status to CLARIFYING
      if (clarifierResult.action === "ask_question") {
        await db.update(featureRequests)
          .set({ status: "CLARIFYING", updatedAt: new Date() })
          .where(eq(featureRequests.id, featureId));
      } else if (clarifierResult.action === "mark_ready") {
        await db.update(featureRequests)
          .set({ status: "CLARIFIED", updatedAt: new Date() })
          .where(eq(featureRequests.id, featureId));
      }
    });

    const org = await step.run("fetch-org-autopilot", async () => {
      const { organizations } = await import("@shipflow/db/schema");
      return db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
    });

    if (org?.isAutopilotEnabled && clarifierResult.action === "mark_ready") {
      await step.sendEvent("auto-trigger-prd", {
        name: "feature.prd.generated",
        data: { featureId, orgId, previousState: "CLARIFIED", newState: "PRD_GENERATED", actorId: "SYSTEM" }
      });
    }

    return { success: true, featureId, action: clarifierResult.action };
  }
);

export const featurePrdGenerated = inngest.createFunction(
  { id: "feature-prd-generated" },
  { event: "feature.prd.generated" },
  async ({ event, step }) => {
    const { featureId, orgId, actorId } = event.data;

    // 1. Fetch feature + clarification messages
    const { feature, transcript } = await step.run("fetch-feature", async () => {
      const featureData = await db.query.featureRequests.findFirst({
        where: eq(featureRequests.id, featureId),
        with: {
          clarificationThreads: {
            with: { messages: { orderBy: (messages, { asc }) => [asc(messages.createdAt)] } },
            limit: 1,
          }
        }
      });
      if (!featureData) throw new Error("Feature not found");

      const messages = featureData.clarificationThreads?.[0]?.messages || [];
      const transcript = messages.map(m => `${m.sender}: ${m.content}`).join("\n");

      return { feature: featureData, transcript };
    });

    // 2. Run PRD generator AI
    const prdContent = await step.run("generate-prd", async () => {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, feature.projectId),
      });

      const { runPRDGenerator } = await import("@shipflow/ai");
      const { result } = await runPRDGenerator(feature.title, feature.rawDescription, transcript, project?.contextDocument);
      return result;
    });

    // 3. Insert prds row
    const prd = await step.run("insert-prd", async () => {
      const { prds } = await import("@shipflow/db/schema");
      const [newPrd] = await db.insert(prds)
        .values({ orgId, featureRequestId: featureId, status: "DRAFT" })
        .returning();
      return newPrd;
    });

    if (!prd) throw new Error("PRD could not be created");

    // 4. Insert prdVersions row
    const prdVersion = await step.run("insert-prd-version", async () => {
      const { prdVersions, prds, members } = await import("@shipflow/db/schema");
      const { and, eq } = await import("drizzle-orm");
      
      const [member] = await db
        .select({ id: members.id })
        .from(members)
        .where(and(eq(members.userId, actorId), eq(members.orgId, orgId)))
        .limit(1);

      if (!member) throw new Error("User is not a member of this organization");

      const [version] = await db.insert(prdVersions)
        .values({
          prdId: prd.id,
          authorId: member.id,
          versionNumber: 1,
          content: prdContent,
          changeSummary: "Initial AI generation",
        })
        .returning();

      if (!version) throw new Error("PRD version could not be created");

      await db.update(prds)
        .set({ currentVersionId: version.id })
        .where(eq(prds.id, prd.id));

      return version;
    });

    // 5. Update feature status
    await step.run("update-state-prd-generated", async () => {
      await db.update(featureRequests)
        .set({ status: "PRD_GENERATED", updatedAt: new Date() })
        .where(eq(featureRequests.id, featureId));
    });

    const org = await step.run("fetch-org-autopilot", async () => {
      const { organizations } = await import("@shipflow/db/schema");
      return db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
    });

    if (org?.isAutopilotEnabled) {
      await step.sendEvent("auto-trigger-tasks", {
        name: "feature.tasks.generated",
        data: { featureId, orgId, previousState: "PRD_GENERATED", newState: "TASKS_GENERATED", actorId: "SYSTEM" }
      });
    }

    return { success: true, featureId, status: "PRD_GENERATED", prdId: prd.id };
  }
);

export const featureTasksGenerated = inngest.createFunction(
  { id: "feature-tasks-generated" },
  { event: "feature.tasks.generated" },
  async ({ event, step }) => {
    const { featureId, orgId } = event.data;

    const prd = await step.run("fetch-prd", async () => {
      const featureData = await db.query.featureRequests.findFirst({
        where: eq(featureRequests.id, featureId),
        with: { prds: { with: { currentVersion: true } } }
      });
      if (!featureData || !featureData.prds || featureData.prds.length === 0) {
        throw new Error("PRD not found for this feature");
      }
      return {
        feature: featureData,
        prdContent: featureData.prds[0]?.currentVersion?.content as Record<string, any>
      };
    });

    const prdContentString = JSON.stringify(prd.prdContent, null, 2);

    const plannerResult = await step.run("run-planner", async () => {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, prd.feature.projectId),
      });

      const { runPlanningAgent } = await import("@shipflow/ai");
      const { result } = await runPlanningAgent(prdContentString, project?.contextDocument);
      return result;
    });

    await step.run("insert-epic-and-tasks", async () => {
      const { epics, tasks, subtasks } = await import("@shipflow/db/schema");
      
      const [epic] = await db.insert(epics).values({
        orgId,
        projectId: prd.feature.projectId,
        prdId: prd.feature.prds[0]?.id as string,
        title: (plannerResult as any).summary,
        description: (plannerResult as any).summary,
      }).returning();
      if (!epic) throw new Error("Epic could not be created");
      
      for (const task of (plannerResult as any).tasks) {
        const [taskRow] = await db.insert(tasks).values({
          orgId,
          epicId: epic.id,
          title: task.title,
          technicalImplementationDetails: task.description,
          estimationPoints: task.storyPoints,
          status: "TODO",
        }).returning();
        if (!taskRow) continue;
        
        if (task.acceptanceCriteria && task.acceptanceCriteria.length > 0) {
          await db.insert(subtasks).values(
            task.acceptanceCriteria.map((criterion: string) => ({
              taskId: taskRow.id,
              description: criterion,
              isCompleted: false,
            }))
          );
        }
      }
    });

    await step.run("update-state-tasks-generated", async () => {
      await db.update(featureRequests)
        .set({ status: "TASKS_GENERATED", updatedAt: new Date() })
        .where(eq(featureRequests.id, featureId));
    });

    const org = await step.run("fetch-org-autopilot", async () => {
      const { organizations } = await import("@shipflow/db/schema");
      return db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
    });

    if (org?.isAutopilotEnabled) {
      await step.sendEvent("auto-trigger-plan-approved", {
        name: "feature.plan.approved",
        data: { featureId, orgId, previousState: "TASKS_GENERATED", newState: "PLAN_APPROVED", actorId: "SYSTEM" }
      });
    }

    return { success: true, featureId, status: "TASKS_GENERATED" };
  }
);

export const featurePlanApproved = inngest.createFunction(
  { id: "feature-plan-approved" },
  { event: "feature.plan.approved" },
  async ({ event, step }) => {
    const { featureId } = event.data;

    await step.run("update-state-plan-approved", async () => {
      await db.update(featureRequests)
        .set({ status: "PLAN_APPROVED", updatedAt: new Date() })
        .where(eq(featureRequests.id, featureId));
    });

    const orgId = (event.data as any).orgId;
    
    if (orgId) {
      const org = await step.run("fetch-org-autopilot", async () => {
        const { organizations } = await import("@shipflow/db/schema");
        return db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
      });

      if (org?.isAutopilotEnabled) {
        const prd = await step.run("fetch-prd-for-dev", async () => {
          const { prds } = await import("@shipflow/db/schema");
          return db.query.prds.findFirst({ where: eq(prds.featureRequestId, featureId) });
        });
        if (prd) {
          await step.run("request-implementation", async () => {
            const { default: TaskExecutionService } = await import("@shipflow/services/task-execution");
            const taskExecutionService = new TaskExecutionService();
            await taskExecutionService.requestImplementation({ prdId: prd.id, orgId });
          });
        }
      }
    }

    return { success: true, featureId, status: "PLAN_APPROVED" };
  }
);

export const featureReviewFailed = inngest.createFunction(
  { id: "feature-review-failed" },
  { event: "feature.review.failed" },
  async ({ event, step }) => {
    const { featureId } = event.data;

    await step.run("update-state-fix-needed", async () => {
      await db.update(featureRequests)
        .set({ status: "FIX_NEEDED", updatedAt: new Date() })
        .where(eq(featureRequests.id, featureId));
    });

    return { success: true, featureId, status: "FIX_NEEDED" };
  }
);

export const featureHumanApproved = inngest.createFunction(
  { id: "feature-human-approved" },
  { event: "feature.human.approved" },
  async ({ event, step }) => {
    const { featureId } = event.data;

    await step.run("update-state-shipped", async () => {
      await db.update(featureRequests)
        .set({ status: "SHIPPED", updatedAt: new Date() })
        .where(eq(featureRequests.id, featureId));
    });

    return { success: true, featureId, status: "SHIPPED" };
  }
);
