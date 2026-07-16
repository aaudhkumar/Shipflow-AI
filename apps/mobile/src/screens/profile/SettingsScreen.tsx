import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Check, Settings as SettingsIcon } from "lucide-react-native";
import { PressableScale } from "../../components/PressableScale";
import { colors } from "../../theme/tokens";
import { trpc } from "../../lib/api";
import { useOrg } from "../../lib/org-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "../../navigation/types";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = NativeStackScreenProps<ProfileStackParamList, "Settings">;

export function SettingsScreen({ navigation }: Props) {
  const { orgId } = useOrg();
  const utils = trpc.useUtils();
  
  const { data: org, isLoading } = trpc.organization.getSettings.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const [name, setName] = useState("");

  useEffect(() => {
    if (org) {
      setName(org.name);
    }
  }, [org]);

  const updateMutation = trpc.organization.updateSettings.useMutation({
    onSuccess: () => {
      utils.organization.getSettings.invalidate();
      utils.organization.list.invalidate();
    },
  });

  const handleUpdate = () => {
    if (!name.trim() || !orgId || name.trim() === org?.name) return;
    updateMutation.mutate({
      orgId,
      name: name.trim(),
    });
  };

  const hasChanges = org && name.trim() !== org.name && name.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.header}>
          <PressableScale onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.ink} />
          </PressableScale>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.form}>
            <View style={styles.sectionIcon}>
              <SettingsIcon size={32} color={colors.ink} />
            </View>
            <Text style={styles.sectionTitle}>Organization Profile</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="E.g., Acme Corp"
                placeholderTextColor={colors.inkFaint}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization Slug (URL)</Text>
              <TextInput
                style={[styles.input, { color: colors.inkSoft, backgroundColor: colors.line + "20" }]}
                value={org?.slug}
                editable={false}
              />
            </View>
          </Animated.View>
        )}

        <View style={styles.footer}>
          <PressableScale
            onPress={handleUpdate}
            disabled={!hasChanges || updateMutation.isPending}
            style={[styles.submitButton, (!hasChanges || updateMutation.isPending) && styles.submitButtonDisabled]}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color={colors.paper} size="small" />
            ) : (
              <>
                <Text style={styles.submitText}>Save Changes</Text>
                {hasChanges && <Check size={18} color={colors.paper} />}
              </>
            )}
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
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
  form: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  sectionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.line + "40",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.inkSoft,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.ink,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 24 : 32,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  submitButton: {
    backgroundColor: colors.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.paper,
    fontSize: 16,
    fontWeight: "600",
  },
});
