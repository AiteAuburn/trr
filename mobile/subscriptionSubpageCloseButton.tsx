import { Pressable, StyleSheet, Text } from "react-native";

type SubscriptionSubpageCloseButtonProps = {
  accessibilityLabel: string;
  onPress: () => void;
};

export function SubscriptionSubpageCloseButton({
  accessibilityLabel,
  onPress
}: SubscriptionSubpageCloseButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.closeButton}
    >
      <Text style={styles.closeButtonText}>×</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  closeButtonText: {
    color: "#0F3F37",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 30
  }
});
