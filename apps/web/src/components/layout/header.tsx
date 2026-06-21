"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Search } from "lucide-react"

export function Header({ orgSlug }: { orgSlug: string }) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-sm hidden md:flex">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search PRs, issues, or repos..."
            className="h-9 w-full rounded-md border border-input/50 bg-muted/20 pl-9 pr-4 text-sm outline-none transition-colors focus:border-primary focus:bg-background placeholder:text-muted-foreground/70"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8 ring-1 ring-border/50">
          <AvatarImage src={`https://avatar.vercel.sh/${orgSlug}`} />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
