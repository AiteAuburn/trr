import { Pressable, StyleSheet, Text, View } from "react-native";

type RecordingResultActionRowProps = {
  onRerecordPress: () => void;
  onUseTextPress: () => void;
  rerecordAccessibilityLabel: string;
  rerecordLabel: string;
  useTextAccessibilityLabel: string;
  useTextLabel: string;
};

export function RecordingResultActionRow({
  onRerecordPress,
  onUseTextPress,
  rerecordAccessibilityLabel,
  rerecordLabel,
  useTextAccessibilityLabel,
  useTextLabel
}: RecordingResultActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={rerecordAccessibilityLabel}
        accessibilityRole="button"
        onPress={onRerecordPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{rerecordLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={useTextAccessibilityLabel}
        accessibilityRole="button"
        onPress={onUseTextPress}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>{useTextLabel}</Text>
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
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#3FA67F",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  primaryButtonText: {
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
