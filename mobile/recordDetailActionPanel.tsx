import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

type RecordDetailActionPanelProps = {
  canManageRecord: boolean;
  deleteAccessibilityLabel: string;
  disabled: boolean;
  editAccessibilityLabel: string;
  editLabel: string;
  onDeletePress: () => void;
  onEditPress: () => void;
};

export function RecordDetailActionPanel({
  canManageRecord,
  deleteAccessibilityLabel,
  disabled,
  editAccessibilityLabel,
  editLabel,
  onDeletePress,
  onEditPress
}: RecordDetailActionPanelProps) {
  if (!canManageRecord) {
    return <Text style={styles.evidence}>請從今日或歷史頁選擇真實紀錄；未選擇時不可編輯或刪除。</Text>;
  }

  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={editAccessibilityLabel}
        accessibilityRole="button"
        style={styles.secondaryButton}
        onPress={onEditPress}
      >
        <Text style={styles.secondaryButtonText}>{editLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={deleteAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={[styles.dangerButton, disabled ? styles.buttonDisabled : null]}
        disabled={disabled}
        onPress={onDeletePress}
      >
        <Text style={styles.dangerButtonText}>刪除</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  buttonDisabled: {
    opacity: 0.55
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: "#D94A38",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  dangerButtonText: {
    color: palette.surface,
    fontSize: 15,
    fontWeight: "700"
  },
  evidence: {
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.brand,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  secondaryButtonText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800"
  }
});
