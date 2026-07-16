import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../theme/tokens";
import { FeatureRequestStatus, labelFor, toneFor } from "../utils/pipeline";
import { useReducedMotion } from "../hooks/useReducedMotion";

const TONE_PROGRESS: Record<string, number> = { neutral: 0, red: 1, green: 2 };

export function StatusPill({ status }: { status: FeatureRequestStatus }) {
  const reduced = useReducedMotion();
  const tone = toneFor(status);
  const progress = useSharedValue(TONE_PROGRESS[tone]);

  useEffect(() => {
    progress.value = reduced ? TONE_PROGRESS[tone] : withTiming(TONE_PROGRESS[tone], { duration: 220 });
  }, [tone]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1, 2], [colors.lineSoft, colors.redBg, colors.greenBg]),
    borderColor: interpolateColor(progress.value, [0, 1, 2], [colors.line, colors.redLine, colors.greenLine]),
  }));

  const textColor = tone === "red" ? colors.red : tone === "green" ? colors.green : colors.inkSoft;

  return (
    <Animated.View
      style={[animatedStyle, { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }]}
    >
      <View className="flex-row items-center gap-1.5">
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: textColor }} />
        <Text style={{ color: textColor, fontSize: 11, fontWeight: "600" }} className="uppercase tracking-wide">
          {labelFor(status)}
        </Text>
      </View>
    </Animated.View>
  );
}
