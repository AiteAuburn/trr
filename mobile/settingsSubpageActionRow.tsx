import { Pressable, StyleSheet, Text, View } from "react-native";

type SettingsSubpageActionRowProps = {
  actionAccessibilityLabel: string;
  actionDisabled?: boolean;
  actionLabel: string;
  onActionPress: () => void;
  onReturnPress: () => void;
  returnAccessibilityLabel: string;
  returnLabel: string;
};

export function SettingsSubpageActionRow({
  actionAccessibilityLabel,
  actionDisabled = false,
  actionLabel,
  onActionPress,
  onReturnPress,
  returnAccessibilityLabel,
  returnLabel
}: SettingsSubpageActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={returnAccessibilityLabel}
        accessibilityRole="button"
        onPress={onReturnPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{returnLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={actionAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: actionDisabled }}
        disabled={actionDisabled}
        onPress={onActionPress}
        style={[styles.secondaryButton, actionDisabled ? styles.buttonDisabled : null]}
      >
        <Text style={styles.secondaryButtonText}>{actionLabel}</Text>
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
    opacity: 0.45
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
