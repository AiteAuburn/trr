import type { SaveEntryMethod } from "./appTypes";
import { clampNumber } from "./mobileBounds";
import {
  lowConfidencePendingRecordCount,
  type ParsePreviewResponse,
  type RecordItem
} from "./recordBounds";

export function recordCollectionState(
  records: readonly RecordItem[],
  syncLimit: number,
  cacheLimit: number,
  displayLimit: number
) {
  const recordCount = records.length;

  return {
    displayCount: clampNumber(recordCount, 0, displayLimit),
    hasRecords: recordCount > 0,
    isEmpty: recordCount === 0,
    isAtCacheLimit: recordCount >= cacheLimit,
    isAtSyncBoundary: recordCount >= syncLimit,
    lastRecord: records[recordCount - 1] ?? null,
    recordCount
  };
}

export function previewRecordState(preview: ParsePreviewResponse | null) {
  const records = preview?.records ?? [];
  const rejectedEvents = preview?.rejected_events ?? [];
  const recordCount = records.length;
  const lowConfidenceRecordCount = lowConfidencePendingRecordCount(records);
  const rejectedEventCount = rejectedEvents.length;

  return {
    hasWarnings: lowConfidenceRecordCount > 0 || rejectedEventCount > 0,
    hasRecords: recordCount > 0,
    isEmpty: recordCount === 0,
    lowConfidenceRecordCount,
    recordCount,
    records,
    rejectedEventCount,
    rejectedEvents
  };
}

export function saveSuccessState(lastSaveEntryMethod: SaveEntryMethod, hasUnsavedPreviewRecords: boolean) {
  const isManualSave = lastSaveEntryMethod === "manual";

  return {
    canContinueManual: isManualSave && !hasUnsavedPreviewRecords,
    canContinueRecordEntry: !hasUnsavedPreviewRecords,
    hasManualFallbackWithAiCandidates: isManualSave && hasUnsavedPreviewRecords,
    hasPartialAiSave: lastSaveEntryMethod === "ai" && hasUnsavedPreviewRecords,
    hasUnsavedPreviewRecords,
    isManualSave,
    shouldPauseEntryActions: hasUnsavedPreviewRecords
  };
}
