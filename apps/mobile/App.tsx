import "./global.css";
import React from "react";
import { View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { InterTight_500Medium, InterTight_600SemiBold, InterTight_700Bold } from "@expo-google-fonts/inter-tight";
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { WinkySans_600SemiBold } from "@expo-google-fonts/winky-sans";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { TRPCProvider } from "./src/lib/api";
import { OrgProvider } from "./src/lib/org-context";
import { StatusBar } from "expo-status-bar";
import { colors } from "./src/theme/tokens";

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.paper, border: colors.line, primary: colors.ink },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    WinkySans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
  }

  return (
    <SafeAreaProvider>
      <TRPCProvider>
        <OrgProvider>
          <NavigationContainer theme={navTheme}>
            <RootNavigator />
          </NavigationContainer>
        </OrgProvider>
      </TRPCProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
