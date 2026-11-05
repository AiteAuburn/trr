import type { AppScreen } from "./navigationConfig";

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

export function recordingStartedStatusMessage(isLowQuota: boolean, usingPhoneSpeech = false) {
  if (usingPhoneSpeech) {
    return boundUiMessage(isLowQuota
      ? "錄音中，使用手機語音服務；今日額度剩餘不到 2 分鐘。"
      : "錄音中，使用手機語音服務；辨識是否需要網路依手機設定。放開即結束。");
  }
  return boundUiMessage(isLowQuota ? "錄音中；今日錄音額度剩餘不到 2 分鐘。" : "錄音中，放開即結束。");
}

export function recordingResetStatusMessage() {
  return boundUiMessage("可重新按住錄音，或直接使用文字輸入。");
}

export function recordingTextFallbackStatusMessage() {
  return boundUiMessage("這次尚未產生文字。語音辨識尚未準備好，請改用文字輸入，確認後再交給 AI 整理。");
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
      ? "這次沒有收到可用的語音。請按住按鈕，說完後再放開。"
      : "錄音已結束，正在整理辨識文字。"
  );
}

export function shouldOpenTodayRecordingTranscriptReview(currentScreen: AppScreen, elapsedSeconds: number) {
  return currentScreen === "today" && elapsedSeconds > 1;
}

export function recordingWhisperMissingModelStatusMessage() {
  return recordingTextFallbackStatusMessage();
}

export function recordingWhisperProgressStatusMessage() {
  return boundUiMessage("正在將錄音轉成文字，完成後會進入文字確認。");
}

export function recordingWhisperSuccessStatusMessage() {
  return boundUiMessage("錄音已轉成文字；請確認內容後再交給 AI 整理。");
}

export function recordingPhoneSpeechFallbackStatusMessage() {
  return boundUiMessage("已使用手機語音辨識；辨識服務可能需要網路，請確認文字後再交給 AI 整理。");
}

export function recordingWhisperEmptyStatusMessage() {
  return boundUiMessage("這次沒有辨識到文字。請靠近麥克風再說一次，或改用文字輸入；原有文字不會被更改。");
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
  return boundDisplayText("看看文字是否正確，有需要的話可以直接修改。", maxDisplayDetailTextLength);
}

export function transcriptReviewPreParseGuidanceCopy() {
  return boundDisplayText(
    "下一步會整理成不同類型的紀錄，確認之前不會儲存。",
    maxDisplayDetailTextLength
  );
}

export function transcriptReviewSampleWarningCopy() {
  return boundDisplayText(
    "這是示範內容。換成你自己的紀錄，就可以開始整理。",
    maxDisplayDetailTextLength
  );
}

export const homeGuidanceDirections = [
  [
    { icon: "🕒", label: "時間" },
    { icon: "🩸", label: "血糖" },
    { icon: "🍽️", label: "飲食" }
  ],
  [
    { icon: "🏃", label: "運動" },
    { icon: "💊", label: "用藥紀錄" },
    { icon: "😊", label: "身體狀況" }
  ]
].map((row, rowIndex) =>
  row.map((item, itemIndex) => ({
    key: `home-guidance-${rowIndex}-${itemIndex}`,
    icon: boundDisplayText(item.icon, 8),
    label: boundDisplayText(item.label, 20)
  }))
);

export const homeSpeechExamples = [
  "今天6月28號，早上起床空腹血糖105，早餐吃兩顆水煮蛋跟無糖豆漿，中午吃雞腿便當沒吃飯，下午騎腳踏車40分鐘，晚上體重77.5公斤。",
  "6月28日。空腹血糖105。早餐兩顆蛋。無糖豆漿一杯。騎腳踏車30分鐘。體重77.5公斤。",
  "今天血糖105，早餐吃蛋跟豆漿。對了，中午沒吃飯只有吃菜。下午有騎車，大概40分鐘吧。晚上量體重77.5公斤。",
  "今天精神不錯，起床先量血糖105。早餐吃得很簡單，兩顆蛋配無糖豆漿。下午去騎腳踏車流了一些汗，希望血糖能慢慢降下來。"
].map((example, index) => ({
  key: `home-example-${index + 1}`,
  label: boundDisplayText(`範例 ${index + 1}`, 20),
  text: boundDisplayText(example, maxDisplayDetailTextLength)
}));

