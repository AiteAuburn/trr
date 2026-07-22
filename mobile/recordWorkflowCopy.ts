import type { SaveEntryMethod } from "./appTypes";
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

function displayTextValue(value: unknown, maxLength = maxDisplayDetailTextLength) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return boundDisplayText(value, maxLength);
  }
  return boundDisplayText(String(value), maxLength);
}

function safeUiError(error: unknown, fallback: string) {
  if (error instanceof Error && /^\S+ failed: \d{3}$/.test(error.message)) {
    return boundUiMessage(error.message);
  }
  return boundUiMessage(fallback);
}

type ParserModelAvailabilitySource = {
  label: string;
  available: boolean;
};

export function aiSaveUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前不會送出 AI 候選儲存請求。`);
}

export function aiPartialSaveFailureStatusMessage(message: string) {
  return boundUiMessage(`${message}；已保留未儲存候選紀錄，不會自動重試。`);
}

export function aiSaveProgressStatusMessage() {
  return boundUiMessage("儲存今日紀錄...");
}

export function aiSaveSuccessStatusMessage() {
  return boundUiMessage("已儲存");
}

export function aiSaveFailureStatusMessage(error: unknown) {
  return safeUiError(error, "儲存失敗");
}

export function aiSaveRecordsStatusMessage(count: number) {
  return boundUiMessage(`已更新今日紀錄，新增 ${clampNumber(count, 0, maxMobileCountValue)} 筆紀錄`);
}

export function aiSaveSuccessSummaryMessage(count: number) {
  return boundUiMessage(`已儲存今日紀錄，包含 ${clampNumber(count, 0, maxMobileCountValue)} 筆 AI 整理紀錄`);
}

export function aiPartialSaveRecordsStatusMessage(savedCount: number, unsavedCount: number) {
  return boundUiMessage(
    `已新增 ${clampNumber(savedCount, 0, maxMobileCountValue)} 筆；${clampNumber(
      unsavedCount,
      0,
      maxMobileCountValue
    )} 筆尚未儲存`
  );
}

export function aiPartialSaveSummaryMessage(savedCount: number, unsavedCount: number) {
  return boundUiMessage(
    `已儲存 ${clampNumber(savedCount, 0, maxMobileCountValue)} 筆；${clampNumber(
      unsavedCount,
      0,
      maxMobileCountValue
    )} 筆尚未儲存，請返回確認頁檢查。`
  );
}

export function saveResultDisplayTexts(value: {
  lastSavedSummary: string;
  lastSaveErrorSummary: string;
  lowConfidenceCount: number;
  rejectedEventCount: number;
  backendUnavailableMessage: string;
}) {
  return {
    lastSavedSummary: boundUiMessage(value.lastSavedSummary || "紀錄已加入今日紀錄與歷史紀錄。"),
    lastSaveErrorSummary: boundUiMessage(
      value.lastSaveErrorSummary || "候選紀錄尚未儲存，請返回確認頁檢查後再送出。"
    ),
    lowConfidenceWarning: boundUiMessage(
      `仍有 ${clampNumber(value.lowConfidenceCount, 0, maxMobileCountValue)} 筆候選信心偏低；建議返回確認逐筆檢查後再儲存。返回確認不會重新呼叫 AI。`
    ),
    rejectedPreviewWarning: boundUiMessage(
      `有 ${clampNumber(value.rejectedEventCount, 0, maxMobileCountValue)} 段文字沒有建立候選紀錄；確認儲存只會送出目前候選，不會儲存這些片段，也不會自動重新呼叫 AI。`
    ),
    aiSaveBackendBlocked: boundUiMessage(
      `${value.backendUnavailableMessage || "backend 尚未 ready"}；目前不會送出儲存請求，避免無效重試與重複寫入。`
    )
  };
}

export function saveResultDisplayBundle(value: {
  lastSavedSummary: string;
  lastSaveErrorSummary: string;
  lowConfidenceCount: number;
  rejectedEventCount: number;
  backendUnavailableMessage: string;
}) {
  return saveResultDisplayTexts(value);
}

export function parserBackendUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前不送出 parser 請求，避免無效重試與額外成本。`);
}

