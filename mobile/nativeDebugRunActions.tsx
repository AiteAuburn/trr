import { StyleSheet, View } from "react-native";

import { NativeDebugActionButton } from "./nativeDebugActionButton";

type NativeDebugRunActionsProps = {
  benchmarkAccessibilityLabel: string;
  benchmarkLabel: string;
  disabled: boolean;
  llamaAccessibilityLabel: string;
  llamaLabel: string;
  onBenchmarkPress: () => void;
  onLlamaPress: () => void;
  onWhisperPress: () => void;
  whisperAccessibilityLabel: string;
  whisperLabel: string;
};

export function NativeDebugRunActions({
  benchmarkAccessibilityLabel,
  benchmarkLabel,
  disabled,
  llamaAccessibilityLabel,
  llamaLabel,
  onBenchmarkPress,
  onLlamaPress,
  onWhisperPress,
  whisperAccessibilityLabel,
  whisperLabel
}: NativeDebugRunActionsProps) {
  return (
    <View style={styles.actionRow}>
      <NativeDebugActionButton
        accessibilityLabel={whisperAccessibilityLabel}
        disabled={disabled}
        label={whisperLabel}
        onPress={onWhisperPress}
      />
      <NativeDebugActionButton
        accessibilityLabel={llamaAccessibilityLabel}
        disabled={disabled}
        label={llamaLabel}
        onPress={onLlamaPress}
      />
      <NativeDebugActionButton
        accessibilityLabel={benchmarkAccessibilityLabel}
        disabled={disabled}
        label={benchmarkLabel}
        onPress={onBenchmarkPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end"
  }
});
