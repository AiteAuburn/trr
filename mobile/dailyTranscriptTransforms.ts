import { localDateKey } from "./dateTimeTransforms";
import type { AppScreen } from "./navigationConfig";
import {
  buildDailyRecordSectionDisplayItems,
  dailyRecordSectionDefinitions,
  rejectedPreviewDisplayItems as buildRejectedPreviewDisplayItems
} from "./recordDisplay";
import { boundParsePreviewResponse, type ParsePreviewResponse, type PendingRecord, type RecordItem } from "./recordBounds";

const maxListItems = 12;
const maxDisplayTextLength = 160;
const maxIdentifierTextLength = 128;
const maxDisplayDetailTextLength = 240;
const maxMobileCountValue = 1_000_000;
const maxMobilePreviewRecords = 20;
const maxMobileRejectedEvents = 40;
const maxTranscriptTextLength = 1200;
const maxUiMessageLength = 300;

export type DailyTranscriptEntry = {
  id: string;
  occurred_at: string;
  source_text: string;
  source: "voice" | "text";
};

export type DailyRecordReorganizationReason = "add" | "edit" | "delete";

export type DailyRecordSaveResponse = {
  daily_record: {
    id: string;
    profile_id: string;
    record_date: string;
    summary_text: string;
    record_ids: string[];
    preview_records_json: Record<string, unknown>[];
    transcript_entries_json: DailyTranscriptEntry[];
    source: string;
    created_at: string;
    updated_at: string;
  };
  records: RecordItem[];
};

export function parserTranscriptSource(voiceSeconds: number): DailyTranscriptEntry["source"] {
  return voiceSeconds > 0 ? "voice" : "text";
}

export function dailyRecordDraftScreenState(value: {
  currentScreen: AppScreen;
  hasPreview: boolean;
  hasUnsavedPreviewRecords: boolean;
  isBusy: boolean;
}) {
  const isFixedSaveVisible = value.currentScreen === "aiSaveConfirm" && value.hasPreview;
  const hasUnsavedDraft = value.currentScreen === "aiSaveConfirm" && value.hasUnsavedPreviewRecords;

  return {
    hasUnsavedDraft,
    isFixedSaveDockVisible: isFixedSaveVisible,
    isFixedSaveReturnDisabled: value.isBusy,
    isFixedSaveVisible,
    shouldGuardLeave: hasUnsavedDraft
  };
}

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string) {
  return boundDisplayText(value, maxIdentifierTextLength);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function recordTimeDisplay(value?: string) {
  if (!value) {
    return "尚無";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "尚無";
  }
  return boundDisplayText(
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }),
    40
  );
}

export function dailyRecordKeyFromRecords(records: PendingRecord[]) {
  const firstRecord = records[0];
  return firstRecord ? localDateKey(firstRecord.occurred_at) : "";
}

export function mergeSameDayParsePreviewDraft(
  current: ParsePreviewResponse | null,
  incoming: ParsePreviewResponse
) {
  if (!current || current.records.length === 0 || incoming.records.length === 0) {
    return incoming;
  }
  const currentKey = dailyRecordKeyFromRecords(current.records);
  const incomingKey = dailyRecordKeyFromRecords(incoming.records);
  if (!currentKey || currentKey !== incomingKey) {
    return incoming;
  }
  return boundParsePreviewResponse({
    ...incoming,
    records: [...current.records, ...incoming.records].slice(0, maxMobilePreviewRecords),
    rejected_events: [...current.rejected_events, ...incoming.rejected_events].slice(0, maxMobileRejectedEvents),
    segments: [...current.segments, ...incoming.segments].slice(0, maxListItems)
  });
}

export function aiReviewDateLabel(records: PendingRecord[]) {
  if (records.length === 0) {
    return "尚未解析日期時間";
  }
  const labels = records.map((record) =>
    new Date(record.occurred_at).toLocaleString("zh-TW", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  );
  const uniqueLabels = Array.from(new Set(labels));
  const label = uniqueLabels.length === 1
    ? uniqueLabels[0]
    : `${uniqueLabels[0]} 等 ${uniqueLabels.length} 個時間`;
  return boundDisplayText(label, 80);
}

export function aiReviewPreviewDisplayBundle(
  preview: ParsePreviewResponse | null,
  records: PendingRecord[],
  rejectedEvents: ParsePreviewResponse["rejected_events"]
) {
  return {
    dateLabel: boundDisplayText(preview ? aiReviewDateLabel(records) : "", maxDisplayDetailTextLength),
    rejectedItems: preview ? buildRejectedPreviewDisplayItems(rejectedEvents) : []
  };
}

export function dailyRecordDateLabel(records: PendingRecord[]) {
  if (records.length === 0) {
    return "今日紀錄";
  }
  const firstDate = new Date(records[0].occurred_at);
  if (Number.isNaN(firstDate.getTime())) {
    return "今日紀錄";
  }
  return boundDisplayText(
    firstDate.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short"
    }),
    80
  );
}

