import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

import { HighlightBulletRow } from "./highlightBulletRow";
import { enableDebugTools } from "./appRuntimeConfig";

type RecordEditFooterActionsProps = {
  cancelAccessibilityLabel: string;
  cancelLabel: string;
  checklistItems: string[];
  disabled: boolean;
  preCheckTitle: string;
  saveLabel: string;
  submitAccessibilityLabel: string;
  validationText: string | null;
  onCancelPress: () => void;
  onSubmitPress: () => void;
};

export function RecordEditFooterActions({
  cancelAccessibilityLabel,
  cancelLabel,
  checklistItems,
  disabled,
  preCheckTitle,
  saveLabel,
  submitAccessibilityLabel,
  validationText,
  onCancelPress,
  onSubmitPress
}: RecordEditFooterActionsProps) {
  return (
    <>
      {enableDebugTools ? <View style={styles.inlineInfoBlock}>
        <Text style={styles.label}>{preCheckTitle}</Text>
        {checklistItems.map((item) => (
          <HighlightBulletRow key={item} text={item} />
        ))}
      </View> : null}
      <View style={styles.actionRow}>
        <Pressable
          accessibilityLabel={cancelAccessibilityLabel}
          accessibilityRole="button"
          style={styles.secondaryButton}
          onPress={onCancelPress}
        >
          <Text style={styles.secondaryButtonText}>{cancelLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={submitAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          style={[styles.primaryButton, disabled ? styles.buttonDisabled : null]}
          disabled={disabled}
          onPress={onSubmitPress}
        >
          <Text style={styles.primaryButtonText}>{saveLabel}</Text>
        </Pressable>
      </View>
      {validationText ? <Text style={styles.warningText}>{validationText}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  buttonDisabled: {
    opacity: 0.55
  },
  inlineInfoBlock: {
    gap: 8,
    paddingVertical: 2
  },
  label: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: palette.brand,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  primaryButtonText: {
    color: palette.surface,
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.brand,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  secondaryButtonText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  warningText: {
    color: palette.danger,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  }
});
