import React, { useState } from "react";
import { View, Text, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Check } from "lucide-react-native";
import { PressableScale } from "../../components/PressableScale";
import { colors } from "../../theme/tokens";
import { trpc } from "../../lib/api";
import { useOrg } from "../../lib/org-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BoardStackParamList } from "../../navigation/types";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = NativeStackScreenProps<BoardStackParamList, "NewFeature">;

export function NewFeatureScreen({ navigation }: Props) {
  const { orgId } = useOrg();
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const projectsQuery = trpc.project.list.useQuery({ orgId: orgId! }, { enabled: !!orgId });
  const defaultProjectId = projectsQuery.data?.[0]?.id;

  const createMutation = trpc.feature.create.useMutation({
    onSuccess: () => {
      utils.feature.list.invalidate();
      navigation.goBack();
    },
  });

  const handleCreate = () => {
    if (!title.trim() || !orgId || !defaultProjectId) return;
    createMutation.mutate({
      orgId,
      projectId: defaultProjectId,
      title: title.trim(),
      rawDescription: description.trim(),
    });
  };

  const isComplete = title.trim().length > 0 && !!defaultProjectId;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.header}>
          <PressableScale onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.ink} />
          </PressableScale>
          <Text style={styles.headerTitle}>New Feature</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.form}>
          <Animated.View entering={FadeInDown.duration(400).springify()}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., Implement dark mode"
              placeholderTextColor={colors.inkFaint}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(50).springify()}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide some details..."
              placeholderTextColor={colors.inkFaint}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <PressableScale
            onPress={handleCreate}
            disabled={!isComplete || createMutation.isPending}
            style={[styles.submitButton, !isComplete && styles.submitButtonDisabled]}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={colors.paper} size="small" />
            ) : (
              <>
                <Text style={styles.submitText}>Create Feature</Text>
                <Check size={18} color={colors.paper} />
              </>
            )}
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  form: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.inkSoft,
    marginBottom: 8,
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
  textArea: {
    minHeight: 120,
    paddingTop: 16,
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