type HomeSpeechExample = (typeof homeSpeechExamples)[number];

export function homeSpeechExampleLabel(example: HomeSpeechExample) {
  return example.label;
}

export function homeSpeechExampleText(example: HomeSpeechExample) {
  return example.text;
}

export function homeSpeechExampleDotKey(example: HomeSpeechExample) {
  return `${example.key}-dot`;
}

export function homeSpeechExampleDotIsActive(index: number, currentIndex: number) {
  return index === currentIndex;
}

export function homeSpeechExamplePaginationAccessibilityLabel(currentIndex: number, totalCount: number) {
  return `目前第 ${currentIndex + 1} 個範例，共 ${totalCount} 個`;
}

export function homeRecordingDisplayBundle(value: {
  currentExampleIndex: number;
  elapsedSeconds: number;
  hasWhisperModel: boolean;
  isRecording: boolean;
}) {
  const currentExample = homeSpeechExamples[
    clampNumber(value.currentExampleIndex, 0, Math.max(homeSpeechExamples.length - 1, 0))
  ];

  return {
    currentExample,
    modelStatus: homeRecordingModelStatusCopy(value.hasWhisperModel),
    previewText: value.isRecording ? recordingActivePreviewCopy(value.elapsedSeconds) : recordingIdlePreviewCopy(),
    secondaryHint: homeRecordingSecondaryHint(value.isRecording, value.elapsedSeconds)
  };
}

export function transcriptReviewPreflightPassedCopy() {
  return boundDisplayText("已通過本機長度與數字密度檢查；下一步才會送出 parser 請求。", maxDisplayDetailTextLength);
}

export function transcriptReviewDisplayTexts() {
  return {
    intro: transcriptReviewIntroCopy(),
    preParseGuidance: transcriptReviewPreParseGuidanceCopy(),
    sampleWarning: transcriptReviewSampleWarningCopy(),
    preflightPassed: transcriptReviewPreflightPassedCopy()
  };
}

export function transcriptReviewDisplayBundle() {
  return transcriptReviewDisplayTexts();
}

export function transcriptReviewRuntimeDisplayBundle() {
  return {
    review: transcriptReviewDisplayBundle()
  };
}

export function transcriptReviewStatusDisplayTexts(value: {
  transcriptValidationError: string | null;
  transcript: string;
  protectedBackendUnavailableMessage: string;
  parserModelUnavailableMessage: string;
  parserRecoveryMessage: string;
}) {
  return {
    transcriptValidation: boundUiMessage(
      value.transcriptValidationError
        ? value.transcript.trim()
          ? value.transcriptValidationError
          : "請先輸入文字，或按「填入範例」查看確認 UI；範例不會送 parser。"
        : ""
    ),
    transcriptReviewValidation: boundUiMessage(
      value.transcriptValidationError
        ? value.transcript.trim()
          ? value.transcriptValidationError
          : "請先輸入文字，再進行 AI 整理。"
        : ""
    ),
    parserRecovery: boundUiMessage(value.parserRecoveryMessage),
    backendUnavailable: boundUiMessage(`${value.protectedBackendUnavailableMessage}，才可送出 parser。`),
    modelUnavailable: boundUiMessage(`${value.parserModelUnavailableMessage}，請先在設定選擇可用模型。`)
  };
}

