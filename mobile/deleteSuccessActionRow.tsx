import { Pressable, StyleSheet, Text, View } from "react-native";

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
    backgroundColor: "#3FA67F",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800"
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
