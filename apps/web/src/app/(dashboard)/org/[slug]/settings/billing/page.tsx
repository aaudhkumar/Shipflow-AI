import { api } from "~/trpc/server";
import { Button } from "@/components/ui/button";
import { CreditCard, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

export default async function BillingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const org = await api.organization.getBySlug.query({ slug });
  if (!org) redirect("/onboarding");

  const subscription = await api.billing.getSubscription.query({ orgId: org.id });

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing & Plans</h2>
        <p className="text-muted-foreground mt-1 text-sm">Manage your subscription, usage, and billing information.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Current Plan
            </h3>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
              {subscription.plan}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-baseline border-b border-border/50 pb-4">
              <span className="text-muted-foreground">Status</span>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            </div>
            <div className="flex justify-between items-baseline border-b border-border/50 pb-4">
              <span className="text-muted-foreground">Billing Period Ends</span>
              <span className="text-sm font-medium">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
            
            <form action={async () => {
              "use server"
              const session = await api.billing.createCheckoutSession.mutate({ orgId: org.id, plan: "PRO" });
              redirect(session.url);
            }} className="pt-4">
              <Button type="submit" variant="outline" className="w-full bg-background/50 backdrop-blur-sm hover:bg-muted/50 border-border/60 transition-all">
                Manage Subscription
              </Button>
            </form>
          </div>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-6 shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4 transition-transform group-hover:scale-110 duration-500">
            <Zap className="w-32 h-32 text-primary" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-xl text-primary">Upgrade to Pro</h3>
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded font-bold uppercase tracking-wider">Recommended</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Unlock the full power of ShipFlow AI for your team.</p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Unlimited automated PR reviews</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Advanced security vulnerability detection</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Dedicated AI reviewer agent per repo</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Priority support</span>
              </li>
            </ul>

            <form action={async () => {
              "use server"
              const session = await api.billing.createCheckoutSession.mutate({ orgId: org.id, plan: "PRO" });
              redirect(session.url);
            }}>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all group-hover:shadow-primary/40">
                Upgrade Now - $49/mo
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
