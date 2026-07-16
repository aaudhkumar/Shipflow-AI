import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { PRListScreen } from "../screens/dashboard/PRListScreen";
import { PRDetailScreen } from "../screens/dashboard/PRDetailScreen";
import { AnalyticsScreen } from "../screens/dashboard/AnalyticsScreen";
import { ReviewsScreen } from "../screens/dashboard/ReviewsScreen";
import type { HomeStackParamList } from "./types";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="PRList" component={PRListScreen} />
      <Stack.Screen name="PRDetail" component={PRDetailScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
    </Stack.Navigator>
  );
}
