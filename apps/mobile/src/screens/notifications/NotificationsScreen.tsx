import React from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Check, GitPullRequest, RotateCcw, Rocket } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PressableScale } from "../../components/PressableScale";
import { EmptyState } from "../../components/EmptyState";
import { colors } from "../../theme/tokens";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { trpc } from "../../lib/api";
import { useOrg } from "../../lib/org-context";

type Tone = "neutral" | "red" | "green";

function iconFor(type: string | null): { icon: typeof Bell; tone: Tone } {
  const t = (type ?? "").toLowerCase();
  if (t.includes("fix") || t.includes("changes_requested") || t.includes("rejected")) return { icon: RotateCcw, tone: "red" };
  if (t.includes("approv")) return { icon: Check, tone: "green" };
  if (t.includes("ship") || t.includes("merge") || t.includes("deploy")) return { icon: Rocket, tone: "green" };
  if (t.includes("pr") || t.includes("pull_request")) return { icon: GitPullRequest, tone: "neutral" };
  return { icon: Bell, tone: "neutral" };
}

function toneColor(tone: Tone) {
  return tone === "red" ? colors.red : tone === "green" ? colors.green : colors.ink;
}
function toneBg(tone: Tone) {
  return tone === "red" ? colors.redBg : tone === "green" ? colors.greenBg : colors.paperDim;
}
function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationsScreen() {
  const reduced = useReducedMotion();
  const { orgId } = useOrg();
  const utils = trpc.useUtils();

  const query = trpc.notification.list.useQuery({ orgId: orgId! }, { enabled: !!orgId });
  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate({ orgId: orgId! }),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 }}>
        <Text style={{ fontSize: 24, fontWeight: "700", color: colors.ink, letterSpacing: -0.4 }}>Notifications</Text>
      </View>

      {query.isPending ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.inkFaint} />
        </View>
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          onRefresh={() => query.refetch()}
          refreshing={query.isFetching}
          ListEmptyComponent={
            <EmptyState icon={Bell} title="You're all caught up" body="Reviews, approvals, and releases will show up here." />
          }
          renderItem={({ item, index }: { item: any; index: number }) => {
            const { icon: Icon, tone } = iconFor(item.type);
            return (
              <Animated.View entering={reduced ? undefined : FadeInDown.duration(280).delay(Math.min(index, 6) * 40)}>
                <PressableScale
                  onPress={() => !item.isRead && markAsRead.mutate({ orgId: orgId!, notificationId: item.id })}
                  scaleTo={0.99}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 12,
                      paddingVertical: 14,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: colors.lineSoft,
                      opacity: item.isRead ? 0.5 : 1,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: toneBg(tone),
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={15} color={toneColor(tone)} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, color: colors.ink, lineHeight: 19 }}>{item.message}</Text>
                      <Text style={{ fontSize: 12, color: colors.inkFaint, marginTop: 3 }}>{timeAgo(item.createdAt)}</Text>
                    </View>
                    {!item.isRead && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ink, marginTop: 6 }} />}
                  </View>
                </PressableScale>
              </Animated.View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