export function dailyRecordSummaryText(records: PendingRecord[]) {
  const counts = new Map<string, number>();
  for (const record of records) {
    counts.set(record.record_type, (counts.get(record.record_type) ?? 0) + 1);
  }
  const parts = dailyRecordSectionDefinitions
    .map((definition) => {
      const count = definition.acceptedRecordTypes.reduce(
        (sum, recordType) => sum + (counts.get(recordType) ?? 0),
        0
      );
      return count > 0 ? `${definition.title.replace("紀錄", "")}${clampNumber(count, 0, maxMobileCountValue)} 筆` : "";
    })
    .filter(Boolean);
  if (parts.length === 0) {
    return boundDisplayText("AI 已完成整理，但今天尚未產生可儲存的分類紀錄。", maxDisplayDetailTextLength);
  }
  return boundDisplayText(
    `AI 已整理今天內容：${parts.join("、")}。每次新增、編輯或刪除後，後續會重新整理今日摘要與分類內容。`,
    maxDisplayDetailTextLength
  );
}

export function dailyRecordDisplayBundle(preview: ParsePreviewResponse | null, records: PendingRecord[]) {
  return {
    dateText: preview ? dailyRecordDateLabel(records) : "",
    summaryText: preview ? dailyRecordSummaryText(records) : "",
    sectionItems: preview ? buildDailyRecordSectionDisplayItems(records) : []
  };
}

export function dailyRecordReorganizationReasonText(reason: DailyRecordReorganizationReason | null) {
  if (reason === "add") {
    return "新增後";
  }
  if (reason === "edit") {
    return "編輯後";
  }
  if (reason === "delete") {
    return "刪除後";
  }
  return "目前";
}

export function dailyRecordReorganizationStatusMessage(
  reason: DailyRecordReorganizationReason,
  count: number,
  revision: number
) {
  return boundDisplayText(
    `AI今日摘要已在${dailyRecordReorganizationReasonText(reason)}重新整理；目前 ${clampNumber(
      count,
      0,
      maxMobilePreviewRecords
    )} 筆，第 ${clampNumber(revision, 0, maxMobileCountValue)} 次整理。`,
    maxUiMessageLength
  );
}

export function dailyRecordReorganizationDisplayText(
  reason: DailyRecordReorganizationReason | null,
  revision: number
) {
  if (revision <= 0) {
    return "AI 今日摘要會依目前草稿即時整理。";
  }
  return boundDisplayText(
    `AI 今日摘要已於${dailyRecordReorganizationReasonText(reason)}重新整理 ${clampNumber(
      revision,
      0,
      maxMobileCountValue
    )} 次。`,
    maxDisplayDetailTextLength
  );
}

export function dailyRecordReorganizationDisplayBundle(
  reason: DailyRecordReorganizationReason | null,
  revision: number
) {
  return {
    summary: dailyRecordReorganizationDisplayText(reason, revision)
  };
}

export function todayTranscriptExpandedStatusMessage() {
  return boundDisplayText("今日錄音文字已在下方展開；不重新呼叫 STT、AI 或 backend。", maxUiMessageLength);
}

export function dailyRecordEntryMenuOpenStatusMessage(typeLabel: string) {
  return boundDisplayText(
    `已開啟${boundDisplayText(typeLabel, maxDisplayTextLength)}單筆管理；可選擇編輯或刪除，尚未寫入 backend。`,
    maxUiMessageLength
  );
}

export function createDailyTranscriptEntry(
  occurredAt: string,
  sourceText: string,
  source: "voice" | "text"
): DailyTranscriptEntry | null {
  const boundedText = boundDisplayText(sourceText, maxTranscriptTextLength);
  if (!boundedText.trim()) {
    return null;
  }
  const safeOccurredAt = boundDisplayText(occurredAt, 40);
  return {
    id: boundIdentifier(`daily-transcript-${safeOccurredAt}-${source}`),
    occurred_at: safeOccurredAt,
    source_text: boundedText,
    source
  };
}

