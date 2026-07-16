import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Building2, Settings as SettingsIcon, Users, ChevronRight } from "lucide-react-native";
import { PressableScale } from "../../components/PressableScale";
import { Avatar } from "../../components/Avatar";
import { colors } from "../../theme/tokens";
import { authClient, useSession } from "../../lib/auth-client";
import { useOrg } from "../../lib/org-context";
import { trpc } from "../../lib/api";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "../../navigation/types";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = NativeStackScreenProps<ProfileStackParamList, "Profile">;

export function ProfileScreen({ navigation }: Props) {
  const { data: session } = useSession();
  const { orgId } = useOrg();
  const { data: orgs } = trpc.organization.list.useQuery(undefined, { enabled: !!session?.user });
  
  const currentOrg = orgs?.find((o) => o.id === orgId);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.userInfo}>
        <Avatar name={session?.user?.name} size={64} />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{session?.user?.name ?? "—"}</Text>
          <Text style={styles.userEmail}>{session?.user?.email ?? ""}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(50).springify()} style={styles.menu}>
        <MenuButton
          icon={Building2}
          title="Organization"
          subtitle={currentOrg?.name ?? "Select organization"}
          onPress={() => navigation.navigate("OrgSelect")}
        />
        <MenuButton
          icon={SettingsIcon}
          title="Settings"
          subtitle="Update organization details"
          onPress={() => navigation.navigate("Settings")}
        />
        <MenuButton
          icon={Users}
          title="Members"
          subtitle="Manage your team"
          onPress={() => navigation.navigate("Members")}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(100).springify()} style={styles.footer}>
        <PressableScale onPress={() => authClient.signOut()}>
          <View style={styles.signOutBtn}>
            <LogOut size={16} color={colors.red} />
            <Text style={styles.signOutText}>Sign out</Text>
          </View>
        </PressableScale>
      </Animated.View>
    </SafeAreaView>
  );
}

function MenuButton({ icon: Icon, title, subtitle, onPress }: { icon: any, title: string, subtitle: string, onPress: () => void }) {
  return (
    <PressableScale onPress={onPress}>
      <View style={styles.menuItem}>
        <View style={styles.menuIconBox}>
          <Icon size={20} color={colors.ink} />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRight size={20} color={colors.inkFaint} />
      </View>
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
  userInfo: {
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
  },
  userEmail: {
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: 2,
  },
  menu: {
    padding: 20,
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 12,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.line + "40",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  footer: {
    padding: 20,
    marginTop: "auto",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    borderRadius: 12,
    paddingVertical: 14,
  },
  signOutText: {
    color: colors.red,
    fontSize: 15,
    fontWeight: "600",
  },
});
