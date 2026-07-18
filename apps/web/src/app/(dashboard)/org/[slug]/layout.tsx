import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { getSession } from "@shipflow/auth"
import { headers } from "next/headers"
import { db } from "@shipflow/db"
import { organizations, members } from "@shipflow/db/schema"
import { eq, and } from "@shipflow/db"

import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const session = await getSession(await headers());

  if (!session?.user) {
    redirect("/login");
  }

  // Check membership
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  let isMember = false;
  if (org) {
    const member = await db.query.members.findFirst({
      where: and(
        eq(members.orgId, org.id),
        eq(members.userId, session.user.id)
      )
    });
    if (member) isMember = true;
  }

  if (!isMember) {
    // Redirect to personal organization
    const personalSlug = `personal-${session.user.id.substring(0, 8)}`;
    
    if (slug === personalSlug) {
       // if we are already trying to access the personal slug and we are not a member,
       // we should just go to onboarding to avoid an infinite loop
       redirect("/onboarding");
    }
    
    // Check if the personal org actually exists and user is a member
    const personalOrg = await db.query.organizations.findFirst({
      where: eq(organizations.slug, personalSlug)
    });
    
    let isPersonalMember = false;
    if (personalOrg) {
      const pMember = await db.query.members.findFirst({
         where: and(eq(members.orgId, personalOrg.id), eq(members.userId, session.user.id))
      });
      if (pMember) isPersonalMember = true;
    }
    
    if (isPersonalMember) {
      redirect(`/org/${personalSlug}`);
    } else {
      // Fallback: get any organization they are a member of
      const anyMember = await db.query.members.findFirst({
        where: eq(members.userId, session.user.id)
      });
      if (anyMember) {
        const anyOrg = await db.query.organizations.findFirst({
          where: eq(organizations.id, anyMember.orgId)
        });
        if (anyOrg && anyOrg.slug !== slug) redirect(`/org/${anyOrg.slug}`);
      }
      
      // If no orgs at all, go to onboarding
      redirect("/onboarding");
    }
  }

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
