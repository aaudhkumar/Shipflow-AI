import { getRazorpayClient } from "../client";
import { BILLING_PLANS, PlanId } from "../config/plans";

export async function createCheckoutSession(orgId: string, planId: PlanId) {
  const plan = BILLING_PLANS[planId];
  if (!plan.razorpayPlanId) {
    throw new Error("Cannot create checkout session for a free plan.");
  }

  // Handle placeholder plan IDs gracefully
  if (plan.razorpayPlanId.startsWith("your_")) {
    return {
      subscriptionId: "sub_dummy_123",
      shortUrl: "/billing/dummy-checkout",
    };
  }

  const razorpay = getRazorpayClient();
  
  const subscription = await razorpay.subscriptions.create({
    plan_id: plan.razorpayPlanId,
    customer_notify: 1,
    total_count: 12,
    notes: {
      orgId,
      planId,
    },
  });

  return {
    subscriptionId: subscription.id,
    shortUrl: subscription.short_url,
  };
}
