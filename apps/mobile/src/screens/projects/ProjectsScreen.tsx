import React from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FolderGit2, ChevronRight, MoreVertical } from "lucide-react-native";
import { trpc } from "../../lib/api";
import { useOrg } from "../../lib/org-context";
import { colors } from "../../theme/tokens";
import { PressableScale } from "../../components/PressableScale";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<ProjectsStackParamList, "Projects">;

export function ProjectsScreen({ navigation }: Props) {
  const { orgId } = useOrg();
  const { data: projects, isLoading } = trpc.project.list.useQuery({ orgId: orgId! }, { enabled: !!orgId });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : projects?.length === 0 ? (
        <View style={styles.emptyState}>
          <FolderGit2 size={48} color={colors.inkFaint} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>No projects yet</Text>
          <Text style={styles.emptyDesc}>Create a project to start organizing features.</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 50).springify()}>
              <PressableScale onPress={() => navigation.navigate("ProjectDetail", { id: item.id })}>
                <View style={styles.projectCard}>
                  <View style={styles.projectIcon}>
                    <FolderGit2 size={20} color={colors.ink} />
                  </View>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectName}>{item.name}</Text>
                    {item.description && <Text style={styles.projectDesc} numberOfLines={1}>{item.description}</Text>}
                  </View>
                  <ChevronRight size={20} color={colors.inkFaint} />
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
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 20,
    gap: 12,
  },
  projectCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
  },
  projectIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.line + "40",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  projectDesc: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: "center",
  },
});
