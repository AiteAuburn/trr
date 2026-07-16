import { Pressable, StyleSheet, Text } from "react-native";

type NativeDebugActionButtonProps = {
  accessibilityLabel: string;
  disabled: boolean;
  label: string;
  onPress: () => void;
};

export function NativeDebugActionButton({
  accessibilityLabel,
  disabled,
  label,
  onPress
}: NativeDebugActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.secondaryButton, disabled ? styles.buttonDisabled : null]}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
