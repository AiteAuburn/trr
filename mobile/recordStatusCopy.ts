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

export function recordSyncUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前不送出紀錄同步請求。`);
}

export function recordSyncInitialStatusMessage() {
  return boundUiMessage("尚未連線帳號或照護對象");
}

export function recordSyncLoadingStatusMessage() {
  return boundUiMessage("紀錄同步中...");
}

export function recordSyncPageLoadingStatusMessage() {
  return boundUiMessage("正在載入更早紀錄...");
}

export function recordSyncSuccessStatusMessage(count: number, pageLimit: number, cacheLimit: number, hasMore: boolean) {
  const boundedCount = clampNumber(count, 0, maxMobileCountValue);
  const boundedPageLimit = clampNumber(pageLimit, 0, maxMobileCountValue);
  const boundedCacheLimit = clampNumber(cacheLimit, 0, maxMobileCountValue);
  const moreCopy = hasMore ? "可繼續載入更早紀錄" : "目前沒有更多已知紀錄";
  return boundUiMessage(`已同步 ${boundedCount} 筆紀錄（每頁 ${boundedPageLimit} 筆，本機上限 ${boundedCacheLimit} 筆）；${moreCopy}。`);
}

export function recordSyncPageSuccessStatusMessage(count: number, pageCount: number, cacheLimit: number, hasMore: boolean) {
  const boundedCount = clampNumber(count, 0, maxMobileCountValue);
  const boundedPageCount = clampNumber(pageCount, 0, maxMobileCountValue);
  const boundedCacheLimit = clampNumber(cacheLimit, 0, maxMobileCountValue);
  const moreCopy = hasMore ? "仍可繼續載入" : "已無更多已知紀錄";
  return boundUiMessage(`已載入更早 ${boundedPageCount} 筆，目前本機共有 ${boundedCount} 筆（上限 ${boundedCacheLimit} 筆）；${moreCopy}。`);
}

export function recordSyncFailureStatusMessage() {
  return boundUiMessage("紀錄暫時無法同步；目前只顯示已載入資料或範例。");
}

export function visualSmokeRecordSyncStatusMessage() {
  return boundUiMessage("Visual smoke demo records loaded locally; no backend sync, database write, AI, STT, Vision, or payment call.");
}

export function recordUpdateUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前不會送出紀錄更新請求。`);
}

export function recordDeleteUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前不會送出紀錄刪除請求。`);
}

export function recordUpdateProgressStatusMessage() {
  return boundUiMessage("儲存修改...");
}

export function recordUpdateSuccessStatusMessage() {
  return boundUiMessage("紀錄已更新");
}

export function recordUpdateFailureStatusMessage(error: unknown) {
  return safeUiError(error, "更新失敗");
}

export function recordUpdateSummaryMessage(count: number) {
  return boundUiMessage(`已更新 ${clampNumber(count, 0, maxMobileCountValue)} 筆紀錄`);
}

export function recordDeleteProgressStatusMessage() {
  return boundUiMessage("刪除紀錄...");
}

export function recordDeleteSuccessStatusMessage() {
  return boundUiMessage("紀錄已刪除");
}

export function recordDeleteFailureStatusMessage(error: unknown) {
  return safeUiError(error, "刪除失敗");
}

export function recordDeleteSummaryMessage(count: number) {
  return boundUiMessage(`已刪除 ${clampNumber(count, 0, maxMobileCountValue)} 筆紀錄`);
}

export function deleteConfirmIntroCopy() {
  return boundDisplayText(
    "刪除後會從目前清單移除；目前不保留本機復原副本。若 backend 已同步，請以後端狀態為準。",
    maxDisplayDetailTextLength
  );
}

export function deleteConfirmRecordMetaCopy(dateTimeLabel: string, sourceLabel: string) {
  return boundDisplayText(
    `${boundDisplayText(dateTimeLabel, 80)} · ${boundDisplayText(sourceLabel, 80)}`,
    maxDisplayDetailTextLength
  );
}

export function deleteConfirmSubmitLabel(isBusy: boolean) {
  return boundDisplayText(isBusy ? "刪除中..." : "確認刪除", maxDisplayTextLength);
}

export function deleteConfirmReadyStatusMessage() {
  return boundUiMessage("請確認是否刪除這筆紀錄；按下確認刪除前不會送出 delete request。");
}

export function deleteConfirmReturnStatusMessage() {
  return boundUiMessage("已取消刪除；紀錄保留，已返回記錄詳情。");
}

export function manualRecordCreateUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前不會送出手動紀錄建立請求。`);
}

export function manualRecordCreateProgressStatusMessage() {
  return boundUiMessage("建立手動紀錄...");
}

export function manualRecordCreateSuccessStatusMessage() {
  return boundUiMessage("手動紀錄已建立");
}

export function manualRecordCreateFailureStatusMessage(error: unknown) {
  return safeUiError(error, "手動紀錄建立失敗");
}

export function manualRecordCreateSummaryMessage(count: number) {
  return boundUiMessage(`已建立 ${clampNumber(count, 0, maxMobileCountValue)} 筆手動紀錄`);
}
