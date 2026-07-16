import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { OrgSelectScreen } from "../screens/profile/OrgSelectScreen";
import { SettingsScreen } from "../screens/profile/SettingsScreen";
import { MembersScreen } from "../screens/profile/MembersScreen";
import type { ProfileStackParamList } from "./types";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="OrgSelect" component={OrgSelectScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Members" component={MembersScreen} />
    </Stack.Navigator>
  );
}
