import { Pressable, StyleSheet, Text, View } from "react-native";

type DangerConfirmActionRowProps = {
  cancelAccessibilityLabel: string;
  cancelDisabled?: boolean;
  cancelLabel: string;
  confirmAccessibilityLabel: string;
  confirmDisabled?: boolean;
  confirmLabel: string;
  onCancelPress: () => void;
  onConfirmPress: () => void;
};

export function DangerConfirmActionRow({
  cancelAccessibilityLabel,
  cancelDisabled = false,
  cancelLabel,
  confirmAccessibilityLabel,
  confirmDisabled = false,
  confirmLabel,
  onCancelPress,
  onConfirmPress
}: DangerConfirmActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={cancelAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: cancelDisabled }}
        disabled={cancelDisabled}
        onPress={onCancelPress}
        style={[styles.secondaryButton, cancelDisabled ? styles.buttonDisabled : null]}
      >
        <Text style={styles.secondaryButtonText}>{cancelLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={confirmAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: confirmDisabled }}
        disabled={confirmDisabled}
        onPress={onConfirmPress}
        style={[styles.dangerButton, confirmDisabled ? styles.buttonDisabled : null]}
      >
        <Text style={styles.dangerButtonText}>{confirmLabel}</Text>
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
  dangerButton: {
    alignItems: "center",
    backgroundColor: "#C85D5D",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  dangerButtonText: {
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
