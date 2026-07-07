const maxUiMessageLength = 300;
const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxMobileCountValue = 1_000_000;
const mobileSingleRecordingLimitSeconds = 60;
const maxTranscriptTextLength = 1200;
const maxTranscriptNumericValues = 90;

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

function countNumericValues(value: string) {
  return value.match(/\d+(?:\.\d+)?/g)?.length ?? 0;
}

function safeUiError(error: unknown, fallback: string) {
  if (error instanceof Error && /^\S+ failed: \d{3}$/.test(error.message)) {
    return boundUiMessage(error.message);
  }
  return boundUiMessage(fallback);
}

export function recordingQuotaExhaustedStatusMessage() {
  return boundUiMessage("今日錄音額度已用完，請改用文字或手動新增。");
}

export function recordingStartedStatusMessage(isLowQuota: boolean) {
  return boundUiMessage(isLowQuota ? "錄音中；今日錄音額度剩餘不到 2 分鐘。" : "錄音中，放開即結束。");
}

export function recordingResetStatusMessage() {
  return boundUiMessage("可重新按住錄音，或直接使用文字輸入。");
}

export function recordingTextFallbackStatusMessage() {
  return boundUiMessage("錄音已結束；尚未設定 Whisper 模型，請用文字輸入，確認後再交給 AI 整理。");
}

export function recordingPermissionDeniedStatusMessage() {
  return boundUiMessage("麥克風權限未允許，請到系統設定開啟，或改用文字/手動新增。");
}

export function recordingStartFailureStatusMessage(error: unknown) {
  return safeUiError(error, "錄音無法開始");
}

export function recordingStopFailureStatusMessage(error: unknown) {
  return safeUiError(error, "錄音停止失敗");
}

export function recordingLimitReachedStatusMessage(limitSeconds: number) {
  return boundUiMessage(`已達單次錄音上限 ${clampNumber(limitSeconds, 0, maxMobileCountValue)} 秒，已自動結束。`);
}

export function recordingFinishedStatusMessage(elapsedSeconds: number) {
  const boundedSeconds = clampNumber(elapsedSeconds, 0, maxMobileCountValue);
  return boundUiMessage(
    boundedSeconds <= 1
      ? "錄音太短，請按住說完後再放開。"
      : "錄音已結束；音檔已保留於本機，可用 Whisper 轉文字後進入確認。"
  );
}

export function recordingWhisperMissingModelStatusMessage() {
  return boundUiMessage("錄音已保留；請先在設定填入 Whisper model path，或改用文字輸入。");
}

export function recordingWhisperProgressStatusMessage() {
  return boundUiMessage("正在將錄音轉成文字，完成後會進入文字確認。");
}

export function recordingWhisperSuccessStatusMessage() {
  return boundUiMessage("錄音已轉成文字；請確認內容後再交給 AI 整理。");
}

export function recordingWhisperEmptyStatusMessage() {
  return boundUiMessage("Whisper 沒有產生文字；請重新錄音或改用文字輸入。");
}

export function recordingWhisperFailureStatusMessage(error: unknown) {
  return safeUiError(error, "錄音轉文字失敗");
}

export function transcriptReviewReadyStatusMessage() {
  return boundUiMessage("請確認文字內容，下一步才會交給 AI 整理");
}

export function transcriptReturnEditStatusMessage() {
  return boundUiMessage("請修改文字；按下一步整理時才會重新送入 parser。");
}

export function transcriptReviewBackStatusMessage() {
  return boundUiMessage("已返回上一頁；目前文字保留，尚未送入 AI 整理。");
}

export function transcriptClearedStatusMessage() {
  return boundUiMessage("已清空目前文字，可回到記錄頁重新輸入。");
}

export function transcriptReviewIntroCopy() {
  return boundDisplayText("確認目前輸入或本機 Whisper 轉出的紀錄文字，若有錯誤可直接修改。", maxDisplayDetailTextLength);
}

export function transcriptReviewPreParseGuidanceCopy() {
  return boundDisplayText(
    "確認後，AI 會幫你整理成血糖、飲食與運動紀錄；範例文字不會送 parser。",
    maxDisplayDetailTextLength
  );
}

