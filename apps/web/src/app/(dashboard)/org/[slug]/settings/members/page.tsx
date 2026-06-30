import { MemberList } from "@/components/settings/member-list"
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog"

import { api } from "~/trpc/server"

export default async function MembersSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await api.organization.getBySlug.query({ slug });
  if (!org) return <div>Organization not found</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Members</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage who has access to {slug} and their permission levels.
          </p>
        </div>
        <InviteMemberDialog orgId={org.id} />
      </div>

      <MemberList orgId={org.id} />
    </div>
  )
}
