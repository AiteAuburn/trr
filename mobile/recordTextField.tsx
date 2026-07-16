import { StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, View } from "react-native";

import { FieldLabel } from "./fieldLabel";

type RecordTextFieldProps = {
  accessibilityLabel: string;
  icon: string;
  inputStyle?: StyleProp<TextStyle>;
  keyboardType?: TextInputProps["keyboardType"];
  label: string;
  maxLength: number;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  textAlignVertical?: TextInputProps["textAlignVertical"];
  value: string;
};

export function RecordTextField({
  accessibilityLabel,
  icon,
  inputStyle,
  keyboardType,
  label,
  maxLength,
  multiline,
  onChangeText,
  placeholder,
  textAlignVertical,
  value
}: RecordTextFieldProps) {
  return (
    <View style={styles.formField}>
      <FieldLabel icon={icon} label={label} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={multiline}
        textAlignVertical={textAlignVertical}
        style={inputStyle ?? recordTextFieldStyles.input}
        placeholder={placeholder}
      />
    </View>
  );
}

export const recordTextFieldStyles = StyleSheet.create({
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    color: "#1E1E1E",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  multilineField: {
    lineHeight: 22,
    minHeight: 96
  }
});

const styles = StyleSheet.create({
  formField: {
    gap: 8
  }
});
