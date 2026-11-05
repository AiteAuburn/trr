import { palette } from "./designTokens";
import { StyleSheet, Text } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

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
    backgroundColor: palette.brand,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  primaryButtonText: {
    color: palette.surface,
    fontSize: 15,
    fontWeight: "800"
  },
  warningText: {
    color: palette.danger,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19
  }
});
