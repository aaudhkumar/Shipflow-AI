import { api } from "~/trpc/server";
import { PricingCards } from "@/components/billing/pricing-cards";
import { redirect } from "next/navigation";

import { BillingSuccessModal } from "@/components/billing/BillingSuccessModal";

export default async function BillingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const org = await api.organization.getBySlug.query({ slug });
  if (!org) redirect("/onboarding");

  const subscription = await api.billing.getSubscription.query({ orgId: org.id });

  return (
    <div className="space-y-8 max-w-5xl">
      <BillingSuccessModal />
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing & Plans</h2>
        <p className="text-muted-foreground mt-1 text-sm">Manage your subscription, usage, and billing information.</p>
      </div>

      <PricingCards orgId={org.id} currentPlan={subscription.plan} />
    </div>
  );
}
