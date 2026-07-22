import { recordDateTimeDisplay } from "./recordDisplay";

const maxUiMessageLength = 300;
const maxDisplayTextLength = 80;
const maxDisplayDetailTextLength = 240;
const maxMobileCountValue = 9999;

function boundUiMessage(value: string) {
  return value.slice(0, maxUiMessageLength);
}

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(Math.round(value), min), max);
}

export function voiceQuotaUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend account 尚未 ready"}；目前不送出語音額度同步請求。`);
}

export function voiceQuotaInitialStatusMessage() {
  return boundUiMessage("語音額度尚未載入");
}

export function voiceQuotaSyncSuccessStatusMessage() {
  return boundUiMessage("語音額度已同步");
}

export function voiceQuotaSyncFailureStatusMessage() {
  return boundUiMessage("語音額度暫時無法載入，不影響文字記錄");
}

export function detailedReportNotLoadedStatusMessage() {
  return boundUiMessage("詳細報告尚未載入");
}

export function detailedReportResetStatusMessage() {
  return boundUiMessage("尚未載入詳細報告");
}

export function detailedReportUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前顯示本機已載入資料摘要，不送出報表請求。`);
}

export function detailedReportInFlightStatusMessage() {
  return boundUiMessage("詳細報告已在載入中...");
}

export function detailedReportLoadingStatusMessage() {
  return boundUiMessage("詳細報告載入中...");
}

export function detailedReportSuccessStatusMessage() {
  return boundUiMessage("已載入 backend 報表摘要");
}

export function detailedReportFailureStatusMessage() {
  return boundUiMessage("backend 報表暫時無法載入，顯示本機已載入資料摘要。");
}

export function analysisReportInFlightStatusMessage() {
  return boundUiMessage("分析統計已在同步中...");
}

export function analysisReportLoadingStatusMessage() {
  return boundUiMessage("正在同步 backend 分析統計...");
}

export function analysisReportSuccessStatusMessage() {
  return boundUiMessage("已同步 backend 分析統計。");
}

export function analysisReportFailureStatusMessage() {
  return boundUiMessage("backend 分析統計暫時無法載入，顯示 mobile 已同步紀錄摘要。");
}

export function reportSourceDisplayItem(report: unknown | null, localRecordCount: number, queryLimit: number) {
  if (report) {
    return {
      label: boundDisplayText("Backend 報表", 24),
      copy: boundUiMessage(`資料來自 /reports/basic，並套用 ${clampNumber(queryLimit, 0, maxMobileCountValue)} 筆查詢上限。`)
    };
  }
  if (localRecordCount > 0) {
    return {
      label: boundDisplayText("本機摘要", 24),
      copy: boundUiMessage("backend 報表暫未使用；目前只根據 mobile 已載入紀錄計算。")
    };
  }
  return {
    label: boundDisplayText("尚無資料", 24),
    copy: boundUiMessage("目前沒有可分析的已載入紀錄；此頁只顯示空摘要。")
  };
}

export function reportGeneratedAtDisplayText(generatedAt?: string | null) {
  return generatedAt
    ? boundDisplayText(`產生時間：${recordDateTimeDisplay(generatedAt)}`, maxDisplayDetailTextLength)
    : boundDisplayText("以 mobile 目前已載入資料計算。", maxDisplayDetailTextLength);
}

export function reportStatusDisplayTexts(value: {
  reportStatus: string;
  quotaStatus: string;
}) {
  return {
    report: boundUiMessage(value.reportStatus),
    quota: boundUiMessage(value.quotaStatus)
  };
}

export function reportStatusDisplayBundle(value: {
  reportStatus: string;
  quotaStatus: string;
}) {
  return reportStatusDisplayTexts(value);
}
