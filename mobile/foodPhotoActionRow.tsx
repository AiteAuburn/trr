import { Pressable, StyleSheet, Text, View } from "react-native";

type FoodPhotoActionRowProps = {
  accessibilityLabel: string;
  label: string;
  onPress: () => void;
};

export function FoodPhotoActionRow({
  accessibilityLabel,
  label,
  onPress
}: FoodPhotoActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={onPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end"
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
