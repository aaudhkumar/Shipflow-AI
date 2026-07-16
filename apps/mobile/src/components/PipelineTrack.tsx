import React from "react";
import { View } from "react-native";
import { colors } from "../theme/tokens";
import { FeatureRequestStatus, STAGE_ORDER, stageIndexFor, toneFor } from "../utils/pipeline";

/**
 * Nine dots, filled up to the current stage. Rendered inside every board
 * card, so — deliberately — it does not animate on its own; it would fire
 * on every scroll recycle. The color state alone communicates outcome.
 */
export function PipelineTrack({ status }: { status: FeatureRequestStatus }) {
  const activeIndex = stageIndexFor(status);
  const tone = toneFor(status);
  const activeColor = tone === "red" ? colors.red : tone === "green" ? colors.green : colors.ink;

  return (
    <View className="flex-row items-center gap-[3px]">
      {STAGE_ORDER.map((stage, i) => {
        const filled = i <= activeIndex;
        return (
          <View
            key={stage.key}
            style={{
              height: 3,
              flex: 1,
              borderRadius: 2,
              backgroundColor: filled ? activeColor : colors.line,
            }}
          />
        );
      })}
    </View>
  );
}
