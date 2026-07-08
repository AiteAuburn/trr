import { Pressable, StyleSheet, Text, View } from "react-native";

import { HighlightBulletRow } from "./highlightBulletRow";

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
      <View style={styles.inlineInfoBlock}>
        <Text style={styles.label}>{preCheckTitle}</Text>
        {checklistItems.map((item) => (
          <HighlightBulletRow key={item} text={item} />
        ))}
      </View>
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
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#3FA67F",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#3FA67F",
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  secondaryButtonText: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  },
  warningText: {
    color: "#C85D5D",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  }
});
