"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Loader2 } from "lucide-react"
import { trpc } from "~/trpc/client"
import { toast } from "sonner"

export function InviteMemberDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"OWNER" | "ADMIN" | "PM" | "DEVELOPER" | "REVIEWER">("DEVELOPER")
  const utils = trpc.useUtils()

  const inviteMutation = trpc.member.invite.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent!")
      setOpen(false)
      setEmail("")
      utils.member.listInvitations.invalidate({ orgId })
    },
    onError: (err) => {
      toast.error(err.message)
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <UserPlus className="w-4 h-4 mr-2" /> Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite to Organization</DialogTitle>
          <DialogDescription>
            Send an email invitation for a user to join this organization.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as any)}
              className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="PM">Product Manager</option>
              <option value="DEVELOPER">Developer</option>
              <option value="REVIEWER">Reviewer</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={() => inviteMutation.mutate({ orgId, email, role })}
            disabled={!email || inviteMutation.isPending}
          >
            {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
