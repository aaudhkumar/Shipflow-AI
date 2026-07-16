import React from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, MessageSquare, AlertTriangle, CheckCircle } from "lucide-react-native";
import { PressableScale } from "../../components/PressableScale";
import { colors } from "../../theme/tokens";
import { trpc } from "../../lib/api";
import { useOrg } from "../../lib/org-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = NativeStackScreenProps<HomeStackParamList, "Reviews">;

export function ReviewsScreen({ navigation }: Props) {
  const { orgId } = useOrg();
  const { data: reviews, isLoading } = trpc.pullRequest.listReviews.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.ink} />
        </PressableScale>
        <Text style={styles.headerTitle}>AI Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : reviews?.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageSquare size={48} color={colors.inkFaint} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptyDesc}>AI reviews for pull requests will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 50).springify()}>
              <PressableScale onPress={() => navigation.navigate("PRDetail", { githubPrNumber: item.pullRequest.githubPrNumber })}>
                <View style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewRepo}>{item.repository.fullName}</Text>
                    <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.reviewTitle} numberOfLines={2}>{item.pullRequest.title}</Text>
                  
                  <View style={styles.findingsRow}>
                    {item.findingCounts.blocking > 0 ? (
                      <View style={[styles.badge, { backgroundColor: colors.red + "20" }]}>
                        <AlertTriangle size={12} color={colors.red} />
                        <Text style={[styles.badgeText, { color: colors.red }]}>{item.findingCounts.blocking} Blocking</Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: colors.ink + "10" }]}>
                        <CheckCircle size={12} color={colors.ink} />
                        <Text style={[styles.badgeText, { color: colors.ink }]}>LGTM</Text>
                      </View>
                    )}
                    <View style={[styles.badge, { backgroundColor: colors.line }]}>
                      <Text style={styles.badgeText}>{item.findingCounts.total} Total Findings</Text>
                    </View>
                  </View>
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
  reviewCard: {
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line,
    borderRadius: 16, padding: 16, gap: 10
  },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewRepo: { fontSize: 13, color: colors.inkSoft, fontWeight: "500" },
  reviewDate: { fontSize: 13, color: colors.inkFaint },
  reviewTitle: { fontSize: 16, fontWeight: "600", color: colors.ink, lineHeight: 22 },
  findingsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "600", color: colors.inkSoft },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: colors.ink, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: colors.inkSoft, textAlign: "center" },
});
