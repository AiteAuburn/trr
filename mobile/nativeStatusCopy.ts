import { displayTextValue } from "./recordDisplay";

const maxListItems = 12;
const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxUiMessageLength = 300;
const maxMobileCountValue = 1_000_000;

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
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

export function nativeDebugDefaultStatusMessage() {
  return boundUiMessage("Expo Go 可跑 UI；whisper.rn / llama.rn 需要 Dev Client。");
}

export function nativeDebugDisabledStatusMessage() {
  return boundUiMessage("Debug tools are disabled.");
}

export function nativeDownloadedModelsFailureStatusMessage(error: unknown) {
  return safeUiError(error, "讀取模型清單失敗");
}

export function nativeModelDownloadProgressStatusMessage() {
  return boundUiMessage("下載模型中...");
}

export function nativeModelDownloadStartState() {
  return {
    progress: 0,
    status: nativeModelDownloadProgressStatusMessage()
  };
}

export function nativeModelDownloadSuccessStatusMessage() {
  return boundUiMessage("模型已下載，已更新本機模型清單。");
}

export function nativeModelDownloadSuccessState() {
  return {
    status: nativeModelDownloadSuccessStatusMessage()
  };
}

export function nativeModelDownloadFailureStatusMessage(error: unknown) {
  return safeUiError(error, "模型下載失敗");
}

export function nativeModelDownloadFailureState(error: unknown) {
  return {
    status: nativeModelDownloadFailureStatusMessage(error)
  };
}

export function nativeModuleCheckButtonLabel(isRunning: boolean) {
  return boundDisplayText(isRunning ? "處理中..." : "檢查 native modules", maxDisplayTextLength);
}

export function nativeModelDownloadButtonLabel(isRunning: boolean, progress: number) {
  const boundedProgress = clampNumber(Math.round(progress * 100), 0, 100);
  return boundDisplayText(
    `${isRunning ? "處理中 " : "下載模型 "}${boundedProgress > 0 ? `${boundedProgress}%` : ""}`,
    maxDisplayTextLength
  );
}

export function nativeDownloadKindAccessibilityLabel(kind: "whisper" | "llama", selectedKind: "whisper" | "llama") {
  const label = kind === "whisper" ? "Whisper" : "Llama";
  const selectedCopy = kind === selectedKind ? "目前選取" : "切換下載類型";
  return boundDisplayText(`${selectedCopy} ${label} 本機模型下載；不呼叫雲端 AI`, maxDisplayDetailTextLength);
}

export function nativeModuleCheckAccessibilityLabel(isRunning: boolean) {
  return boundDisplayText(
    isRunning ? "正在檢查 native modules，不呼叫 backend 或 AI" : "檢查 native modules，不呼叫 backend 或 AI",
    maxDisplayDetailTextLength
  );
}

export function nativeModelDownloadAccessibilityLabel(isRunning: boolean, progress: number) {
  const boundedProgress = clampNumber(Math.round(progress * 100), 0, 100);
  return boundDisplayText(
    isRunning
      ? `正在下載本機模型 ${boundedProgress}%；只更新本機檔案狀態`
      : "下載本機模型；不送出健康資料、不呼叫 LLM",
    maxDisplayDetailTextLength
  );
}

export function nativeWhisperRunAccessibilityLabel(isRunning: boolean) {
  return boundDisplayText(
    isRunning ? "正在執行本機 Whisper，輸出仍需使用者確認" : "執行本機 Whisper，僅讀取指定本機音檔",
    maxDisplayDetailTextLength
  );
}

export function nativeLlamaRunAccessibilityLabel(isRunning: boolean) {
  return boundDisplayText(
    isRunning ? "正在執行本機 Llama，只顯示 bounded 摘要" : "執行本機 Llama，不顯示完整 raw model output",
    maxDisplayDetailTextLength
  );
}

export function nativeBenchmarkAccessibilityLabel(isRunning: boolean) {
  return boundDisplayText(
    isRunning ? "正在執行本機 benchmark，不呼叫雲端模型" : "執行本機 Whisper 與 Llama benchmark，不呼叫雲端模型",
    maxDisplayDetailTextLength
  );
}

export function nativeModuleCheckProgressStatusMessage() {
  return boundUiMessage("檢查 native modules...");
}

export function nativeModuleCheckStartState() {
  return {
    status: nativeModuleCheckProgressStatusMessage()
  };
}

export function nativeModuleCheckResultStatusMessage(message: string) {
  return boundUiMessage(message);
}

export function nativeModuleCheckResultState(message: string) {
  return {
    status: nativeModuleCheckResultStatusMessage(message)
  };
}

export function nativeModuleCheckFailureStatusMessage(error: unknown) {
  return safeUiError(error, "Native module check failed");
}

