import { Pressable, StyleSheet, Text, View } from "react-native";

import { DailyRecordDetailRow } from "./dailyRecordDetailRow";

type HistoryDailyRecordDetailRow = {
  label: string;
  value: string;
};

export type HistoryDailyRecordEntryItem = {
  accessibilityLabel: string;
  detailRows: HistoryDailyRecordDetailRow[];
  key: string;
  payloadSummary: string;
  timeLabel: string;
};

export type HistoryDailyRecordSectionItem<TEntry extends HistoryDailyRecordEntryItem = HistoryDailyRecordEntryItem> = {
  countLabel: string;
  emptyCopy: string;
  entries: TEntry[];
  icon: string;
  id: string;
  title: string;
};

type HistoryDailyRecordSectionCardProps<TEntry extends HistoryDailyRecordEntryItem> = {
  section: HistoryDailyRecordSectionItem<TEntry>;
  onEntryPress: (item: TEntry) => void;
};

function historyDailyRecordDetailRowKey<TEntry extends HistoryDailyRecordEntryItem>(
  item: TEntry,
  row: HistoryDailyRecordDetailRow
) {
  return `${item.key}-${row.label}`;
}

function historyDailyRecordDetailRowLabel(row: HistoryDailyRecordDetailRow) {
  return row.label;
}

function historyDailyRecordDetailRowValue(row: HistoryDailyRecordDetailRow) {
  return row.value;
}

export function HistoryDailyRecordSectionCard<TEntry extends HistoryDailyRecordEntryItem>({
  section,
  onEntryPress
}: HistoryDailyRecordSectionCardProps<TEntry>) {
  return (
    <View style={styles.dailyRecordSectionCard}>
      <View style={styles.recordHeader}>
        <View style={styles.historyItemTitle}>
          <View style={styles.iconCircleSmall}>
            <Text>{section.icon}</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.label}>{section.title}</Text>
            <Text style={styles.evidence}>可新增多筆；每筆可點進詳情修改。</Text>
          </View>
        </View>
        <Text style={styles.countText}>{section.countLabel}</Text>
      </View>
      {section.entries.length > 0 ? (
        section.entries.map((item) => (
          <Pressable
            key={item.key}
            accessibilityLabel={item.accessibilityLabel}
            accessibilityRole="button"
            style={styles.dailyRecordEntryCard}
            onPress={() => onEntryPress(item)}
          >
            <View style={styles.recordHeader}>
              <View style={styles.timelineContent}>
                <Text style={styles.confidence}>{item.timeLabel}</Text>
                <Text style={styles.recordContent}>{item.payloadSummary}</Text>
              </View>
              <Text style={styles.countText}>看詳情</Text>
            </View>
            <View style={styles.detailRows}>
              {item.detailRows.map((row) => (
                <DailyRecordDetailRow
                  key={historyDailyRecordDetailRowKey(item, row)}
                  label={historyDailyRecordDetailRowLabel(row)}
                  value={historyDailyRecordDetailRowValue(row)}
                />
              ))}
            </View>
          </Pressable>
        ))
      ) : (
        <Text style={styles.evidence}>{section.emptyCopy}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  confidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  countText: {
    color: "#5F666A",
    fontSize: 13,
    fontWeight: "700"
  },
  dailyRecordEntryCard: {
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  dailyRecordSectionCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D6EEE4",
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  detailRows: {
    gap: 8,
    paddingVertical: 2
  },
  evidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  historyItemTitle: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10
  },
  iconCircleSmall: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  label: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  },
  recordContent: {
    color: "#1E1E1E",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  recordHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  timelineContent: {
    flex: 1,
    gap: 3
  }
});
