import React from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Users, Shield } from "lucide-react-native";
import { PressableScale } from "../../components/PressableScale";
import { Avatar } from "../../components/Avatar";
import { colors } from "../../theme/tokens";
import { trpc } from "../../lib/api";
import { useOrg } from "../../lib/org-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "../../navigation/types";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = NativeStackScreenProps<ProfileStackParamList, "Members">;

export function MembersScreen({ navigation }: Props) {
  const { orgId } = useOrg();
  const { data: members, isLoading } = trpc.organization.getMembers.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.ink} />
        </PressableScale>
        <Text style={styles.headerTitle}>Members</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : members?.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={48} color={colors.inkFaint} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>No members</Text>
          <Text style={styles.emptyDesc}>Invite team members from the web dashboard.</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(index * 50).springify()}>
              <View style={styles.memberCard}>
                <Avatar name={item.user.name} size={40} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{item.user.name}</Text>
                  <Text style={styles.memberEmail}>{item.user.email}</Text>
                </View>
                <View style={styles.roleBadge}>
                  {item.role === "OWNER" && <Shield size={12} color={colors.ink} style={{ marginRight: 4 }} />}
                  <Text style={styles.roleText}>{item.role}</Text>
                </View>
              </View>
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
  list: {
    padding: 20,
    gap: 12,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  memberEmail: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.line + "40",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.ink,
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
