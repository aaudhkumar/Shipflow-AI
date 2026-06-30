"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, ShieldAlert, UserX, Loader2, Mail } from "lucide-react"
import { trpc } from "~/trpc/client"
import { toast } from "sonner"

export function MemberList({ orgId }: { orgId: string }) {
  const utils = trpc.useUtils();
  const { data: members, isLoading: loadingMembers } = trpc.member.list.useQuery({ orgId });
  const { data: invitations, isLoading: loadingInvites } = trpc.member.listInvitations.useQuery({ orgId });

  const revokeMutation = trpc.member.revokeInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation revoked");
      utils.member.listInvitations.invalidate({ orgId });
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  if (loadingMembers || loadingInvites) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="w-[300px]">User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members?.map((member) => (
            <TableRow key={member.id} className="border-border/30 hover:bg-muted/10">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.user.image || `https://avatar.vercel.sh/${member.user.name}`} />
                    <AvatarFallback>{member.user.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm text-foreground/90">{member.user.name}</div>
                    <div className="text-xs text-muted-foreground">{member.user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={member.role === "OWNER" ? "default" : "secondary"} className="font-normal text-xs">
                  {member.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-normal text-xs text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                  Active
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem>
                      <ShieldAlert className="mr-2 h-4 w-4" /> Change Role
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      <UserX className="mr-2 h-4 w-4" /> Revoke Access
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}

          {invitations?.map((invite) => (
            <TableRow key={invite.id} className="border-border/30 hover:bg-muted/10">
              <TableCell>
                <div className="flex items-center gap-3 opacity-60">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback><Mail className="w-4 h-4 text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm text-foreground/90 italic">Pending Invite</div>
                    <div className="text-xs text-muted-foreground">{invite.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-normal text-xs opacity-60">
                  {invite.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-normal text-xs text-amber-500 border-amber-500/20 bg-amber-500/5">
                  Pending
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => revokeMutation.mutate({ id: invite.id, orgId })}
                    >
                      <UserX className="mr-2 h-4 w-4" /> Revoke Invite
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
