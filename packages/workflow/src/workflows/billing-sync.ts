import { inngest } from "../../../services/src/workflow/client";
import { db } from "@shipflow/db";
import { subscriptions, invoices } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";

export const billingSyncWorkflow = inngest.createFunction(
  { id: "billing-sync" },
  { event: "billing.payment.success" },
  async ({ event, step }) => {
    await step.run("update-subscription-and-invoice", async () => {
      const { subscriptionId, amount, paymentId } = event.data;

      const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.razorpaySubscriptionId, subscriptionId),
      });

      if (!sub) {
        throw new Error(`Subscription ${subscriptionId} not found in DB`);
      }

      const newPeriodEnd = new Date(sub.currentPeriodEnd);
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

      await db.update(subscriptions)
        .set({ status: "ACTIVE", currentPeriodEnd: newPeriodEnd })
        .where(eq(subscriptions.id, sub.id));

      await db.insert(invoices).values({
        id: crypto.randomUUID(),
        subscriptionId: sub.id,
        amount,
        razorpayInvoiceId: paymentId,
        status: "paid",
        currency: "USD",
      });

      return { success: true };
    });
  }
);
