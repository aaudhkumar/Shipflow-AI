import { createCheckoutSession as createCheckout } from "./checkout";
import { cancelSubscription as cancelSub } from "./subscription";
import { getRazorpayClient } from "../client";
import crypto from "crypto";
import { db } from "@shipflow/db";
import { subscriptions } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";
import { PlanId } from "../config/plans";

export const billingService = {
  createOrder: async (amount: number, currency: string, receipt: string) => {
    if (amount < 100) {
      throw new Error("Amount must be at least 100 paise");
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
    });

    return {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  },

  verifyPayment: async (orderId: string, paymentId: string, signature: string) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("Razorpay secret not configured");
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      throw new Error("Invalid payment signature");
    }

    return true;
  },

  createCheckoutSession: async (params: { orgId: string; userId: string; planId: string }) => {
    // Retry logic in case Razorpay API fails
    let attempts = 0;
    while (attempts < 3) {
      try {
        const result = await createCheckout(params.orgId, params.planId as PlanId);
        return { checkoutUrl: result.shortUrl };
      } catch (error) {
        attempts++;
        if (attempts >= 3) throw error;
        await new Promise(res => setTimeout(res, Math.pow(2, attempts) * 1000));
      }
    }
    throw new Error("Failed to create checkout session");
  },

  getSubscription: async (orgId: string) => {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.orgId, orgId),
    });

    const { organizations } = await import("@shipflow/db/schema");
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });

    const fallbackPlan = org?.billingPlan ? org.billingPlan.toUpperCase() : "FREE";
    const usageLimitFallback = fallbackPlan === "ENTERPRISE" ? 100 : fallbackPlan === "PRO" ? 30 : 10;

    if (!sub) {
      return {
        plan: fallbackPlan,
        status: "active",
        usageCount: 0,
        usageLimit: usageLimitFallback,
        currentPeriodEnd: null,
      };
    }

    const planId = sub.planId ? sub.planId.toUpperCase() : fallbackPlan;
    
    return {
      plan: planId,
      status: sub.status ? sub.status.toLowerCase() : "active",
      usageCount: sub.usageCount || 0,
      usageLimit: sub.usageLimit || (planId === "ENTERPRISE" ? 100 : planId === "PRO" ? 30 : 10),
      currentPeriodEnd: sub.currentPeriodEnd,
    };
  },

  cancelSubscription: async (orgId: string) => {
    return cancelSub(orgId);
  },

  checkRepositoryLimit: async (orgId: string) => {
    const sub = await billingService.getSubscription(orgId);
    if (sub.plan === "FREE") {
      const { repositories } = await import("@shipflow/db/schema");
      const repoCountResult = await db.select({ count: db.$count(repositories) })
                                    .from(repositories)
                                    .where(eq(repositories.orgId, orgId));
      const currentRepoCount = repoCountResult[0]?.count || 0;
      if (currentRepoCount >= 3) {
        throw new Error("Upgrade to Pro to connect more repositories");
      }
    }
  },

  incrementAiReviewUsage: async (orgId: string) => {
    const sub = await billingService.getSubscription(orgId);
    if (sub.usageCount >= sub.usageLimit) {
      throw new Error("AI review credits exhausted");
    }
    
    const [updatedSub] = await db.update(subscriptions)
      .set({ usageCount: sub.usageCount + 1 })
      .where(eq(subscriptions.orgId, orgId))
      .returning();
      
    if (!updatedSub) {
       // Create the subscription row if it doesn't exist
       await db.insert(subscriptions).values({
         id: crypto.randomUUID(),
         orgId,
         planId: "FREE",
         currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
         usageCount: 1,
         usageLimit: 10,
       });
    }
  }
};
