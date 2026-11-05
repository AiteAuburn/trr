import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

type DeleteSuccessActionRowProps = {
  historyAccessibilityLabel: string;
  historyLabel: string;
  onHistoryPress: () => void;
  onReturnPress: () => void;
  returnAccessibilityLabel: string;
  returnLabel: string;
};

export function DeleteSuccessActionRow({
  historyAccessibilityLabel,
  historyLabel,
  onHistoryPress,
  onReturnPress,
  returnAccessibilityLabel,
  returnLabel
}: DeleteSuccessActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={historyAccessibilityLabel}
        accessibilityRole="button"
        onPress={onHistoryPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{historyLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={returnAccessibilityLabel}
        accessibilityRole="button"
        onPress={onReturnPress}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>{returnLabel}</Text>
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
  primaryButton: {
    alignItems: "center",
    backgroundColor: palette.brand,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  primaryButtonText: {
    color: palette.surface,
    fontSize: 14,
    fontWeight: "800"
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
