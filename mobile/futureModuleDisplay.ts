import type { AppScreen } from "./navigationConfig";
import { resultChecklistItem } from "./sharedDisplayItems";

const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxIdentifierTextLength = 128;
const maxMobileCountValue = 1_000_000;
const maxListItems = 12;

export type FutureModuleCard = {
  id: string;
  title: string;
  description: string;
  readiness: string;
  requirements: string[];
  safety: string;
  icon: string;
  target?: AppScreen;
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string) {
  return value.slice(0, maxIdentifierTextLength);
}

function futureModuleText(value: string | undefined, fallback: string, maxLength = maxDisplayDetailTextLength) {
  return boundDisplayText(value || fallback, maxLength);
}

function futureModuleIcon(value: string | undefined) {
  return boundDisplayText(value || "模", 4);
}

function futureModuleRequirements(value: string[] | undefined) {
  const requirements = value && value.length > 0 ? value : ["從未來擴充清單選擇模組"];
  return requirements.slice(0, maxListItems).map((requirement) => boundDisplayText(requirement, maxDisplayDetailTextLength));
}

export function futureModuleCardDisplayItem(value: FutureModuleCard) {
  return {
    key: boundIdentifier(value.id),
    module: value,
    target: value.target,
    icon: futureModuleIcon(value.icon),
    title: futureModuleText(value.title, "未來模組", maxDisplayTextLength),
    description: futureModuleText(value.description, "尚未設定說明。"),
    accessibilityLabel: boundDisplayText(`查看${futureModuleText(value.title, "未來模組", maxDisplayTextLength)}整合狀態`, maxDisplayTextLength),
    readiness: futureModuleText(value.readiness, "尚未設定啟用狀態。"),
    safety: futureModuleText(value.safety, "正式啟用前必須完成權限、成本與隱私設計。"),
    requirements: futureModuleRequirements(value.requirements).map((requirement, index) => ({
      key: `${boundIdentifier(value.id)}-${clampNumber(index, 0, maxListItems)}-${boundIdentifier(requirement)}`,
      text: requirement
    }))
  };
}

export function selectedFutureModuleDisplayItem(value: FutureModuleCard | null) {
  const id = value?.id ?? "none";
  return {
    key: `selected-${boundIdentifier(id)}`,
    icon: futureModuleIcon(value?.icon),
    title: futureModuleText(value?.title, "未來模組詳情", maxDisplayTextLength),
    description: futureModuleText(value?.description, "請從未來擴充清單選擇一個模組。"),
    readiness: futureModuleText(value?.readiness, "尚未選擇模組。"),
    safety: futureModuleText(value?.safety, "正式啟用前必須完成權限、稽核、成本與隱私設計。"),
    requirements: futureModuleRequirements(value?.requirements).map((requirement, index) => ({
      key: `selected-${boundIdentifier(id)}-${clampNumber(index, 0, maxListItems)}-${boundIdentifier(requirement)}`,
      text: requirement
    }))
  };
}

function futurePreviewBoundaryDisplayItem(badge: string, copy: string) {
  return {
    badge: boundDisplayText(badge, 40),
    copy: boundDisplayText(copy, maxDisplayDetailTextLength)
  };
}

export function doctorSharePreviewBoundaryDisplayItem() {
  return futurePreviewBoundaryDisplayItem(
    "授權未啟用",
    "目前不產生授權碼、不建立 share token、不新增 grants、不呼叫醫師端 API；只顯示未來合作流程與安全邊界。"
  );
}

export function doctorShareBackendBoundaryCopy() {
  return boundDisplayText(
    "後端已有 profile grant / shared profile / basic report 的基礎能力；mobile 正式開放前仍需完成 production auth、使用者確認 UI、撤銷入口與醫師端唯讀頁。",
    maxDisplayDetailTextLength
  );
}

export function healthIntegrationPreviewBoundaryDisplayItem() {
  return futurePreviewBoundaryDisplayItem(
    "串接未啟用",
    "目前不請求 HealthKit / Health Connect 權限、不掃描 BLE、不讀取血糖機、不寫入 records；只顯示同步資料邊界。"
  );
}

