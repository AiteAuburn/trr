import type { AppScreen } from "./navigationConfig";

export type QuickEntryMode = "voice" | "text" | "manual";

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

export function busyActionStatusMessage() {
  return boundUiMessage("目前仍在處理上一個動作，請稍候");
}

export function previewActionClearStatusMessage() {
  return "";
}

export function todayRecordSummaryText(recordCount: number) {
  if (recordCount <= 0) {
    return boundDisplayText("今日尚未載入紀錄", 80);
  }
  return boundDisplayText(`今日已記錄 ${clampNumber(recordCount, 0, maxMobileCountValue)} 筆`, 80);
}

export function coreFlowSectionLabels() {
  return {
    recordSyncStatus: boundDisplayText("紀錄同步狀態", maxDisplayTextLength),
    recordingEnded: boundDisplayText("錄音結束", maxDisplayTextLength),
    rerecord: boundDisplayText("重新錄音", maxDisplayTextLength),
    rerecordAccessibility: boundDisplayText("重新錄音，只重置本機錄音預覽狀態", maxDisplayDetailTextLength),
    useRecordingTextAccessibility: boundDisplayText("使用錄音結果轉文字，可呼叫本機 Whisper，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength),
    fillSample: boundDisplayText("填入範例", maxDisplayTextLength),
    fillSampleAccessibility: boundDisplayText("填入範例文字，只供確認 UI 預覽，不送 parser", maxDisplayDetailTextLength),
    manualAdd: boundDisplayText("手動新增", maxDisplayTextLength),
    manualAddAccessibility: boundDisplayText("改用手動新增，不呼叫 AI、LLM 或 STT", maxDisplayDetailTextLength),
    nextOrganize: boundDisplayText("下一步整理", maxDisplayTextLength),
    nextOrganizeAccessibility: boundDisplayText("前往文字確認，尚未送出 AI 整理", maxDisplayDetailTextLength),
    textRecord: boundDisplayText("文字記錄", maxDisplayTextLength),
    textRecordAccessibility: boundDisplayText("前往文字記錄輸入，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength),
    viewAnalysis: boundDisplayText("📊 查看分析", maxDisplayTextLength),
    viewAnalysisAccessibility: boundDisplayText("查看基本分析，只使用已載入紀錄", maxDisplayDetailTextLength),
    parseSettings: boundDisplayText("本次整理設定", maxDisplayTextLength),
    noRecordCreated: boundDisplayText("未建立紀錄", maxDisplayTextLength),
    returnEdit: boundDisplayText("返回修改", maxDisplayTextLength),
    returnEditAccessibility: boundDisplayText("返回文字修改，保留目前輸入且不重新呼叫 AI", maxDisplayDetailTextLength),
    enterSaveConfirm: boundDisplayText("查看每日紀錄", maxDisplayTextLength),
    enterSaveConfirmAccessibility: boundDisplayText("進入每日紀錄頁，不儲存也不重新呼叫 AI", maxDisplayDetailTextLength),
    returnTextConfirm: boundDisplayText("回文字確認", maxDisplayTextLength),
    returnTextConfirmAccessibility: boundDisplayText("回文字確認，不送 parser 或寫入資料", maxDisplayDetailTextLength),
    returnConfirm: boundDisplayText("返回確認", maxDisplayTextLength),
    returnConfirmAccessibility: boundDisplayText("返回確認，保留每日紀錄草稿且不送 backend", maxDisplayDetailTextLength),
    submitAiSaveAccessibility: boundDisplayText("儲存今日紀錄，送 backend 驗證與 audit", maxDisplayDetailTextLength),
    saveSuccessManualContinueAccessibility: boundDisplayText("繼續手動新增，不呼叫 AI 或 parser", maxDisplayDetailTextLength),
    saveSuccessRecordEntryAccessibility: boundDisplayText("繼續語音或文字記錄，不自動呼叫 AI 或 STT", maxDisplayDetailTextLength),
    saveSuccessDetailAccessibility: boundDisplayText("查看剛儲存紀錄詳情，不重送 save request", maxDisplayDetailTextLength),
    saveSuccessProcessUnsavedAccessibility: boundDisplayText("處理未儲存 AI 候選，不自動重試儲存", maxDisplayDetailTextLength),
    saveSuccessReturnTodayAccessibility: boundDisplayText("回今日紀錄，只查看目前已載入清單", maxDisplayDetailTextLength),
    lowConfidenceWarning: boundDisplayText("低信心候選提醒", maxDisplayTextLength),
    rejectedEventWarning: boundDisplayText("未建立片段提醒", maxDisplayTextLength),
    saveConnectionStatus: boundDisplayText("儲存連線狀態", maxDisplayTextLength),
    preSubmitCheck: boundDisplayText("送出前檢查", maxDisplayTextLength),
    removeScope: boundDisplayText("移除範圍", maxDisplayTextLength),
    cancel: boundDisplayText("取消", maxDisplayTextLength),
    cancelAccessibility: boundDisplayText("取消並返回確認，不刪除正式紀錄", maxDisplayDetailTextLength),
    confirmRemoveAccessibility: boundDisplayText("確認移除未儲存候選，不呼叫刪除 API", maxDisplayDetailTextLength),
    applyChanges: boundDisplayText("套用修改", maxDisplayTextLength),
    previewEditReturnAccessibility: boundDisplayText("取消候選修改並返回 AI 確認，不寫入正式紀錄", maxDisplayDetailTextLength),
    previewEditApplyAccessibility: boundDisplayText("套用未儲存候選修改，不送 backend save request", maxDisplayDetailTextLength),
    failureBoundary: boundDisplayText("失敗後邊界", maxDisplayTextLength),
    backAiConfirm: boundDisplayText("回 AI 確認", maxDisplayTextLength),
    backAiConfirmAccessibility: boundDisplayText("回 AI 確認，保留候選且不自動重試儲存", maxDisplayDetailTextLength),
    returnSaveConfirm: boundDisplayText("返回儲存確認", maxDisplayTextLength),
    returnSaveConfirmAccessibility: boundDisplayText("返回儲存確認，不自動重試 backend save", maxDisplayDetailTextLength),
    back: boundDisplayText("返回", maxDisplayTextLength),
    backAccessibility: boundDisplayText("返回上一個輸入頁，不送 parser 或寫入資料", maxDisplayDetailTextLength),
    preOrganizeHint: boundDisplayText("整理前提示", maxDisplayTextLength),
    costBoundary: boundDisplayText("本次成本邊界", maxDisplayTextLength),
    retryInput: boundDisplayText("重新輸入", maxDisplayTextLength),
    retryInputAccessibility: boundDisplayText("重新輸入並清除候選暫存，不呼叫 AI 或 backend", maxDisplayDetailTextLength),
    switchManualAdd: boundDisplayText("改用手動新增", maxDisplayTextLength),
    switchManualAddAccessibility: boundDisplayText("改用手動新增，不重送 parser 或呼叫 AI", maxDisplayDetailTextLength),
    submitTranscriptParseAccessibility: boundDisplayText("送出文字整理，僅在 backend 和模型 ready 時呼叫 parser", maxDisplayDetailTextLength),
    saveResult: boundDisplayText("儲存結果", maxDisplayTextLength),
    postSaveBoundary: boundDisplayText("儲存後邊界", maxDisplayTextLength),
    continueManualAdd: boundDisplayText("繼續手動新增", maxDisplayTextLength),
    continueRecord: boundDisplayText("繼續記錄", maxDisplayTextLength),
    voiceText: boundDisplayText("語音 / 文字", maxDisplayTextLength),
    viewDetail: boundDisplayText("查看詳情", maxDisplayTextLength),
    processUnsavedCandidates: boundDisplayText("處理未儲存候選", maxDisplayTextLength),
    backToday: boundDisplayText("回今日紀錄", maxDisplayTextLength),
    backTodayAlt: boundDisplayText("回今日記錄", maxDisplayTextLength),
    deleteResult: boundDisplayText("刪除結果", maxDisplayTextLength),
    postDeleteBoundary: boundDisplayText("刪除後邊界", maxDisplayTextLength),
    viewHistory: boundDisplayText("看歷史紀錄", maxDisplayTextLength),
    deleteSuccessHistoryAccessibility: boundDisplayText("前往歷史紀錄，只查看已載入清單，不重送 delete request", maxDisplayDetailTextLength),
    recordResultReturnAccessibility: boundDisplayText("返回紀錄頁面，只切換畫面，不重送 backend request", maxDisplayDetailTextLength),
    updateResult: boundDisplayText("更新結果", maxDisplayTextLength),
    postUpdateBoundary: boundDisplayText("更新後邊界", maxDisplayTextLength),
    updatedRecordDetailAccessibility: boundDisplayText("查看更新後紀錄詳情，不重送 update request", maxDisplayDetailTextLength),
    createRecord: boundDisplayText("建立紀錄", maxDisplayTextLength),
    manualReturnAccessibility: boundDisplayText("返回上一頁，不建立手動紀錄或呼叫 AI", maxDisplayDetailTextLength),
    manualCreatePreviewAccessibility: boundDisplayText("進入手動紀錄確認，尚未送 backend create request", maxDisplayDetailTextLength),
    manualConfirmReturnAccessibility: boundDisplayText("返回手動紀錄編輯，不送 create request", maxDisplayDetailTextLength),
    manualCreateSubmitAccessibility: boundDisplayText("送出手動紀錄建立，走 backend 驗證與 audit，不呼叫 AI", maxDisplayDetailTextLength),
    historyDataBoundary: boundDisplayText("歷史資料邊界", maxDisplayTextLength),
    startDate: boundDisplayText("開始日期", maxDisplayTextLength),
    endDate: boundDisplayText("結束日期", maxDisplayTextLength),
    applyDateRange: boundDisplayText("套用日期範圍", maxDisplayTextLength),
    historyApplyRangeAccessibility: boundDisplayText("套用歷史日期範圍，只篩選已載入紀錄", maxDisplayDetailTextLength),
    historyReturnTodayAccessibility: boundDisplayText("回今日紀錄，不查詢 backend 或建立紀錄", maxDisplayDetailTextLength),
    historyDataStatus: boundDisplayText("歷史資料狀態", maxDisplayTextLength),
    historySyncBoundary: boundDisplayText("歷史同步邊界", maxDisplayTextLength),
    historyLoadMore: boundDisplayText("載入更多", maxDisplayTextLength),
    historyLoadMoreAccessibility: boundDisplayText("使用 cursor 載入更早紀錄，不呼叫 AI 或修改資料", maxDisplayDetailTextLength),
    analysisReportStatus: boundDisplayText("分析統計同步", maxDisplayTextLength),
    analysisApplyCustomRange: boundDisplayText("套用自訂區間", maxDisplayTextLength),
    analysisApplyCustomRangeAccessibility: boundDisplayText("套用分析自訂日期區間並同步 bounded report，不呼叫 AI", maxDisplayDetailTextLength),
    mainInfo: boundDisplayText("主要資訊", maxDisplayTextLength),
    supplementalInfo: boundDisplayText("補充資訊", maxDisplayTextLength),
    source: boundDisplayText("來源", maxDisplayTextLength),
    detailBoundary: boundDisplayText("詳情頁邊界", maxDisplayTextLength),
    recordDetailReturnAccessibility: boundDisplayText("返回紀錄清單，不更新或刪除紀錄", maxDisplayDetailTextLength),
    edit: boundDisplayText("編輯", maxDisplayTextLength),
    recordEditOpenAccessibility: boundDisplayText("開啟編輯紀錄，不送 update request", maxDisplayDetailTextLength),
    recordDeleteOpenAccessibility: boundDisplayText("開啟刪除確認，不送 delete request", maxDisplayDetailTextLength),
    deletePreConfirm: boundDisplayText("刪除前確認", maxDisplayTextLength),
    recordDeleteReturnAccessibility: boundDisplayText("返回紀錄詳情，不送 delete request", maxDisplayDetailTextLength),
    recordDeleteCancelAccessibility: boundDisplayText("取消刪除並返回詳情，不送 delete request", maxDisplayDetailTextLength),
    recordDeleteSubmitAccessibility: boundDisplayText("確認刪除正式紀錄，送 backend delete request 與 audit", maxDisplayDetailTextLength),
    updatePreCheck: boundDisplayText("更新前檢查", maxDisplayTextLength),
    saveChanges: boundDisplayText("儲存修改", maxDisplayTextLength),
    recordEditReturnAccessibility: boundDisplayText("取消編輯並返回詳情，不送 update request", maxDisplayDetailTextLength),
    recordUpdateSubmitAccessibility: boundDisplayText("儲存修改，送 backend update request 與 audit", maxDisplayDetailTextLength),
    analysisDataBoundary: boundDisplayText("分析資料邊界", maxDisplayTextLength),
    analysisSyncBoundary: boundDisplayText("分析同步邊界", maxDisplayTextLength),
    analysisManualAccessibility: boundDisplayText("從分析頁改用手動新增，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength),
    analysisReturnTodayAccessibility: boundDisplayText("從分析頁回今日紀錄，不查詢 backend", maxDisplayDetailTextLength),
    analysisDetailedReportAccessibility: boundDisplayText("查看詳細報告，只在符合條件時查詢 bounded report", maxDisplayDetailTextLength),
    reportNotes: boundDisplayText("報告備註", maxDisplayTextLength),
    reportReturnAnalysisAccessibility: boundDisplayText("返回基本分析，不重新查詢報告", maxDisplayDetailTextLength),
    reportManualAccessibility: boundDisplayText("從詳細報告改用手動新增，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength),
    reportReturnTodayAccessibility: boundDisplayText("從詳細報告回今日紀錄，不重新查詢 backend", maxDisplayDetailTextLength)
  };
}

export function headerActionAccessibilityLabel(chrome: { actionLabel?: string }) {
  if (chrome.actionLabel === "×") {
    return boundDisplayText("關閉目前頁面", maxDisplayTextLength);
  }
  if (chrome.actionLabel === "‹") {
    return boundDisplayText("返回上一頁", maxDisplayTextLength);
  }
  return boundDisplayText("開啟功能選單", maxDisplayTextLength);
}

export function recordingButtonAccessibilityLabel(isRecording: boolean) {
  return boundDisplayText(isRecording ? "錄音預覽進行中，放開結束" : "按住開始錄音預覽", maxDisplayTextLength);
}

export function primaryTabAccessibilityLabel(label: string) {
  const safeLabel = boundDisplayText(label || "分頁", 60);
  return boundDisplayText(`前往${safeLabel}分頁，只切換 App 內頁面`, maxDisplayDetailTextLength);
}

export function returnDestinationButtonLabel(destination: AppScreen) {
  if (destination === "futureModules") {
    return boundDisplayText("返回未來擴充", maxDisplayTextLength);
  }
  if (destination === "menu") {
    return boundDisplayText("返回功能選單", maxDisplayTextLength);
  }
  return boundDisplayText("返回上一頁", maxDisplayTextLength);
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
