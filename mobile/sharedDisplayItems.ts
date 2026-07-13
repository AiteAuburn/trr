import type { AppScreen } from "./navigationConfig";

const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundUiMessage(value: string) {
  return value.slice(0, 300);
}

export function tutorialStepDisplayItem(value: readonly string[]) {
  return {
    icon: boundDisplayText(value[0] || "•", 4),
    title: boundDisplayText(value[1] || "教學步驟", maxDisplayTextLength),
    description: boundDisplayText(value[2] || "尚未設定教學說明。", maxDisplayDetailTextLength)
  };
}

export function previewTupleDisplayItem(value: readonly [string, string, string]) {
  const title = boundDisplayText(value[0] || "項目", maxDisplayTextLength);
  return {
    title,
    statusLabel: boundDisplayText(value[1] || "未設定", 40),
    copy: boundDisplayText(value[2] || "尚未設定說明。", maxDisplayDetailTextLength),
    icon: boundDisplayText(title[0] || "•", 4)
  };
}

export function sessionManagementPreviewDisplayItem(value: readonly [string, string, string]) {
  const item = previewTupleDisplayItem(value);
  return {
    ...item,
    accessibilityLabel: boundDisplayText(`查看${item.title}session 管理狀態，不顯示 raw token`, maxDisplayDetailTextLength),
    actionStatus: boundUiMessage(
      `${item.title} 尚未啟用；需完成 server-side session list、refresh token revoke、裝置識別與安全儲存清除後才可操作。`
    )
  };
}

export function boundaryMetricDisplayItem(value: readonly [string, string]) {
  return {
    label: boundDisplayText(value[0] || "狀態", 60),
    value: boundDisplayText(value[1] || "未設定", 80)
  };
}

export function metricDisplayItem(value: readonly [string, string]) {
  return {
    label: boundDisplayText(value[0] || "指標", 60),
    value: boundDisplayText(value[1] || "尚無", 80)
  };
}

export function detailPairDisplayItem(value: readonly [string, string]) {
  return {
    label: boundDisplayText(value[0] || "項目", 60),
    value: boundDisplayText(value[1] || "尚未設定", maxDisplayDetailTextLength)
  };
}

export function reminderPreviewDisplayItem(value: readonly [string, string, string, string]) {
  return {
    title: boundDisplayText(value[0] || "提醒", maxDisplayTextLength),
    time: boundDisplayText(value[1] || "尚未設定", 60),
    copy: boundDisplayText(value[2] || "尚未設定提醒說明。", maxDisplayDetailTextLength),
    statusLabel: boundDisplayText(value[3] || "未設定", 40)
  };
}

export function optionDisplayItem(value: string) {
  const label = boundDisplayText(value || "選項", 60);
  return {
    value: boundDisplayText(value || "unknown", 40),
    label,
    accessibilityLabel: boundDisplayText(`選擇${label}選項`, maxDisplayTextLength)
  };
}

export function optionDisplayItems(values: readonly string[]) {
  return values.map(optionDisplayItem);
}

export function valueLabelDisplayItem(value: readonly [string, string]) {
  const label = boundDisplayText(value[1] || "選項", 60);
  return {
    value: boundDisplayText(value[0] || "unknown", 40),
    label,
    accessibilityLabel: boundDisplayText(`選擇${label}選項`, maxDisplayTextLength)
  };
}

export function valueLabelDisplayItems(values: ReadonlyArray<readonly [string, string]>) {
  return values.map(valueLabelDisplayItem);
}

export function manualRecordTypeDisplayItem<T extends string>(value: { id: T; label: string }) {
  const label = boundDisplayText(value.label || "紀錄", 60);
  return {
    value: value.id,
    label,
    accessibilityLabel: boundDisplayText(`選擇${label}紀錄類型，不呼叫 AI 或 parser`, maxDisplayDetailTextLength)
  };
}

export function comparisonDisplayItem(value: readonly [string, string, string]) {
  return {
    feature: boundDisplayText(value[0] || "功能", 80),
    trial: boundDisplayText(value[1] || "未設定", 80),
    annual: boundDisplayText(value[2] || "未設定", 80)
  };
}

export function destinationCardDisplayItem(value: readonly string[]) {
  const label = boundDisplayText(value[1] || "前往頁面", maxDisplayTextLength);
  return {
    icon: boundDisplayText(value[0] || "•", 4),
    label,
    helper: boundDisplayText(value[2] || "查看相關頁面。", maxDisplayDetailTextLength),
    accessibilityLabel: boundDisplayText(`前往${label}`, maxDisplayTextLength),
    target: value[3] as AppScreen
  };
}

