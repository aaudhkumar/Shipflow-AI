import React, { useMemo } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Check, GitPullRequest } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PressableScale } from "../../components/PressableScale";
import { StatusPill } from "../../components/StatusPill";
import { PipelineTimeline } from "../../components/PipelineTimeline";
import { colors } from "../../theme/tokens";
import { toneFor } from "../../utils/pipeline";
import { extractPrdBullets } from "../../lib/prd-content";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { trpc } from "../../lib/api";
import { useOrg } from "../../lib/org-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BoardStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<BoardStackParamList, "TaskDetail">;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 28 }}>
      <Text style={{ fontSize: 12, color: colors.inkFaint, marginBottom: 12 }} className="uppercase tracking-wide">
        {title}
      </Text>
      {children}
    </View>
  );
}

export function TaskDetailScreen({ route, navigation }: Props) {
  const reduced = useReducedMotion();
  const { orgId } = useOrg();
  const { id: featureId } = route.params;

  const featureQuery = trpc.feature.getById.useQuery({ featureId, orgId: orgId! }, { enabled: !!orgId });
  const prdQuery = trpc.prd.getByFeature.useQuery({ orgId: orgId!, featureId }, { enabled: !!orgId });
  const kanbanQuery = trpc.task.getKanban.useQuery({ orgId: orgId!, featureId }, { enabled: !!orgId });

  const feature = featureQuery.data as any;
  const tone = feature ? toneFor(feature.status) : "neutral";

  const prdBullets = useMemo(() => extractPrdBullets(prdQuery.data?.currentVersion?.content), [prdQuery.data]);

  const flatTasks = useMemo(() => {
    const k = kanbanQuery.data as { TODO?: any[]; IN_PROGRESS?: any[]; DONE?: any[] } | undefined;
    if (!k) return [];
    return [...(k.DONE ?? []).map((t) => ({ ...t, done: true })), ...(k.IN_PROGRESS ?? []).map((t) => ({ ...t, done: false })), ...(k.TODO ?? []).map((t) => ({ ...t, done: false }))];
  }, [kanbanQuery.data]);

  if (featureQuery.isPending || !feature) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.inkFaint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <PressableScale onPress={() => navigation.goBack()} style={{ padding: 6, marginLeft: -6 }}>
          <ArrowLeft size={20} color={colors.ink} />
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Animated.View entering={reduced ? undefined : FadeInDown.duration(360).springify().damping(18)}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.ink, letterSpacing: -0.3 }}>{feature.title}</Text>
          <View style={{ marginTop: 10 }}>
            <StatusPill status={feature.status} />
          </View>
        </Animated.View>

        <Section title="Progress">
          <PipelineTimeline status={feature.status} />
        </Section>

        <Section title="PRD">
          {prdQuery.isPending ? (
            <ActivityIndicator color={colors.inkFaint} style={{ alignSelf: "flex-start" }} />
          ) : prdBullets.length === 0 ? (
            <Text style={{ fontSize: 13.5, color: colors.inkFaint }}>No PRD generated for this request yet.</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {prdBullets.map((line, i) => (
                <View key={`${i}-${line.slice(0, 20)}`} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.inkFaint, marginTop: 7 }} />
                  <Text style={{ flex: 1, fontSize: 14, color: colors.inkSoft, lineHeight: 20 }}>{line}</Text>
                </View>
              ))}
            </View>
          )}
        </Section>

        <Section title="Tasks">
          {kanbanQuery.isPending ? (
            <ActivityIndicator color={colors.inkFaint} style={{ alignSelf: "flex-start" }} />
          ) : flatTasks.length === 0 ? (
            <Text style={{ fontSize: 13.5, color: colors.inkFaint }}>No tasks broken out yet.</Text>
          ) : (
            <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 14, overflow: "hidden" }}>
              {flatTasks.map((t: any, i: number) => (
                <View
                  key={t.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.lineSoft,
                  }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      borderWidth: 1.5,
                      borderColor: t.done ? colors.ink : colors.line,
                      backgroundColor: t.done ? colors.ink : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {t.done && <Check size={11} color={colors.paper} strokeWidth={3} />}
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      color: t.done ? colors.inkFaint : colors.ink,
                      textDecorationLine: t.done ? "line-through" : "none",
                      flex: 1,
                    }}
                    numberOfLines={2}
                  >
                    {t.title}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Section>

        <Section title="Review">
          <View
            style={{
              borderWidth: 1,
              borderRadius: 14,
              padding: 14,
              borderColor: colors.line,
              backgroundColor: colors.paperDim,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <GitPullRequest size={16} color={colors.inkFaint} strokeWidth={1.7} />
            <Text style={{ flex: 1, fontSize: 13, color: colors.inkFaint, lineHeight: 18 }}>
              PR review isn't wired here yet — pullRequest.getWithReviews needs a githubPrNumber, and no current
              endpoint joins a PR back to a featureId. Worth adding a `byFeatureId` lookup on the backend before this
              section can go live.
            </Text>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
