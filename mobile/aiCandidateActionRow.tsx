import { Pressable, StyleSheet, Text, View } from "react-native";

type AiCandidateActionRowProps = {
  editAccessibilityLabel: string;
  editLabel: string;
  onEditPress: () => void;
  onRemovePress: () => void;
  removeAccessibilityLabel: string;
  removeLabel: string;
};

export function AiCandidateActionRow({
  editAccessibilityLabel,
  editLabel,
  onEditPress,
  onRemovePress,
  removeAccessibilityLabel,
  removeLabel
}: AiCandidateActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={editAccessibilityLabel}
        accessibilityRole="button"
        onPress={onEditPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{editLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={removeAccessibilityLabel}
        accessibilityRole="button"
        onPress={onRemovePress}
        style={styles.dangerButton}
      >
        <Text style={styles.dangerButtonText}>{removeLabel}</Text>
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
  dangerButton: {
    alignItems: "center",
    backgroundColor: "#C85D5D",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  dangerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800"
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