export function healthIntegrationExternalDataBoundaryCopy() {
  return boundDisplayText(
    "外部資料不能覆蓋使用者手動紀錄；正式匯入後仍需保留來源、同步批次、同步狀態與去重證據。",
    maxDisplayDetailTextLength
  );
}

export function communityPreviewBoundaryDisplayItem() {
  return futurePreviewBoundaryDisplayItem(
    "食物社群",
    "backend ready 時可同步食物資料庫、送出食物分享、建立點數並刷新排行榜；貼文、留言與內容治理仍未開放。"
  );
}

export function communityPublicNameBoundaryCopy() {
  return boundDisplayText(
    "公開名稱與排行榜 opt-in 已可同步 backend；健康紀錄仍預設私密，貼文與留言需另行 opt-in。",
    maxDisplayDetailTextLength
  );
}

export function rankingPreviewBoundaryDisplayItem() {
  return futurePreviewBoundaryDisplayItem(
    "公開榜單",
    "一般操作路徑只讀取 opt-in 公開榜單與非敏感統計；不公開健康數值、不上傳 streak、不呼叫 AI。"
  );
}

export function rankingLocalPreviewBoundaryCopy() {
  return boundDisplayText("本機連續天數僅供自己查看；公開榜單只使用 backend 已聚合的 opt-in 社群統計。", maxDisplayDetailTextLength);
}

export function reminderPreviewBoundaryDisplayItem() {
  return futurePreviewBoundaryDisplayItem(
    "通知預覽",
    "目前不請求系統通知權限、不建立背景工作、不寫入 reminder table；只呈現未來設定結構。"
  );
}

export function privacyPreviewBoundaryDisplayItem() {
  return futurePreviewBoundaryDisplayItem(
    "隱私控制預覽",
    "目前不寫入偏好、不建立分享、不匯出資料、不呼叫 API；正式啟用前必須接權限、audit 與資料刪除流程。"
  );
}

export function foodPhotoVisionBoundaryDisplayItem() {
  return {
    badge: boundDisplayText("Vision 未串接", 24),
    copy: boundDisplayText(
      "相機、圖片上傳、影像模型與營養估算尚未啟用；目前不會讀取照片、不會呼叫 AI，也不會寫入飲食紀錄。",
      maxDisplayDetailTextLength
    ),
    uploadUnavailable: boundDisplayText("相機與圖片上傳尚未啟用。", maxDisplayDetailTextLength),
    resultPending: boundDisplayText("尚未產生", 24),
    futureBoundary: boundDisplayText(
      "影像辨識是 future module；MVP 仍以手動/文字/語音紀錄為主，避免未確認估算直接寫入。",
      maxDisplayDetailTextLength
    )
  };
}

export function foodPhotoEmptyResultChecklistDisplayItems() {
  return [
    "尚未產生分析結果。",
    "拍攝或上傳流程尚未接上，因此不顯示任何營養估算。",
    "這裡不使用固定範例數字，避免把 mock 結果誤認為實際 AI 分析。",
    "沒有真實分析結果時不可加入紀錄；正式啟用時必須先讓使用者確認食物與數值。"
  ].map(resultChecklistItem);
}

export function foodPhotoIntroCopy() {
  return boundDisplayText(
    "目前先保留拍照分析 UI 與確認流程入口；Vision 尚未串接，不會估算營養或寫入紀錄。",
    maxDisplayDetailTextLength
  );
}

export function foodPhotoUploadBoxLabel() {
  return boundDisplayText("拍攝或上傳照片", maxDisplayTextLength);
}

export function foodPhotoResultTitle() {
  return boundDisplayText("AI 分析結果", maxDisplayTextLength);
}

export function foodPhotoReadinessTitle() {
  return boundDisplayText("正式啟用前需要完成", maxDisplayTextLength);
}

export function foodPhotoIntegrationButtonLabel() {
  return boundDisplayText("查看拍照整合狀態", maxDisplayTextLength);
}

export function foodPhotoIntegrationButtonAccessibilityLabel() {
  return boundDisplayText("查看拍照整合狀態，不讀取照片或呼叫 Vision", maxDisplayDetailTextLength);
}

