import type { AppScreen } from "./navigationConfig";

export type QuickEntryMode = "voice" | "text" | "manual";

const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxUiMessageLength = 300;

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundUiMessage(value: string) {
  return value.slice(0, maxUiMessageLength);
}

export function quickRecordIntroCopy() {
  return boundDisplayText("首頁只保留按住錄音；文字整理與手動新增請從記錄頁進入，整理前都會先進文字確認。", maxDisplayDetailTextLength);
}

export function quickEntryModeDisplayItems() {
  return [
    {
      key: "voice" as QuickEntryMode,
      icon: boundDisplayText("🎙", 4),
      label: boundDisplayText("語音預覽", maxDisplayTextLength),
      copy: boundDisplayText("按住錄音，放開結束", maxDisplayTextLength),
      accessibilityLabel: boundDisplayText("語音預覽，請按住下方麥克風開始", maxDisplayTextLength)
    },
    {
      key: "text" as QuickEntryMode,
      icon: boundDisplayText("文", 4),
      label: boundDisplayText("文字整理", maxDisplayTextLength),
      copy: boundDisplayText("輸入後先確認再整理", maxDisplayTextLength),
      accessibilityLabel: boundDisplayText("文字整理，前往文字輸入流程", maxDisplayTextLength)
    },
    {
      key: "manual" as QuickEntryMode,
      icon: boundDisplayText("＋", 4),
      label: boundDisplayText("手動新增", maxDisplayTextLength),
      copy: boundDisplayText("免 AI，直接補登", maxDisplayTextLength),
      accessibilityLabel: boundDisplayText("手動新增，直接建立一筆紀錄", maxDisplayTextLength)
    }
  ];
}

export function quickEntryVoicePromptStatusMessage() {
  return boundUiMessage("請按住下方大型麥克風按鈕開始錄音預覽；放開後才會結束。");
}

export function quickEntryTextModeStatusMessage() {
  return boundUiMessage("已切到文字整理流程；輸入內容後會先進文字確認，再交給 AI 整理。");
}

export function todayManualEntryStatusMessage() {
  return boundUiMessage("已從今日紀錄進入手動新增；此路徑不呼叫 AI、LLM 或 STT。");
}

export function todayRecordEntryStatusMessage() {
  return boundUiMessage("已從今日紀錄進入文字記錄；送出前不會呼叫 parser 或 LLM。");
}

export function todayRecordDetailStatusMessage() {
  return boundUiMessage("已從今日紀錄查看單筆詳情；只使用已同步紀錄，不呼叫 AI。");
}

export function todayAnalysisStatusMessage() {
  return boundUiMessage("已前往基本分析；只使用已載入紀錄摘要，不呼叫 AI 或 LLM。");
}

export function recordManualEntryStatusMessage() {
  return boundUiMessage("已從快速記錄進入手動新增；此路徑不呼叫 AI、LLM 或 STT。");
}

export function aiReviewManualEntryStatusMessage() {
  return boundUiMessage("已從 AI 整理確認改用手動新增；不會重新呼叫 AI 或自動送出 backend。");
}

export function transcriptReviewManualEntryStatusMessage() {
  return boundUiMessage("已從文字確認改用手動新增；不會重送 parser，也不呼叫 AI 或 STT。");
}

export function aiSaveFailureBackAiReviewStatusMessage() {
  return boundUiMessage("已回到 AI 整理確認；候選紀錄保留，不會自動重試或重新呼叫 AI。");
}

export function aiSaveFailureReturnSaveConfirmStatusMessage() {
  return boundUiMessage("已返回每日紀錄頁；請確認後手動送出，不會自動重試 backend。");
}

export function aiSaveFailureManualFallbackStatusMessage() {
  return boundUiMessage("已改用手動新增；AI 候選保留在確認流程，不會自動重試或重新呼叫 AI。");
}

export function saveSuccessProcessUnsavedStatusMessage() {
  return boundUiMessage("已返回 AI 整理確認；只處理未儲存候選，不會重新呼叫 AI。");
}

export function saveSuccessDestinationStatusMessage(target: AppScreen) {
  const targetLabel =
    target === "today"
      ? "今日紀錄"
      : target === "history"
        ? "歷史紀錄"
        : target === "analysis"
          ? "基本分析"
          : target === "recordDetail"
            ? "記錄詳情"
            : "指定頁面";
  return boundUiMessage(`已前往${targetLabel}；成功頁不會自動新增 backend、AI 或 STT 呼叫。`);
}

export function saveSuccessManualContinueStatusMessage() {
  return boundUiMessage("已從儲存完成繼續手動新增；沿用原返回目標，不會呼叫 AI、LLM 或 STT。");
}

export function saveSuccessRecordEntryStatusMessage() {
  return boundUiMessage("已從儲存完成前往文字記錄；不會自動整理、不送 backend request。");
}

export function saveSuccessViewDetailStatusMessage() {
  return boundUiMessage("已從儲存完成查看紀錄詳情；返回會回到儲存完成頁，不會呼叫 AI。");
}
