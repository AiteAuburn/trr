import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

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
