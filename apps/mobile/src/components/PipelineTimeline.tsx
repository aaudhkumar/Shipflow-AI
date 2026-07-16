import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../theme/tokens";
import { FeatureRequestStatus, STAGE_ORDER, stageIndexFor, toneFor } from "../utils/pipeline";
import { useReducedMotion } from "../hooks/useReducedMotion";

function dotColor(i: number, activeIndex: number, tone: ReturnType<typeof toneFor>) {
  if (i > activeIndex) return colors.line;
  if (i === activeIndex) return tone === "red" ? colors.red : tone === "green" ? colors.green : colors.ink;
  return colors.inkFaint;
}

function ConnectorFill({ filled, reduced, delay }: { filled: boolean; reduced: boolean; delay: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = reduced ? (filled ? 1 : 0) : withDelay(delay, withTiming(filled ? 1 : 0, { duration: 320 }));
  }, [filled]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: progress.value }] }));
  return (
    <View style={{ width: 2, flex: 1, backgroundColor: colors.line, overflow: "hidden" }}>
      <Animated.View
        style={[style, { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.ink, transformOrigin: "top" }]}
      />
    </View>
  );
}

export function PipelineTimeline({ status }: { status: FeatureRequestStatus }) {
  const reduced = useReducedMotion();
  const activeIndex = stageIndexFor(status);
  const tone = toneFor(status);

  return (
    <View>
      {STAGE_ORDER.map((stage, i) => {
        const isLast = i === STAGE_ORDER.length - 1;
        const isCurrent = i === activeIndex;
        const isDone = i < activeIndex;

        return (
          <Animated.View
            key={stage.key}
            entering={reduced ? undefined : FadeInDown.duration(280).delay(i * 35).springify().damping(18)}
            style={{ flexDirection: "row" }}
          >
            <View style={{ width: 24, alignItems: "center" }}>
              <View
                style={{
                  width: isCurrent ? 12 : 9,
                  height: isCurrent ? 12 : 9,
                  borderRadius: 6,
                  backgroundColor: dotColor(i, activeIndex, tone),
                  marginTop: 3,
                }}
              />
              {!isLast && <ConnectorFill filled={isDone} reduced={reduced} delay={i * 60} />}
            </View>

            <View style={{ flex: 1, paddingBottom: isLast ? 0 : 20, paddingLeft: 12 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isCurrent ? "700" : "500",
                  color: isCurrent || isDone ? colors.ink : colors.inkFaint,
                }}
              >
                {stage.label}
              </Text>
              {isCurrent && (
                <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>Currently here</Text>
              )}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}
