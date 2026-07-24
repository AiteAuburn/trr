const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxUiMessageLength = 300;
const maxMobileCountValue = 1_000_000;

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

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

export function historyCalendarDisplayTexts(monthStart: Date, selectedDate: string) {
  return {
    title: boundDisplayText(`${monthStart.getFullYear()} 年 ${monthStart.getMonth() + 1} 月`, 40),
    selectedDate: boundDisplayText(selectedDate, 40),
    previousMonthLabel: boundDisplayText("上一月", 20),
    nextMonthLabel: boundDisplayText("下一月", 20),
    previousMonthAccessibility: boundDisplayText("查看上一個月份月曆，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength),
    nextMonthAccessibility: boundDisplayText("查看下一個月份月曆，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength)
  };
}

export function historyCalendarDisplayBundle(monthStart: Date, selectedDate: string) {
  return historyCalendarDisplayTexts(monthStart, selectedDate);
}

export function historyRuntimeDisplayBundle(value: {
  monthStart: Date;
  selectedDate: string;
  selectedRecordCount: number;
}) {
  return {
    calendar: historyCalendarDisplayBundle(value.monthStart, value.selectedDate),
    selectedRecordDisplayCount: clampNumber(value.selectedRecordCount, 0, maxMobileCountValue)
  };
}

export function historyBoundaryChecklistDisplayItems(
  recordSyncLimit: number,
  recordCacheLimit: number,
  hasLoadedRecords: boolean
) {
  const boundedRecordSyncLimit = clampNumber(recordSyncLimit, 0, maxMobileCountValue);
  const boundedRecordCacheLimit = clampNumber(recordCacheLimit, 0, maxMobileCountValue);
  return [
    "月曆選取日期只套用在 mobile 目前已載入的紀錄。",
    `每頁最多載入 ${boundedRecordSyncLimit} 筆，本機最多保留 ${boundedRecordCacheLimit} 筆；這不是完整歷史匯出。`,
    "點擊月曆日期或切換 AI 整理 / 原始紀錄不會額外查詢 backend，也不會呼叫 AI。",
    "載入更多使用 backend cursor pagination，只追加更早紀錄並以 id 去重。",
    hasLoadedRecords ? loadedRecordActionCopy() : noRealRecordHealthValueCopy("general")
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function historyBoundaryDisplayBundle(value: {
  recordSyncLimit: number;
  recordCacheLimit: number;
  hasLoadedRecords: boolean;
}) {
  return {
    boundaryChecklistItems: historyBoundaryChecklistDisplayItems(
      value.recordSyncLimit,
      value.recordCacheLimit,
      value.hasLoadedRecords
    )
  };
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

export function historyEmptyStateDisplayBundle() {
  return {
    noRealRecordHealthValue: noRealRecordHealthValueCopy("history"),
    noRecordsTitle: historyNoRecordsTitleCopy(),
    noRecordsBody: historyNoRecordsBodyCopy(),
    noRangeRecordsTitle: historyNoRangeRecordsTitleCopy(),
    noRangeRecordsBody: historyNoRangeRecordsBodyCopy()
  };
}
