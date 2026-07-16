import React from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, GitPullRequest, Clock, CheckCircle, XCircle } from "lucide-react-native";
import { PressableScale } from "../../components/PressableScale";
import { colors } from "../../theme/tokens";
import { trpc } from "../../lib/api";
import { useOrg } from "../../lib/org-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = NativeStackScreenProps<HomeStackParamList, "PRList">;

export function PRListScreen({ navigation }: Props) {
  const { orgId } = useOrg();
  const { data: prs, isLoading } = trpc.pullRequest.list.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const getStatusIcon = (state: string | null) => {
    switch (state) {
      case "OPEN": return <Clock size={16} color={colors.inkSoft} />;
      case "MERGED": return <CheckCircle size={16} color={colors.ink} />;
      case "CLOSED": return <XCircle size={16} color={colors.red} />;
      default: return <Clock size={16} color={colors.inkSoft} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.ink} />
        </PressableScale>
        <Text style={styles.headerTitle}>Pull Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : prs?.length === 0 ? (
        <View style={styles.emptyState}>
          <GitPullRequest size={48} color={colors.inkFaint} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>No PRs yet</Text>
          <Text style={styles.emptyDesc}>Pull requests created will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={prs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 50).springify()}>
              <PressableScale onPress={() => navigation.navigate("PRDetail", { githubPrNumber: item.githubPrNumber })}>
                <View style={styles.prCard}>
                  <View style={styles.prHeader}>
                    <Text style={styles.prRepo}>{item.repoName}</Text>
                    <View style={styles.prStatusBadge}>
                      {getStatusIcon(item.state)}
                      <Text style={styles.prStatusText}>{item.state}</Text>
                    </View>
                  </View>
                  <Text style={styles.prTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.prSubtitle}>#{item.githubPrNumber} • {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              </PressableScale>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 17, fontWeight: "600", color: colors.ink },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 20, gap: 12 },
  prCard: {
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line,
    borderRadius: 16, padding: 16, gap: 8
  },
  prHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  prRepo: { fontSize: 13, color: colors.inkSoft, fontWeight: "500" },
  prStatusBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.line + "40", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  prStatusText: { fontSize: 11, fontWeight: "600", color: colors.ink },
  prTitle: { fontSize: 16, fontWeight: "600", color: colors.ink, lineHeight: 22 },
  prSubtitle: { fontSize: 13, color: colors.inkFaint },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: colors.ink, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: colors.inkSoft, textAlign: "center" },
});