export function foodPhotoRetakeButtonLabel() {
  return boundDisplayText("查看重新拍攝整合狀態", maxDisplayTextLength);
}

export function foodPhotoRetakeButtonAccessibilityLabel() {
  return boundDisplayText("查看重新拍攝整合狀態，目前沒有暫存圖片可清除", maxDisplayDetailTextLength);
}

export function storeCartUnavailableDisplayItem() {
  return {
    title: boundDisplayText("購物車尚未啟用", maxDisplayTextLength),
    copy: boundDisplayText("目前不建立訂單、不保留購物車內容，也不處理付款或折價券。", maxDisplayDetailTextLength),
    evidence: boundDisplayText("需等購物車、庫存、出貨、付款與退款規則完成後再接 backend order flow。", maxDisplayDetailTextLength),
    checkoutLabel: boundDisplayText("結帳整合尚未啟用", maxDisplayTextLength),
    legalWarning: boundDisplayText("商城商品不得宣稱醫療療效；正式交易前需完成法務、付款與商品審核。", maxDisplayDetailTextLength)
  };
}

export function storePreviewBoundaryCopy() {
  return boundDisplayText(
    "點數商城一般操作路徑會同步 backend 目錄與點數；優惠券與保健食品折扣可立即發碼，合作商品與會員福利仍需後續 fulfillment，不建立出貨訂單，也不處理付款。",
    maxDisplayDetailTextLength
  );
}

export function storeEmptySearchDisplayItem() {
  return {
    title: boundDisplayText("找不到符合的商品", maxDisplayTextLength),
    copy: boundDisplayText("請清除搜尋文字或切換分類。", maxDisplayDetailTextLength),
    evidence: boundDisplayText("搜尋會篩選已同步的 backend 目錄；backend unavailable 時才使用本機預覽。", maxDisplayDetailTextLength)
  };
}

export function storeCartButtonLabel() {
  return boundDisplayText("查看購物車整合狀態", maxDisplayTextLength);
}

export function storeCartButtonAccessibilityLabel() {
  return boundDisplayText("查看購物車、出貨訂單與付款整合狀態；不建立訂單或付款", maxDisplayDetailTextLength);
}

export function storeLocalBoundaryCopy() {
  return boundDisplayText(
    "商城目前可同步點數、發出優惠券 / 折扣碼並建立兌換紀錄；庫存、出貨、付款與 entitlement fulfillment 尚未啟用，也不宣稱醫療療效。",
    maxDisplayDetailTextLength
  );
}

export function storeCartIntroCopy() {
  return boundDisplayText("點數帳本、兌換券與折扣碼已可同步；購物車、出貨訂單與付款仍未接上。", maxDisplayDetailTextLength);
}

export function storeCheckoutReadinessTitle() {
  return boundDisplayText("正式結帳前需要完成", maxDisplayTextLength);
}

export function storeCartReturnButtonLabel() {
  return boundDisplayText("返回商城", maxDisplayTextLength);
}

export function achievementPreviewBoundaryCopy() {
  return boundDisplayText(
    "成就可同步 backend 依記錄聚合的 MVP 徽章摘要；backend 不可用或 visual smoke 時保留本機推算。",
    maxDisplayDetailTextLength
  );
}

export function achievementLocalComputationCopy() {
  return boundDisplayText(
    "成就摘要只讀取既有紀錄並聚合進度；按下同步才會保存已解鎖徽章，不呼叫 AI、不更新排行榜，也不提供醫療建議。",
    maxDisplayDetailTextLength
  );
}

export function achievementNextBadgeCopy(remainingProgress: number) {
  const boundedProgress = clampNumber(remainingProgress, 0, maxMobileCountValue);
  return boundDisplayText(
    boundedProgress > 0 ? `下一個徽章還差 ${boundedProgress} 點進度` : "目前清單已全部完成",
    maxDisplayTextLength
  );
}

export function achievementIntegrationButtonLabel() {
  return boundDisplayText("同步徽章解鎖", maxDisplayTextLength);
}

