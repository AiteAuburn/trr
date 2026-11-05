import { palette } from "./designTokens";
import { StyleSheet, Text } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

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
