import { Pressable, StyleSheet, Text, View } from "react-native";

type SaveSuccessActionRowProps = {
  canContinueManual: boolean;
  canContinueRecordEntry: boolean;
  continueManualAccessibilityLabel: string;
  continueManualLabel: string;
  detailAccessibilityLabel: string;
  detailLabel: string;
  hasUnsavedPreviewRecords: boolean;
  onContinueManualPress: () => void;
  onProcessUnsavedPress: () => void;
  onRecordEntryPress: () => void;
  onReturnTodayPress: () => void;
  onViewDetailPress: () => void;
  pauseEntryText: string;
  processUnsavedAccessibilityLabel: string;
  processUnsavedLabel: string;
  recordEntryAccessibilityLabel: string;
  recordEntryLabel: string;
  returnTodayAccessibilityLabel: string;
  returnTodayLabel: string;
  shouldPauseEntryActions: boolean;
  showDetail: boolean;
  voiceTextLabel: string;
};

export function SaveSuccessActionRow({
  canContinueManual,
  canContinueRecordEntry,
  continueManualAccessibilityLabel,
  continueManualLabel,
  detailAccessibilityLabel,
  detailLabel,
  hasUnsavedPreviewRecords,
  onContinueManualPress,
  onProcessUnsavedPress,
  onRecordEntryPress,
  onReturnTodayPress,
  onViewDetailPress,
  pauseEntryText,
  processUnsavedAccessibilityLabel,
  processUnsavedLabel,
  recordEntryAccessibilityLabel,
  recordEntryLabel,
  returnTodayAccessibilityLabel,
  returnTodayLabel,
  shouldPauseEntryActions,
  showDetail,
  voiceTextLabel
}: SaveSuccessActionRowProps) {
  return (
    <View style={styles.actionRow}>
      {canContinueManual ? (
        <Pressable
          accessibilityLabel={continueManualAccessibilityLabel}
          accessibilityRole="button"
          onPress={onContinueManualPress}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>{continueManualLabel}</Text>
        </Pressable>
      ) : canContinueRecordEntry ? (
        <Pressable
          accessibilityLabel={recordEntryAccessibilityLabel}
          accessibilityRole="button"
          onPress={onRecordEntryPress}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>{recordEntryLabel}</Text>
        </Pressable>
      ) : null}
      {canContinueManual ? (
        <Pressable
          accessibilityLabel={recordEntryAccessibilityLabel}
          accessibilityRole="button"
          onPress={onRecordEntryPress}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>{voiceTextLabel}</Text>
        </Pressable>
      ) : shouldPauseEntryActions ? (
        <Text style={styles.evidence}>{pauseEntryText}</Text>
      ) : null}
      {showDetail ? (
        <Pressable
          accessibilityLabel={detailAccessibilityLabel}
          accessibilityRole="button"
          onPress={onViewDetailPress}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>{detailLabel}</Text>
        </Pressable>
      ) : null}
      {hasUnsavedPreviewRecords ? (
        <Pressable
          accessibilityLabel={processUnsavedAccessibilityLabel}
          accessibilityRole="button"
          onPress={onProcessUnsavedPress}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>{processUnsavedLabel}</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityLabel={returnTodayAccessibilityLabel}
          accessibilityRole="button"
          onPress={onReturnTodayPress}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>{returnTodayLabel}</Text>
        </Pressable>
      )}
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
  evidence: {
    color: "#5E746F",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 20
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
