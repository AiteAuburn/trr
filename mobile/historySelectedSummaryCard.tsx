import { StyleSheet, Text, View } from "react-native";

type HistorySelectedSummaryCardProps = {
  sourceLabel: string;
  summaryText: string;
  syncLabel: string;
};

export function HistorySelectedSummaryCard({ sourceLabel, summaryText, syncLabel }: HistorySelectedSummaryCardProps) {
  return (
    <View style={styles.dailySummaryCard}>
      <View style={styles.historyDailySummaryHeader}>
        <View style={styles.timelineContent}>
          <Text style={styles.previewModeBadge}>AI今日摘要</Text>
          <Text style={styles.recordContent}>{summaryText}</Text>
        </View>
        <View style={styles.historyStatusPillRow}>
          <Text style={styles.historyStatusPill}>{syncLabel}</Text>
          <Text style={styles.historyStatusPillMuted}>{sourceLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dailySummaryCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D6EEE4",
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 16
  },
  historyDailySummaryHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
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
  previewModeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF6F1",
    borderColor: "#D6EEE4",
    borderRadius: 999,
    borderWidth: 1,
    color: "#0F3F37",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5
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
