import { z } from "zod";
import { billingService } from "@shipflow/billing";

export const getSubscriptionOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof billingService.getSubscription>>>>;
export const createCheckoutSessionOutputSchema = z.any() as z.ZodType<{ url: string }>;
export const createOrderOutputSchema = z.any() as z.ZodType<NonNullable<Awaited<ReturnType<typeof billingService.createOrder>>>>;
export const verifyPaymentOutputSchema = z.any() as z.ZodType<{ success: boolean }>;
