import { Pressable, StyleSheet, Text, View } from "react-native";

type RankingActionRowProps = {
  onOptInPress: () => void;
  onPublicPress: () => void;
  optInAccessibilityLabel: string;
  optInLabel: string;
  publicAccessibilityLabel: string;
  publicLabel: string;
};

export function RankingActionRow({
  onOptInPress,
  onPublicPress,
  optInAccessibilityLabel,
  optInLabel,
  publicAccessibilityLabel,
  publicLabel
}: RankingActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={publicAccessibilityLabel}
        accessibilityRole="button"
        onPress={onPublicPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{publicLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={optInAccessibilityLabel}
        accessibilityRole="button"
        onPress={onOptInPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{optInLabel}</Text>
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
