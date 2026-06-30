import { db } from "./index";
import * as schema from "./schema";
import { faker } from "@faker-js/faker";
import { hashPassword } from "@better-auth/utils/password";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🌱 Starting database seeding...");

  console.log("🧹 Clearing existing data...");
  // Disable foreign key checks for truncation (using CASCADE)
  const tables = [
    "user",
    "account",
    "session",
    "organizations",
    "members",
    "projects",
    "feature_requests",
    "prds",
    "prd_versions",
    "epics",
    "tasks",
    "subtasks",
    "notifications",
    "audit_logs",
    "github_installations",
    "repositories",
  ];

  for (const table of tables) {
    try {
      await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE;`));
    } catch (e) {
      console.log(`Skipped truncating ${table} (might not exist)`);
    }
  }

  console.log("👤 Creating Demo User...");
  const userId = faker.string.uuid();
  const passwordHash = await hashPassword("demo@2026");

  await db.insert(schema.users).values({
    id: userId,
    name: "Demo User",
    email: "demo@demo.com",
    emailVerified: true,
    image: `https://avatar.vercel.sh/demo@demo.com`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(schema.accounts).values({
    id: faker.string.uuid(),
    userId,
    accountId: "demo@demo.com",
    providerId: "credential",
    password: passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("🏢 Creating Demo Organization...");
  const orgId = faker.string.uuid();
  await db.insert(schema.organizations).values({
    id: orgId,
    name: "Demo Org",
    slug: "demo",
    billingPlan: "PRO",
    retentionDays: 90,
  });

  const memberId = faker.string.uuid();
  await db.insert(schema.members).values({
    id: memberId,
    orgId,
    userId,
    role: "ADMIN",
    status: "ACTIVE",
  });

  console.log("📂 Creating Projects...");
  const projectsData = [
    { id: faker.string.uuid(), name: "Main Platform", description: "Core application features" },
    { id: faker.string.uuid(), name: "Mobile App", description: "iOS & Android development" },
  ];

  for (const p of projectsData) {
    await db.insert(schema.projects).values({
      id: p.id,
      orgId,
      name: p.name,
      description: p.description,
    });
  }

  const projectId = projectsData[0]!.id;

  console.log("🌟 Generating 20-30 Feature Requests and related data...");
  const numFeatures = faker.number.int({ min: 20, max: 30 });
  const statuses = [
    "SUBMITTED",
    "CLARIFYING",
    "CLARIFIED",
    "PRD_GENERATED",
    "TASKS_GENERATED",
    "PLAN_APPROVED",
    "IN_DEVELOPMENT",
    "IN_REVIEW",
    "FIX_NEEDED",
    "AWAITING_HUMAN_APPROVAL",
    "SHIPPED",
  ] as const;
  const channels = ["IN_APP", "EMAIL", "TICKET", "CALL"] as const;
  const taskStatuses = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;

  for (let i = 0; i < numFeatures; i++) {
    const featureId = faker.string.uuid();
    const status = faker.helpers.arrayElement(statuses);
    const createdAt = faker.date.recent({ days: 60 });
    
    await db.insert(schema.featureRequests).values({
      id: featureId,
      orgId,
      projectId,
      authorId: memberId,
      title: faker.hacker.phrase(),
      rawDescription: faker.lorem.paragraphs(2),
      status,
      sourceChannel: faker.helpers.arrayElement(channels),
      businessValueScore: faker.number.int({ min: 10, max: 100 }),
      createdAt,
      updatedAt: createdAt,
    });

    if (status !== "SUBMITTED" && status !== "CLARIFYING" && status !== "CLARIFIED") {
      const prdId = faker.string.uuid();
      await db.insert(schema.prds).values({
        id: prdId,
        orgId,
        featureRequestId: featureId,
        status: "APPROVED",
        createdAt,
      });

      const versionId = faker.string.uuid();
      await db.insert(schema.prdVersions).values({
        id: versionId,
        prdId,
        authorId: memberId,
        versionNumber: 1,
        content: {
          objective: faker.lorem.paragraph(),
          requirements: [faker.lorem.sentence(), faker.lorem.sentence()],
          scope: faker.lorem.paragraph(),
          metrics: [faker.lorem.words(3), faker.lorem.words(3)],
        },
        changeSummary: "Initial version",
        createdAt,
      });

      await db.update(schema.prds).set({ currentVersionId: versionId }).where(sql`id = ${prdId}`);

      const numEpics = faker.number.int({ min: 1, max: 3 });
      for (let j = 0; j < numEpics; j++) {
        const epicId = faker.string.uuid();
        await db.insert(schema.epics).values({
          id: epicId,
          orgId,
          projectId,
          prdId,
          title: `Epic: ${faker.commerce.productName()}`,
          description: faker.lorem.paragraph(),
          status: "TODO",
          createdAt,
        });

        const numTasks = faker.number.int({ min: 3, max: 5 });
        for (let k = 0; k < numTasks; k++) {
          const taskId = faker.string.uuid();
          await db.insert(schema.tasks).values({
            id: taskId,
            orgId,
            epicId,
            assigneeId: memberId,
            title: `Task: ${faker.hacker.verb()} ${faker.hacker.noun()}`,
            technicalImplementationDetails: faker.lorem.paragraph(),
            status: faker.helpers.arrayElement(taskStatuses),
            estimationPoints: faker.helpers.arrayElement([1, 2, 3, 5, 8]),
            createdAt,
            updatedAt: createdAt,
          });

          const numSubtasks = faker.number.int({ min: 1, max: 3 });
          for (let l = 0; l < numSubtasks; l++) {
            await db.insert(schema.subtasks).values({
              id: faker.string.uuid(),
              taskId,
              description: faker.lorem.sentence(),
              isCompleted: faker.datatype.boolean(),
            });
          }
        }
      }
    }
  }

  console.log("🔔 Generating Notifications & Activity...");
  const features = await db.select().from(schema.featureRequests);
  for (const f of features) {
    if (f.status === "AWAITING_HUMAN_APPROVAL") {
      await db.insert(schema.notifications).values({
        id: faker.string.uuid(),
        orgId,
        userId,
        title: "Action Required: Plan Approval",
        message: `The plan for "${f.title}" is ready and awaiting your approval.`,
        type: "ACTION_REQUIRED",
        isRead: faker.datatype.boolean(),
        actionUrl: `/org/${orgId}/features/${f.id}`,
        createdAt: faker.date.recent({ days: 10 }),
      });
    } else if (f.status === "PRD_GENERATED") {
      await db.insert(schema.notifications).values({
        id: faker.string.uuid(),
        orgId,
        userId,
        title: "PRD Generated",
        message: `A PRD has been generated for "${f.title}".`,
        type: "SYSTEM",
        isRead: faker.datatype.boolean(),
        actionUrl: `/org/${orgId}/features/${f.id}`,
        createdAt: faker.date.recent({ days: 10 }),
      });
    }
  }

  for (let i = 0; i < 25; i++) {
      id: faker.string.uuid(),
      orgId,
      actorId: memberId,
      action: faker.helpers.arrayElement(["PRD_GENERATED", "PR_REVIEWED", "FEATURE_CREATED", "TASK_COMPLETED"]),
      targetEntity: faker.helpers.arrayElement(["PRD", "FEATURE", "TASK", "REPO"]),
      targetEntityId: faker.string.uuid(),
      metadata: {},
      timestamp: faker.date.recent({ days: 10 }),
    });
  }

  console.log("✅ Seeding complete!");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
