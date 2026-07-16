import React from "react";
import { Text, View } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { colors } from "../theme/tokens";

export function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <View style={{ alignItems: "center", paddingHorizontal: 32, paddingTop: 80 }}>
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          borderWidth: 1,
          borderColor: colors.line,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Icon size={20} color={colors.inkFaint} strokeWidth={1.6} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.ink, marginBottom: 4 }}>{title}</Text>
      <Text style={{ fontSize: 13.5, color: colors.inkSoft, textAlign: "center", lineHeight: 19 }}>{body}</Text>
    </View>
  );
}
