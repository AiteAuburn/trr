import { Pressable, StyleSheet, Text, View } from "react-native";

type AiSaveFailureActionRowProps = {
  backAccessibilityLabel: string;
  backLabel: string;
  manualAddAccessibilityLabel: string;
  manualAddLabel: string;
  onBackPress: () => void;
  onManualAddPress: () => void;
  onReturnSavePress: () => void;
  returnSaveAccessibilityLabel: string;
  returnSaveDisabled: boolean;
  returnSaveLabel: string;
};

export function AiSaveFailureActionRow({
  backAccessibilityLabel,
  backLabel,
  manualAddAccessibilityLabel,
  manualAddLabel,
  onBackPress,
  onManualAddPress,
  onReturnSavePress,
  returnSaveAccessibilityLabel,
  returnSaveDisabled,
  returnSaveLabel
}: AiSaveFailureActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={backAccessibilityLabel}
        accessibilityRole="button"
        onPress={onBackPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{backLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={manualAddAccessibilityLabel}
        accessibilityRole="button"
        onPress={onManualAddPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{manualAddLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={returnSaveAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: returnSaveDisabled }}
        disabled={returnSaveDisabled}
        onPress={onReturnSavePress}
        style={[styles.primaryButton, returnSaveDisabled ? styles.buttonDisabled : null]}
      >
        <Text style={styles.primaryButtonText}>{returnSaveLabel}</Text>
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
