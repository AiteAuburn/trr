import { Pressable, StyleSheet, Text, View } from "react-native";

type DoctorShareActionRowProps = {
  onReportPress: () => void;
  onTokenPress: () => void;
  reportAccessibilityLabel: string;
  reportLabel: string;
  tokenAccessibilityLabel: string;
  tokenLabel: string;
};

export function DoctorShareActionRow({
  onReportPress,
  onTokenPress,
  reportAccessibilityLabel,
  reportLabel,
  tokenAccessibilityLabel,
  tokenLabel
}: DoctorShareActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={tokenAccessibilityLabel}
        accessibilityRole="button"
        onPress={onTokenPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{tokenLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={reportAccessibilityLabel}
        accessibilityRole="button"
        onPress={onReportPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{reportLabel}</Text>
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
