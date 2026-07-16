import React from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthStack } from "./AuthStack";
import { AppTabs } from "./AppTabs";
import { useSession } from "../lib/auth-client";
import { colors } from "../theme/tokens";

export function RootNavigator() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return session ? <AppTabs /> : <AuthStack />;
}
