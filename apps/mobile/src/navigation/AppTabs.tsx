import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LayoutGrid, Bell, User, Home, FolderGit2 } from "lucide-react-native";
import { HomeStack } from "./HomeStack";
import { ProjectsStack } from "./ProjectsStack";
import { BoardStack } from "./BoardStack";
import { NotificationsStack } from "./NotificationsStack";
import { ProfileStack } from "./ProfileStack";
import { colors } from "../theme/tokens";
import type { AppTabsParamList } from "./types";

const Tab = createBottomTabNavigator<AppTabsParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: { borderTopColor: colors.line, height: 58, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home color={color} size={size ? size - 2 : 20} /> }}
      />
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectsStack}
        options={{ title: "Projects", tabBarIcon: ({ color, size }) => <FolderGit2 color={color} size={size ? size - 2 : 20} /> }}
      />
      <Tab.Screen
        name="BoardTab"
        component={BoardStack}
        options={{ title: "Board", tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size ? size - 2 : 20} /> }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsStack}
        options={{ title: "Alerts", tabBarIcon: ({ color, size }) => <Bell color={color} size={size ? size - 2 : 20} /> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User color={color} size={size ? size - 2 : 20} /> }}
      />
    </Tab.Navigator>
  );
}
