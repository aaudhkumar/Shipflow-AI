import { inngest } from "../../../services/src/workflow/client";
import { db } from "@shipflow/db";
import { subscriptions, invoices } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

export const billingSyncWorkflow = inngest.createFunction(
  { id: "billing-sync" },
  { event: "billing.payment.success" },
  async ({ event, step }) => {
    await step.run("update-subscription-and-invoice", async () => {
      let { subscriptionId, amount, paymentId, orgId, planId } = event.data;

      if (planId) {
        planId = planId.toUpperCase();
      }

      if (!orgId) {
        throw new Error(`No orgId provided in webhook notes for payment ${paymentId}`);
      }

      const existingSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.orgId, orgId),
      });

      const newPeriodEnd = new Date();
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

      let subId = existingSub?.id;

      if (!existingSub) {
         const [newSub] = await db.insert(subscriptions).values({
           id: crypto.randomUUID(),
           orgId,
           razorpaySubscriptionId: subscriptionId,
           status: "ACTIVE",
           planId: planId || "PRO",
           currentPeriodEnd: newPeriodEnd,
           usageCount: 0,
           usageLimit: planId === "ENTERPRISE" ? 70 : 30,
         }).returning();
         if (!newSub) throw new Error("Failed to create new subscription");
         subId = newSub.id;
      } else {
        await db.update(subscriptions)
          .set({ 
            status: "ACTIVE", 
            currentPeriodEnd: newPeriodEnd,
            planId: planId || existingSub.planId,
            razorpaySubscriptionId: subscriptionId || existingSub.razorpaySubscriptionId,
            usageLimit: (planId || existingSub.planId) === "ENTERPRISE" ? 70 : 30,
          })
          .where(eq(subscriptions.id, existingSub.id));
      }

      if (subId) {
        await db.insert(invoices).values({
          id: crypto.randomUUID(),
          subscriptionId: subId,
          amount,
          razorpayInvoiceId: paymentId,
          status: "paid",
          currency: "USD",
        });
      }

      return { success: true };
    });
  }
);
