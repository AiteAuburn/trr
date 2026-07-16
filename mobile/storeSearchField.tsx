import { StyleSheet, Text, TextInput, View } from "react-native";

type StoreSearchFieldProps = {
  accessibilityLabel: string;
  maxLength: number;
  onChangeText: (value: string) => void;
  value: string;
};

export function StoreSearchField({
  accessibilityLabel,
  maxLength,
  onChangeText,
  value
}: StoreSearchFieldProps) {
  return (
    <View style={styles.searchField}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        style={styles.searchInput}
        placeholder="搜尋商品"
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchField: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  searchIcon: {
    color: "#3FA67F",
    fontSize: 18,
    fontWeight: "900"
  },
  searchInput: {
    color: "#1E1E1E",
    flex: 1,
    fontSize: 16,
    padding: 0
  }
});
