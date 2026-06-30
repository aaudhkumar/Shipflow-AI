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
      <div className="print:hidden">
        <Sidebar orgSlug={slug} />
      </div>
      <div className="flex flex-col w-full flex-1 md:pl-64 print:pl-0">
        <div className="print:hidden">
          <Header orgSlug={slug} />
        </div>
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
