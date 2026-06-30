import { api } from "~/trpc/server"
import { StatCards } from "@/components/dashboard/stat-cards"
import { PRVolumeChart } from "@/components/analytics/pr-volume-chart"
import { ReviewTimeChart } from "@/components/analytics/review-time-chart"
import { FeatureTimeline } from "@/components/analytics/feature-timeline"
import { ProductivityHeatmap } from "@/components/analytics/productivity-heatmap"
import { SecurityTrendsChart } from "@/components/analytics/security-trends-chart"
import { AiAccuracyMetrics } from "@/components/analytics/ai-accuracy-metrics"
import { ReviewFeedbackMetrics } from "@/components/analytics/review-feedback-metrics"
import { SourceChannelChart } from "@/components/analytics/source-channel-chart"
import { Button } from "@/components/ui/button"
import Link from "next/link"


export default async function AnalyticsPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ days?: string }>
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const days = resolvedSearchParams?.days === "30" ? 30 : 7;
  
  const org = await api.organization.getBySlug.query({ slug });
  if (!org) return <div className="p-8">Organization not found</div>;

  const stats = await api.organization.getStats.query({ orgId: org.id });
  const analytics = await api.organization.getAnalytics.query({ orgId: org.id, days });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Deep dive into {slug}'s engineering velocity and AI performance.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/40">
          <Button 
            variant={days === 7 ? "secondary" : "ghost"} 
            size="sm" 
            className="text-sm font-medium rounded-md"
            asChild
          >
            <Link href={`/org/${slug}/analytics?days=7`}>
              7 Days
            </Link>
          </Button>
          <Button 
            variant={days === 30 ? "secondary" : "ghost"} 
            size="sm" 
            className="text-sm font-medium rounded-md"
            asChild
          >
            <Link href={`/org/${slug}/analytics?days=30`}>
              30 Days
            </Link>
          </Button>
        </div>
      </div>

      <StatCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <PRVolumeChart data={analytics.volumeTrend} />
        </div>
        
        <div className="lg:col-span-1">
          <AiAccuracyMetrics data={analytics.aiAccuracy} />
        </div>
        
        <div className="lg:col-span-1">
          <ReviewFeedbackMetrics data={analytics.userReviewFeedback} />
        </div>
        
        <div className="lg:col-span-1">
          <SecurityTrendsChart data={analytics.securityTrends} />
        </div>
        
        <div className="lg:col-span-1">
          <ReviewTimeChart data={analytics.reviewTimeBySeverity} />
        </div>
        
        <div className="lg:col-span-1">
          <FeatureTimeline data={analytics.featureTimeline} />
        </div>
        
        <div className="lg:col-span-1">
          <SourceChannelChart data={(analytics as any).sourceChannelBreakdown} />
        </div>
        
        <div className="lg:col-span-2">
          <ProductivityHeatmap data={analytics.productivityHeatmap} />
        </div>
      </div>
    </div>
  )
}
