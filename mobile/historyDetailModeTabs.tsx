import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

type HistoryDetailModeTabItem = {
  accessibilityLabel: string;
  label: string;
  value: string;
};

type HistoryDetailModeTabsProps<T extends HistoryDetailModeTabItem> = {
  activeValue: string;
  options: T[];
  onPress: (item: T) => void;
};

export function HistoryDetailModeTabs<T extends HistoryDetailModeTabItem>({
  activeValue,
  options,
  onPress
}: HistoryDetailModeTabsProps<T>) {
  return (
    <View style={styles.segmentRow}>
      {options.map((item) => {
        const isSelected = activeValue === item.value;
        return (
          <Pressable
            key={item.value}
            accessibilityLabel={item.accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[styles.segmentPill, isSelected ? styles.segmentActive : null]}
            onPress={() => onPress(item)}
          >
            <Text style={[styles.segmentText, isSelected ? styles.segmentTextActive : null]}>{item.label}</Text>
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
