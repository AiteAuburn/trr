import { Pressable, StyleSheet, Text, View } from "react-native";

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
    backgroundColor: "#EAF6F1",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  secondaryButtonText: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  }
});
