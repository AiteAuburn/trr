const maxUiMessageLength = 300;
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
