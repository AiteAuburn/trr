import type { AppScreen } from "./navigationConfig";

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

export function deleteConfirmDisplayTexts(
  selectedRecordDisplayItem: { dateTimeLabel: string; sourceLabel: string } | null,
  isBusy: boolean
) {
  return {
    intro: deleteConfirmIntroCopy(),
    recordMeta: selectedRecordDisplayItem
      ? deleteConfirmRecordMetaCopy(selectedRecordDisplayItem.dateTimeLabel, selectedRecordDisplayItem.sourceLabel)
      : "",
    submit: deleteConfirmSubmitLabel(isBusy)
  };
}

export function deleteConfirmReadyStatusMessage() {
  return boundUiMessage("請確認是否刪除這筆紀錄；按下確認刪除前不會送出 delete request。");
}

export function deleteConfirmReturnStatusMessage() {
  return boundUiMessage("已取消刪除；紀錄保留，已返回記錄詳情。");
}

export function deleteConfirmChecklistDisplayItems() {
  return [
    "只會刪除目前選取的這一筆紀錄。",
    "只送出單筆 delete request，不批次載入完整歷史。",
    "不會自動刪除其他日期、分析統計或未儲存候選紀錄。",
    "不會呼叫 parser、AI 或 LLM，成本為 0。",
    "不會附帶 raw transcript、raw prompt、raw model output 或模型 debug trace。",
    "目前沒有本機 undo；刪除成功後會進入刪除完成頁。",
    "刪除中按鈕會停用；失敗時不會自動重試，刪除請求仍走後端權限與 audit 路徑。"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function recordEditIntroCopy() {
  return boundDisplayText(
    "修改以下內容，然後儲存。欄位會轉成後端結構化 payload。",
    maxDisplayDetailTextLength
  );
}

export function recordEditOpenStatusMessage() {
  return boundUiMessage("正在編輯這筆紀錄；按下儲存修改前不會送出 update request。");
}

export function recordEditCancelStatusMessage() {
  return boundUiMessage("已取消編輯；正式紀錄未變更，已返回記錄詳情。");
}

export function recordUpdateChecklistDisplayItems() {
  return [
    "只會更新目前選取的這一筆紀錄。",
    "只送出確認後的結構化 payload，不批次載入完整歷史。",
    "不會呼叫 parser、AI 或 LLM，成本為 0。",
    "不會附帶 raw transcript、raw prompt、raw model output 或模型 debug trace。",
    "儲存中按鈕會停用；失敗時不會自動重試。"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function recordResultDestinationStatusMessage(kind: "delete" | "update", target: AppScreen) {
  const kindLabel = kind === "delete" ? "刪除完成" : "更新完成";
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
  return boundUiMessage(`已從${kindLabel}前往${targetLabel}；不會重新送出 backend request 或呼叫 AI。`);
}

export function deleteSuccessBoundaryChecklistDisplayItems(recordSyncLimit: number) {
  const boundedLimit = clampNumber(recordSyncLimit, 0, maxMobileCountValue);
  return [
    "成功頁不保留被刪除紀錄的本機復原副本。",
    "不會呼叫 parser、AI 或 LLM，成本為 0。",
    "不會保留 raw transcript、raw prompt、raw model output 或模型 debug trace。",
    "失敗不會自動重試；若需要確認 backend 狀態，請稍後重新同步。",
    `回到今日 / 歷史只使用已同步紀錄；mobile 每頁載入 ${boundedLimit} 筆，可用歷史頁載入更多。`
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function updateSuccessBoundaryChecklistDisplayItems(recordSyncLimit: number) {
  const boundedLimit = clampNumber(recordSyncLimit, 0, maxMobileCountValue);
  return [
    "成功頁只反映目前已更新的選取紀錄與本機清單。",
    "不會呼叫 parser、AI 或 LLM，成本為 0。",
    "不會保留 raw transcript、raw prompt、raw model output 或模型 debug trace。",
    "失敗不會自動重試；若需要確認其他裝置狀態，請稍後重新同步。",
    `回到今日 / 歷史 / 分析只使用已同步紀錄；mobile 每頁載入 ${boundedLimit} 筆，可用歷史頁載入更多。`
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
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
