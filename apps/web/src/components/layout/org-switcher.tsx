"use client"

import * as React from "react"
import { Check, Plus, Monitor, Sun, Moon, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"


import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { trpc } from "~/trpc/client"
import { useSession, signOut } from "@/lib/auth-client"

interface OrgSwitcherProps {
  currentSlug: string
}

export function OrgSwitcher({ currentSlug }: OrgSwitcherProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { data: orgs, isLoading } = trpc.organization.list.useQuery()
  const { theme, setTheme } = useTheme()

  const currentOrg = orgs?.find((org) => org.slug === currentSlug)

  if (isLoading) {
    return (
      <Button variant="ghost" className="w-full justify-between h-14 animate-pulse bg-muted/50">
        <span className="w-24 h-4 bg-muted-foreground/20 rounded"></span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-2 hover:bg-muted/50"
        >
          <div className="flex items-center gap-3 overflow-hidden text-left w-full">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {currentOrg?.name?.charAt(0)?.toUpperCase() || "S"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate flex-1">
              <span className="truncate font-semibold text-base leading-tight">
                {currentOrg?.name || "ShipFlow AI"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Organization
              </span>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 p-1 rounded-xl" sideOffset={12}>
        <DropdownMenuLabel className="font-normal px-3 py-2 text-sm text-muted-foreground truncate">
          {session?.user?.email || "user@example.com"}
        </DropdownMenuLabel>
        
        <div className="px-2 py-1.5 mb-1">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg">
            <Button
              variant={theme === "system" ? "secondary" : "ghost"}
              size="icon"
              className="w-full h-8 rounded-md"
              onClick={() => setTheme("system")}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={theme === "light" ? "secondary" : "ghost"}
              size="icon"
              className="w-full h-8 rounded-md"
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4" />
            </Button>
            <Button
              variant={theme === "dark" ? "secondary" : "ghost"}
              size="icon"
              className="w-full h-8 rounded-md"
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator className="mx-2" />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-3 p-2 mx-1 mt-1 rounded-lg">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {currentOrg?.name?.charAt(0)?.toUpperCase() || "S"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate flex-1 text-left">
              <span className="truncate font-medium text-sm leading-tight">
                {currentOrg?.name || "ShipFlow AI"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Organization
              </span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-56 p-1 rounded-xl" sideOffset={8}>
              {orgs?.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onSelect={() => {
                    if (org.slug !== currentSlug) {
                      router.push(`/org/${org.slug}`)
                    }
                  }}
                  className="flex items-center justify-between cursor-pointer p-2 rounded-lg"
                >
                  <div className="flex items-center gap-3 truncate">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                        {org.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium">{org.name}</span>
                  </div>
                  {currentSlug === org.slug && (
                    <Check className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => router.push("/onboarding")}
                className="cursor-pointer text-muted-foreground p-2 rounded-lg"
              >
                <Plus className="h-4 w-4 mr-3" />
                Create Organization
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator className="mx-2 my-1" />
        
        <DropdownMenuItem
          onSelect={async () => {
            await signOut()
            router.push("/")
          }}
          className="cursor-pointer p-2 mx-1 rounded-lg text-muted-foreground focus:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
