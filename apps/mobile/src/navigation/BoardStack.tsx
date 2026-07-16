import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BoardScreen } from "../screens/board/BoardScreen";
import { TaskDetailScreen } from "../screens/task/TaskDetailScreen";
import { NewFeatureScreen } from "../screens/board/NewFeatureScreen";
import type { BoardStackParamList } from "./types";

const Stack = createNativeStackNavigator<BoardStackParamList>();

export function BoardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Board" component={BoardScreen} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="NewFeature" component={NewFeatureScreen} options={{ presentation: "modal" }} />
    </Stack.Navigator>
  );
}