export function achievementIntegrationButtonAccessibilityLabel() {
  return boundDisplayText("同步成就徽章解鎖紀錄，不更新排行榜或公開資料", maxDisplayDetailTextLength);
}

export function futurePreviewSectionLabels() {
  const doctorTokenButton = boundDisplayText("查看授權碼狀態", maxDisplayTextLength);
  const doctorReportButton = boundDisplayText("查看報表邊界", maxDisplayTextLength);
  const healthPermissionButton = boundDisplayText("查看平台權限狀態", maxDisplayTextLength);
  const healthMeterButton = boundDisplayText("查看血糖機同步狀態", maxDisplayTextLength);
  const communityPostButton = boundDisplayText("查看發文狀態", maxDisplayTextLength);
  const communityPrivacyButton = boundDisplayText("查看隱私邊界", maxDisplayTextLength);
  const rankingPublicButton = boundDisplayText("查看排名狀態", maxDisplayTextLength);
  const rankingOptInButton = boundDisplayText("查看 Opt-in 邊界", maxDisplayTextLength);
  return {
    readiness: boundDisplayText("啟用前條件", maxDisplayTextLength),
    formalReadiness: boundDisplayText("正式啟用前需要完成", maxDisplayTextLength),
    integrationStatus: boundDisplayText("未來模組整合狀態", maxDisplayTextLength),
    mvpScope: boundDisplayText("MVP 範圍邊界", maxDisplayTextLength),
    currentStatus: boundDisplayText("目前狀態", maxDisplayTextLength),
    implementationOrder: boundDisplayText("建議實作順序", maxDisplayTextLength),
    backendFoundation: boundDisplayText("後端基礎邊界", maxDisplayTextLength),
    externalDataBoundary: boundDisplayText("外部資料邊界", maxDisplayTextLength),
    doctorStatus: boundDisplayText("醫師合作整合狀態", maxDisplayTextLength),
    healthStatus: boundDisplayText("健康串接整合狀態", maxDisplayTextLength),
    communityStatus: boundDisplayText("社群整合狀態", maxDisplayTextLength),
    rankingStatus: boundDisplayText("排行榜整合狀態", maxDisplayTextLength),
    returnFutureModules: boundDisplayText("返回未來擴充", maxDisplayTextLength),
    viewPreview: boundDisplayText("查看預覽 ›", maxDisplayTextLength),
    viewIntegration: boundDisplayText("查看整合狀態 ›", maxDisplayTextLength),
    doctorTokenButton,
    doctorTokenAccessibility: boundDisplayText(`${doctorTokenButton}，只顯示授權碼與 share token 邊界`, maxDisplayDetailTextLength),
    doctorReportButton,
    doctorReportAccessibility: boundDisplayText(`${doctorReportButton}，只顯示報表與醫師端唯讀邊界`, maxDisplayDetailTextLength),
    healthPermissionButton,
    healthPermissionAccessibility: boundDisplayText(`${healthPermissionButton}，不請求平台權限或讀取健康資料`, maxDisplayDetailTextLength),
    healthMeterButton,
    healthMeterAccessibility: boundDisplayText(`${healthMeterButton}，不掃描血糖機或寫入紀錄`, maxDisplayDetailTextLength),
    communityPostButton,
    communityPostAccessibility: boundDisplayText(`${communityPostButton}，不建立貼文或公開紀錄`, maxDisplayDetailTextLength),
    communityPrivacyButton,
    communityPrivacyAccessibility: boundDisplayText(`${communityPrivacyButton}，只顯示公開資料邊界`, maxDisplayDetailTextLength),
    rankingPublicButton,
    rankingPublicAccessibility: boundDisplayText(`${rankingPublicButton}，只讀取 opt-in 公開榜單，不公開健康數值`, maxDisplayDetailTextLength),
    rankingOptInButton,
    rankingOptInAccessibility: boundDisplayText(`${rankingOptInButton}，只顯示公開排名 opt-in 邊界`, maxDisplayDetailTextLength),
    returnFutureModulesAccessibility: boundDisplayText("返回未來擴充，不建立 future module 資料或呼叫 backend", maxDisplayDetailTextLength)
  };
}
