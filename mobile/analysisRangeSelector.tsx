import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AnalysisRange } from "./analysisCopy";

export type AnalysisRangeOption = {
  accessibilityLabel: string;
  label: string;
  value: AnalysisRange;
};

type AnalysisRangeSelectorProps<TOption> = {
  isSelected: (option: TOption) => boolean;
  onOptionPress: (option: TOption) => void;
  optionAccessibilityLabel: (option: TOption) => string;
  optionKey: (option: TOption) => string;
  optionLabel: (option: TOption) => string;
  options: readonly TOption[];
};

export function AnalysisRangeSelector<TOption>({
  isSelected,
  onOptionPress,
  optionAccessibilityLabel,
  optionKey,
  optionLabel,
  options
}: AnalysisRangeSelectorProps<TOption>) {
  return (
    <View style={styles.segmentRow}>
      {options.map((option) => {
        const optionSelected = isSelected(option);

        return (
          <Pressable
            key={optionKey(option)}
            accessibilityLabel={optionAccessibilityLabel(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: optionSelected }}
            style={[styles.segmentPill, optionSelected ? styles.segmentActive : null]}
            onPress={() => onOptionPress(option)}
          >
            <Text style={[styles.segmentText, optionSelected ? styles.segmentTextActive : null]}>
              {optionLabel(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function analysisRangeTarget(item: AnalysisRangeOption) {
  return item.value;
}

export function analysisRangeOptionKey(item: AnalysisRangeOption) {
  return analysisRangeTarget(item);
}

export function analysisRangeOptionAccessibilityLabel(item: AnalysisRangeOption) {
  return item.accessibilityLabel;
}

export function analysisRangeOptionLabel(item: AnalysisRangeOption) {
  return item.label;
}

export function analysisRangeOptionSelected(item: AnalysisRangeOption, selectedRange: AnalysisRange) {
  return analysisRangeTarget(item) === selectedRange;
}

const styles = StyleSheet.create({
  segmentActive: {
    backgroundColor: "#3FA67F",
    borderColor: "#3FA67F"
  },
  segmentPill: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  segmentText: {
    color: "#0F3F37",
    fontSize: 13,
    fontWeight: "800"
  },
  segmentTextActive: {
    color: "#FFFFFF"
  }
});
