import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

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
    backgroundColor: palette.wash,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  secondaryButtonText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800"
  }
});
