import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

type DailyRecordEntryActionRowProps = {
  editAccessibilityLabel: string;
  editLabel: string;
  onEditPress: () => void;
  onRemovePress: () => void;
  removeAccessibilityLabel: string;
  removeLabel: string;
};

export function DailyRecordEntryActionRow({
  editAccessibilityLabel,
  editLabel,
  onEditPress,
  onRemovePress,
  removeAccessibilityLabel,
  removeLabel
}: DailyRecordEntryActionRowProps) {
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
    backgroundColor: palette.danger,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  dangerButtonText: {
    color: palette.surface,
    fontSize: 14,
    fontWeight: "800"
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
