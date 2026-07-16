import React from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Building2, ArrowLeft } from "lucide-react-native";
import { PressableScale } from "../../components/PressableScale";
import { colors } from "../../theme/tokens";
import { trpc } from "../../lib/api";
import { useOrg } from "../../lib/org-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "../../navigation/types";
import Animated, { FadeIn } from "react-native-reanimated";

type Props = NativeStackScreenProps<ProfileStackParamList, "OrgSelect">;

export function OrgSelectScreen({ navigation }: Props) {
  const { orgId, setOrgId } = useOrg();
  const { data: orgs, isLoading } = trpc.organization.list.useQuery();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line }}>
        <PressableScale onPress={() => navigation.goBack()} style={{ padding: 4, marginLeft: -4 }}>
          <ArrowLeft size={24} color={colors.ink} />
        </PressableScale>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.ink, marginLeft: 12 }}>Switch Organization</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : (
        <FlatList
          data={orgs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeIn.delay(index * 50).duration(300)}>
              <PressableScale
                onPress={() => {
                  setOrgId(item.id);
                  navigation.goBack();
                }}
              >
                <View style={[styles.orgCard, orgId === item.id && styles.activeCard]}>
                  <View style={styles.iconContainer}>
                    <Building2 size={20} color={orgId === item.id ? colors.ink : colors.inkSoft} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[styles.orgName, orgId === item.id && { color: colors.ink }]}>{item.name}</Text>
                    <Text style={styles.orgSlug}>{item.slug}</Text>
                  </View>
                  {orgId === item.id && <Check size={20} color={colors.ink} />}
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
  orgCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  activeCard: {
    borderColor: colors.ink,
    backgroundColor: colors.line + "20",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  orgName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.inkSoft,
  },
  orgSlug: {
    fontSize: 13,
    color: colors.inkFaint,
    marginTop: 2,
  },
});
