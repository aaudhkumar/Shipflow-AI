import { db } from "@shipflow/db";
import { subscriptions } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";
import { getRazorpayClient } from "../client";

export async function cancelSubscription(orgId: string) {
  const activeSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.orgId, orgId),
  });

  if (!activeSub || !activeSub.razorpaySubscriptionId) {
    throw new Error("No active Razorpay subscription found");
  }

  const razorpay = getRazorpayClient();
  
  await razorpay.subscriptions.cancel(activeSub.razorpaySubscriptionId, false);

  await db.update(subscriptions)
    .set({ status: "CANCELED" })
    .where(eq(subscriptions.id, activeSub.id));

  return { success: true };
}
