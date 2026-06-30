import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@shipflow/auth";

export default async function InvitationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession(await headers());
  
  if (!session || !session.user) {
    // If not logged in, they can't accept an invitation yet
    // They would need to login first. We could redirect them to login with a returnUrl,
    // but just /login is fine for a quick fix
    redirect("/login");
  }
  
  return <>{children}</>;
}
