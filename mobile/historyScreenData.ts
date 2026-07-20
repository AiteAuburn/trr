import { boundDateInputText, formatLocalDateInput, localDateKey } from "./dateTimeTransforms";
import { dailyRecordSummaryText } from "./dailyTranscriptTransforms";
import {
  dailyRecordEntryDisplayItem,
  dailyRecordSectionDefinitions,
  recordListDisplayItem
} from "./recordDisplay";
import type { PendingRecord, RecordItem } from "./recordBounds";

export type HistoryDetailMode = "structured" | "raw";

const maxDisplayTextLength = 160;
const maxDisplayDetailTextLength = 240;
const maxIdentifierTextLength = 128;
const maxMobilePreviewRecords = 20;
const maxMobileCountValue = 1_000_000;

export const historyDetailModes: Array<{ id: HistoryDetailMode; label: string; accessibilityCopy: string }> = [
  { id: "structured", label: "AI 整理", accessibilityCopy: "查看 AI 分析整理後的紀錄" },
  { id: "raw", label: "原始紀錄", accessibilityCopy: "查看原始語音轉文字內容" }
];

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string) {
  return boundDisplayText(value.replace(/[^a-zA-Z0-9_-]/g, "-"), maxIdentifierTextLength);
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

export function historyCalendarDayDisplayItem(date: Date, selectedDateKey: string, recordsByDate: Map<string, RecordItem[]>) {
  const dateKey = formatLocalDateInput(date);
  const recordCount = clampNumber(recordsByDate.get(dateKey)?.length ?? 0, 0, maxMobileCountValue);
  const dayLabel = boundDisplayText(String(date.getDate()), 4);
  return {
    key: `history-calendar-${boundIdentifier(dateKey)}`,
    value: dateKey,
    dayLabel,
    recordCount,
    hasRecords: recordCount > 0,
    isSelected: dateKey === selectedDateKey,
    accessibilityLabel: boundDisplayText(
      `${dateKey}，${recordCount > 0 ? `有 ${recordCount} 筆紀錄` : "沒有紀錄"}，點擊查看日期`,
      maxDisplayDetailTextLength
    )
  };
}

export function historyDetailModeDisplayItem(value: { id: HistoryDetailMode; label: string; accessibilityCopy: string }) {
  const label = boundDisplayText(value.label || "紀錄模式", 60);
  return {
    value: value.id,
    label,
    accessibilityLabel: boundDisplayText(value.accessibilityCopy || `查看${label}`, maxDisplayDetailTextLength)
  };
}

export function historyDetailModeDisplayItems(values: ReadonlyArray<{ id: HistoryDetailMode; label: string; accessibilityCopy: string }>) {
  return values.map(historyDetailModeDisplayItem);
}

export function historyRecordsByDateMap(records: RecordItem[]) {
  const groups = new Map<string, RecordItem[]>();
  for (const record of records) {
    const key = localDateKey(record.occurred_at);
    if (!key) {
      continue;
    }
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return groups;
}

function pendingRecordFromRecordItem(record: RecordItem): PendingRecord {
  return {
    profile_id: record.profile_id,
    record_type: record.record_type,
    occurred_at: record.occurred_at,
    payload_json: record.payload_json,
    metadata_json: record.metadata_json,
    source: record.source
  };
}

export function historyDailySyncSummary(records: RecordItem[], isLocalPreview: boolean) {
  const count = clampNumber(records.length, 0, maxMobileCountValue);
  if (count === 0) {
    return {
      syncLabel: boundDisplayText("沒有紀錄", 40),
      sourceLabel: boundDisplayText("尚無來源", 40),
      storageLabel: boundDisplayText("未同步 / 未儲存", 80)
    };
  }
  if (isLocalPreview) {
    return {
      syncLabel: boundDisplayText("尚未同步", 40),
      sourceLabel: boundDisplayText("本機", 40),
      storageLabel: boundDisplayText(`本機 ${count} 筆 · 雲端 0 筆`, 80)
    };
  }
  return {
    syncLabel: boundDisplayText("已同步", 40),
    sourceLabel: boundDisplayText("雲端", 40),
    storageLabel: boundDisplayText(`雲端 ${count} 筆 · 本機 0 筆待同步`, 80)
  };
}

export function historyDailySummaryDisplayItem(dateKey: string, records: RecordItem[], isLocalPreview: boolean) {
  const safeDateKey = boundDateInputText(dateKey);
  const pendingRecords = records.map(pendingRecordFromRecordItem);
  const syncSummary = historyDailySyncSummary(records, isLocalPreview);
  const recordCount = clampNumber(records.length, 0, maxMobileCountValue);
  return {
    key: `history-daily-summary-${boundIdentifier(safeDateKey)}`,
    value: safeDateKey,
    dateLabel: boundDisplayText(safeDateKey, 40),
    countLabel: boundDisplayText(`${recordCount} 筆紀錄`, 20),
    summaryText: dailyRecordSummaryText(pendingRecords),
    syncLabel: syncSummary.syncLabel,
    sourceLabel: syncSummary.sourceLabel,
    storageLabel: syncSummary.storageLabel,
    accessibilityLabel: boundDisplayText(
      `查看 ${safeDateKey} 每日摘要，${syncSummary.syncLabel}，${syncSummary.storageLabel}`,
      maxDisplayDetailTextLength
    )
  };
}

export function buildHistoryDailySummaryDisplayItems(recordsByDate: Map<string, RecordItem[]>, isLocalPreview: boolean) {
  return Array.from(recordsByDate.entries())
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([dateKey, dateRecords]) => historyDailySummaryDisplayItem(dateKey, dateRecords, isLocalPreview));
}

export function buildHistoryDailyRecordSectionDisplayItems(records: RecordItem[]) {
  return dailyRecordSectionDefinitions.map((definition) => {
    const entries = records
      .map((record, index) => ({ record, index }))
      .filter(({ record }) => definition.acceptedRecordTypes.includes(record.record_type))
      .map(({ record, index }) => ({
        ...dailyRecordEntryDisplayItem(pendingRecordFromRecordItem(record), index),
        record,
        accessibilityLabel: recordListDisplayItem(record, `history-daily-${index}`).accessibilityLabel
      }));
    return {
      ...definition,
      title: boundDisplayText(definition.title, 80),
      icon: boundDisplayText(definition.icon, 4),
      emptyCopy: boundDisplayText(definition.emptyCopy, maxDisplayDetailTextLength),
      countLabel: boundDisplayText(`${clampNumber(entries.length, 0, maxMobilePreviewRecords)} 筆`, 20),
      entries
    };
  });
}

export function historyRawRecordDisplayItem(record: RecordItem, index: number) {
  const item = recordListDisplayItem(record, `history-raw-${index}`);
  const sourceText = record.metadata_json?.source_text;
  const hasSourceText = typeof sourceText === "string" && sourceText.trim().length > 0;
  const rawText = hasSourceText
    ? boundDisplayText(sourceText, maxDisplayDetailTextLength)
    : "尚無原始逐字稿；此筆紀錄只保留結構化資料。";
  return {
    ...item,
    sourceStatusLabel: boundDisplayText(hasSourceText ? "原始逐字稿" : "僅結構化", 40),
    rawText
  };
}

export function historyRawRecordDisplayItems(records: RecordItem[]) {
  return records.map(historyRawRecordDisplayItem);
}
