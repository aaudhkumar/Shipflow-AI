import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Inbox, Plus } from "lucide-react-native";
import { TaskCard, FeatureRequestSummary } from "../../components/TaskCard";
import { EmptyState } from "../../components/EmptyState";
import { PressableScale } from "../../components/PressableScale";
import { colors } from "../../theme/tokens";
import { trpc } from "../../lib/api";
import { useOrg } from "../../lib/org-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BoardStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<BoardStackParamList, "Board">;

export function BoardScreen({ navigation }: Props) {
  const { orgId } = useOrg();

  const featuresQuery = trpc.feature.list.useQuery({ orgId: orgId! }, { enabled: !!orgId });
  const projectsQuery = trpc.project.list.useQuery({ orgId: orgId! }, { enabled: !!orgId });

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projectsQuery.data ?? []) map.set(p.id, p.name);
    return map;
  }, [projectsQuery.data]);

  const items: FeatureRequestSummary[] = useMemo(
    () =>
      (featuresQuery.data ?? []).map((f: any) => ({
        id: f.id,
        title: f.title,
        status: f.status,
        projectName: projectNameById.get(f.projectId) ?? "—",
      })),
    [featuresQuery.data, projectNameById]
  );

  const loading = featuresQuery.isPending && !featuresQuery.data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 14,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ fontSize: 12, color: colors.inkFaint }} className="uppercase tracking-wide">
            {/* Org name isn't returned by feature.list — swap in organization.getBySlug if you want it here */}
            Board
          </Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.ink, marginTop: 2, letterSpacing: -0.4 }}>
            Requests
          </Text>
        </View>
        <PressableScale>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.ink,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={18} color={colors.paper} />
          </View>
        </PressableScale>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.inkFaint} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={featuresQuery.isFetching}
              onRefresh={() => {
                featuresQuery.refetch();
                projectsQuery.refetch();
              }}
              tintColor={colors.inkFaint}
            />
          }
          renderItem={({ item }) => (
            <TaskCard item={item} onPress={() => navigation.navigate("TaskDetail", { id: item.id })} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={Inbox}
              title="No requests yet"
              body="New feature requests will land here the moment they're submitted."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
