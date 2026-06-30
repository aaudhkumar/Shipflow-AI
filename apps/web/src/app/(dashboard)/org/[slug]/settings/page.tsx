import { api } from "~/trpc/server"
import { SettingsClient } from "@/components/settings/settings-client"
import { notFound } from "next/navigation"

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const org = await api.organization.getBySlug.query({ slug })
  
  if (!org) {
    notFound()
  }
  
  return <SettingsClient orgId={org.id} />
}
