import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  GitPullRequest,
  Clock,
  Sparkles,
  ThumbsUp,
  Flame,
  BarChart3,
  Rocket,
  CheckCircle2,
  XCircle,
  Calculator,
  TrendingUp,
  Shield,
  ChartPie,
  AlertCircle,
} from "lucide-react-native";
import { DonutChart } from "../../components/DonutChart";
import { BarChart } from "../../components/BarChart";
import { PressableScale } from "../../components/PressableScale";
import { colors, radii, durations } from "../../theme/tokens";
import { trpc } from "../../lib/api";
import { useOrg } from "../../lib/org-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useReducedMotion } from "../../hooks/useReducedMotion";

type Props = NativeStackScreenProps<HomeStackParamList, "Analytics">;

// Helper date local parser to avoid timezone shifts
const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

// Helper date formatter
const formatDate = (dateInput: string | Date) => {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

interface SeverityRowProps {
  severity: string;
  avgHours: number;
  maxHours: number;
  reduced: boolean;
  index: number;
}

function SeverityRow({ severity, avgHours, maxHours, reduced, index }: SeverityRowProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const animatedWidth = useSharedValue(0);

  const percentage = maxHours > 0 ? avgHours / maxHours : 0;

  useEffect(() => {
    if (trackWidth > 0) {
      if (reduced) {
        animatedWidth.value = percentage * trackWidth;
      } else {
        animatedWidth.value = withDelay(
          index * 50,
          withSpring(percentage * trackWidth, { damping: 20, stiffness: 160 })
        );
      }
    }
  }, [trackWidth, percentage, reduced, index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: animatedWidth.value,
    };
  });

  const getSeverityColor = (sev: string) => {
    switch (sev.toUpperCase()) {
      case "BLOCKER":
        return colors.red;
      case "MAJOR":
        return colors.ink;
      case "MINOR":
        return colors.inkSoft;
      case "SUGGESTION":
        return "#a1a1aa"; // zinc-400 / inkFaint
      default:
        return colors.inkSoft;
    }
  };

  const getSeverityLabel = (sev: string) => {
    return sev.charAt(0).toUpperCase() + sev.slice(1).toLowerCase();
  };

  return (
    <View style={styles.severityRow}>
      <View style={styles.severityInfo}>
        <Text style={styles.severityLabel}>{getSeverityLabel(severity)}</Text>
        <Text style={styles.severityValue}>{avgHours} hrs</Text>
      </View>
      <View
        style={styles.progressBarTrack}
        onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            styles.progressBarFill,
            { backgroundColor: getSeverityColor(severity) },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

export function AnalyticsScreen({ navigation }: Props) {
  const { orgId } = useOrg();
  const [days, setDays] = useState<7 | 30>(7);
  const [selectedCell, setSelectedCell] = useState<{ date: string; count: number } | null>(null);
  const reduced = useReducedMotion();

  const { data: analytics, isLoading, error, refetch } = trpc.organization.getAnalytics.useQuery(
    { orgId: orgId!, days },
    { enabled: !!orgId }
  );

  // Custom Entering Animation with stagger, scaling, and reduced motion fallback
  const getEnteringAnimation = (index: number) => {
    const delay = index * 50;
    if (reduced) {
      return () => {
        "worklet";
        return {
          initialValues: {
            opacity: 0,
          },
          animations: {
            opacity: withDelay(delay, withTiming(1, { duration: durations.ui })),
          },
        };
      };
    }
    return () => {
      "worklet";
      return {
        initialValues: {
          opacity: 0,
          transform: [{ translateY: 20 }, { scale: 0.95 }],
        },
        animations: {
          opacity: withDelay(delay, withSpring(1, { damping: 20, stiffness: 160 })),
          transform: [
            { translateY: withDelay(delay, withSpring(0, { damping: 20, stiffness: 160 })) },
            { scale: withDelay(delay, withSpring(1, { damping: 20, stiffness: 160 })) },
          ],
        },
      };
    };
  };

  // Math derivations
  const totalPrsAnalyzed = analytics?.volumeTrend?.reduce((acc, curr) => acc + curr.analyses, 0) ?? 0;

  const avgLeadTime =
    analytics?.featureTimeline && analytics.featureTimeline.length > 0
      ? Math.round(
          analytics.featureTimeline.reduce((acc, curr) => acc + curr.durationDays, 0) /
            analytics.featureTimeline.length
        )
      : 0;

  const aiAccuracyRate = analytics?.aiAccuracy?.accuracyRate
    ? Math.round(analytics.aiAccuracy.accuracyRate)
    : 0;

  const approvalRate = analytics?.userReviewFeedback?.approvalRate
    ? Math.round(analytics.userReviewFeedback.approvalRate)
    : 0;

  const maxSeverityHours =
    analytics?.reviewTimeBySeverity && analytics.reviewTimeBySeverity.length > 0
      ? Math.max(...analytics.reviewTimeBySeverity.map((d) => d.avgHours), 1)
      : 1;

  // Productivity Heatmap Pre-Padding
  const firstItem = analytics?.productivityHeatmap?.[0];
  const startDayOfWeek = firstItem ? parseLocalDate(firstItem.date).getDay() : 0;

  const paddedHeatmap = [
    ...Array.from({ length: startDayOfWeek }).map((_, i) => ({
      isPlaceholder: true,
      date: `placeholder-${i}`,
      count: 0,
    })),
    ...(analytics?.productivityHeatmap ?? []).map((item) => ({
      ...item,
      isPlaceholder: false,
    })),
  ];

  const maxHeatmapCount = analytics?.productivityHeatmap?.length
    ? Math.max(...analytics.productivityHeatmap.map((d) => d.count), 1)
    : 1;

  const getHeatmapCellColorAndOpacity = (count: number) => {
    if (count === 0) {
      return {
        backgroundColor: colors.lineSoft,
        opacity: 1,
      };
    }
    const opacity = 0.15 + (count / maxHeatmapCount) * 0.85;
    return {
      backgroundColor: colors.ink,
      opacity,
    };
  };

  const getTimelineNodeColor = (durationDays: number) => {
    if (durationDays <= 3) return colors.green;
    if (durationDays <= 7) return "#eab308";
    return colors.red;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.ink} />
        </PressableScale>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.ink} size="large" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.red} />
          <Text style={styles.errorText}>Failed to load analytics data.</Text>
          <PressableScale onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </PressableScale>
        </View>
      ) : !analytics ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.inkSoft} />
          <Text style={styles.errorText}>Analytics data is not available.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Segmented days selector */}
          <Animated.View entering={getEnteringAnimation(0)} style={styles.filterContainer}>
            <View style={styles.segmentedControl}>
              <PressableScale
                onPress={() => {
                  setDays(7);
                  setSelectedCell(null);
                }}
                style={[styles.segmentButton, days === 7 && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentText, days === 7 && styles.segmentTextActive]}>
                  7 Days
                </Text>
              </PressableScale>
              <PressableScale
                onPress={() => {
                  setDays(30);
                  setSelectedCell(null);
                }}
                style={[styles.segmentButton, days === 30 && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentText, days === 30 && styles.segmentTextActive]}>
                  30 Days
                </Text>
              </PressableScale>
            </View>
          </Animated.View>

          {/* Summary Grid */}
          <View style={styles.summaryGrid}>
            <Animated.View entering={getEnteringAnimation(1)} style={styles.summaryCard}>
              <GitPullRequest size={20} color={colors.inkSoft} style={{ marginBottom: 8 }} />
              <Text style={styles.summaryTitle}>PRs Analyzed</Text>
              <Text style={styles.summaryValue}>{totalPrsAnalyzed}</Text>
            </Animated.View>
            <Animated.View entering={getEnteringAnimation(2)} style={styles.summaryCard}>
              <Clock size={20} color={colors.inkSoft} style={{ marginBottom: 8 }} />
              <Text style={styles.summaryTitle}>Avg Lead Time</Text>
              <Text style={styles.summaryValue}>{avgLeadTime ? `${avgLeadTime}d` : "—"}</Text>
            </Animated.View>
            <Animated.View entering={getEnteringAnimation(3)} style={styles.summaryCard}>
              <Sparkles size={20} color={colors.inkSoft} style={{ marginBottom: 8 }} />
              <Text style={styles.summaryTitle}>AI Accuracy</Text>
              <Text style={styles.summaryValue}>{aiAccuracyRate ? `${aiAccuracyRate}%` : "—"}</Text>
            </Animated.View>
            <Animated.View entering={getEnteringAnimation(4)} style={styles.summaryCard}>
              <ThumbsUp size={20} color={colors.inkSoft} style={{ marginBottom: 8 }} />
              <Text style={styles.summaryTitle}>Approval Rate</Text>
              <Text style={styles.summaryValue}>{approvalRate ? `${approvalRate}%` : "—"}</Text>
            </Animated.View>
          </View>

          {/* PR Analysis Volume Trend Bar Chart */}
          <Animated.View entering={getEnteringAnimation(5)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTitleBox}>
                <TrendingUp size={18} color={colors.ink} style={{ marginRight: 6 }} />
                <Text style={styles.cardTitle}>Analysis Volume Trend</Text>
              </View>
              <Text style={styles.cardSubtitle}>Number of PRs analyzed per day</Text>
            </View>

            {!analytics.volumeTrend || analytics.volumeTrend.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No volume data available</Text>
              </View>
            ) : (
              <BarChart 
                data={analytics.volumeTrend.map(d => ({
                  label: d.date,
                  stacks: [{ value: d.analyses, color: colors.ink }]
                }))}
                delayStart={5 * 50}
                height={140}
              />
            )}
          </Animated.View>

          {/* Security Finding Trends Bar Chart */}
          <Animated.View entering={getEnteringAnimation(6)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTitleBox}>
                <Shield size={18} color={colors.ink} style={{ marginRight: 6 }} />
                <Text style={styles.cardTitle}>Security Finding Trends</Text>
              </View>
              <Text style={styles.cardSubtitle}>Blocking vs non-blocking security issues</Text>
            </View>

            {!analytics.securityTrends || analytics.securityTrends.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No security data available</Text>
              </View>
            ) : (
              <>
                <BarChart 
                  data={analytics.securityTrends.map(d => ({
                    label: d.date,
                    stacks: [
                      { value: d.blocking, color: colors.red },
                      { value: d.nonBlocking, color: colors.inkSoft }
                    ]
                  }))}
                  delayStart={6 * 50}
                  height={140}
                />
                <View style={{ flexDirection: "row", gap: 16, marginTop: 16, justifyContent: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.red }} />
                    <Text style={styles.legendName}>Blocking</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.inkSoft }} />
                    <Text style={styles.legendName}>Non-Blocking</Text>
                  </View>
                </View>
              </>
            )}
          </Animated.View>

          {/* Source Channel Intake Pie Chart */}
          <Animated.View entering={getEnteringAnimation(7)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTitleBox}>
                <ChartPie size={18} color={colors.ink} style={{ marginRight: 6 }} />
                <Text style={styles.cardTitle}>Source Channel Intake</Text>
              </View>
              <Text style={styles.cardSubtitle}>Where your feature requests are coming from</Text>
            </View>

            {!analytics.sourceChannelBreakdown || analytics.sourceChannelBreakdown.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No requests data available</Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 24, marginTop: 12 }}>
                <DonutChart 
                  data={analytics.sourceChannelBreakdown.map(d => ({ name: d.name, value: d.value, color: d.fill }))}
                  size={140}
                  strokeWidth={24}
                  delayStart={6 * 50}
                  centerText={String(analytics.sourceChannelBreakdown.reduce((sum, item) => sum + item.value, 0))}
                  centerSubtext="TOTAL"
                />
                
                <View style={{ flex: 1, gap: 12 }}>
                  {analytics.sourceChannelBreakdown.map((item, i) => (
                    <PressableScale key={item.name} scaleTo={0.97} style={styles.legendRow}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={[styles.legendDot, { backgroundColor: item.fill }]} />
                        <Text style={styles.legendName}>{item.name}</Text>
                      </View>
                      <Text style={styles.legendValue}>{item.value}</Text>
                    </PressableScale>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>

          {/* PR Quality Generated Pie Chart */}
          <Animated.View entering={getEnteringAnimation(8)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTitleBox}>
                <GitPullRequest size={18} color={colors.ink} style={{ marginRight: 6 }} />
                <Text style={styles.cardTitle}>Quality of PR Generated</Text>
              </View>
              <Text style={styles.cardSubtitle}>Ratio of high-quality vs low-quality pull requests</Text>
            </View>

            {!analytics.userReviewFeedback || (analytics.userReviewFeedback.correct === 0 && analytics.userReviewFeedback.incorrect === 0) ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No quality data available</Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 24, marginTop: 12 }}>
                <DonutChart 
                  data={[
                    { name: "Recommended", value: analytics.userReviewFeedback.correct, color: colors.green },
                    { name: "Non Recommended", value: analytics.userReviewFeedback.incorrect, color: colors.red }
                  ].filter(d => d.value > 0)}
                  size={140}
                  strokeWidth={24}
                  delayStart={7 * 50}
                  centerText={`${Math.round(analytics.userReviewFeedback.approvalRate)}%`}
                  centerSubtext="QUALITY"
                />
                
                <View style={{ flex: 1, gap: 8 }}>
                  <PressableScale scaleTo={0.97} style={[styles.metricRow, { backgroundColor: `${colors.green}10`, borderColor: `${colors.green}20` }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={16} color={colors.green} />
                      <Text style={[styles.metricLabel, { color: colors.green }]}>Recommended</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: colors.green }]}>{analytics.userReviewFeedback.correct}</Text>
                  </PressableScale>

                  <PressableScale scaleTo={0.97} style={[styles.metricRow, { backgroundColor: `${colors.red}10`, borderColor: `${colors.red}20` }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <XCircle size={16} color={colors.red} />
                      <Text style={[styles.metricLabel, { color: colors.red }]}>Non Recommended</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: colors.red }]}>{analytics.userReviewFeedback.incorrect}</Text>
                  </PressableScale>

                  <PressableScale scaleTo={0.97} style={[styles.metricRow, { backgroundColor: `${colors.ink}08`, borderColor: `${colors.ink}15` }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Calculator size={16} color={colors.ink} />
                      <Text style={[styles.metricLabel, { color: colors.ink }]}>Total</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: colors.ink }]}>{analytics.userReviewFeedback.total}</Text>
                  </PressableScale>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Severity Review Time Bar Chart */}
          <Animated.View entering={getEnteringAnimation(9)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTitleBox}>
                <BarChart3 size={18} color={colors.ink} style={{ marginRight: 6 }} />
                <Text style={styles.cardTitle}>Review Time by Severity</Text>
              </View>
              <Text style={styles.cardSubtitle}>Average time to address findings (hours)</Text>
            </View>

            {!analytics.reviewTimeBySeverity || analytics.reviewTimeBySeverity.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Not enough review findings data yet</Text>
              </View>
            ) : (
              <View style={{ gap: 4 }}>
                {analytics.reviewTimeBySeverity.map((item, index) => (
                  <SeverityRow
                    key={item.severity}
                    severity={item.severity}
                    avgHours={item.avgHours}
                    maxHours={maxSeverityHours}
                    reduced={reduced}
                    index={index}
                  />
                ))}
              </View>
            )}
          </Animated.View>

          {/* Feature-to-Ship Timeline */}
          <Animated.View entering={getEnteringAnimation(10)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTitleBox}>
                <Rocket size={18} color={colors.ink} style={{ marginRight: 6 }} />
                <Text style={styles.cardTitle}>Feature-to-Ship Timeline</Text>
              </View>
              <Text style={styles.cardSubtitle}>Recently shipped items and lead times</Text>
            </View>

            {!analytics.featureTimeline || analytics.featureTimeline.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No features shipped in this period</Text>
              </View>
            ) : (
              <View style={styles.timelineList}>
                {analytics.featureTimeline.map((item, index) => {
                  const isLast = index === analytics.featureTimeline.length - 1;
                  return (
                    <View key={item.id} style={styles.timelineItem}>
                      <View style={styles.timelineIndicators}>
                        {!isLast && <View style={styles.timelineLine} />}
                        <View
                          style={[
                            styles.timelineNode,
                            { backgroundColor: getTimelineNodeColor(item.durationDays) },
                          ]}
                        />
                      </View>

                      <View style={styles.timelineContent}>
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={styles.timelineItemTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={styles.timelineItemSubtitle}>
                            Shipped on {formatDate(item.shippedAt)}
                          </Text>
                        </View>
                        <View style={styles.durationBadge}>
                          <Text style={styles.durationBadgeText}>
                            {item.durationDays === 1
                              ? "1 day"
                              : `${item.durationDays} days`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* Productivity Heatmap */}
          <Animated.View entering={getEnteringAnimation(11)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTitleBox}>
                <Flame size={18} color={colors.ink} style={{ marginRight: 6 }} />
                <Text style={styles.cardTitle}>Productivity Heatmap</Text>
              </View>
              <Text style={styles.cardSubtitle}>Daily throughput (PRs & Reviews)</Text>
            </View>

            {!analytics.productivityHeatmap || analytics.productivityHeatmap.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No activity data available</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View style={styles.heatmapGrid}>
                  {paddedHeatmap.map((item, idx) => {
                    if (item.isPlaceholder) {
                      return (
                        <View key={item.date} style={styles.heatmapCellPlaceholder} />
                      );
                    }
                    const isSelected = selectedCell?.date === item.date;
                    const cellStyle = getHeatmapCellColorAndOpacity(item.count);
                    return (
                      <PressableScale
                        key={item.date}
                        onPress={() => setSelectedCell({ date: item.date, count: item.count })}
                        scaleTo={0.9}
                        style={[
                          styles.heatmapCell,
                          cellStyle,
                          isSelected && styles.heatmapCellSelected,
                        ]}
                      />
                    );
                  })}
                </View>

                {/* Detail View */}
                {selectedCell ? (
                  <View style={styles.heatmapDetail}>
                    <Text style={styles.heatmapDetailText}>
                      {selectedCell.count} {selectedCell.count === 1 ? "activity" : "activities"} on{" "}
                      {formatDate(parseLocalDate(selectedCell.date))}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.heatmapDetail}>
                    <Text style={[styles.heatmapDetailText, { color: colors.inkSoft }]}>
                      Tap a cell to view daily activity details.
                    </Text>
                  </View>
                )}

                {/* Heatmap Legend */}
                <View style={styles.legendContainer}>
                  <Text style={styles.legendLabel}>Less</Text>
                  <View style={styles.legendBoxRow}>
                    <View style={[styles.legendBox, { backgroundColor: colors.lineSoft }]} />
                    <View
                      style={[
                        styles.legendBox,
                        { backgroundColor: colors.ink, opacity: 0.15 + 0.25 * 0.85 },
                      ]}
                    />
                    <View
                      style={[
                        styles.legendBox,
                        { backgroundColor: colors.ink, opacity: 0.15 + 0.5 * 0.85 },
                      ]}
                    />
                    <View
                      style={[
                        styles.legendBox,
                        { backgroundColor: colors.ink, opacity: 0.15 + 0.75 * 0.85 },
                      ]}
                    />
                    <View style={[styles.legendBox, { backgroundColor: colors.ink, opacity: 1.0 }]} />
                  </View>
                  <Text style={styles.legendLabel}>More</Text>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.ink,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    color: colors.red,
    fontWeight: "500",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: colors.paper,
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    padding: 20,
    gap: 24,
  },
  filterContainer: {
    width: "100%",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: colors.lineSoft,
    borderRadius: radii.md,
    padding: 4,
    width: "100%",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.sm,
  },
  segmentButtonActive: {
    backgroundColor: colors.paper,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.inkSoft,
  },
  segmentTextActive: {
    color: colors.ink,
    fontWeight: "600",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.inkSoft,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: 18,
    gap: 16,
  },
  cardHeader: {
    gap: 4,
  },
  cardHeaderTitleBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.inkSoft,
  },
  heatmapGrid: {
    flexDirection: "column",
    flexWrap: "wrap",
    height: 136,
    gap: 4,
    alignSelf: "flex-start",
  },
  heatmapCell: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  heatmapCellPlaceholder: {
    width: 16,
    height: 16,
    backgroundColor: "transparent",
  },
  heatmapCellSelected: {
    borderColor: colors.ink,
    borderWidth: 1.5,
  },
  heatmapDetail: {
    backgroundColor: colors.lineSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    alignSelf: "flex-start",
  },
  heatmapDetailText: {
    fontSize: 12,
    color: colors.ink,
    fontWeight: "500",
  },
  legendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  legendBoxRow: {
    flexDirection: "row",
    gap: 3,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  severityRow: {
    gap: 6,
    marginBottom: 12,
  },
  severityInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  severityLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  severityValue: {
    fontSize: 13,
    color: colors.inkSoft,
    fontWeight: "500",
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: colors.lineSoft,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  timelineList: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 68,
  },
  timelineIndicators: {
    width: 24,
    alignItems: "center",
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    top: 14,
    bottom: -14,
    width: 1,
    backgroundColor: colors.line,
  },
  timelineNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 10,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paperDim,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 12,
    marginLeft: 6,
  },
  timelineItemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  timelineItemSubtitle: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  durationBadge: {
    backgroundColor: colors.lineSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.inkSoft,
  },
  emptyContainer: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
    borderRadius: radii.md,
  },
  emptyText: {
    fontSize: 13,
    color: colors.inkSoft,
    fontWeight: "500",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.paper, // or "transparent" if you don't want a background
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: "500",
  },
  legendValue: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: "700",
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "700",
  },
});
