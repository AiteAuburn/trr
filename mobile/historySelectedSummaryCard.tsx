import { palette } from "./designTokens";
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
    backgroundColor: palette.surface,
    borderColor: palette.accentBorder,
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
    backgroundColor: palette.accentBorder,
    borderRadius: 999,
    color: palette.ink,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  historyStatusPillMuted: {
    backgroundColor: palette.neutral,
    borderRadius: 999,
    color: palette.secondary,
    fontSize: 12,
    fontWeight: "700",
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
    backgroundColor: palette.wash,
    borderColor: palette.accentBorder,
    borderRadius: 999,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  recordContent: {
    color: palette.text,
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
