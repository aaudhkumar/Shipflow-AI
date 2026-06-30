import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@shipflow/auth";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession(await headers());
  
  if (!session || !session.user) {
    redirect("/login");
  }
  
  return <>{children}</>;
}