export function transcriptReviewStatusDisplayBundle(value: {
  transcriptValidationError: string | null;
  transcript: string;
  protectedBackendUnavailableMessage: string;
  parserModelUnavailableMessage: string;
  parserRecoveryMessage: string;
}) {
  return transcriptReviewStatusDisplayTexts(value);
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
  return boundDisplayText("放開後由 Whisper 或手機語音服務轉成文字，再進入確認。", maxDisplayDetailTextLength);
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
    hasWhisperModel
      ? "語音辨識：本機 Whisper 優先；手機備援可能需要網路"
      : "語音辨識：手機內建服務，可能需要網路",
    80
  );
}

export function homeRecordingPreviewBoundaryCopy() {
  return boundDisplayText(
    "按住時由手機語音服務辨識並暫存音檔；若本機 Whisper 可用則優先使用，否則採用手機結果。手機服務可能使用網路；確認前不會呼叫 AI 或儲存紀錄。",
    maxDisplayDetailTextLength
  );
}

export function recordPageRecordingPreviewBoundaryCopy() {
  return boundDisplayText(
    "按住時由手機語音服務辨識並暫存音檔；本機 Whisper 可用時優先使用。手機服務可能使用網路；辨識文字需先確認，才會整理或儲存。",
    maxDisplayDetailTextLength
  );
}

export function recordingSimulatedResultCopy(elapsedSeconds: number) {
  return boundDisplayText(
    `已錄音 ${clampNumber(elapsedSeconds, 0, maxMobileCountValue)} 秒；Whisper 或手機語音服務完成辨識後，可確認文字。`,
    maxDisplayDetailTextLength
  );
}

export function recordingElapsedSecondsCopy(elapsedSeconds: number) {
  return boundDisplayText(`${clampNumber(elapsedSeconds, 0, maxMobileCountValue)} 秒`, 40);
}

export function recordingLimitCopy(limitSeconds: number) {
  return boundDisplayText(`單次最多 ${clampNumber(limitSeconds, 1, mobileSingleRecordingLimitSeconds)} 秒`, 80);
}

export function recordingBoundaryDisplayBundle(limitSeconds: number) {
  return {
    limit: recordingLimitCopy(limitSeconds),
    homeBoundary: homeRecordingPreviewBoundaryCopy(),
    recordPageBoundary: recordPageRecordingPreviewBoundaryCopy()
  };
}

export function recordingResultBodyCopy(elapsedSeconds: number) {
  const boundedSeconds = clampNumber(elapsedSeconds, 0, maxMobileCountValue);
  return boundDisplayText(
    boundedSeconds <= 1
      ? "錄音時間太短，建議重新按住錄音。"
      : "錄音已結束；Whisper 或手機語音服務會提供辨識文字，確認後再交給 AI 整理。",
    maxDisplayDetailTextLength
  );
}

export function recordingResultPrimaryActionLabel(elapsedSeconds: number) {
  const boundedSeconds = clampNumber(elapsedSeconds, 0, maxMobileCountValue);
  return boundDisplayText(boundedSeconds <= 1 ? "再錄一次" : "確認辨識文字", maxDisplayTextLength);
}

export function recordingResultDisplayBundle(elapsedSeconds: number) {
  return {
    body: recordingResultBodyCopy(elapsedSeconds),
    elapsed: recordingElapsedSecondsCopy(elapsedSeconds),
    primaryAction: recordingResultPrimaryActionLabel(elapsedSeconds),
    simulatedResult: recordingSimulatedResultCopy(elapsedSeconds)
  };
}

export function recordingRuntimeDisplayBundle(value: {
  currentExampleIndex: number;
  elapsedSeconds: number;
  hasWhisperModel: boolean;
  isRecording: boolean;
  limitSeconds: number;
}) {
  return {
    home: homeRecordingDisplayBundle({
      currentExampleIndex: value.currentExampleIndex,
      elapsedSeconds: value.elapsedSeconds,
      hasWhisperModel: value.hasWhisperModel,
      isRecording: value.isRecording
    }),
    boundary: recordingBoundaryDisplayBundle(value.limitSeconds),
    result: recordingResultDisplayBundle(value.elapsedSeconds)
  };
}
