import { StyleSheet, Text, View } from "react-native";

import { HistoryDailySummaryCard } from "./historyDailySummaryCard";
import { HistoryNoRangeRecordsCard } from "./historyNoRangeRecordsCard";

export type HistoryDailySummaryTableItem = {
  accessibilityLabel: string;
  countLabel: string;
  dateLabel: string;
  key: string;
  sourceLabel: string;
  storageLabel: string;
  summaryText: string;
  syncLabel: string;
  value: string;
};

type HistoryDailySummaryTableProps<TItem extends HistoryDailySummaryTableItem> = {
  emptyBody: string;
  emptyTitle: string;
  items: TItem[];
  selectedDate: string;
  onSummaryPress: (item: TItem) => void;
};

export function HistoryDailySummaryTable<TItem extends HistoryDailySummaryTableItem>({
  emptyBody,
  emptyTitle,
  items,
  selectedDate,
  onSummaryPress
}: HistoryDailySummaryTableProps<TItem>) {
  return (
    <View style={styles.historyDailySummaryTable}>
      <View style={styles.sectionHeader}>
        <View style={styles.timelineContent}>
          <Text style={styles.label}>每日摘要表</Text>
          <Text style={styles.evidence}>點日期查看完整每日紀錄、同步狀態與各分類內容。</Text>
        </View>
      </View>
      {items.length > 0 ? (
        items.map((item) => (
          <HistoryDailySummaryCard
            key={item.key}
            accessibilityLabel={item.accessibilityLabel}
            countLabel={item.countLabel}
            dateLabel={item.dateLabel}
            selected={item.value === selectedDate}
            sourceLabel={item.sourceLabel}
            storageLabel={item.storageLabel}
            summaryText={item.summaryText}
            syncLabel={item.syncLabel}
            onPress={() => onSummaryPress(item)}
          />
        ))
      ) : (
        <HistoryNoRangeRecordsCard body={emptyBody} title={emptyTitle} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  evidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  historyDailySummaryTable: {
    gap: 10
  },
  label: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  timelineContent: {
    flex: 1,
    gap: 3
  }
});
