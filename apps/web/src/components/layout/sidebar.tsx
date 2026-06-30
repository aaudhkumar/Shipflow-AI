"use client"

import { trpc } from "~/trpc/client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Settings, 
  GitPullRequestDraft, 
  FolderGit2, 
  Users, 
  Blocks,
  History,
  Activity,
  FileText,
  Inbox
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrgSwitcher } from "./org-switcher"

interface SidebarProps {
  orgSlug: string
  usage?: { used: number, total: number }
}

export function Sidebar({ orgSlug, usage: _usage = { used: 0, total: 500 } }: SidebarProps) {
  const pathname = usePathname()

  const routes = [
    {
      label: "Command Center",
      icon: LayoutDashboard,
      href: `/org/${orgSlug}`,
      active: pathname === `/org/${orgSlug}`,
    },
    {
      label: "Projects",
      icon: FolderGit2,
      href: `/org/${orgSlug}/projects`,
      active: pathname.startsWith(`/org/${orgSlug}/projects`),
    },
    {
      label: "Analytics",
      icon: Activity,
      href: `/org/${orgSlug}/analytics`,
      active: pathname.startsWith(`/org/${orgSlug}/analytics`),
    },
    {
      label: "Feature Requests",
      icon: FileText,
      href: `/org/${orgSlug}/features`,
      active: pathname.startsWith(`/org/${orgSlug}/features`),
    },
    {
      label: "Issues Inbox",
      icon: Inbox,
      href: `/org/${orgSlug}/issues`,
      active: pathname.startsWith(`/org/${orgSlug}/issues`),
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
      label: "Review History",
      icon: History,
      href: `/org/${orgSlug}/reviews`,
      active: pathname.startsWith(`/org/${orgSlug}/reviews`),
    },
    {
      label: "Billing & Plans",
      icon: Activity,
      href: `/org/${orgSlug}/settings/billing`,
      active: pathname === `/org/${orgSlug}/settings/billing`,
    },
    {
      label: "Audit Logs",
      icon: History,
      href: `/org/${orgSlug}/settings/audit-logs`,
      active: pathname === `/org/${orgSlug}/settings/audit-logs`,
    },
    {
      label: "Settings",
      icon: Settings,
      href: `/org/${orgSlug}/settings`,
      active: pathname === `/org/${orgSlug}/settings`,
    },
  ]

  const { data: orgs, isLoading: isLoadingOrgs } = trpc.organization.list.useQuery()
  const currentOrg = orgs?.find((org) => org.slug === orgSlug)

  const { data: subscription, isLoading: isLoadingSub } = trpc.billing.getSubscription.useQuery(
    { orgId: currentOrg?.id as string },
    { enabled: !!currentOrg?.id }
  )

  console.log("DEBUG SIDEBAR:", { orgSlug, currentOrgId: currentOrg?.id, subscription, isLoadingOrgs, isLoadingSub })

  const normalizedPlan = subscription?.plan?.toUpperCase()
  const planName = isLoadingOrgs || isLoadingSub ? "Loading Plan..." 
                 : normalizedPlan === "PRO" ? "PRO Plan" 
                 : normalizedPlan === "ENTERPRISE" ? "Enterprise Plan" 
                 : "Free Plan"
                 
  const used = subscription?.usageCount || 0
  const total = subscription?.usageLimit || 10

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
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4 backdrop-blur-md mb-4">
          <h4 className="text-sm font-medium mb-1">{planName}</h4>
          <p className="text-xs text-muted-foreground mb-3">{used} / {total} AI PR & Feature sessions used this month.</p>
          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all" style={{ width: `${Math.min(100, Math.round((used / total) * 100))}%` }} />
          </div>
        </div>
        <OrgSwitcher currentSlug={orgSlug} />
      </div>
    </aside>
  )
}
