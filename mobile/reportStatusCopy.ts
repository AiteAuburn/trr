const maxUiMessageLength = 300;

function boundUiMessage(value: string) {
  return value.slice(0, maxUiMessageLength);
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
