import { Pressable, StyleSheet, Text, View } from "react-native";

type AiReviewActionRowProps = {
  enterSaveAccessibilityLabel: string;
  enterSaveDisabled: boolean;
  enterSaveLabel: string;
  manualAddAccessibilityLabel: string;
  manualAddLabel: string;
  onEnterSavePress: () => void;
  onManualAddPress: () => void;
  onReturnEditPress: () => void;
  returnEditAccessibilityLabel: string;
  returnEditLabel: string;
  showEnterSave: boolean;
  showManualAdd: boolean;
};

export function AiReviewActionRow({
  enterSaveAccessibilityLabel,
  enterSaveDisabled,
  enterSaveLabel,
  manualAddAccessibilityLabel,
  manualAddLabel,
  onEnterSavePress,
  onManualAddPress,
  onReturnEditPress,
  returnEditAccessibilityLabel,
  returnEditLabel,
  showEnterSave,
  showManualAdd
}: AiReviewActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={returnEditAccessibilityLabel}
        accessibilityRole="button"
        onPress={onReturnEditPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{returnEditLabel}</Text>
      </Pressable>
      {showManualAdd ? (
        <Pressable
          accessibilityLabel={manualAddAccessibilityLabel}
          accessibilityRole="button"
          onPress={onManualAddPress}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>{manualAddLabel}</Text>
        </Pressable>
      ) : null}
      {showEnterSave ? (
        <Pressable
          accessibilityLabel={enterSaveAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: enterSaveDisabled }}
          disabled={enterSaveDisabled}
          onPress={onEnterSavePress}
          style={[styles.primaryButton, enterSaveDisabled ? styles.buttonDisabled : null]}
        >
          <Text style={styles.primaryButtonText}>{enterSaveLabel}</Text>
        </Pressable>
      ) : null}
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
