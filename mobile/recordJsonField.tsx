import { StyleProp, TextInput, TextInputProps, TextStyle } from "react-native";

import { FieldLabel } from "./fieldLabel";

type RecordJsonFieldProps = {
  accessibilityLabel: string;
  inputStyle: StyleProp<TextStyle>;
  maxLength: number;
  onChangeText: (value: string) => void;
  value: string;
};

export function RecordJsonField({
  accessibilityLabel,
  inputStyle,
  maxLength,
  onChangeText,
  value
}: RecordJsonFieldProps) {
  const textAlignVertical: TextInputProps["textAlignVertical"] = "top";

  return (
    <>
      <FieldLabel icon={"{}"} label={"payload_json"} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        textAlignVertical={textAlignVertical}
        style={inputStyle}
      />
    </>
  );
}
