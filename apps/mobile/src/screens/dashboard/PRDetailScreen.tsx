import React from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, GitPullRequest, AlertTriangle, CheckCircle, Clock } from "lucide-react-native";
import { PressableScale } from "../../components/PressableScale";
import { colors } from "../../theme/tokens";
import { trpc } from "../../lib/api";
import { useOrg } from "../../lib/org-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = NativeStackScreenProps<HomeStackParamList, "PRDetail">;

export function PRDetailScreen({ route, navigation }: Props) {
  const { githubPrNumber } = route.params;
  const { orgId } = useOrg();
  
  const { data: pr, isLoading } = trpc.pullRequest.getWithReviews.useQuery(
    { orgId: orgId!, githubPrNumber },
    { enabled: !!orgId }
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.ink} />
        </PressableScale>
        <Text style={styles.headerTitle}>PR #{githubPrNumber}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : !pr ? (
        <View style={styles.loader}>
          <Text style={{ color: colors.inkSoft }}>Pull Request not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInDown.duration(400).springify()}>
            <View style={styles.prHeader}>
              <View style={styles.iconBox}>
                <GitPullRequest size={32} color={colors.ink} />
              </View>
              <Text style={styles.prTitle}>{pr.title}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{pr.state}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Review Status</Text>
              {pr.reviews?.length > 0 ? (
                pr.reviews.map((review: any, index: number) => {
                  const blockingCount = review.findings.filter((f: any) => f.isBlocking).length;
                  return (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        {blockingCount > 0 ? (
                          <AlertTriangle size={20} color={colors.red} />
                        ) : (
                          <CheckCircle size={20} color={colors.ink} />
                        )}
                        <Text style={styles.reviewTitle}>
                          {blockingCount > 0 ? `${blockingCount} Blocking Issues` : "LGTM"}
                        </Text>
                      </View>
                      <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleString()}</Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyCard}>
                  <Clock size={24} color={colors.inkFaint} style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyText}>No AI reviews yet.</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>
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
  content: { padding: 24, gap: 32 },
  prHeader: { alignItems: "center", gap: 12, marginBottom: 16 },
  iconBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.line + "40", alignItems: "center", justifyContent: "center" },
  prTitle: { fontSize: 22, fontWeight: "700", color: colors.ink, textAlign: "center" },
  badgeRow: { flexDirection: "row", gap: 8 },
  statusBadge: { backgroundColor: colors.line, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "600", color: colors.ink },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: colors.ink },
  reviewCard: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  reviewTitle: { fontSize: 16, fontWeight: "600", color: colors.ink },
  reviewDate: { fontSize: 13, color: colors.inkSoft },
  emptyCard: { padding: 24, backgroundColor: colors.line + "20", borderRadius: 12, borderWidth: 1, borderColor: colors.line, borderStyle: "dashed", alignItems: "center" },
  emptyText: { fontSize: 14, color: colors.inkSoft, fontWeight: "500" },
});
