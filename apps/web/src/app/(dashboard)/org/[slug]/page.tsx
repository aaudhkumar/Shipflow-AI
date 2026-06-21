import { StatCards } from "@/components/dashboard/stat-cards"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { DeploymentsList } from "@/components/dashboard/deployments-list"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight } from "lucide-react"

export default function DashboardPage({ params }: { params: { slug: string } }) {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back to {params.slug}. Here's what your AI has been up to.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-border/60 bg-background/50 backdrop-blur-sm">
            Release Notes <ArrowRight className="w-4 h-4 ml-2 opacity-70" />
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all">
            <Sparkles className="w-4 h-4 mr-2" /> Trigger Analysis
          </Button>
        </div>
      </div>

      <StatCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-[250px] rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 shadow-sm">
            <h3 className="font-semibold mb-4 text-lg">Analysis Volume (Last 7 Days)</h3>
            <div className="h-full w-full flex items-center justify-center text-muted-foreground/50 text-sm">
              [Recharts AreaChart Placeholder]
            </div>
          </div>
          <DeploymentsList />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
