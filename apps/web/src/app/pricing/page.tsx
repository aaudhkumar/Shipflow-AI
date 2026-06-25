import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For small teams and side projects.",
    features: ["Up to 3 Team Members", "Basic Issue Tracking", "Community Support"],
    buttonText: "Get Started",
    popular: false,
  },
  {
    name: "Pro Plan",
    price: "$29",
    period: "/mo",
    description: "For growing teams that need more power.",
    features: ["Unlimited Team Members", "Advanced Workflows", "AI Code Reviews", "Priority Support"],
    buttonText: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with complex needs.",
    features: ["Custom Workflows", "Dedicated Success Manager", "SLA", "Advanced Security"],
    buttonText: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your team's needs. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border ${
                plan.popular ? "border-primary shadow-xl" : "border-border shadow-sm"
              } bg-card p-8 flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-muted-foreground mt-2">{plan.description}</p>
              </div>
              <div className="mb-8 flex items-baseline text-5xl font-extrabold">
                {plan.price}
                {plan.period && (
                  <span className="text-xl font-medium text-muted-foreground ml-1">
                    {plan.period}
                  </span>
                )}
              </div>
              <ul className="mb-8 space-y-4 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.popular ? "default" : "outline"}
                className="w-full"
                size="lg"
              >
                <Link href="/login">{plan.buttonText}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
