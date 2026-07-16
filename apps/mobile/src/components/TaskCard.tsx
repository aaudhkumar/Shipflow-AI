import React from "react";
import { Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { PressableScale } from "./PressableScale";
import { PipelineTrack } from "./PipelineTrack";
import { StatusPill } from "./StatusPill";
import { colors } from "../theme/tokens";
import { FeatureRequestStatus } from "../utils/pipeline";

export type FeatureRequestSummary = {
  id: string;
  title: string;
  projectName: string; // resolved client-side from project.list — see BoardScreen
  status: FeatureRequestStatus;
};

export function TaskCard({ item, onPress }: { item: FeatureRequestSummary; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.985}>
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 16,
          padding: 16,
          backgroundColor: colors.paper,
        }}
      >
        <View className="flex-row items-start justify-between">
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ fontSize: 11, color: colors.inkFaint, marginBottom: 4 }} className="uppercase tracking-wide">
              {item.projectName}
            </Text>
            <Text style={{ fontSize: 15.5, fontWeight: "600", color: colors.ink }} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.inkFaint} />
        </View>

        <View style={{ marginTop: 14 }}>
          <PipelineTrack status={item.status} />
        </View>

        <View style={{ marginTop: 12 }}>
          <StatusPill status={item.status} />
        </View>
      </View>
    </PressableScale>
  );
}
