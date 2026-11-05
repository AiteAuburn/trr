import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

type InsightEmptyActionRowProps = {
  manualAccessibilityLabel: string;
  manualLabel: string;
  onManualPress: () => void;
  onReturnPress: () => void;
  returnAccessibilityLabel: string;
  returnLabel: string;
};

export function InsightEmptyActionRow({
  manualAccessibilityLabel,
  manualLabel,
  onManualPress,
  onReturnPress,
  returnAccessibilityLabel,
  returnLabel
}: InsightEmptyActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={manualAccessibilityLabel}
        accessibilityRole="button"
        onPress={onManualPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{manualLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={returnAccessibilityLabel}
        accessibilityRole="button"
        onPress={onReturnPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{returnLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: palette.wash,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  secondaryButtonText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800"
  }
});
