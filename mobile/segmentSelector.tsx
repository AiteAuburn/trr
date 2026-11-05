import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

type SegmentSelectorProps<TOption> = {
  isSelected: (option: TOption) => boolean;
  onOptionPress: (option: TOption) => void;
  optionAccessibilityLabel: (option: TOption) => string;
  optionKey: (option: TOption) => string;
  optionLabel: (option: TOption) => string;
  options: readonly TOption[];
};

export function SegmentSelector<TOption>({
  isSelected,
  onOptionPress,
  optionAccessibilityLabel,
  optionKey,
  optionLabel,
  options
}: SegmentSelectorProps<TOption>) {
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

const styles = StyleSheet.create({
  segmentActive: {
    backgroundColor: palette.brand,
    borderColor: palette.brand
  },
  segmentPill: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
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
    color: palette.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  segmentTextActive: {
    color: palette.surface
  }
});
