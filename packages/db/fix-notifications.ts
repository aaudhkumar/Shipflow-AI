import { db } from "./index";
import { notifications, featureRequests, users, organizations } from "./schema";
import { eq } from "drizzle-orm";

async function fix() {
  console.log("Fixing notifications...");
  
  const [user] = await db.select().from(users).where(eq(users.email, "demo@demo.com"));
  const [org] = await db.select().from(organizations).where(eq(organizations.slug, "demo"));
  
  if (!user || !org) {
    console.error("User or Org not found");
    return;
  }

  // Clear existing notifications
  await db.delete(notifications);

  // Generate some realistic notifications based on features
  const features = await db.select().from(featureRequests);
  
  for (const f of features) {
    if (f.status === "AWAITING_HUMAN_APPROVAL") {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        orgId: org.id,
        userId: user.id,
        title: "Action Required: Plan Approval",
        message: `The plan for "${f.title}" is ready and awaiting your approval.`,
        type: "ACTION_REQUIRED",
        isRead: false,
        actionUrl: `/org/${org.slug}/features/${f.id}`,
        createdAt: new Date(),
      });
    } else if (f.status === "PRD_GENERATED") {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        orgId: org.id,
        userId: user.id,
        title: "PRD Generated",
        message: `A PRD has been generated for "${f.title}".`,
        type: "SYSTEM",
        isRead: false,
        actionUrl: `/org/${org.slug}/features/${f.id}`,
        createdAt: new Date(),
      });
    } else if (f.status === "IN_REVIEW") {
       await db.insert(notifications).values({
        id: crypto.randomUUID(),
        orgId: org.id,
        userId: user.id,
        title: "Feature In Review",
        message: `Feature "${f.title}" is now in review.`,
        type: "SYSTEM",
        isRead: true,
        actionUrl: `/org/${org.slug}/features/${f.id}`,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
      });
    }
  }

  console.log("Notifications fixed!");
}

fix().catch(console.error);
