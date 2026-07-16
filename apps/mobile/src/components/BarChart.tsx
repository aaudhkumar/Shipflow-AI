import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { colors, radii } from "../theme/tokens";

import { ScrollView } from "react-native-gesture-handler";

export interface BarChartData {
  label: string;
  stacks: { value: number; color: string }[];
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  delayStart?: number;
}

function AnimatedStack({ 
  value, 
  maxValue, 
  color, 
  totalHeight, 
  delay, 
  reduced 
}: { 
  value: number; 
  maxValue: number; 
  color: string; 
  totalHeight: number;
  delay: number;
  reduced: boolean;
}) {
  const animatedHeight = useSharedValue(0);
  const targetHeight = maxValue > 0 ? (value / maxValue) * totalHeight : 0;

  useEffect(() => {
    if (totalHeight > 0 && targetHeight > 0) {
      if (reduced) {
        animatedHeight.value = withDelay(delay, withTiming(targetHeight, { duration: 150 }));
      } else {
        animatedHeight.value = withDelay(
          delay,
          withSpring(targetHeight, { damping: 20, stiffness: 120 })
        );
      }
    }
  }, [totalHeight, targetHeight, delay, reduced]);

  const style = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
      backgroundColor: color,
    };
  });

  return <Animated.View style={[styles.stack, style]} />;
}

export function BarChart({ data, height = 160, delayStart = 0 }: BarChartProps) {
  const reduced = useReducedMotion();
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate max total value for any single bar to scale properly
  const maxTotalValue = Math.max(
    ...data.map((item) => item.stacks.reduce((sum, stack) => sum + stack.value, 0)),
    1 // prevent division by zero
  );

  return (
    <View style={[styles.container, { height: height + 24 }]}>
      <View style={styles.yAxis}>
        <Text style={styles.yAxisLabel}>{Math.round(maxTotalValue)}</Text>
        <Text style={styles.yAxisLabel}>{Math.round(maxTotalValue / 2)}</Text>
        <Text style={styles.yAxisLabel}>0</Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ flexGrow: 1, paddingLeft: 8 }}
      >
        <View 
          style={[styles.chartArea, { height, minWidth: Math.max(100, data.length * 40) }]}
          onLayout={(e: LayoutChangeEvent) => setContainerHeight(e.nativeEvent.layout.height)}
        >
          {data.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.barColumn}>
              {/* The bar stacks */}
              <View style={styles.stacksContainer}>
                {item.stacks.map((stack, stackIndex) => (
                  <AnimatedStack
                    key={`stack-${index}-${stackIndex}`}
                    value={stack.value}
                    maxValue={maxTotalValue}
                    color={stack.color}
                    totalHeight={containerHeight}
                    delay={delayStart + index * 20} // slight stagger for each bar
                    reduced={reduced}
                  />
                ))}
              </View>
              
              {/* Label */}
              <Text style={styles.label} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 12,
    flexDirection: "row",
  },
  yAxis: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 8,
    paddingBottom: 24, // to align with labels
    borderRightWidth: 1,
    borderRightColor: colors.lineSoft,
  },
  yAxisLabel: {
    fontSize: 10,
    color: colors.inkSoft,
    fontWeight: "500",
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    paddingBottom: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
    paddingHorizontal: 2,
  },
  stacksContainer: {
    width: "100%",
    maxWidth: 24,
    flexDirection: "column-reverse", // stacks build from bottom up
    alignItems: "center",
    justifyContent: "flex-start",
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
    overflow: "hidden",
  },
  stack: {
    width: "100%",
  },
  label: {
    fontSize: 10,
    color: colors.inkSoft,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
});
