"use client"

import React, { useState } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { trpc } from "~/trpc/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false)
    
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existingScript) {
      return resolve(true)
    }
    
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

interface PricingCardsProps {
  orgId: string
  currentPlan: string
}

export function PricingCards({ orgId, currentPlan }: PricingCardsProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  
  const normalizedCurrentPlan = currentPlan?.toUpperCase() || "FREE"

  const createOrderMutation = trpc.billing.createOrder.useMutation()
  const verifyPaymentMutation = trpc.billing.verifyPayment.useMutation()

  const handleCheckout = async (planId: string, amount: number) => {
    if (planId === normalizedCurrentPlan || normalizedCurrentPlan === "ENTERPRISE") {
      toast.info("You already have this plan or a higher tier.")
      return
    }

    setLoadingPlan(planId)
    try {
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        toast.error("Failed to load Razorpay SDK")
        return
      }

      // amount is passed in paise (e.g. 49900)
      const order = await createOrderMutation.mutateAsync({ orgId, amount })
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "ShipFlow AI",
        description: `Purchase ${planId} Plan`,
        order_id: order.order_id,
        handler: async function (response: any) {
          try {
            await verifyPaymentMutation.mutateAsync({
              orgId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })
            toast.success("Payment successful! Your plan has been upgraded.")
            window.location.reload()
          } catch (_error) {
            toast.error("Payment verification failed.")
          }
        },
        theme: {
          color: "#1C1C1C",
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on("payment.failed", function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`)
      })
      rzp.open()
    } catch (_error) {
      toast.error("An error occurred during checkout. Please try again.")
    } finally {
      setLoadingPlan(null)
    }
  }

  const plans = [
    {
      id: "FREE",
      name: "Basic",
      tagline: "Ideal for Individuals or small teams",
      price: 0,
      gradient: "from-[#eef0ff]/80 via-white to-white dark:from-indigo-900/20 dark:via-background dark:to-background",
      iconColor: "text-indigo-400 dark:text-indigo-500",
      iconBg: "bg-indigo-50 dark:bg-indigo-900/30",
      features: [
        "Up to 3 connected repositories.",
        "10 AI PR reviews per month.",
        "Basic PRD generation.",
        "Standard community support."
      ]
    },
    {
      id: "PRO",
      name: "Premium",
      tagline: "Perfect for growing businesses",
      price: 499,
      gradient: "from-[#fff5e5]/80 via-white to-white dark:from-orange-900/20 dark:via-background dark:to-background",
      iconColor: "text-orange-400 dark:text-orange-500",
      iconBg: "bg-orange-50 dark:bg-orange-900/30",
      popular: true,
      features: [
        "Unlimited repositories.",
        "30 AI PR reviews per month.",
        "Advanced PRD generation & Planner agent.",
        "Automated AI Code Reviewer.",
        "Priority email support."
      ]
    },
    {
      id: "ENTERPRISE",
      name: "Custom",
      tagline: "Designed for unique needs",
      price: 999,
      gradient: "from-[#e5f8ff]/80 via-white to-white dark:from-cyan-900/20 dark:via-background dark:to-background",
      iconColor: "text-cyan-400 dark:text-cyan-500",
      iconBg: "bg-cyan-50 dark:bg-cyan-900/30",
      features: [
        "Unlimited repositories.",
        "70 AI PR reviews per month.",
        "Custom AI integrations.",
        "Dedicated Slack channel.",
        "24/7 Enterprise support."
      ]
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 w-full max-w-6xl mx-auto items-stretch">
      {plans.map((plan) => {
        const isCurrent = normalizedCurrentPlan === plan.id || (normalizedCurrentPlan === "FREE" && plan.id === "FREE")
        
        return (
          <div 
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-[2rem] border border-border/40 bg-gradient-to-br p-8 shadow-sm transition-all hover:shadow-md",
              plan.gradient,
              plan.popular ? "md:-translate-y-2 border-orange-200/50 shadow-orange-100/50" : ""
            )}
          >
            {plan.popular && (
              <div className="absolute top-6 right-6">
                <span className="rounded-full bg-orange-100/80 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 px-3 py-1 text-xs font-semibold">
                  Most popular
                </span>
              </div>
            )}
            
            <div className={cn("mb-6 h-12 w-12 rounded-2xl flex items-center justify-center", plan.iconBg)}>
              {plan.id === "FREE" && (
                <svg className={cn("w-6 h-6", plan.iconColor)} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z" />
                </svg>
              )}
              {plan.id === "PRO" && (
                <div className="grid grid-cols-2 gap-[2px] rotate-45">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-300" />
                </div>
              )}
              {plan.id === "ENTERPRISE" && (
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-6 h-6 rounded-full bg-cyan-200/50" />
                  <svg className={cn("w-4 h-4 relative z-10", plan.iconColor)} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z" />
                  </svg>
                </div>
              )}
            </div>

            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <p className="text-sm text-muted-foreground mb-6 h-10">{plan.tagline}</p>
            
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-2xl font-medium text-muted-foreground/80">$</span>
              <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
              <span className="text-muted-foreground ml-1 font-medium">/ per month</span>
            </div>

            <Button 
              variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
              className={cn(
                "w-full rounded-xl py-6 mb-8 text-base font-semibold transition-all",
                isCurrent ? "opacity-50 cursor-not-allowed border-dashed" : "",
                !isCurrent && plan.popular ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-md" : "hover:bg-muted/50"
              )}
              disabled={isCurrent || loadingPlan === plan.id}
              onClick={() => {
                if (plan.id === "FREE") return;
                // Pass paise 49900 or 99900
                handleCheckout(plan.id, plan.price * 100) 
              }}
            >
              {loadingPlan === plan.id ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </span>
              ) : isCurrent ? (
                "Current Plan"
              ) : plan.id === "ENTERPRISE" ? (
                "Get started"
              ) : (
                "Get started"
              )}
            </Button>

            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-4">What's included:</p>
              <ul className="space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={cn("mt-0.5 rounded-full p-1", plan.iconBg)}>
                      <Check className={cn("h-3 w-3", plan.iconColor)} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-muted-foreground leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      })}
    </div>
  )
}
