const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxUiMessageLength = 300;

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundUiMessage(value: string) {
  return value.slice(0, maxUiMessageLength);
}

export function historyReturnTodayStatusMessage() {
  return boundUiMessage("已從歷史紀錄回到今日紀錄；只使用已載入紀錄，不額外查詢 backend。");
}

export function historyManualEntryStatusMessage() {
  return boundUiMessage("已從歷史紀錄進入手動新增；此路徑不呼叫 AI、LLM 或 STT。");
}

export function historyRecordDetailStatusMessage() {
  return boundUiMessage("已從歷史紀錄查看單筆詳情；返回會回到歷史紀錄，不呼叫 AI。");
}

export function noRealRecordHealthValueCopy(scope: "general" | "history") {
  return boundDisplayText(
    scope === "history"
      ? "目前尚未載入真實紀錄；歷史頁不顯示固定範例健康數值。"
      : "目前尚未載入真實紀錄；不顯示固定範例健康數值。",
    maxDisplayDetailTextLength
  );
}

export function loadedRecordActionCopy() {
  return boundDisplayText("點擊真實紀錄可查看詳情並進行編輯或刪除。", maxDisplayDetailTextLength);
}

export function historyNoRecordsTitleCopy() {
  return boundDisplayText("還沒有可顯示的歷史紀錄", maxDisplayTextLength);
}

export function historyNoRecordsBodyCopy() {
  return boundDisplayText("建立真實紀錄後，這裡會依日期分組顯示你的資料。", maxDisplayDetailTextLength);
}

export function historyNoRangeRecordsTitleCopy() {
  return boundDisplayText("這個範圍沒有紀錄", maxDisplayTextLength);
}

export function historyNoRangeRecordsBodyCopy() {
  return boundDisplayText("可以切換時間範圍，或回到今日頁新增新的紀錄。", maxDisplayDetailTextLength);
}