export function nativeModuleCheckFailureState(error: unknown) {
  return {
    status: nativeModuleCheckFailureStatusMessage(error)
  };
}

export function nativeWhisperMissingInputStatusMessage() {
  return boundUiMessage("請先填 whisper model path 和 audio file path");
}

export function nativeWhisperMissingInputState() {
  return {
    status: nativeWhisperMissingInputStatusMessage()
  };
}

export function nativeWhisperProgressStatusMessage() {
  return boundUiMessage("本機 Whisper 轉錄中...");
}

export function nativeWhisperStartState() {
  return {
    status: nativeWhisperProgressStatusMessage()
  };
}

export function nativeWhisperSuccessStatusMessage() {
  return boundUiMessage("Whisper 轉錄完成，已填入文字輸入框");
}

export function nativeWhisperSuccessState() {
  return {
    status: nativeWhisperSuccessStatusMessage()
  };
}

export function nativeWhisperFailureStatusMessage(error: unknown) {
  return safeUiError(error, "Whisper failed");
}

export function nativeWhisperFailureState(error: unknown) {
  return {
    status: nativeWhisperFailureStatusMessage(error)
  };
}

export function recordingModelRefreshStatusMessage(count: number) {
  return boundUiMessage(`已找到 ${clampNumber(count, 0, maxMobileCountValue)} 個本機 Whisper 模型。`);
}

export function recordingModelRefreshFailureStatusMessage(error: unknown) {
  return safeUiError(error, "讀取本機 Whisper 模型失敗");
}

export function recordingModelSelectedStatusMessage(label: string) {
  return boundUiMessage(`已選擇本機 Whisper 模型：${boundDisplayText(label, 80)}。`);
}

export function recordingModelRefreshButtonLabel() {
  return boundDisplayText("重新掃描本機模型", maxDisplayTextLength);
}

export function recordingModelRefreshAccessibilityLabel() {
  return boundDisplayText("重新掃描本機已下載 Whisper 模型，不呼叫雲端或上傳音檔", maxDisplayDetailTextLength);
}

export function nativeLlamaMissingInputStatusMessage() {
  return boundUiMessage("請先填 GGUF model path 和 transcript");
}

export function nativeLlamaMissingInputState() {
  return {
    status: nativeLlamaMissingInputStatusMessage()
  };
}

export function nativeLlamaProgressStatusMessage() {
  return boundUiMessage("本機 llama.cpp 解析中...");
}

export function nativeLlamaStartState() {
  return {
    status: nativeLlamaProgressStatusMessage()
  };
}

export function nativeLlamaOutputSummaryMessage(outputLength: number) {
  return boundUiMessage(
    `llama.cpp 輸出已產生（${clampNumber(outputLength, 0, maxMobileCountValue)} chars）；為避免保留 raw model output，UI 不顯示完整內容。`
  );
}

export function nativeLlamaSuccessStatusMessage() {
  return boundUiMessage("llama.cpp constrained JSON 輸出完成；完整輸出未保留在 UI。");
}

export function nativeLlamaSuccessState() {
  return {
    status: nativeLlamaSuccessStatusMessage()
  };
}

export function nativeLlamaFailureStatusMessage(error: unknown) {
  return safeUiError(error, "llama.cpp failed");
}

export function nativeLlamaFailureState(error: unknown) {
  return {
    status: nativeLlamaFailureStatusMessage(error)
  };
}

export function nativeBenchmarkProgressStatusMessage() {
  return boundUiMessage("本機模型 benchmark 中...");
}

export function nativeBenchmarkStartState() {
  return {
    status: nativeBenchmarkProgressStatusMessage()
  };
}

export function nativeBenchmarkMissingInputStatusMessage() {
  return boundUiMessage("請先填模型與測試輸入後再 benchmark。");
}

export function nativeBenchmarkMissingInputState() {
  return {
    status: nativeBenchmarkMissingInputStatusMessage()
  };
}

export function nativeBenchmarkResultStatusMessage(
  results: Array<{ task: string; ok: boolean; durationMs: number; outputChars: number }>
) {
  return boundUiMessage(
    results
      .slice(0, maxListItems)
      .map((result) =>
        [
          `${displayTextValue(result.task, 30)}: ${result.ok ? "ok" : "failed"}`,
          `${clampNumber(result.durationMs, 0, maxMobileCountValue)}ms`,
          `${clampNumber(result.outputChars, 0, maxMobileCountValue)} chars`
        ].join(" ")
      )
      .join("\n")
  );
}

export function nativeBenchmarkResultState(
  results: Array<{ task: string; ok: boolean; durationMs: number; outputChars: number }>
) {
  return {
    status: nativeBenchmarkResultStatusMessage(results)
  };
}

export function nativeStatusDisplayTexts(nativeStatus: string) {
  return {
    native: boundUiMessage(nativeStatus)
  };
}
