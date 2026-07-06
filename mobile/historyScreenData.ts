import { formatLocalDateInput } from "./dateTimeTransforms";
import type { RecordItem } from "./recordBounds";

export type HistoryDetailMode = "structured" | "raw";

const maxDisplayTextLength = 160;
const maxDisplayDetailTextLength = 240;
const maxIdentifierTextLength = 128;
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
