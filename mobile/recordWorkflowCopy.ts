const maxUiMessageLength = 300;
const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxMobileCountValue = 1_000_000;

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function boundUiMessage(value: string) {
  return value.slice(0, maxUiMessageLength);
}

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function safeUiError(error: unknown, fallback: string) {
  if (error instanceof Error && /^\S+ failed: \d{3}$/.test(error.message)) {
    return boundUiMessage(error.message);
  }
  return boundUiMessage(fallback);
}

export function aiSaveUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前不會送出 AI 候選儲存請求。`);
}

export function aiPartialSaveFailureStatusMessage(message: string) {
  return boundUiMessage(`${message}；已保留未儲存候選紀錄，不會自動重試。`);
}

export function aiSaveProgressStatusMessage() {
  return boundUiMessage("儲存今日紀錄...");
}

export function aiSaveSuccessStatusMessage() {
  return boundUiMessage("已儲存");
}

export function aiSaveFailureStatusMessage(error: unknown) {
  return safeUiError(error, "儲存失敗");
}

export function aiSaveRecordsStatusMessage(count: number) {
  return boundUiMessage(`已更新今日紀錄，新增 ${clampNumber(count, 0, maxMobileCountValue)} 筆紀錄`);
}

export function aiSaveSuccessSummaryMessage(count: number) {
  return boundUiMessage(`已儲存今日紀錄，包含 ${clampNumber(count, 0, maxMobileCountValue)} 筆 AI 整理紀錄`);
}

export function aiPartialSaveRecordsStatusMessage(savedCount: number, unsavedCount: number) {
  return boundUiMessage(
    `已新增 ${clampNumber(savedCount, 0, maxMobileCountValue)} 筆；${clampNumber(
      unsavedCount,
      0,
      maxMobileCountValue
    )} 筆尚未儲存`
  );
}

export function aiPartialSaveSummaryMessage(savedCount: number, unsavedCount: number) {
  return boundUiMessage(
    `已儲存 ${clampNumber(savedCount, 0, maxMobileCountValue)} 筆；${clampNumber(
      unsavedCount,
      0,
      maxMobileCountValue
    )} 筆尚未儲存，請返回確認頁檢查。`
  );
}

export function parserBackendUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前不送出 parser 請求，避免無效重試與額外成本。`);
}

export function parserModelUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message}；目前不送出 parser 請求，請先在設定選擇可用模型。`);
}

export function parserSampleBlockedStatusMessage() {
  return boundUiMessage("範例文字不會送入 parser；請改成自己的紀錄內容，或使用手動新增避免 LLM 成本。");
}

export function parserProgressStatusMessage() {
  return boundUiMessage("送入 parser...");
}

export function parserSuccessStatusMessage(count: number) {
  return boundUiMessage(`整理完成：${clampNumber(count, 0, maxMobileCountValue)} 筆候選紀錄`);
}

export function parserVoiceQuotaSyncedStatusMessage(count: number, voiceSeconds: number) {
  return boundUiMessage(
    `整理完成：${clampNumber(count, 0, maxMobileCountValue)} 筆候選紀錄；已送出 ${clampNumber(voiceSeconds, 0, maxMobileCountValue)} 秒語音額度。`
  );
}

export function parserFailureStatusMessage(error: unknown) {
  return safeUiError(error, "Parser 失敗");
}

export function parserFailureRecoveryMessage(message: string) {
  return boundUiMessage(`${message}。可以修改文字後再整理，或改用手動新增避免再次呼叫 parser。`);
}

export function aiReviewNoCandidateTitleCopy() {
  return boundDisplayText("沒有可儲存的候選紀錄", maxDisplayTextLength);
}

export function aiReviewNoCandidateBodyCopy() {
  return boundDisplayText("請返回修改文字，或改用手動新增。", maxDisplayDetailTextLength);
}

export function aiReviewNoCandidateBoundaryCopy() {
  return boundDisplayText("不會送出儲存請求，也不會新增額外 AI 呼叫。", maxDisplayDetailTextLength);
}

export function aiReviewNoPreviewTitleCopy() {
  return boundDisplayText("尚未產生整理結果", maxDisplayTextLength);
}

export function aiReviewNoPreviewBodyCopy() {
  return boundDisplayText("請先完成文字確認，再進行 AI 整理。", maxDisplayDetailTextLength);
}

export function aiReviewIntroCopy() {
  return boundDisplayText("儲存前請逐筆確認；修改候選紀錄不會重新呼叫 AI。", maxDisplayDetailTextLength);
}

export function aiReviewLowConfidenceCopy() {
  return boundDisplayText("信心偏低，請仔細確認後再儲存。", maxDisplayDetailTextLength);
}

export function aiReviewRejectedEventsCopy() {
  return boundDisplayText("以下片段沒有轉成候選紀錄；不會自動儲存，也不會自動重新呼叫 AI。", maxDisplayDetailTextLength);
}

export function aiReviewRejectedReasonCopy(reasonLabel: string) {
  return boundDisplayText(`原因：${boundDisplayText(reasonLabel, 80)}`, maxDisplayDetailTextLength);
}

export function aiReviewBackendRequiredCopy() {
  return boundDisplayText("請先連線 backend，才可儲存候選紀錄。", maxDisplayDetailTextLength);
}

export function aiSaveConfirmIntroCopy() {
  return boundDisplayText(
    "AI 已整理成今天唯一的每日紀錄草稿；按下儲存今日紀錄後才會送到後端建立紀錄。",
    maxDisplayDetailTextLength
  );
}

export function aiSaveConfirmReadyStatusMessage() {
  return boundUiMessage("已產生每日紀錄草稿；請確認分類內容後再儲存今日紀錄。");
}

export function aiSaveConfirmReturnStatusMessage() {
  return boundUiMessage("已返回 AI 整理確認；每日紀錄草稿保留，可繼續編輯或移除候選。");
}

export function aiSaveConfirmSubmitLabel(isBusy: boolean, isBlockedByBackend: boolean, hasWarnings: boolean) {
  return boundDisplayText(
    isBusy
      ? "儲存中..."
      : isBlockedByBackend
        ? "等待 backend 連線"
        : hasWarnings
          ? "了解提醒並儲存今日紀錄"
          : "儲存今日紀錄",
    maxDisplayTextLength
  );
}

export function aiCandidateEditOpenStatusMessage() {
  return boundUiMessage("請確認 AI 整理的單筆紀錄");
}

export function aiCandidateEditCancelStatusMessage() {
  return boundUiMessage("已取消修改；候選紀錄保留在 AI 整理確認清單。");
}

export function aiCandidateRemoveConfirmStatusMessage() {
  return boundUiMessage("請確認是否移除這筆 AI 候選紀錄");
}

export function aiCandidateRemoveCancelStatusMessage() {
  return boundUiMessage("已取消移除；候選紀錄保留在 AI 整理確認清單。");
}

export function aiCandidateRemoveResultStatusMessage(count: number) {
  const boundedCount = clampNumber(count, 0, maxMobileCountValue);
  return boundedCount === 0 ? boundUiMessage("已移除所有候選紀錄") : boundUiMessage(`剩餘 ${boundedCount} 筆候選紀錄`);
}

export function aiCandidateEditSuccessStatusMessage() {
  return boundUiMessage("候選紀錄已更新，請再次確認後儲存");
}

export function aiCandidateEditFailureStatusMessage(error: unknown) {
  return safeUiError(error, "候選紀錄更新失敗");
}
