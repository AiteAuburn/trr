export type AnalysisRange = "week" | "month" | "custom";

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

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundUiMessage(value: string) {
  return value.slice(0, maxUiMessageLength);
}

function checklistItem(value: string) {
  return boundDisplayText(value, maxDisplayDetailTextLength);
}

function parseDateBoundary(value: string, edge: "start" | "end") {
  const date = new Date(`${value}T${edge === "start" ? "00:00:00.000" : "23:59:59.999"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function analysisSafetyIntroCopy() {
  return boundDisplayText("只做趨勢摘要，不提供診療建議。", maxDisplayDetailTextLength);
}

export function analysisChartEmptyCopy() {
  return boundDisplayText("目前範圍沒有血糖資料", maxDisplayTextLength);
}

export function analysisEmptyStateDisplayBundle() {
  return {
    safetyIntro: analysisSafetyIntroCopy(),
    chartEmpty: analysisChartEmptyCopy()
  };
}

export function analysisNoDataStatusLabel() {
  return boundDisplayText("尚無資料", 24);
}

export function analysisNoDataCopy() {
  return boundDisplayText(
    "建立真實紀錄後才會顯示趨勢與統計；目前不使用固定範例血糖數字。",
    maxDisplayDetailTextLength
  );
}

export function analysisBoundaryDataCopy(isPreviewMode: boolean) {
  return boundDisplayText(
    isPreviewMode
      ? "目前沒有可分析的真實紀錄；不顯示固定 mock 血糖數字。"
      : "六項統計優先使用 backend bounded report；圖表使用 mobile 已載入紀錄。",
    maxDisplayDetailTextLength
  );
}

export function analysisDataBoundaryDisplayBundle(isPreviewMode: boolean) {
  return {
    noDataStatus: analysisNoDataStatusLabel(),
    noDataCopy: analysisNoDataCopy(),
    boundaryData: analysisBoundaryDataCopy(isPreviewMode)
  };
}

export function analysisBoundaryChecklistDisplayItems(
  dataBoundaryCopy: string,
  recordCacheLimit: number,
  reportQueryLimit: number
) {
  const boundedRecordCacheLimit = clampNumber(recordCacheLimit, 0, maxMobileCountValue);
  const boundedReportQueryLimit = clampNumber(reportQueryLimit, 0, maxMobileCountValue);
  return [
    dataBoundaryCopy,
    `mobile 本機分析最多基於目前已同步的 ${boundedRecordCacheLimit} 筆紀錄。`,
    "基本分析不呼叫 AI，不會產生診療建議。",
    `詳細報告會使用 ${boundedReportQueryLimit} 筆上限查詢，避免一次載入過多資料。`
  ].map(checklistItem);
}

export function analysisRangeSummaryCopy(recordCount: number, isPreviewMode: boolean) {
  const boundedCount = clampNumber(recordCount, 0, maxMobileCountValue);
  return boundDisplayText(
    boundedCount > 0
      ? `目前範圍內有 ${boundedCount} 筆血糖紀錄。`
      : isPreviewMode
        ? "目前沒有任何紀錄；新增紀錄後才會顯示趨勢與統計。"
        : "目前範圍沒有血糖紀錄。",
    maxDisplayDetailTextLength
  );
}

export function analysisCustomRangeStatusCopy(range: AnalysisRange, customStart: string, customEnd: string) {
  if (range !== "custom") {
    return "";
  }
  const start = parseDateBoundary(customStart, "start");
  const end = parseDateBoundary(customEnd, "end");
  if (!start || !end) {
    return boundDisplayText("自訂日期格式無效；目前改用本月資料。", maxDisplayDetailTextLength);
  }
  if (start > end) {
    return boundDisplayText("開始日期晚於結束日期；目前改用本月資料。", maxDisplayDetailTextLength);
  }
  return boundDisplayText("自訂日期區間已套用，結束日期包含當天完整紀錄。", maxDisplayDetailTextLength);
}

export function analysisRangeDisplayTexts(
  range: AnalysisRange,
  customStart: string,
  customEnd: string,
  ranges: ReadonlyArray<{ id: AnalysisRange; label: string }>
) {
  return {
    label: boundDisplayText(
      range === "custom"
        ? `${customStart} - ${customEnd}`
        : ranges.find((item) => item.id === range)?.label ?? "本月",
      maxDisplayDetailTextLength
    ),
    customRangeStatus: analysisCustomRangeStatusCopy(range, customStart, customEnd)
  };
}

export function analysisRangeDisplayBundle(
  range: AnalysisRange,
  customStart: string,
  customEnd: string,
  ranges: ReadonlyArray<{ id: AnalysisRange; label: string }>
) {
  return analysisRangeDisplayTexts(range, customStart, customEnd, ranges);
}

export function analysisReportButtonLabel(isLoading: boolean) {
  return boundDisplayText(isLoading ? "報告載入中..." : "查看詳細報告", maxDisplayTextLength);
}

export function analysisSummaryActionDisplayBundle(value: {
  recordCount: number;
  isPreviewMode: boolean;
  isReportLoading: boolean;
}) {
  return {
    summary: analysisRangeSummaryCopy(value.recordCount, value.isPreviewMode),
    reportButton: analysisReportButtonLabel(value.isReportLoading)
  };
}

export function analysisRuntimeDisplayBundle(value: {
  range: AnalysisRange;
  customStart: string;
  customEnd: string;
  ranges: ReadonlyArray<{ id: AnalysisRange; label: string }>;
  isPreviewMode: boolean;
}) {
  return {
    range: analysisRangeDisplayBundle(
      value.range,
      value.customStart,
      value.customEnd,
      value.ranges
    ),
    dataBoundary: analysisDataBoundaryDisplayBundle(value.isPreviewMode)
  };
}

export function detailedReportNoteDisplayItems(queryLimit: number) {
  const boundedLimit = clampNumber(queryLimit, 0, maxMobileCountValue);
  return [
    "本報告只做紀錄摘要，不提供診斷或治療建議。",
    "backend 報表載入成功時使用 `/reports/basic`，否則使用本機已載入紀錄。",
    `報表查詢限制 ${boundedLimit} 筆，避免 mobile 與 backend 一次載入過多資料。`
  ].map(checklistItem);
}

export function detailedReportBoundaryDisplayRows(reportSourceLabel: string, queryLimit: number) {
  const boundedLimit = clampNumber(queryLimit, 0, maxMobileCountValue);
  return [
    ["資料來源", reportSourceLabel],
    ["AI 成本", "0 次呼叫"],
    ["資料上限", `最多 ${boundedLimit} 筆`],
    ["醫療建議", "不提供"]
  ].map(([label, value]) => ({
    label: boundDisplayText(label, 60),
    value: boundDisplayText(value, 80)
  }));
}

export function analysisRuntimeBoundaryDisplayBundle(value: {
  dataBoundaryCopy: string;
  recordCacheLimit: number;
  reportQueryLimit: number;
  reportSourceLabel: string;
}) {
  return {
    boundaryChecklistItems: analysisBoundaryChecklistDisplayItems(
      value.dataBoundaryCopy,
      value.recordCacheLimit,
      value.reportQueryLimit
    ),
    detailedReportBoundaryRows: detailedReportBoundaryDisplayRows(value.reportSourceLabel, value.reportQueryLimit),
    detailedReportNoteItems: detailedReportNoteDisplayItems(value.reportQueryLimit)
  };
}

export function analysisCustomApplyStatusMessage() {
  return boundUiMessage("已套用自訂日期區間並同步 bounded report；不呼叫 AI 或 LLM。");
}

export function analysisManualEntryStatusMessage() {
  return boundUiMessage("已從基本分析進入手動新增；此路徑不呼叫 AI、LLM 或 STT。");
}

export function analysisReturnTodayStatusMessage() {
  return boundUiMessage("已從基本分析回到今日紀錄；只使用已載入紀錄，不額外查詢 backend。");
}

export function analysisDetailedReportStatusMessage() {
  return boundUiMessage("已開啟詳細報告；會使用固定查詢上限，且不呼叫 AI 或 LLM。");
}

export function detailedReportReturnAnalysisStatusMessage() {
  return boundUiMessage("已從詳細報告返回基本分析；不重新查詢 backend 或呼叫 AI。");
}

export function detailedReportManualEntryStatusMessage() {
  return boundUiMessage("已從詳細報告進入手動新增；此路徑不呼叫 AI、LLM 或 STT。");
}

export function detailedReportReturnTodayStatusMessage() {
  return boundUiMessage("已從詳細報告回到今日紀錄；不重新查詢 backend 或呼叫 AI。");
}