export function parserModelUnavailableText(
  llmModel: ParserModelAvailabilitySource | null,
  sttModel: ParserModelAvailabilitySource | null
) {
  if (!llmModel) {
    return boundUiMessage("LLM 模型尚未載入");
  }
  if (!llmModel.available) {
    return boundUiMessage(`${displayTextValue(llmModel.label, 80)} 尚未啟用`);
  }
  if (!sttModel) {
    return boundUiMessage("STT 模型尚未載入");
  }
  if (!sttModel.available) {
    return boundUiMessage(`${displayTextValue(sttModel.label, 80)} 尚未啟用`);
  }
  return "";
}

export function parserModelReadyFromMessage(message: string) {
  return message.length === 0;
}

export function parserModelAvailabilityDisplayBundle(value: {
  llmModel: ParserModelAvailabilitySource | null;
  sttModel: ParserModelAvailabilitySource | null;
}) {
  const unavailableMessage = parserModelUnavailableText(value.llmModel, value.sttModel);
  return {
    unavailableMessage,
    ready: parserModelReadyFromMessage(unavailableMessage)
  };
}

export function parserAvailabilityDisplayMessages(value: {
  parserModelUnavailableMessage: string;
  protectedBackendUnavailableMessage: string;
}) {
  return {
    parserModelUnavailable: boundUiMessage(value.parserModelUnavailableMessage),
    protectedBackendUnavailable: boundUiMessage(value.protectedBackendUnavailableMessage)
  };
}

