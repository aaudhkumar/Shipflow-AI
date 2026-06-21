import { MemberList } from "@/components/settings/member-list"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

export default function MembersSettingsPage({ params }: { params: { slug: string } }) {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Members</h2>
          <p className="text-muted-foreground mt-1">
            Manage who has access to {params.slug} and their permission levels.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <UserPlus className="w-4 h-4 mr-2" /> Invite Member
        </Button>
      </div>

      <MemberList />
    </div>
  )
}
