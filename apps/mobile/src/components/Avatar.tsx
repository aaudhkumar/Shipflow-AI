import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/tokens";

interface AvatarProps {
  name?: string | null;
  size?: number;
}

export function Avatar({ name, size = 32 }: AvatarProps) {
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "?";

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  text: {
    color: colors.paper,
    fontWeight: "600",
    fontFamily: "InterTight_600SemiBold",
  },
});
