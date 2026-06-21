import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GitPullRequest, Bug, Clock, CheckCircle } from "lucide-react"

export function StatCards() {
  const stats = [
    {
      title: "PRs Analyzed",
      value: "142",
      description: "+12% from last month",
      icon: GitPullRequest,
      trend: "up"
    },
    {
      title: "Critical Bugs Caught",
      value: "28",
      description: "Prevented reaching staging",
      icon: Bug,
      trend: "neutral"
    },
    {
      title: "Dev Time Saved",
      value: "104h",
      description: "~45 min per PR",
      icon: Clock,
      trend: "up"
    },
    {
      title: "Approval Rate",
      value: "94%",
      description: "Code merged without human intervention",
      icon: CheckCircle,
      trend: "up"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card/40 backdrop-blur-md border-border/50 hover:border-border/80 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
