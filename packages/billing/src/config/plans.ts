export const BILLING_PLANS = {
  FREE: {
    id: "FREE",
    name: "Free",
    priceUsd: 0,
    limits: {
      maxPrsAnalyzedPerMonth: 5,
      maxAiTokensPerMonth: 50000,
    },
    razorpayPlanId: null,
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceUsd: 29,
    limits: {
      maxPrsAnalyzedPerMonth: 50,
      maxAiTokensPerMonth: 1000000,
    },
    razorpayPlanId: process.env.RAZORPAY_PRO_PLAN_ID,
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    priceUsd: 99,
    limits: {
      maxPrsAnalyzedPerMonth: 500,
      maxAiTokensPerMonth: 10000000,
    },
    razorpayPlanId: process.env.RAZORPAY_ENTERPRISE_PLAN_ID,
  },
} as const;

export type PlanId = keyof typeof BILLING_PLANS;
