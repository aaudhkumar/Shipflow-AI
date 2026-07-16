import React from "react";
import { Pressable, PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useReducedMotion } from "../hooks/useReducedMotion";

import { StyleProp, ViewStyle } from "react-native";

/**
 * Every tappable surface in the app should go through this instead of raw
 * Pressable. Scale-only (GPU), spring-based so rapid re-taps retarget instead
 * of restarting, and it's a no-op transform when reduced motion is on.
 */
export function PressableScale({
  children,
  scaleTo = 0.97,
  style,
  ...rest
}: Omit<PressableProps, "style" | "children"> & { scaleTo?: number, style?: StyleProp<ViewStyle>, children?: React.ReactNode }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={(e) => {
        if (!reduced) scale.value = withSpring(scaleTo, { damping: 18, stiffness: 400 });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduced) scale.value = withSpring(1, { damping: 14, stiffness: 260 });
        rest.onPressOut?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}
