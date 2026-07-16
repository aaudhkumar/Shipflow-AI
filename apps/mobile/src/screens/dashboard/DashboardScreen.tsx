import React from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GitPullRequest, Bug, Clock, CheckCircle, BarChart3, MessageSquare, ExternalLink } from "lucide-react-native";
import { trpc } from "../../lib/api";
import { useOrg } from "../../lib/org-context";
import { colors } from "../../theme/tokens";
import { PressableScale } from "../../components/PressableScale";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "Dashboard">;

export function DashboardScreen({ navigation }: Props) {
  const { orgId } = useOrg();
  const { data: stats, isLoading: statsLoading } = trpc.organization.getStats.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Command Center</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {statsLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : stats ? (
          <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.statsGrid}>
            <StatCard title="PRs Analyzed" value={stats.totalPRsAnalyzed} icon={GitPullRequest} />
            <StatCard title="Bugs Caught" value={stats.criticalBugsCaught} icon={Bug} />
            <StatCard title="Active Features" value={stats.activeFeatures} icon={Clock} />
            <StatCard title="Approval Rate" value={stats.approvalRate ? `${stats.approvalRate}%` : "N/A"} icon={CheckCircle} />
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.duration(400).delay(100).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.linksGrid}>
            <QuickLinkCard title="Pull Requests" icon={GitPullRequest} onPress={() => navigation.navigate("PRList")} />
            <QuickLinkCard title="AI Reviews" icon={MessageSquare} onPress={() => navigation.navigate("Reviews")} />
            <QuickLinkCard title="Analytics" icon={BarChart3} onPress={() => navigation.navigate("Analytics")} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Activity feed coming soon.</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        <Icon size={16} color={colors.inkSoft} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function QuickLinkCard({ title, icon: Icon, onPress }: { title: string, icon: any, onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} style={styles.quickLinkCard}>
      <View style={styles.quickLinkIconBox}>
        <Icon size={20} color={colors.ink} />
      </View>
      <Text style={styles.quickLinkTitle}>{title}</Text>
      <ExternalLink size={16} color={colors.inkFaint} style={{ marginLeft: "auto" }} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  content: {
    padding: 20,
    gap: 32,
  },
  loader: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.inkSoft,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.ink,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  emptyCard: {
    padding: 24,
    backgroundColor: colors.line + "20",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.inkSoft,
    fontWeight: "500",
  },
  linksGrid: {
    gap: 12,
  },
  quickLinkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 12,
  },
  quickLinkIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.line + "40",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  quickLinkTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
});