export function transcriptReviewSampleWarningCopy() {
  return boundDisplayText(
    "目前是範例文字；請改成自己的紀錄內容後再整理，避免不必要的 parser / LLM 成本。",
    maxDisplayDetailTextLength
  );
}

export function transcriptReviewPreflightPassedCopy() {
  return boundDisplayText("已通過本機長度與數字密度檢查；下一步才會送出 parser 請求。", maxDisplayDetailTextLength);
}

export function validateTranscriptForParser(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "請先輸入文字";
  }
  if (normalized.length > maxTranscriptTextLength) {
    return `文字過長，請縮短到 ${maxTranscriptTextLength} 字內，或分批整理`;
  }
  if (countNumericValues(normalized) > maxTranscriptNumericValues) {
    return "數字太多，請分批整理，避免 parser 成本過高";
  }
  return null;
}

export function recordingIdlePreviewCopy() {
  return boundDisplayText("放開後保留本機音檔；轉文字需接 Whisper 或改用下方文字輸入", maxDisplayDetailTextLength);
}

export function recordingActivePreviewCopy(elapsedSeconds: number) {
  return boundDisplayText(`${clampNumber(elapsedSeconds, 0, maxMobileCountValue)} 秒 · 放開結束`, 80);
}

export function homeRecordingSecondaryHint(isRecording: boolean, elapsedSeconds: number) {
  if (!isRecording) {
    return boundDisplayText("放開即結束", 40);
  }
  return boundDisplayText(
    `已錄音 ${clampNumber(elapsedSeconds, 0, maxMobileCountValue)} 秒，放開即結束`,
    80
  );
}

export function homeRecordingModelStatusCopy(hasWhisperModel: boolean) {
  return boundDisplayText(
    hasWhisperModel ? "目前語音識別：本機 Whisper" : "目前語音識別：內建文字確認",
    80
  );
}

export function homeRecordingPreviewBoundaryCopy() {
  return boundDisplayText(
    "首頁按住會使用 expo-av 擷取本機音檔；放開只停止錄音，不自動呼叫 STT、AI、LLM 或寫入 backend。",
    maxDisplayDetailTextLength
  );
}

export function recordPageRecordingPreviewBoundaryCopy() {
  return boundDisplayText(
    "按住會使用 expo-av 擷取本機音檔；若已設定 Whisper model path，可轉文字後進入確認，儲存前仍必須先文字確認。",
    maxDisplayDetailTextLength
  );
}

export function recordingSimulatedResultCopy(elapsedSeconds: number) {
  return boundDisplayText(
    `錄音已擷取 ${clampNumber(elapsedSeconds, 0, maxMobileCountValue)} 秒；可用 Whisper 轉文字後確認，或改用文字輸入。`,
    maxDisplayDetailTextLength
  );
}

export function recordingElapsedSecondsCopy(elapsedSeconds: number) {
  return boundDisplayText(`${clampNumber(elapsedSeconds, 0, maxMobileCountValue)} 秒`, 40);
}

export function recordingLimitCopy(limitSeconds: number) {
  return boundDisplayText(`單次最多 ${clampNumber(limitSeconds, 1, mobileSingleRecordingLimitSeconds)} 秒`, 80);
}

export function recordingResultBodyCopy(elapsedSeconds: number) {
  const boundedSeconds = clampNumber(elapsedSeconds, 0, maxMobileCountValue);
  return boundDisplayText(
    boundedSeconds <= 1
      ? "錄音時間太短，建議重新按住錄音。"
      : "錄音已結束並保留本機音檔；已設定 Whisper 時可轉文字後確認，否則請改用下方文字輸入。",
    maxDisplayDetailTextLength
  );
}

export function recordingResultPrimaryActionLabel(elapsedSeconds: number) {
  const boundedSeconds = clampNumber(elapsedSeconds, 0, maxMobileCountValue);
  return boundDisplayText(boundedSeconds <= 1 ? "再錄一次" : "使用文字輸入", maxDisplayTextLength);
}
