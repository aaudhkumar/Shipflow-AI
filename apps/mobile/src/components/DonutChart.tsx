import React, { useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { colors } from "../theme/tokens";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface DonutChartData {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  strokeWidth?: number;
  delayStart?: number;
  centerText?: string;
  centerSubtext?: string;
}

export function DonutChart({
  data,
  size = 160,
  strokeWidth = 20,
  delayStart = 0,
  centerText,
  centerSubtext,
}: DonutChartProps) {
  const reduced = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const halfCircle = size / 2;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Progress value from 0 to 1 for the entrance animation
  const progress = useSharedValue(0);

  useEffect(() => {
    if (total > 0) {
      if (reduced) {
        progress.value = withDelay(delayStart, withTiming(1, { duration: 150 }));
      } else {
        progress.value = withDelay(
          delayStart,
          withSpring(1, { damping: 20, stiffness: 120 })
        );
      }
    }
  }, [total, delayStart, reduced]);

  // Calculate starting offsets for each segment
  let currentOffset = 0;
  const segments = data.map((item) => {
    const percentage = total > 0 ? item.value / total : 0;
    const strokeLength = percentage * circumference;
    const startOffset = currentOffset;
    currentOffset += strokeLength;
    
    return {
      ...item,
      percentage,
      strokeLength,
      startOffset,
    };
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${halfCircle}, ${halfCircle}`}>
          {/* Background Track */}
          <Circle
            cx={halfCircle}
            cy={halfCircle}
            r={radius}
            fill="transparent"
            stroke={colors.lineSoft}
            strokeWidth={strokeWidth}
          />
          
          {/* Foreground Segments */}
          {segments.map((segment, index) => {
            const animatedProps = useAnimatedProps(() => {
              // Standard SVG pie slice: offset by -startOffset to position it
              // We use circumference - startOffset to avoid negative offsets which some SVG engines don't like
              // However, since we animate it, we want it to "grow" from 0.
              const currentStrokeLength = segment.strokeLength * progress.value;
              const currentOffset = circumference - segment.startOffset;

              return {
                strokeDashoffset: currentOffset,
                strokeDasharray: `${currentStrokeLength} ${circumference}`,
              };
            });

            return (
              <AnimatedCircle
                key={`segment-${index}`}
                cx={halfCircle}
                cy={halfCircle}
                r={radius}
                fill="transparent"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                animatedProps={animatedProps}
              />
            );
          })}
        </G>
      </Svg>
      
      {/* Center Text Overlay */}
      {(centerText || centerSubtext) && (
        <View style={[StyleSheet.absoluteFillObject, styles.centerOverlay]}>
          {centerText && (
            <Animated.Text 
              style={[styles.centerText, { opacity: progress }]}
            >
              {centerText}
            </Animated.Text>
          )}
          {centerSubtext && (
            <Animated.Text 
              style={[styles.centerSubtext, { opacity: progress }]}
            >
              {centerSubtext}
            </Animated.Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerOverlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  centerSubtext: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    color: colors.inkSoft,
    letterSpacing: 1,
    marginTop: 2,
  },
});
