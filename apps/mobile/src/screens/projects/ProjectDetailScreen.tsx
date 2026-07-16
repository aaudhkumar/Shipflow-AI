import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, FolderGit2 } from "lucide-react-native";
import { trpc } from "../../lib/api";
import { useOrg } from "../../lib/org-context";
import { colors } from "../../theme/tokens";
import { PressableScale } from "../../components/PressableScale";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "../../navigation/types";
import Animated, { FadeIn } from "react-native-reanimated";

type Props = NativeStackScreenProps<ProjectsStackParamList, "ProjectDetail">;

export function ProjectDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { orgId } = useOrg();
  
  const { data: project, isLoading } = trpc.project.getById.useQuery(
    { orgId: orgId!, projectId: id }, 
    { enabled: !!orgId }
  );

  const { data: features, isLoading: isLoadingFeatures } = trpc.feature.list.useQuery(
    { orgId: orgId!, projectId: id },
    { enabled: !!orgId }
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.ink} />
        </PressableScale>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {project ? project.name : "Loading..."}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : project ? (
        <Animated.ScrollView 
          entering={FadeIn.duration(400)} 
          contentContainerStyle={styles.content}
        >
          <View style={styles.projectHeader}>
            <View style={styles.projectIcon}>
              <FolderGit2 size={32} color={colors.ink} />
            </View>
            <Text style={styles.projectName}>{project.name}</Text>
            {project.description && <Text style={styles.projectDesc}>{project.description}</Text>}
          </View>
          
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Features</Text>
            {isLoadingFeatures ? (
              <ActivityIndicator color={colors.ink} style={{ marginTop: 24 }} />
            ) : features && features.length > 0 ? (
              features.map(feature => (
                <PressableScale 
                  key={feature.id} 
                  style={styles.featureCard}
                  onPress={() => navigation.navigate("TaskDetail", { id: feature.id })}
                >
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureStatus}>{feature.status.replace(/_/g, " ")}</Text>
                </PressableScale>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No features requested yet.</Text>
              </View>
            )}
          </View>
        </Animated.ScrollView>
      ) : (
        <View style={styles.loader}>
          <Text style={{ color: colors.inkSoft }}>Project not found.</Text>
        </View>
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
    flex: 1,
    textAlign: "center",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 24,
    gap: 32,
  },
  projectHeader: {
    alignItems: "center",
    gap: 12,
  },
  projectIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.line + "40",
    alignItems: "center",
    justifyContent: "center",
  },
  projectName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
  },
  projectDesc: {
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: "center",
    lineHeight: 22,
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
  featuresSection: {
    marginTop: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 8,
  },
  featureCard: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.ink,
  },
  featureStatus: {
    fontSize: 12,
    color: colors.inkSoft,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
