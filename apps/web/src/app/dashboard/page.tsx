import { redirect } from "next/navigation";
import { api } from "~/trpc/server";

export const dynamic = "force-dynamic";

export default async function DashboardRedirect() {
  let orgs;
  try {
    // Attempt to fetch the user's organizations
    orgs = await api.organization.list.query();
  } catch (error) {
    // If they are not logged in or an error occurs, redirect to login
    console.error("Error fetching organizations:", error);
    redirect("/login");
  }

  if (orgs && orgs.length > 0 && orgs[0]) {
    // User has an organization, redirect to the first one
    redirect(`/org/${orgs[0].slug}`);
  } else {
    // User has no organizations, redirect to onboarding
    redirect("/onboarding");
  }
}
