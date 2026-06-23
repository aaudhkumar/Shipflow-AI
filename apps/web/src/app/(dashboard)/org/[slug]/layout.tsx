import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return (
    <div className="flex min-h-screen w-full bg-background/95">
      <Sidebar orgSlug={slug} />
      <div className="flex flex-col w-full flex-1 md:pl-64">
        <Header orgSlug={slug} />
        <main className="flex-1 p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">
          {children}
        </main>
      </div>
    </div>
  )
}
