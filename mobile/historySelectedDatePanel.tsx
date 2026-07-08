import { StyleSheet, View } from "react-native";

import {
  HistoryDailyRecordEntryItem,
  HistoryDailyRecordSectionCard,
  HistoryDailyRecordSectionItem
} from "./historyDailyRecordSectionCard";
import { HistoryDetailModeTabs } from "./historyDetailModeTabs";
import { HistoryNoRangeRecordsCard } from "./historyNoRangeRecordsCard";
import { HistoryRawTranscriptCard } from "./historyRawTranscriptCard";
import { HistorySelectedDateHeader } from "./historySelectedDateHeader";
import { HistorySelectedSummaryCard } from "./historySelectedSummaryCard";

type HistorySelectedDatePanelProps<
  TDetailModeOption extends { accessibilityLabel: string; label: string; value: string },
  TSectionEntry extends HistoryDailyRecordEntryItem,
  TRawItem extends {
    key: string;
    rawText: string;
    sourceStatusLabel: string;
    timeLabel: string;
    typeLabel: string;
  }
> = {
  detailMode: string;
  detailModeOptions: TDetailModeOption[];
  emptyBody: string;
  emptyTitle: string;
  rawItems: TRawItem[];
  recordCount: number;
  sectionItems: Array<HistoryDailyRecordSectionItem<TSectionEntry>>;
  selectedDateLabel: string;
  selectedSourceLabel: string;
  selectedStorageLabel: string;
  selectedSummaryText: string;
  selectedSyncLabel: string;
  onDetailModePress: (item: TDetailModeOption) => void;
  onEntryPress: (item: TSectionEntry) => void;
};

export function HistorySelectedDatePanel<
  TDetailModeOption extends { accessibilityLabel: string; label: string; value: string },
  TSectionEntry extends HistoryDailyRecordEntryItem,
  TRawItem extends {
    key: string;
    rawText: string;
    sourceStatusLabel: string;
    timeLabel: string;
    typeLabel: string;
  }
>({
  detailMode,
  detailModeOptions,
  emptyBody,
  emptyTitle,
  rawItems,
  recordCount,
  sectionItems,
  selectedDateLabel,
  selectedSourceLabel,
  selectedStorageLabel,
  selectedSummaryText,
  selectedSyncLabel,
  onDetailModePress,
  onEntryPress
}: HistorySelectedDatePanelProps<TDetailModeOption, TSectionEntry, TRawItem>) {
  return (
    <View style={styles.historySelectedDatePanel}>
      <HistorySelectedDateHeader dateLabel={selectedDateLabel} storageLabel={selectedStorageLabel} />
      <HistorySelectedSummaryCard
        sourceLabel={selectedSourceLabel}
        summaryText={selectedSummaryText}
        syncLabel={selectedSyncLabel}
      />
      <HistoryDetailModeTabs activeValue={detailMode} options={detailModeOptions} onPress={onDetailModePress} />
      {recordCount === 0 ? (
        <HistoryNoRangeRecordsCard body={emptyBody} title={emptyTitle} />
      ) : detailMode === "structured" ? (
        <View style={styles.dailyRecordSectionList}>
          {sectionItems.map((section) => (
            <HistoryDailyRecordSectionCard
              key={`history-${section.id}`}
              section={section}
              onEntryPress={onEntryPress}
            />
          ))}
        </View>
      ) : (
        rawItems.map((item) => (
          <HistoryRawTranscriptCard
            key={item.key}
            rawText={item.rawText}
            sourceStatusLabel={item.sourceStatusLabel}
            timeLabel={item.timeLabel}
            typeLabel={item.typeLabel}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dailyRecordSectionList: {
    gap: 12
  },
  historySelectedDatePanel: {
    gap: 12
  }
});
