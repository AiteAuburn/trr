import { Pressable, StyleSheet, Text, View } from "react-native";

type HistoryDailySummaryCardProps = {
  accessibilityLabel: string;
  countLabel: string;
  dateLabel: string;
  selected: boolean;
  sourceLabel: string;
  storageLabel: string;
  summaryText: string;
  syncLabel: string;
  onPress: () => void;
};

export function HistoryDailySummaryCard({
  accessibilityLabel,
  countLabel,
  dateLabel,
  selected,
  sourceLabel,
  storageLabel,
  summaryText,
  syncLabel,
  onPress
}: HistoryDailySummaryCardProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.historyDailySummaryCard, selected ? styles.historyDailySummaryCardSelected : null]}
      onPress={onPress}
    >
      <View style={styles.historyDailySummaryHeader}>
        <View style={styles.timelineContent}>
          <Text style={styles.historyItemText}>{dateLabel}</Text>
          <Text style={styles.evidence}>{countLabel}</Text>
        </View>
        <View style={styles.historyStatusPillRow}>
          <Text style={styles.historyStatusPill}>{syncLabel}</Text>
          <Text style={styles.historyStatusPillMuted}>{sourceLabel}</Text>
        </View>
      </View>
      <Text style={styles.recordContent}>{summaryText}</Text>
      <Text style={styles.confidence}>{storageLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  confidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  evidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  historyDailySummaryCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  historyDailySummaryCardSelected: {
    backgroundColor: "#EAF6F1",
    borderColor: "#3FA67F"
  },
  historyDailySummaryHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
  },
  historyItemText: {
    color: "#1E1E1E",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21
  },
  historyStatusPill: {
    backgroundColor: "#DCEFE7",
    borderRadius: 999,
    color: "#0F3F37",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  historyStatusPillMuted: {
    backgroundColor: "#F1F4F2",
    borderRadius: 999,
    color: "#5F666A",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  historyStatusPillRow: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end"
  },
  recordContent: {
    color: "#1E1E1E",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  timelineContent: {
    flex: 1,
    gap: 4
  }
});
