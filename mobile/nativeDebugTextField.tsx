import { StyleSheet, TextInput } from "react-native";

type NativeDebugTextFieldProps = {
  accessibilityLabel: string;
  disabled: boolean;
  maxLength: number;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
};

export function NativeDebugTextField({
  accessibilityLabel,
  disabled,
  maxLength,
  onChangeText,
  placeholder,
  value
}: NativeDebugTextFieldProps) {
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
      placeholder={placeholder}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    color: "#1E1E1E",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  inputDisabled: {
    opacity: 0.55
  }
});