export function parserModelUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message}；目前不送出 parser 請求，請先在設定選擇可用模型。`);
}

export function parserSampleBlockedStatusMessage() {
  return boundUiMessage("範例文字不會送入 parser；請改成自己的紀錄內容，或使用手動新增避免 LLM 成本。");
}

export function parserProgressStatusMessage() {
  return boundUiMessage("送入 parser...");
}

export function parserSuccessStatusMessage(count: number) {
  return boundUiMessage(`整理完成：${clampNumber(count, 0, maxMobileCountValue)} 筆候選紀錄`);
}

export function parserVoiceQuotaSyncedStatusMessage(count: number, voiceSeconds: number) {
  return boundUiMessage(
    `整理完成：${clampNumber(count, 0, maxMobileCountValue)} 筆候選紀錄；已送出 ${clampNumber(voiceSeconds, 0, maxMobileCountValue)} 秒語音額度。`
  );
}

export function parserFailureStatusMessage(error: unknown) {
  return safeUiError(error, "Parser 失敗");
}

export function parserFailureRecoveryMessage(message: string) {
  return boundUiMessage(`${message}。可以修改文字後再整理，或改用手動新增避免再次呼叫 parser。`);
}

export function aiReviewNoCandidateTitleCopy() {
  return boundDisplayText("沒有可儲存的候選紀錄", maxDisplayTextLength);
}

export function aiReviewNoCandidateBodyCopy() {
  return boundDisplayText("請返回修改文字，或改用手動新增。", maxDisplayDetailTextLength);
}

export function aiReviewNoCandidateBoundaryCopy() {
  return boundDisplayText("不會送出儲存請求，也不會新增額外 AI 呼叫。", maxDisplayDetailTextLength);
}

export function aiReviewNoPreviewTitleCopy() {
  return boundDisplayText("尚未產生整理結果", maxDisplayTextLength);
}

export function aiReviewNoPreviewBodyCopy() {
  return boundDisplayText("請先完成文字確認，再進行 AI 整理。", maxDisplayDetailTextLength);
}

export function aiReviewIntroCopy() {
  return boundDisplayText("儲存前請逐筆確認；修改候選紀錄不會重新呼叫 AI。", maxDisplayDetailTextLength);
}

export function aiReviewLowConfidenceCopy() {
  return boundDisplayText("信心偏低，請仔細確認後再儲存。", maxDisplayDetailTextLength);
}

export function aiReviewRejectedEventsCopy() {
  return boundDisplayText("以下片段沒有轉成候選紀錄；不會自動儲存，也不會自動重新呼叫 AI。", maxDisplayDetailTextLength);
}

export function aiReviewRejectedReasonCopy(reasonLabel: string) {
  return boundDisplayText(`原因：${boundDisplayText(reasonLabel, 80)}`, maxDisplayDetailTextLength);
}

export function aiReviewBackendRequiredCopy() {
  return boundDisplayText("請先連線 backend，才可儲存候選紀錄。", maxDisplayDetailTextLength);
}

export function aiReviewDisplayTexts() {
  return {
    noCandidateTitle: aiReviewNoCandidateTitleCopy(),
    noCandidateBody: aiReviewNoCandidateBodyCopy(),
    noCandidateBoundary: aiReviewNoCandidateBoundaryCopy(),
    noPreviewTitle: aiReviewNoPreviewTitleCopy(),
    noPreviewBody: aiReviewNoPreviewBodyCopy(),
    intro: aiReviewIntroCopy(),
    lowConfidence: aiReviewLowConfidenceCopy(),
    rejectedEvents: aiReviewRejectedEventsCopy(),
    backendRequired: aiReviewBackendRequiredCopy()
  };
}

export function aiReviewDisplayBundle() {
  return aiReviewDisplayTexts();
}

export function aiReviewCostBoundaryChecklistDisplayItems() {
  return [
    "此頁只顯示 parser 已回傳的候選紀錄。",
    "逐筆編輯、移除或進入儲存確認都不會重新呼叫 AI。",
    "未建立片段不會自動儲存，也不會自動重跑 parser。",
    "返回修改後，只有再次按下一步整理才會產生新的 parser / AI 成本。",
    "mobile 不保留 raw prompt、raw model output 或模型 debug trace。"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function recordEntrySettingsChecklistDisplayItems(isBackendReady: boolean) {
  return [
    "手動新增可完全避開 AI parser，適合補登明確紀錄。",
    "文字整理每次只送出目前文字一次，不批次載入歷史紀錄。",
    "確認儲存前不會寫入資料庫；候選紀錄可先逐筆修改或移除。",
    "mobile 不保存 raw prompt、raw model output 或模型 debug trace。",
    isBackendReady
      ? "backend ready；送出前仍會先做本機長度與數字密度檢查。"
      : boundUiMessage("backend 尚未 ready；目前不能送 parser，避免無效重試與額外成本。")
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function aiSaveConfirmIntroCopy() {
  return boundDisplayText(
    "AI 已整理成今天唯一的每日紀錄草稿；按下儲存今日紀錄後才會送到後端建立紀錄。",
    maxDisplayDetailTextLength
  );
}

export function aiSaveConfirmReadyStatusMessage() {
  return boundUiMessage("已產生每日紀錄草稿；請確認分類內容後再儲存今日紀錄。");
}

export function aiSaveConfirmReturnStatusMessage() {
  return boundUiMessage("已返回 AI 整理確認；每日紀錄草稿保留，可繼續編輯或移除候選。");
}

export function aiSaveConfirmSubmitLabel(isBusy: boolean, isBlockedByBackend: boolean, hasWarnings: boolean) {
  return boundDisplayText(
    isBusy
      ? "儲存中..."
      : isBlockedByBackend
        ? "等待 backend 連線"
        : hasWarnings
          ? "了解提醒並儲存今日紀錄"
          : "儲存今日紀錄",
    maxDisplayTextLength
  );
}

export function aiSaveConfirmDisplayTexts(isBusy: boolean, isBlockedByBackend: boolean, hasWarnings: boolean) {
  return {
    title: boundDisplayText("每日紀錄", maxDisplayTextLength),
    dateLabel: boundDisplayText("記錄日期", maxDisplayTextLength),
    summaryLabel: boundDisplayText("AI今日摘要", maxDisplayTextLength),
    intro: aiSaveConfirmIntroCopy(),
    submit: aiSaveConfirmSubmitLabel(isBusy, isBlockedByBackend, hasWarnings)
  };
}

export function aiSaveConfirmDisplayBundle(isBusy: boolean, isBlockedByBackend: boolean, hasWarnings: boolean) {
  return aiSaveConfirmDisplayTexts(isBusy, isBlockedByBackend, hasWarnings);
}

export function aiSaveConfirmChecklistDisplayItems(unsavedPreviewRecordCount: number) {
  const boundedCount = clampNumber(unsavedPreviewRecordCount, 0, maxMobileCountValue);
  return [
    "只會儲存目前畫面上的候選紀錄。",
    `本次最多送出 ${boundedCount} 筆候選 payload，不會批次載入完整歷史。`,
    "送往 backend 的內容以確認後資料為主，不會附帶整段紀錄歷史或模型 debug trace。",
    "不會儲存未建立片段，也不會自動重新呼叫 AI。",
    "每筆紀錄仍會經過後端驗證、權限與 audit 路徑。",
    "若部分儲存失敗，已成功紀錄會保留，未儲存候選會回到確認流程。"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function aiSaveConfirmBoundaryDisplayRows(
  unsavedPreviewRecordCount: number,
  lowConfidenceRecordCount: number,
  rejectedPreviewEventCount: number
) {
  return [
    ["候選紀錄", `${clampNumber(unsavedPreviewRecordCount, 0, maxMobileCountValue)} 筆`],
    ["低信心", `${clampNumber(lowConfidenceRecordCount, 0, maxMobileCountValue)} 筆`],
    ["未建立片段", `${clampNumber(rejectedPreviewEventCount, 0, maxMobileCountValue)} 筆`],
    ["額外 AI 成本", "0 次呼叫"]
  ].map(([label, value]) => ({
    label: boundDisplayText(label, 60),
    value: boundDisplayText(value, 80)
  }));
}

export function saveSuccessBoundaryChecklistDisplayItems(
  lastSaveEntryMethod: SaveEntryMethod,
  hasUnsavedPreviewRecords: boolean,
  unsavedPreviewRecordCount: number,
  recordSyncLimit: number
) {
  const boundedUnsavedCount = clampNumber(unsavedPreviewRecordCount, 0, maxMobileCountValue);
  const boundedRecordSyncLimit = clampNumber(recordSyncLimit, 0, maxMobileCountValue);
  const hasManualFallbackWithAiCandidates = lastSaveEntryMethod === "manual" && hasUnsavedPreviewRecords;
  return [
    lastSaveEntryMethod === "manual"
      ? hasManualFallbackWithAiCandidates
        ? "手動新增沒有 parser / LLM 成本；原本 AI 候選仍保留在確認流程，需由使用者手動處理。"
        : "手動新增沒有 parser / LLM 成本，也沒有 AI 候選紀錄需要保留。"
      : "AI 原始文字與目前輸入已清空；成功頁不保留 raw prompt、raw model output 或 debug trace。",
    hasUnsavedPreviewRecords
      ? `仍有 ${boundedUnsavedCount} 筆候選紀錄留在確認流程；系統不會自動重試或重新呼叫 AI。`
      : "沒有未儲存候選需要自動重試；下一步只做頁面導覽。",
    `回到今日 / 歷史 / 分析只使用已同步紀錄；mobile 每頁載入 ${boundedRecordSyncLimit} 筆，可用歷史頁載入更多。`,
    "成功頁不新增 backend request，除非使用者主動進入其他頁面觸發既有同步。"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function dailyRecordLeaveGuardTitleCopy() {
  return boundDisplayText("尚未儲存今天的紀錄", maxDisplayTextLength);
}

export function dailyRecordLeaveGuardBodyCopy() {
  return boundDisplayText("離開後，今天的修改將不會保留。", maxDisplayDetailTextLength);
}

export function dailyRecordLeaveGuardQuestionCopy() {
  return boundDisplayText("是否仍要離開？", maxDisplayTextLength);
}

export function dailyRecordLeaveGuardDisplayTexts() {
  return {
    title: dailyRecordLeaveGuardTitleCopy(),
    body: dailyRecordLeaveGuardBodyCopy(),
    question: dailyRecordLeaveGuardQuestionCopy(),
    cancel: boundDisplayText("取消", maxDisplayTextLength),
    cancelAccessibility: boundDisplayText("取消離開，保留每日紀錄草稿", maxDisplayDetailTextLength),
    confirm: boundDisplayText("離開", maxDisplayTextLength),
    confirmAccessibility: boundDisplayText("離開每日紀錄頁，今天未儲存修改不會保留", maxDisplayDetailTextLength)
  };
}

export function dailyRecordLeaveGuardDisplayBundle() {
  return dailyRecordLeaveGuardDisplayTexts();
}

export function dailyRecordLeaveGuardPromptStatusMessage() {
  return boundUiMessage("尚未儲存今天的紀錄；請先選擇取消或離開。");
}

export function dailyRecordLeaveGuardCancelStatusMessage() {
  return boundUiMessage("已取消離開；每日紀錄草稿仍保留在目前畫面。");
}

export function dailyRecordLeaveGuardConfirmStatusMessage() {
  return boundUiMessage("已離開每日紀錄頁；未儲存草稿仍保留在 AI 確認流程。");
}

export function aiRemoveConfirmBoundaryLabel(isDailyRecordDelete = false) {
  return boundDisplayText(isDailyRecordDelete ? "確定要刪除這筆紀錄嗎？" : "只會移除待確認候選", maxDisplayTextLength);
}

export function aiRemoveConfirmBoundaryCopy(isDailyRecordDelete = false) {
  return boundDisplayText(
    isDailyRecordDelete
      ? "刪除後無法復原。這會先從每日紀錄草稿移除，儲存前不會送出刪除 API，也不會重新呼叫 AI。"
      : "這筆 AI 整理結果尚未寫入資料庫；移除後不會送出刪除 API，也不會重新呼叫 AI。",
    maxDisplayDetailTextLength
  );
}

export function aiRemoveConfirmSourceCopy(confidencePercent: number) {
  const boundedPercent = clampNumber(confidencePercent, 0, 100);
  return boundDisplayText(`信心 ${boundedPercent}% · source: AI candidate`, maxDisplayDetailTextLength);
}

export function aiRemoveConfirmDisplayTexts(isDailyRecordDelete: boolean, confidencePercent: number | null) {
  return {
    title: boundDisplayText(isDailyRecordDelete ? "刪除此筆紀錄" : "移除候選紀錄", maxDisplayTextLength),
    submit: boundDisplayText(isDailyRecordDelete ? "刪除" : "確認移除", maxDisplayTextLength),
    boundaryLabel: aiRemoveConfirmBoundaryLabel(isDailyRecordDelete),
    boundary: aiRemoveConfirmBoundaryCopy(isDailyRecordDelete),
    source: confidencePercent === null ? "" : aiRemoveConfirmSourceCopy(confidencePercent)
  };
}

export function aiRemoveConfirmDisplayBundle(isDailyRecordDelete: boolean, confidencePercent: number | null) {
  return aiRemoveConfirmDisplayTexts(isDailyRecordDelete, confidencePercent);
}

export function previewRecordEditBoundaryCopy() {
  return boundDisplayText("這裡只修改待確認候選紀錄；按下確認儲存前不會寫入資料庫。", maxDisplayDetailTextLength);
}

export function previewRecordEditBoundaryDisplayBundle() {
  return {
    boundary: previewRecordEditBoundaryCopy()
  };
}

export function manualRecordConfirmIntroCopy() {
  return boundDisplayText(
    "這筆紀錄不經 AI parser，送出後會透過後端驗證、權限與 audit 路徑建立。",
    maxDisplayDetailTextLength
  );
}

export function manualRecordConfirmSubmitLabel(isBusy: boolean) {
  return boundDisplayText(isBusy ? "建立中..." : "確認建立", maxDisplayTextLength);
}

export function manualRecordConfirmDisplayTexts(isBusy: boolean) {
  return {
    intro: manualRecordConfirmIntroCopy(),
    submit: manualRecordConfirmSubmitLabel(isBusy)
  };
}

export function manualRecordConfirmDisplayBundle(isBusy: boolean) {
  return manualRecordConfirmDisplayTexts(isBusy);
}

export function manualSubmitChecklistDisplayItems() {
  return [
    "不會呼叫 AI 或 LLM，成本為 0。",
    "只會送出 1 筆手動紀錄 payload，不會批次載入完整歷史。",
    "不會附帶 raw transcript、raw prompt、raw model output 或模型 debug trace。",
    "日期、時間、類型與欄位會送到後端再次驗證。",
    "建立中按鈕會停用；失敗時不會自動重試。"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function manualRecordConfirmReadyStatusMessage() {
  return boundUiMessage("請確認手動紀錄；送出前不會呼叫 AI 或 LLM。");
}

export function manualRecordConfirmReturnStatusMessage() {
  return boundUiMessage("已返回手動新增；目前輸入已保留，可繼續修改。");
}

export function manualRecordReturnStatusMessage(target: AppScreen) {
  const targetLabel =
    target === "today"
      ? "今日紀錄"
      : target === "history"
        ? "歷史紀錄"
        : target === "analysis"
          ? "基本分析"
          : target === "tutorial"
            ? "使用教學"
            : target === "aiReview"
              ? "AI 整理確認"
              : target === "record"
                ? "快速記錄"
                : "上一頁";
  return boundUiMessage(`已從手動新增返回${targetLabel}；未送出 create request，也未呼叫 AI。`);
}

export function recordDetailReturnStatusMessage(target: AppScreen) {
  const targetLabel =
    target === "history"
      ? "歷史紀錄"
      : target === "saveSuccess"
        ? "儲存完成"
        : target === "updateSuccess"
          ? "更新完成"
          : "今日紀錄";
  return boundUiMessage(`已從記錄詳情返回${targetLabel}；只使用已載入紀錄，不呼叫 AI。`);
}

export function recordDetailBoundaryChecklistDisplayItems() {
  return [
    "只顯示目前已載入的單筆紀錄，不額外查詢完整歷史。",
    "不會呼叫 parser、AI 或 LLM，成本為 0。",
    "不會保留 raw transcript、raw prompt、raw model output 或模型 debug trace。",
    "編輯與刪除必須進入各自確認流程，詳情頁本身不直接寫入資料。"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function tutorialRecordEntryStatusMessage() {
  return boundUiMessage("已從使用教學前往快速記錄；送出文字前不會呼叫 parser 或 LLM。");
}

export function tutorialManualEntryStatusMessage() {
  return boundUiMessage("已從使用教學進入手動新增；此路徑不呼叫 AI、LLM 或 STT。");
}

export function aiCandidateEditOpenStatusMessage() {
  return boundUiMessage("請確認 AI 整理的單筆紀錄");
}

export function aiCandidateEditCancelStatusMessage() {
  return boundUiMessage("已取消修改；候選紀錄保留在 AI 整理確認清單。");
}

export function aiCandidateRemoveConfirmStatusMessage() {
  return boundUiMessage("請確認是否移除這筆 AI 候選紀錄");
}

export function aiCandidateRemoveCancelStatusMessage() {
  return boundUiMessage("已取消移除；候選紀錄保留在 AI 整理確認清單。");
}

export function aiCandidateRemoveChecklistDisplayItems() {
  return [
    "只影響目前 AI 整理確認清單。",
    "已經儲存的正式紀錄不受影響。",
    "若移除錯誤，可返回文字確認頁重新整理；這會重新產生 parser / AI 成本。"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function recordWorkflowStaticChecklistDisplayBundle() {
  return {
    aiReviewCostBoundaryItems: aiReviewCostBoundaryChecklistDisplayItems(),
    manualSubmitItems: manualSubmitChecklistDisplayItems(),
    recordDetailBoundaryItems: recordDetailBoundaryChecklistDisplayItems(),
    aiCandidateRemoveItems: aiCandidateRemoveChecklistDisplayItems()
  };
}

export function aiSaveFailureChecklistDisplayItems(unsavedPreviewRecordCount: number) {
  const boundedCount = clampNumber(unsavedPreviewRecordCount, 0, maxMobileCountValue);
  return [
    `目前保留 ${boundedCount} 筆候選紀錄在確認流程中。`,
    "系統不會自動重試，也不會重新呼叫 parser / AI。",
    "你可以返回儲存確認後再送出，或回 AI 整理確認逐筆編輯。",
    "若 backend 持續不可用，可改用手動新增單筆明確紀錄。"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function recordWorkflowRuntimeChecklistDisplayBundle(value: {
  protectedBackendReady: boolean;
  unsavedPreviewRecordCount: number;
}) {
  return {
    aiSaveConfirmItems: aiSaveConfirmChecklistDisplayItems(value.unsavedPreviewRecordCount),
    recordEntrySettingsItems: recordEntrySettingsChecklistDisplayItems(value.protectedBackendReady),
    aiSaveFailureItems: aiSaveFailureChecklistDisplayItems(value.unsavedPreviewRecordCount)
  };
}

export function aiCandidateRemoveResultStatusMessage(count: number) {
  const boundedCount = clampNumber(count, 0, maxMobileCountValue);
  return boundedCount === 0 ? boundUiMessage("已移除所有候選紀錄") : boundUiMessage(`剩餘 ${boundedCount} 筆候選紀錄`);
}

export function aiCandidateEditSuccessStatusMessage() {
  return boundUiMessage("候選紀錄已更新，請再次確認後儲存");
}

export function aiCandidateEditFailureStatusMessage(error: unknown) {
  return safeUiError(error, "候選紀錄更新失敗");
}
