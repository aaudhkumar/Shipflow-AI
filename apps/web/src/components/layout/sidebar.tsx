"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Settings, 
  GitPullRequestDraft, 
  Users, 
  Blocks,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  orgSlug: string
}

export function Sidebar({ orgSlug }: SidebarProps) {
  const pathname = usePathname()

  const routes = [
    {
      label: "Command Center",
      icon: LayoutDashboard,
      href: `/org/${orgSlug}`,
      active: pathname === `/org/${orgSlug}`,
    },
    {
      label: "PR Insights",
      icon: GitPullRequestDraft,
      href: `/org/${orgSlug}/pr`,
      active: pathname.startsWith(`/org/${orgSlug}/pr`),
    },
    {
      label: "Integrations",
      icon: Blocks,
      href: `/org/${orgSlug}/settings/integrations`,
      active: pathname === `/org/${orgSlug}/settings/integrations`,
    },
    {
      label: "Team Members",
      icon: Users,
      href: `/org/${orgSlug}/settings/members`,
      active: pathname === `/org/${orgSlug}/settings/members`,
    },
    {
      label: "Settings",
      icon: Settings,
      href: `/org/${orgSlug}/settings`,
      active: pathname === `/org/${orgSlug}/settings`,
    },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 border-r border-border/40 bg-card/60 backdrop-blur-xl z-30">
      <div className="h-14 flex items-center px-6 border-b border-border/40">
        <div className="flex items-center gap-2 font-semibold tracking-tight text-lg">
          <Activity className="w-5 h-5 text-primary" />
          <span>ShipFlow AI</span>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-3 flex flex-col gap-1">
        {routes.map((route) => (
          <Button
            key={route.href}
            variant={route.active ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start h-10 px-3 text-sm font-medium transition-colors",
              route.active 
                ? "bg-secondary/80 text-secondary-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            asChild
          >
            <Link href={route.href}>
              <route.icon className={cn("w-4 h-4 mr-3", route.active ? "text-primary" : "text-muted-foreground")} />
              {route.label}
            </Link>
          </Button>
        ))}
      </div>
      
      <div className="p-4 border-t border-border/40">
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4 backdrop-blur-md">
          <h4 className="text-sm font-medium mb-1">PRO Plan</h4>
          <p className="text-xs text-muted-foreground mb-3">142 / 500 AI PR Analyses used this month.</p>
          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-[28%]" />
          </div>
        </div>
      </div>
    </aside>
  )
}
