import { Pressable, StyleSheet, Text, View } from "react-native";

import { HighlightBulletRow } from "./highlightBulletRow";

type ManualRecordConfirmFooterActionsProps = {
  checklistItems: string[];
  preCheckTitle: string;
  returnAccessibilityLabel: string;
  returnDisabled: boolean;
  returnLabel: string;
  submitAccessibilityLabel: string;
  submitDisabled: boolean;
  submitLabel: string;
  warningText: string | null;
  onReturnPress: () => void;
  onSubmitPress: () => void;
};

export function ManualRecordConfirmFooterActions({
  checklistItems,
  preCheckTitle,
  returnAccessibilityLabel,
  returnDisabled,
  returnLabel,
  submitAccessibilityLabel,
  submitDisabled,
  submitLabel,
  warningText,
  onReturnPress,
  onSubmitPress
}: ManualRecordConfirmFooterActionsProps) {
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
          accessibilityLabel={returnAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: returnDisabled }}
          style={[styles.secondaryButton, returnDisabled ? styles.buttonDisabled : null]}
          disabled={returnDisabled}
          onPress={onReturnPress}
        >
          <Text style={styles.secondaryButtonText}>{returnLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={submitAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: submitDisabled }}
          style={[styles.primaryButton, submitDisabled ? styles.buttonDisabled : null]}
          disabled={submitDisabled}
          onPress={onSubmitPress}
        >
          <Text style={styles.primaryButtonText}>{submitLabel}</Text>
        </Pressable>
      </View>
      {warningText ? <Text style={styles.warningText}>{warningText}</Text> : null}
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
