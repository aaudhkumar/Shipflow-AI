"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Search, Moon, Sun } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { trpc } from "~/trpc/client"

export function Header({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: org } = trpc.organization.getBySlug.useQuery({ slug: orgSlug });
  const { data: notifications, refetch } = trpc.notification.list.useQuery({ orgId: org?.id! }, {
    enabled: !!org?.id,
    refetchInterval: 30000,
  });

  const { data: unreadCount = 0, refetch: refetchUnreadCount } = trpc.notification.getUnreadCount.useQuery(
    { orgId: org?.id! },
    { enabled: !!org?.id, refetchInterval: 10000 }
  );

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => { refetch(); refetchUnreadCount(); },
  });

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => { refetch(); refetchUnreadCount(); },
  });

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
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive border-2 border-background" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => markAllAsRead.mutate({ orgId: org?.id! })} className="h-auto text-xs px-2 py-1 text-muted-foreground">
                  Mark all read
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {!notifications?.length ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notification: any) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.isRead ? 'bg-muted/50' : ''}`}
                    onClick={() => {
                      if (!notification.isRead) markAsRead.mutate({ orgId: org?.id!, notificationId: notification.id });
                      if (notification.actionUrl) {
                        router.push(notification.actionUrl);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-sm leading-none">{notification.title}</span>
                      {!notification.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2">{notification.message}</span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <Avatar className="h-8 w-8 ring-1 ring-border/50">
          <AvatarImage src={`https://avatar.vercel.sh/${orgSlug}`} />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
