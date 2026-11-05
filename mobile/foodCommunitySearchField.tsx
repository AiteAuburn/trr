import { palette } from "./designTokens";
import { StyleSheet, TextInput } from "react-native";

type FoodCommunitySearchFieldProps = {
  accessibilityLabel: string;
  maxLength: number;
  onChangeText: (value: string) => void;
  value: string;
};

export function FoodCommunitySearchField({
  accessibilityLabel,
  maxLength,
  onChangeText,
  value
}: FoodCommunitySearchFieldProps) {
  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      autoCorrect={false}
      maxLength={maxLength}
      style={styles.input}
      placeholder="搜尋食物名稱"
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
  }
});
