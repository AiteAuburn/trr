import { StyleSheet, TextInput } from "react-native";

type CommunityPublicDisplayNameFieldProps = {
  accessibilityLabel: string;
  maxLength: number;
  onChangeText: (value: string) => void;
  value: string;
};

export function CommunityPublicDisplayNameField({
  accessibilityLabel,
  maxLength,
  onChangeText,
  value
}: CommunityPublicDisplayNameFieldProps) {
  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      value={value}
      onChangeText={onChangeText}
      maxLength={maxLength}
      style={styles.input}
      placeholder="社群公開顯示名稱"
      autoCapitalize="none"
      autoCorrect={false}
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
  }
});
