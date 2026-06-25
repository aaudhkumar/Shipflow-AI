import { redirect } from "next/navigation";
import { api } from "~/trpc/server";
import { headers } from "next/headers";

export default async function DashboardRedirect() {
  try {
    // Attempt to fetch the user's organizations
    const orgs = await api.organization.list.query();
    
    if (orgs && orgs.length > 0 && orgs[0]) {
      // User has an organization, redirect to the first one
      redirect(`/org/${orgs[0].slug}`);
    } else {
      // User has no organizations, redirect to onboarding
      redirect("/onboarding");
    }
  } catch (error) {
    // If they are not logged in or an error occurs, redirect to login
    redirect("/login");
  }
}
