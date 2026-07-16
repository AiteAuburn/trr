import { Pressable, StyleSheet, Text, View } from "react-native";

type PreviewRecordEditActionRowProps = {
  applyAccessibilityLabel: string;
  applyDisabled: boolean;
  applyLabel: string;
  cancelAccessibilityLabel: string;
  cancelLabel: string;
  onApplyPress: () => void;
  onCancelPress: () => void;
};

export function PreviewRecordEditActionRow({
  applyAccessibilityLabel,
  applyDisabled,
  applyLabel,
  cancelAccessibilityLabel,
  cancelLabel,
  onApplyPress,
  onCancelPress
}: PreviewRecordEditActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={cancelAccessibilityLabel}
        accessibilityRole="button"
        onPress={onCancelPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{cancelLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={applyAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: applyDisabled }}
        disabled={applyDisabled}
        onPress={onApplyPress}
        style={[styles.primaryButton, applyDisabled ? styles.buttonDisabled : null]}
      >
        <Text style={styles.primaryButtonText}>{applyLabel}</Text>
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
  buttonDisabled: {
    opacity: 0.55
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
