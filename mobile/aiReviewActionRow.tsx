import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

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
