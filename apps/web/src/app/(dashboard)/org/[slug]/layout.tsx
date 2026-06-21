import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  return (
    <div className="flex min-h-screen w-full bg-background/95">
      <Sidebar orgSlug={params.slug} />
      <div className="flex flex-col w-full flex-1 md:pl-64">
        <Header orgSlug={params.slug} />
        <main className="flex-1 p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">
          {children}
        </main>
      </div>
    </div>
  )
}
