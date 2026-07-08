import { Pressable, StyleSheet, Text } from "react-native";

type ManualRecordCreatePreviewActionProps = {
  accessibilityLabel: string;
  disabled: boolean;
  label: string;
  warningText: string | null;
  onPress: () => void;
};

export function ManualRecordCreatePreviewAction({
  accessibilityLabel,
  disabled,
  label,
  warningText,
  onPress
}: ManualRecordCreatePreviewActionProps) {
  return (
    <>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={[styles.primaryButtonFull, disabled ? styles.buttonDisabled : null]}
        disabled={disabled}
        onPress={onPress}
      >
        <Text style={styles.primaryButtonText}>{label}</Text>
      </Pressable>
      {warningText ? <Text style={styles.warningText}>{warningText}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  buttonDisabled: {
    opacity: 0.45
  },
  primaryButtonFull: {
    alignItems: "center",
    backgroundColor: "#3FA67F",
    borderRadius: 24,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800"
  },
  warningText: {
    color: "#C85D5D",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19
  }
});
