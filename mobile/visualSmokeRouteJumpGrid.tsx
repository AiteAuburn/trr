import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";
import type { AppScreen } from "./navigationConfig";

export type VisualSmokeRouteJumpItem = {
  accessibilityLabel: string;
  label: string;
  target: AppScreen;
};

type VisualSmokeRouteJumpGridProps = {
  items: VisualSmokeRouteJumpItem[];
  onRoutePress: (target: AppScreen) => void;
};

function visualSmokeRouteTarget(item: VisualSmokeRouteJumpItem) {
  return item.target;
}

function visualSmokeRouteKey(item: VisualSmokeRouteJumpItem) {
  return item.target;
}

function visualSmokeRouteAccessibilityLabel(item: VisualSmokeRouteJumpItem) {
  return item.accessibilityLabel;
}

function visualSmokeRouteLabel(item: VisualSmokeRouteJumpItem) {
  return item.label;
}

export function VisualSmokeRouteJumpGrid({ items, onRoutePress }: VisualSmokeRouteJumpGridProps) {
  return (
    <View style={styles.visualSmokeRouteGrid}>
      {items.map((item) => (
        <Pressable
          key={visualSmokeRouteKey(item)}
          accessibilityLabel={visualSmokeRouteAccessibilityLabel(item)}
          accessibilityRole="button"
          style={styles.visualSmokeRouteChip}
          onPress={() => onRoutePress(visualSmokeRouteTarget(item))}
        >
          <Text style={styles.visualSmokeRouteChipText}>{visualSmokeRouteLabel(item)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  visualSmokeRouteChip: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  visualSmokeRouteChipText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20
  },
  visualSmokeRouteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center"
  }
});
