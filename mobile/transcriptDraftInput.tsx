import { StyleProp, TextInput, TextStyle } from "react-native";

type TranscriptDraftInputProps = {
  accessibilityLabel: string;
  inputStyle: StyleProp<TextStyle>;
  maxLength: number;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
};

export function TranscriptDraftInput({
  accessibilityLabel,
  inputStyle,
  maxLength,
  onChangeText,
  placeholder,
  value
}: TranscriptDraftInputProps) {
  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      value={value}
      onChangeText={onChangeText}
      maxLength={maxLength}
      autoCapitalize="none"
      autoCorrect={false}
      multiline
      textAlignVertical="top"
      style={inputStyle}
      placeholder={placeholder}
    />
  );
}
