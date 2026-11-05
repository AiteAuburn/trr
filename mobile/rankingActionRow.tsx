import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

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
