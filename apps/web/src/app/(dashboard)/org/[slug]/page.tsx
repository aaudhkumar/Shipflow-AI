import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { DeploymentsList } from "@/components/dashboard/deployments-list"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"

import { api } from "~/trpc/server"

import { MyTasksKanban } from "@/components/dashboard/my-tasks-kanban"

export default async function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await api.organization.getBySlug.query({ slug });
  if (!org) return <div>Organization not found</div>;

  const recentActivity = await api.organization.getRecentActivity.query({ orgId: org.id });
  const deploymentsData = await api.deployment.list.query({ orgId: org.id });

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back to {slug}. Here's what your AI has been up to.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-border/60 bg-background/50 backdrop-blur-sm">
            Release Notes <ArrowRight className="w-4 h-4 ml-2 opacity-70" />
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all">
            <Link href={recentActivity && recentActivity.length > 0 ? `/org/${slug}/pr/${recentActivity[0]?.githubPrNumber}` : `/org/${slug}/features`} className="absolute inset-0 z-10" />
            <Sparkles className="w-4 h-4 mr-2" /> Trigger Analysis
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <MyTasksKanban orgId={org.id} slug={slug} />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <ActivityFeed activities={recentActivity} orgId={org.id} />
          <DeploymentsList deployments={deploymentsData} />
        </div>
      </div>
    </div>
  )
}