export function menuScreenDisplayItem(value: { id: AppScreen; label: string; icon: string }) {
  const label = boundDisplayText(value.label || "功能", 60);
  return {
    target: value.id,
    label,
    icon: boundDisplayText(value.icon || "•", 4),
    accessibilityLabel: boundDisplayText(`前往${label}`, maxDisplayTextLength)
  };
}

export function visualSmokeRouteJumpDisplayItem(value: { id: AppScreen; label: string }) {
  const label = boundDisplayText(value.label || "頁面", maxDisplayTextLength);
  return {
    target: value.id,
    label,
    accessibilityLabel: boundDisplayText(`Visual smoke 前往${label}`, maxDisplayTextLength)
  };
}

export function resultChecklistItem(value: string) {
  return boundDisplayText(value, maxDisplayDetailTextLength);
}

export function auxiliarySectionLabels() {
  return {
    showMoreFeatures: boundDisplayText("查看更多功能", maxDisplayTextLength),
    advancedSettings: boundDisplayText("進階設定", maxDisplayTextLength),
    developerSettings: boundDisplayText("開發設定", maxDisplayTextLength),
    backendUrl: boundDisplayText("Backend URL", maxDisplayTextLength),
    careProfile: boundDisplayText("照護對象", maxDisplayTextLength),
    llmModel: boundDisplayText("LLM 模型", maxDisplayTextLength),
    sttModel: boundDisplayText("STT 模型", maxDisplayTextLength),
    nativeDevClient: boundDisplayText("本機模型 Dev Client", maxDisplayTextLength),
    whisper: boundDisplayText("Whisper", maxDisplayTextLength),
    llama: boundDisplayText("Llama", maxDisplayTextLength),
    benchmark: boundDisplayText("Benchmark", maxDisplayTextLength),
    tutorialSafety: boundDisplayText("記錄安全原則", maxDisplayTextLength),
    startUse: boundDisplayText("開始使用", maxDisplayTextLength),
    tutorialStartAccessibility: boundDisplayText("開始使用並前往記錄頁，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength),
    tutorialManualAccessibility: boundDisplayText("從教學改用手動新增，不呼叫 AI、LLM 或 STT", maxDisplayDetailTextLength),
    localPreview: boundDisplayText("本機預覽", maxDisplayTextLength),
    yearPreview: boundDisplayText("年度回顧", maxDisplayTextLength),
    unlocked: boundDisplayText("已解鎖", maxDisplayTextLength),
    achievementStatus: boundDisplayText("徽章整合狀態", maxDisplayTextLength),
    yearHighlights: boundDisplayText("今年亮點", maxDisplayTextLength),
    yearReviewSource: boundDisplayText("年度回顧來源", maxDisplayTextLength),
    yearReviewBoundary: boundDisplayText("年度回顧邊界", maxDisplayTextLength),
    yearEncouragementBadge: boundDisplayText("年度鼓勵徽章", maxDisplayTextLength),
    shareStatus: boundDisplayText("分享整合狀態", maxDisplayTextLength),
    storePreview: boundDisplayText("點數商城", maxDisplayTextLength),
    storeProductStatus: boundDisplayText("商品整合狀態", maxDisplayTextLength),
    foodPhotoStatus: boundDisplayText("拍照整合狀態", maxDisplayTextLength),
    achievementsReturnAccessibility: boundDisplayText("返回上一個功能入口，不寫入成就資料", maxDisplayDetailTextLength),
    yearReviewReturnAccessibility: boundDisplayText("返回上一個功能入口，不產生分享圖或公開資料", maxDisplayDetailTextLength),
    storeReturnAccessibility: boundDisplayText("返回上一個功能入口，不建立訂單或付款", maxDisplayDetailTextLength),
    storeCartCheckoutAccessibility: boundDisplayText("結帳尚未開放，不建立訂單或付款", maxDisplayDetailTextLength),
    storeCartReturnAccessibility: boundDisplayText("返回商城，不建立訂單或付款", maxDisplayDetailTextLength),
    foodPhotoReturnAccessibility: boundDisplayText("返回上一個功能入口，不讀取照片或呼叫 Vision", maxDisplayDetailTextLength),
    visualSmokeRoutes: boundDisplayText("Visual smoke routes", maxDisplayTextLength),
    visualSmokeRouteCopy: boundDisplayText(
      "只供本機截圖檢查；不呼叫 backend、不寫資料、不觸發 AI / LLM / Vision / payment。",
      maxDisplayDetailTextLength
    ),
    closeReturn: boundDisplayText("關閉並返回", maxDisplayTextLength),
    showMoreFeaturesAccessibility: boundDisplayText("前往未來擴充功能", maxDisplayTextLength),
    devResetAccessibility: boundDisplayText("開發測試用重置所有資料", maxDisplayTextLength),
    foodPhotoUploadAccessibility: boundDisplayText("查看拍照或上傳照片整合狀態", maxDisplayTextLength),
    transcriptInputAccessibility: boundDisplayText("紀錄文字輸入", maxDisplayTextLength),
    dateInputAccessibility: boundDisplayText("日期輸入", maxDisplayTextLength),
    timeInputAccessibility: boundDisplayText("時間輸入", maxDisplayTextLength),
    glucoseValueInputAccessibility: boundDisplayText("血糖數值輸入", maxDisplayTextLength),
    foodItemsInputAccessibility: boundDisplayText("飲食內容輸入", maxDisplayTextLength),
    exerciseActivityInputAccessibility: boundDisplayText("運動內容輸入", maxDisplayTextLength),
    exerciseMinutesInputAccessibility: boundDisplayText("運動時長分鐘輸入", maxDisplayTextLength),
    medicationNameInputAccessibility: boundDisplayText("用藥名稱輸入", maxDisplayTextLength),
    medicationDoseInputAccessibility: boundDisplayText("用藥劑量輸入", maxDisplayTextLength),
    noteKindInputAccessibility: boundDisplayText("備註類型輸入", maxDisplayTextLength),
    noteTagsInputAccessibility: boundDisplayText("備註標籤輸入", maxDisplayTextLength),
    fallbackJsonInputAccessibility: boundDisplayText("結構化資料 JSON 輸入", maxDisplayTextLength),
    historyStartDateInputAccessibility: boundDisplayText("歷史開始日期輸入", maxDisplayTextLength),
    historyEndDateInputAccessibility: boundDisplayText("歷史結束日期輸入", maxDisplayTextLength),
    analysisStartDateInputAccessibility: boundDisplayText("分析開始日期輸入", maxDisplayTextLength),
    analysisEndDateInputAccessibility: boundDisplayText("分析結束日期輸入", maxDisplayTextLength),
    foodCommunitySearchInputAccessibility: boundDisplayText("食物搜尋輸入", maxDisplayTextLength),
    backendUrlInputAccessibility: boundDisplayText("Backend URL 輸入", maxDisplayTextLength),
    modelUrlInputAccessibility: boundDisplayText("模型下載 URL 輸入", maxDisplayTextLength),
    whisperModelPathInputAccessibility: boundDisplayText("Whisper 模型路徑輸入", maxDisplayTextLength),
    audioPathInputAccessibility: boundDisplayText("音檔路徑輸入", maxDisplayTextLength),
    llamaModelPathInputAccessibility: boundDisplayText("Llama 模型路徑輸入", maxDisplayTextLength),
    storeSearchInputAccessibility: boundDisplayText("商城搜尋輸入", maxDisplayTextLength),
    productOpenArrow: boundDisplayText("›", maxDisplayTextLength),
    devOnly: boundDisplayText("DEV ONLY", maxDisplayTextLength),
    reservedArchitecture: boundDisplayText("預留架構", maxDisplayTextLength),
    costBoundaryBadge: boundDisplayText("成本邊界", maxDisplayTextLength),
    preSaveConfirmBadge: boundDisplayText("儲存前確認", maxDisplayTextLength),
    dangerOperation: boundDisplayText("危險操作", maxDisplayTextLength),
    quotaControl: boundDisplayText("額度控制", maxDisplayTextLength),
    averageGlucose: boundDisplayText("平均血糖", maxDisplayTextLength),
    lowestGlucose: boundDisplayText("最低血糖", maxDisplayTextLength),
    glucoseRecordCount: boundDisplayText("血糖測量總次數", maxDisplayTextLength),
    beforeMealGlucoseCount: boundDisplayText("飯前血糖次數", maxDisplayTextLength),
    afterMealGlucoseCount: boundDisplayText("飯後血糖次數", maxDisplayTextLength),
    highestGlucose: boundDisplayText("最高血糖", maxDisplayTextLength),
    candidateDateTime: boundDisplayText("日期時間", maxDisplayTextLength),
    confirmStatus: boundDisplayText("確認", maxDisplayTextLength),
    aiBadge: boundDisplayText("AI", maxDisplayTextLength),
    dangerBang: boundDisplayText("!", 4)
  };
}