export function boundDailyTranscriptEntries(entries: DailyTranscriptEntry[]): DailyTranscriptEntry[] {
  return entries.slice(-maxListItems).map((entry, index) => ({
    id: boundIdentifier(entry.id || `daily-transcript-${index}`),
    occurred_at: boundDisplayText(entry.occurred_at, 40),
    source_text: boundDisplayText(entry.source_text, maxTranscriptTextLength),
    source: (entry.source === "voice" ? "voice" : "text") as DailyTranscriptEntry["source"]
  }));
}

export function dailyTranscriptDisplayItems(
  preview: ParsePreviewResponse | null,
  entries: DailyTranscriptEntry[]
) {
  if (!preview) {
    return [];
  }
  const previewDayKey = dailyRecordKeyFromRecords(preview.records);
  const retainedItems = entries
    .filter((entry) => !previewDayKey || localDateKey(entry.occurred_at) === previewDayKey)
    .slice(-maxListItems)
    .map((entry, index) => ({
      key: `daily-transcript-retained-${boundIdentifier(entry.id)}-${clampNumber(index, 0, maxListItems)}`,
      timeLabel: boundDisplayText(recordTimeDisplay(entry.occurred_at), 40),
      sourceText: boundDisplayText(entry.source_text, maxDisplayDetailTextLength)
    }))
    .filter((item) => item.sourceText.length > 0);
  if (retainedItems.length > 0) {
    return retainedItems;
  }
  const fallbackText = preview.normalized_text || preview.transcript;
  const segmentItems = preview.segments
    .slice(0, maxListItems)
    .map((segment, index) => ({
      key: `daily-transcript-${boundIdentifier(segment.segment_id)}-${clampNumber(index, 0, maxListItems)}`,
      timeLabel: boundDisplayText(`第 ${clampNumber(index + 1, 1, maxListItems)} 段`, 40),
      sourceText: boundDisplayText(segment.source_text, maxDisplayDetailTextLength)
    }))
    .filter((item) => item.sourceText.length > 0);
  if (segmentItems.length > 0) {
    return segmentItems;
  }
  return fallbackText.trim().length > 0
    ? [
        {
          key: "daily-transcript-current",
          timeLabel: boundDisplayText("本次錄音", 40),
          sourceText: boundDisplayText(fallbackText, maxDisplayDetailTextLength)
        }
      ]
    : [];
}

export function dailyTranscriptDisplayBundle(
  preview: ParsePreviewResponse | null,
  entries: DailyTranscriptEntry[]
) {
  const items = dailyTranscriptDisplayItems(preview, entries);
  const countText = boundDisplayText(`${clampNumber(items.length, 0, maxListItems)} 段`, 20);
  return {
    items,
    title: boundDisplayText("今日錄音文字", maxDisplayTextLength),
    body: boundDisplayText("保留今天所有文字片段；目前先顯示本次整理內容。", maxDisplayDetailTextLength),
    countText,
    accessibilityLabel: boundDisplayText(`查看今日錄音文字，共 ${countText}`, maxDisplayDetailTextLength)
  };
}

export function dailyTranscriptEntriesForSave(
  preview: ParsePreviewResponse,
  entries: DailyTranscriptEntry[]
) {
  const previewDayKey = dailyRecordKeyFromRecords(preview.records);
  return boundDailyTranscriptEntries(
    entries.filter((entry) => !previewDayKey || localDateKey(entry.occurred_at) === previewDayKey)
  );
}

export function buildDailyRecordSaveRequest(
  preview: ParsePreviewResponse,
  recordsToSave: PendingRecord[],
  transcriptEntries: DailyTranscriptEntry[]
) {
  const firstRecord = recordsToSave[0];
  return {
    profile_id: firstRecord.profile_id,
    record_date: dailyRecordKeyFromRecords(preview.records) || localDateKey(firstRecord.occurred_at),
    summary_text: dailyRecordSummaryText(preview.records),
    records: recordsToSave,
    transcript_entries: dailyTranscriptEntriesForSave(preview, transcriptEntries),
    source: "ai_confirmation"
  };
}
