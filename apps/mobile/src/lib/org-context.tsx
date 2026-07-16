import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { trpc } from "./api";
import { useSession } from "./auth-client";

const STORAGE_KEY = "shipflow.activeOrgId";

type OrgContextValue = {
  orgId: string | null;
  setOrgId: (id: string) => void;
  loading: boolean;
};

const OrgContext = createContext<OrgContextValue>({ orgId: null, setOrgId: () => {}, loading: true });

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [orgId, setOrgIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, isPending: sessionPending } = useSession();
  const utils = trpc.useUtils();

  const { data: orgs, isLoading: orgsLoading } = trpc.organization.list.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const createOrg = trpc.organization.create.useMutation({
    onSuccess: (data) => {
      setOrgId(data.id);
      utils.organization.list.invalidate();
    },
  });

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((v) => setOrgIdState(v))
      .finally(() => setLoading(false));
  }, []);

  // Auto-create or auto-select org logic
  useEffect(() => {
    if (sessionPending || orgsLoading || loading) return;

    if (!session?.user) {
      if (orgId) setOrgIdState(null); // Clear on logout
      return;
    }

    if (orgs && orgs.length > 0) {
      // If we have orgs, but no active orgId or active orgId is invalid, pick the first one
      if (!orgId || !orgs.find(o => o.id === orgId)) {
        setOrgId(orgs[0].id);
      }
    } else if (orgs && orgs.length === 0 && !createOrg.isPending && !createOrg.isSuccess) {
      // User has no orgs, create a "Personal" org
      createOrg.mutate({
        name: "Personal",
        slug: `personal-${Math.random().toString(36).substring(2, 8)}`,
      });
    }
  }, [session, orgs, orgId, loading, sessionPending, orgsLoading]);

  function setOrgId(id: string) {
    setOrgIdState(id);
    SecureStore.setItemAsync(STORAGE_KEY, id);
  }

  return <OrgContext.Provider value={{ orgId, setOrgId, loading }}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  return useContext(OrgContext);
}
