import { palette } from "./designTokens";
import { StyleSheet, TextInput } from "react-native";

type BackendUrlFieldProps = {
  accessibilityLabel: string;
  disabled: boolean;
  maxLength: number;
  onChangeText: (value: string) => void;
  value: string;
};

export function BackendUrlField({
  accessibilityLabel,
  disabled,
  maxLength,
  onChangeText,
  value
}: BackendUrlFieldProps) {
  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      value={value}
      onChangeText={onChangeText}
      maxLength={maxLength}
      autoCapitalize="none"
      autoCorrect={false}
      editable={!disabled}
      accessibilityState={{ disabled }}
      style={[styles.input, disabled ? styles.inputDisabled : null]}
      placeholder="http://192.168.1.50:8000"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  inputDisabled: {
    opacity: 0.55
  }
});
