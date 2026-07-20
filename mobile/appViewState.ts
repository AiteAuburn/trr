import type { SaveEntryMethod } from "./appTypes";
import {
  clampNumber,
  maxMobilePreviewRecords,
  maxMobileRejectedEvents
} from "./mobileBounds";
import type { AppScreen } from "./navigationConfig";
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
    displayCount: clampNumber(recordCount, 0, maxMobilePreviewRecords),
    hasWarnings: lowConfidenceRecordCount > 0 || rejectedEventCount > 0,
    hasRecords: recordCount > 0,
    isEmpty: recordCount === 0,
    lowConfidenceDisplayCount: clampNumber(lowConfidenceRecordCount, 0, maxMobilePreviewRecords),
    lowConfidenceRecordCount,
    recordCount,
    records,
    rejectedEventDisplayCount: clampNumber(rejectedEventCount, 0, maxMobileRejectedEvents),
    rejectedEventCount,
    rejectedEvents
  };
}

export function aiSaveConfirmState(value: {
  isBusy: boolean;
  protectedBackendReady: boolean;
  previewState: ReturnType<typeof previewRecordState>;
}) {
  const isBlockedByBackend = !value.protectedBackendReady;

  return {
    hasWarnings: value.previewState.hasWarnings,
    isBlockedByBackend,
    isSubmitDisabled: value.isBusy || isBlockedByBackend || value.previewState.isEmpty
  };
}

export function previewActionReturnState(returnScreen: AppScreen) {
  const isReturningToDailyRecord = returnScreen === "aiSaveConfirm";

  return {
    isDailyRecordRemoveConfirm: isReturningToDailyRecord,
    isReturningToDailyRecord
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
