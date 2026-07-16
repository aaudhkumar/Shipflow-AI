import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProjectsScreen } from "../screens/projects/ProjectsScreen";
import { ProjectDetailScreen } from "../screens/projects/ProjectDetailScreen";
import { TaskDetailScreen } from "../screens/task/TaskDetailScreen";
import type { ProjectsStackParamList } from "./types";

const Stack = createNativeStackNavigator<ProjectsStackParamList>();

export function ProjectsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Projects" component={ProjectsScreen} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
    </Stack.Navigator>
  );
}
