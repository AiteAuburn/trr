import { Pressable, StyleSheet, Text, View } from "react-native";

type SubscriptionSubpageActionRowProps = {
  actionAccessibilityLabel: string;
  actionLabel: string;
  onActionPress: () => void;
  onReturnPress: () => void;
  returnAccessibilityLabel: string;
  returnLabel: string;
};

export function SubscriptionSubpageActionRow({
  actionAccessibilityLabel,
  actionLabel,
  onActionPress,
  onReturnPress,
  returnAccessibilityLabel,
  returnLabel
}: SubscriptionSubpageActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={returnAccessibilityLabel}
        accessibilityRole="button"
        onPress={onReturnPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{returnLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={actionAccessibilityLabel}
        accessibilityRole="button"
        onPress={onActionPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{actionLabel}</Text>
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
