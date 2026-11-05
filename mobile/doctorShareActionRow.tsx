import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

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
