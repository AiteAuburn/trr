import type { AppScreen } from "./navigationConfig";
import { recordDateTimeDisplay, recordTypeLabel } from "./recordDisplay";
import { metricDisplayItem, resultChecklistItem } from "./sharedDisplayItems";

const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxIdentifierTextLength = 128;
const maxMobileCountValue = 1_000_000;
const maxListItems = 12;
const maxUiMessageLength = 300;

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

export type YearReviewApiMetric = {
  key: string;
  label: string;
  value: number | string;
};

export type YearReviewApiObservation = {
  kind: "important_observation" | "encouragement";
  text: string;
};

export type YearReviewApiResponse = {
  snapshot_id?: string | null;
  year: number;
  generated_for_previous_year: boolean;
  generated_at?: string | null;
  source?: "snapshot" | "generated";
  annual_stats: YearReviewApiMetric[];
  health_outcomes: YearReviewApiMetric[];
  ai_summary: YearReviewApiObservation[];
};

export type YearReviewApiShareAsset = {
  snapshot_id: string;
  year: number;
  asset_kind: "svg_card";
  mime_type: "image/svg+xml";
  filename: string;
  alt_text: string;
  privacy_level: "public_summary";
  privacy_mask_applied: boolean;
  external_share_enabled: boolean;
  svg_text: string;
  checksum_sha256: string;
};

export type YearReviewApiSharePackage = {
  share_package_id: string;
  snapshot_id: string;
  year: number;
  privacy_level: "public_summary";
  privacy_mask_applied: boolean;
  external_share_enabled: boolean;
  status: "confirmed" | "opened" | "dismissed" | "revoked";
  confirmed_at: string;
  shared_at?: string | null;
  revoked_at?: string | null;
  share_text: string;
  asset: YearReviewApiShareAsset;
};

export const futureModuleCards: FutureModuleCard[] = [
  {
    id: "doctor",
    title: "醫師 / 醫院合作",
    description: "授權碼、回診摘要、醫療端唯讀查看與報表匯出。",
    readiness: "需先完成 production auth、權限模型與分享撤銷。",
    requirements: ["授權碼產生、到期與撤銷", "醫師端唯讀權限", "回診摘要與匯出稽核"],
    safety: "預設不分享資料；所有醫療端查看都必須由使用者主動授權。",
    icon: "醫",
    target: "doctorShare"
  },
  {
    id: "yearReview",
    title: "年度回顧",
    description: "年度血糖、飲食、運動與連續記錄摘要。",
    readiness: "年度 snapshot、隱私遮罩分享卡與原生分享已接 backend；外部平台深度整合與刪除治理仍待完成。",
    requirements: ["外部平台深度整合與權限細節", "分享 package 刪除與撤回治理", "外部分享稽核與違規處置"],
    safety: "年度回顧只能做紀錄摘要與鼓勵，不提供診療建議或療效宣稱。",
    icon: "年",
    target: "yearReview"
  },
  {
    id: "health",
    title: "HealthKit / Health Connect / 血糖機",
    description: "外部健康平台、血糖機匯入與未來 BLE 同步。",
    readiness: "需先完成 integration source、去重與同步紀錄模型。",
    requirements: ["external source 欄位與去重鍵", "同步狀態與錯誤復原", "使用者授權、撤權與資料刪除"],
    safety: "外部資料不可直接覆蓋手動紀錄；匯入資料需保留來源與同步狀態。",
    icon: "串",
    target: "healthIntegration"
  },
  {
    id: "image",
    title: "食物拍照辨識",
    description: "圖片上傳、營養估算、使用者確認後寫入飲食紀錄。",
    readiness: "需先完成圖片儲存、成本控制與確認流程。",
    requirements: ["相機/相簿權限", "圖片儲存與刪除生命週期", "Vision 成本上限與使用者確認"],
    safety: "估算結果不能自動儲存；必須由使用者確認後才轉成飲食紀錄。",
    icon: "照",
    target: "foodPhoto"
  }
];

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

export function futureModuleCardDisplayItems(values: FutureModuleCard[]) {
  return values.map(futureModuleCardDisplayItem);
}

export function futureModuleCardsRuntimeDisplayBundle(value: { cards: FutureModuleCard[] }) {
  return {
    cards: futureModuleCardDisplayItems(value.cards)
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

export function selectedFutureModuleRuntimeDisplayBundle(value: { selectedModule: FutureModuleCard | null }) {
  return {
    selectedModule: selectedFutureModuleDisplayItem(value.selectedModule)
  };
}

export type FutureModuleRequirementDisplayItem = ReturnType<typeof futureModuleCardDisplayItem>["requirements"][number];

export function futureModuleRequirementKey(requirement: FutureModuleRequirementDisplayItem) {
  return requirement.key;
}

export function futureModuleRequirementText(requirement: FutureModuleRequirementDisplayItem) {
  return requirement.text;
}

export function futureModuleDetailBoundaryCopy() {
  return boundDisplayText(
    "這個頁面只整理 UI 入口、工程前置條件與資料安全邊界；目前不呼叫 API、不寫入資料、不啟動背景工作，也不呼叫 AI。",
    maxDisplayDetailTextLength
  );
}

export function futureModuleImplementationOrderCopy() {
  return boundDisplayText(
    "實作順序建議：先完成 production auth、權限模型、schema/source 欄位與 audit trail，再開啟任何外部分享、匯入或圖片分析功能。",
    maxDisplayDetailTextLength
  );
}

export function futureModuleDetailDisplayBundle() {
  return {
    boundary: futureModuleDetailBoundaryCopy(),
    implementationOrder: futureModuleImplementationOrderCopy()
  };
}

export function futureModulesOpenStatusMessage() {
  return boundDisplayText("已開啟未來擴充清單；預覽入口不呼叫 backend、AI、Vision 或 payment。", maxDisplayDetailTextLength);
}

export function futureModulesReturnMenuStatusMessage() {
  return boundDisplayText("已從未來擴充返回功能選單；未來模組預覽不會寫入資料或呼叫 AI。", maxDisplayDetailTextLength);
}

export function futureModuleDetailReturnStatusMessage() {
  return boundDisplayText("已返回未來擴充清單；未完成模組詳情只顯示本機預覽。", maxDisplayDetailTextLength);
}

export function futurePreviewReturnStatusMessage(target: AppScreen) {
  const targetLabel = target === "menu" ? "功能選單" : target === "futureModules" ? "未來擴充" : "上一頁";
  return boundDisplayText(`已返回${targetLabel}；preview 不呼叫 backend、AI、Vision 或 payment。`, maxDisplayDetailTextLength);
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

export function healthIntegrationBoundaryDisplayRows() {
  return [
    ["來源欄位", "meter / healthkit / health_connect"],
    ["同步批次", "import_batch_id 預留"],
    ["同步狀態", "pending / synced / failed"],
    ["AI 成本", "0 次呼叫"]
  ].map(([label, value]) => ({
    label: boundDisplayText(label, 60),
    value: boundDisplayText(value, 80)
  }));
}

export function healthIntegrationReadinessChecklistDisplayItems() {
  return [
    "使用者授權、撤權與資料刪除流程",
    "external integration layer 與平台權限隔離",
    "import batch id、sync status 與錯誤復原",
    "duplicate detection，避免同一筆血糖被重複匯入"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function futurePreviewBoundaryCopyBundle() {
  return {
    doctorShareBackend: doctorShareBackendBoundaryCopy(),
    healthIntegrationExternalData: healthIntegrationExternalDataBoundaryCopy()
  };
}

export function futurePreviewReadinessStaticDisplayBundle() {
  return {
    healthIntegrationItems: healthIntegrationReadinessChecklistDisplayItems()
  };
}

export function futurePreviewReadinessRuntimeDisplayBundle() {
  return {
    readiness: futurePreviewReadinessStaticDisplayBundle()
  };
}

export function futureBoundaryRowsDisplayBundle() {
  return {
    healthIntegration: healthIntegrationBoundaryDisplayRows()
  };
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

export function futurePreviewBoundaryDisplayBundle() {
  return {
    doctorShare: doctorSharePreviewBoundaryDisplayItem(),
    healthIntegration: healthIntegrationPreviewBoundaryDisplayItem(),
    reminder: reminderPreviewBoundaryDisplayItem(),
    privacy: privacyPreviewBoundaryDisplayItem()
  };
}

export function futurePreviewBoundaryRuntimeDisplayBundle() {
  return {
    boundary: futurePreviewBoundaryDisplayBundle()
  };
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

export function foodPhotoReadinessChecklistDisplayItems() {
  return [
    "相機 / 相簿權限與圖片壓縮上限",
    "圖片儲存、刪除與隱私遮罩策略",
    "Vision 成本上限、rate limit 與重試規則",
    "使用者確認後才可轉成飲食紀錄"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function foodPhotoPreviewStaticDisplayBundle() {
  return {
    visionBoundary: foodPhotoVisionBoundaryDisplayItem(),
    emptyResultItems: foodPhotoEmptyResultChecklistDisplayItems(),
    readinessItems: foodPhotoReadinessChecklistDisplayItems()
  };
}

export function foodPhotoPreviewRuntimeDisplayBundle() {
  return {
    preview: foodPhotoPreviewStaticDisplayBundle()
  };
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

export function foodPhotoStatusDisplayTexts(actionStatus: string) {
  return {
    action: boundUiMessage(actionStatus),
    upload: boundUiMessage(
      "相機與照片上傳尚未啟用；正式開放前需要圖片權限、壓縮上限、儲存策略與 Vision 成本控制。"
    ),
    integration: boundUiMessage(
      "相機與照片上傳尚未啟用；需先完成圖片儲存、權限、成本控制與使用者確認流程。"
    ),
    retake: boundUiMessage("重新拍攝需等相機/相簿流程接上；目前沒有暫存圖片或分析結果可清除。")
  };
}

export function foodPhotoDisplayBundle(actionStatus: string) {
  const status = foodPhotoStatusDisplayTexts(actionStatus);
  return {
    status,
    intro: foodPhotoIntroCopy(),
    uploadBox: foodPhotoUploadBoxLabel(),
    resultTitle: foodPhotoResultTitle(),
    readinessTitle: foodPhotoReadinessTitle(),
    integrationButton: foodPhotoIntegrationButtonLabel(),
    retakeButton: foodPhotoRetakeButtonLabel(),
    integrationAccessibility: foodPhotoIntegrationButtonAccessibilityLabel(),
    retakeAccessibility: foodPhotoRetakeButtonAccessibilityLabel()
  };
}

export function yearReviewStatusDisplayTexts(value: { yearReviewActionStatus: string }) {
  return {
    yearReviewAction: boundUiMessage(value.yearReviewActionStatus)
  };
}

export function yearReviewStatusDisplayBundle(value: { yearReviewActionStatus: string }) {
  return yearReviewStatusDisplayTexts(value);
}

export function yearReviewPreviewBoundaryCopy() {
  return boundDisplayText(
    "backend ready 時同步保存年度 snapshot，並準備 privacy-masked 年度分享 package；離線時使用已載入紀錄即時計算。",
    maxDisplayDetailTextLength
  );
}

export function yearReviewTargetYear(value: Date) {
  return value.getFullYear() - 1;
}

export function yearReviewSyncStatusMessages(value: {
  backendUnavailableMessage: string;
  year: string | number;
  snapshotId?: string | null;
}) {
  const snapshotCopy = value.snapshotId
    ? `已保存 snapshot ${boundIdentifier(value.snapshotId).slice(0, 8)}`
    : "已產生即時摘要";
  return {
    unavailable: boundUiMessage(
      `${value.backendUnavailableMessage || "backend 尚未 ready"}；目前只顯示本機年度回顧預覽。`
    ),
    inFlight: boundUiMessage("正在同步 backend 年度回顧，請稍候。"),
    loading: boundUiMessage("正在同步 backend 年度回顧。"),
    success: boundUiMessage(`已同步 ${value.year} 年 backend 年度回顧，${snapshotCopy}。`),
    failure: boundUiMessage("年度回顧同步失敗；目前保留本機已載入紀錄預覽。")
  };
}

export function nextYearReviewGenerationLabel(value: Date) {
  const nextYear = value.getMonth() === 0 && value.getDate() === 1 ? value.getFullYear() + 1 : value.getFullYear() + 1;
  return boundDisplayText(`每年 1 月 1 日自動產生前一年度回顧；下一次為 ${nextYear} 年 1 月 1 日`, maxDisplayDetailTextLength);
}

export function yearReviewBoundaryDisplayCopy() {
  return boundDisplayText(
    "年度回顧由 backend snapshot 保存年度統計、AI-style 觀察與鼓勵；不提供診療建議或療效宣稱。",
    maxDisplayDetailTextLength
  );
}

export function yearReviewBoundaryCopyBundle(value: Date) {
  return {
    generationLabel: nextYearReviewGenerationLabel(value),
    boundaryCopy: yearReviewBoundaryDisplayCopy()
  };
}

export function yearReviewShareUnavailableStatusMessage() {
  return boundUiMessage("visual smoke 或 backend unavailable 時不啟動外部分享；backend ready 時可準備隱私遮罩分享卡並開啟原生分享。");
}

export function yearReviewShareFilenameDisplayText(filename: string) {
  return boundDisplayText(filename, maxDisplayTextLength);
}

export function yearReviewShareMessageDisplayText(message: string) {
  return boundDisplayText(message, maxDisplayDetailTextLength);
}

export function yearReviewShareCardStatusMessages(value: {
  backendUnavailableMessage: string;
  shareFilename: string;
  privacyCopy: string;
  packageCopy: string;
  checksumShort: string;
  shareResultCopy: string;
  resultReportCopy: string;
}) {
  return {
    unavailable: boundUiMessage(`${value.backendUnavailableMessage || "backend 尚未 ready"}；目前不產生分享卡。`),
    loading: boundUiMessage("正在準備隱私遮罩後的年度分享卡。"),
    success: boundUiMessage(
      `${boundDisplayText(value.shareFilename, maxDisplayTextLength)} SVG 分享素材已準備，${boundDisplayText(
        value.privacyCopy,
        maxDisplayTextLength
      )}，${boundDisplayText(value.packageCopy, maxDisplayTextLength)}，checksum ${boundIdentifier(
        value.checksumShort
      ).slice(0, 8)}；${boundDisplayText(value.shareResultCopy, maxDisplayTextLength)}，${boundDisplayText(
        value.resultReportCopy,
        maxDisplayTextLength
      )}。`
    ),
    failure: boundUiMessage("分享卡準備或原生分享失敗；未送出外部分享。")
  };
}

export function yearReviewRevokeStatusMessages(value: {
  backendUnavailableMessage: string;
  sharePackageId: string;
  revokedCopy: string;
}) {
  return {
    visualSmoke: boundUiMessage("visual smoke 預覽不撤回年度分享 package。"),
    empty: boundUiMessage("目前沒有可撤回的年度分享 package。"),
    unavailable: boundUiMessage(`${value.backendUnavailableMessage || "backend 尚未 ready"}；目前無法撤回年度分享。`),
    invalid: boundUiMessage("年度分享 package 識別無效；已清除本機撤回狀態。"),
    loading: boundUiMessage("正在撤回年度分享 package。"),
    success: boundUiMessage(
      `年度分享 package ${boundIdentifier(value.sharePackageId).slice(0, 8)} 已撤回，${boundDisplayText(
        value.revokedCopy,
        maxDisplayTextLength
      )}。`
    ),
    failure: boundUiMessage("年度分享撤回失敗；請稍後重試。")
  };
}

export function safeYearReviewShareAssetFileName(value: string) {
  const fallback = "year-review-share-card.svg";
  const bounded = boundDisplayText(value || fallback, maxDisplayTextLength);
  const sanitized = bounded.replace(/[^a-zA-Z0-9._-]/g, "_");
  return sanitized.endsWith(".svg") ? sanitized : `${sanitized || "year-review-share-card"}.svg`;
}

export function yearReviewHeroRecordCountCopy(count: number) {
  const boundedCount = clampNumber(count, 0, maxMobileCountValue);
  return boundDisplayText(`前一年度共記錄 ${boundedCount} 次`, maxDisplayTextLength);
}

export function yearReviewHeroTitleCopy(targetYear: number) {
  return boundDisplayText(`前一年度 ${targetYear} 年回顧`, maxDisplayTextLength);
}

export function yearReviewLiveCalculationCopy(targetYear: number, generationLabel: string) {
  return boundDisplayText(`${targetYear} 年資料；${generationLabel}。同步成功後會使用 backend snapshot。`, maxDisplayDetailTextLength);
}

export function yearReviewSourceDisplayCopy(summary: YearReviewApiResponse | null, sharePackageId: string) {
  const boundedSharePackageId = boundIdentifier(sharePackageId);
  if (!summary) {
    const shareCopy = boundedSharePackageId ? `最近分享 package ${boundedSharePackageId.slice(0, 8)}。` : "尚未建立分享 package。";
    return boundDisplayText(`本機已載入紀錄預覽；backend snapshot 尚未同步。${shareCopy}`, maxDisplayDetailTextLength);
  }
  const sourceCopy = summary.source === "snapshot" ? "backend snapshot" : "backend 即時產生摘要";
  const snapshotCopy = summary.snapshot_id ? `snapshot ${boundIdentifier(summary.snapshot_id).slice(0, 8)}` : "尚未保存 snapshot id";
  const generatedCopy = summary.generated_at ? `產生時間 ${recordDateTimeDisplay(summary.generated_at)}` : "產生時間尚未回傳";
  const shareCopy = boundedSharePackageId ? `最近分享 package ${boundedSharePackageId.slice(0, 8)}` : "尚未建立分享 package";
  return boundDisplayText(
    `${summary.year} 年來源：${sourceCopy}，${snapshotCopy}，${generatedCopy}；${shareCopy}。`,
    maxDisplayDetailTextLength
  );
}

export function yearReviewHeaderDisplayTexts(value: {
  targetYear: number;
  recordCount: number;
  generationLabel: string;
  summary: YearReviewApiResponse | null;
  sharePackageId: string;
}) {
  return {
    previewBoundary: yearReviewPreviewBoundaryCopy(),
    heroTitle: yearReviewHeroTitleCopy(value.targetYear),
    heroRecordCount: yearReviewHeroRecordCountCopy(value.recordCount),
    liveCalculation: yearReviewLiveCalculationCopy(value.targetYear, value.generationLabel),
    source: yearReviewSourceDisplayCopy(value.summary, value.sharePackageId),
    shareButtonLabel: yearReviewShareButtonLabel(),
    shareAccessibilityLabel: yearReviewShareButtonAccessibilityLabel(),
    revokeShareButtonLabel: yearReviewRevokeShareButtonLabel(),
    revokeShareAccessibilityLabel: yearReviewRevokeShareButtonAccessibilityLabel()
  };
}

export function yearReviewHeaderDisplayBundle(value: {
  targetYear: number;
  recordCount: number;
  generationLabel: string;
  summary: YearReviewApiResponse | null;
  sharePackageId: string;
}) {
  return yearReviewHeaderDisplayTexts(value);
}

// Older saved snapshots still carry the retired badge stats (7 items); newer ones return 5.
// Match by key, never by index, and drop the badge entries so both shapes render the same.
const retiredYearReviewStatKeys = new Set(["achieved_badges", "highest_badge_level"]);

export function backendYearReviewMetricDisplayRows(summary: YearReviewApiResponse | null) {
  return (
    summary?.annual_stats
      .filter((item) => !retiredYearReviewStatKeys.has(item.key))
      .slice(0, 7)
      .map((item) => metricDisplayItem([item.label, String(item.value)] as const)) ?? []
  );
}

export function backendYearReviewHealthOutcomeDisplayRows(summary: YearReviewApiResponse | null) {
  return summary?.health_outcomes.slice(0, 3).map((item) => metricDisplayItem([item.label, String(item.value)] as const)) ?? [];
}

export function localYearlyReviewMetricDisplayRows(
  yearlyRecordDayDisplayCount: number,
  yearlyGlucoseRecordDisplayCount: number,
  yearlyMealRecordDisplayCount: number,
  yearlyExerciseRecordDisplayCount: number,
  yearlyLongestStreakDisplayDays: number
) {
  return ([
    ["本年度總記錄天數", `${yearlyRecordDayDisplayCount} 天`],
    ["本年度血糖記錄次數", `${yearlyGlucoseRecordDisplayCount} 次`],
    ["本年度飲食記錄次數", `${yearlyMealRecordDisplayCount} 次`],
    ["本年度運動記錄次數", `${yearlyExerciseRecordDisplayCount} 次`],
    ["最長連續記錄天數", `${yearlyLongestStreakDisplayDays} 天`]
  ] as const).map(metricDisplayItem);
}

export function localYearlyHealthOutcomeDisplayRows(
  yearlyGlucoseAverageDisplayValue: number | null,
  yearlyGlucoseHighestDisplayValue: number | null,
  yearlyGlucoseLowestDisplayValue: number | null
) {
  return ([
    ["年平均血糖", yearlyGlucoseAverageDisplayValue === null ? "尚無" : `${yearlyGlucoseAverageDisplayValue} mg/dL`],
    ["年度最高血糖", yearlyGlucoseHighestDisplayValue === null ? "尚無" : `${yearlyGlucoseHighestDisplayValue} mg/dL`],
    ["年度最低血糖", yearlyGlucoseLowestDisplayValue === null ? "尚無" : `${yearlyGlucoseLowestDisplayValue} mg/dL`]
  ] as const).map(metricDisplayItem);
}

export function yearReviewRowsDisplayBundle(value: {
  backendSummary: YearReviewApiResponse | null;
  yearlyRecordDayDisplayCount: number;
  yearlyGlucoseRecordDisplayCount: number;
  yearlyMealRecordDisplayCount: number;
  yearlyExerciseRecordDisplayCount: number;
  yearlyLongestStreakDisplayDays: number;
  yearlyGlucoseAverageDisplayValue: number | null;
  yearlyGlucoseHighestDisplayValue: number | null;
  yearlyGlucoseLowestDisplayValue: number | null;
}) {
  const backendMetricRows = backendYearReviewMetricDisplayRows(value.backendSummary);
  const backendHealthRows = backendYearReviewHealthOutcomeDisplayRows(value.backendSummary);
  const localMetricRows = localYearlyReviewMetricDisplayRows(
    value.yearlyRecordDayDisplayCount,
    value.yearlyGlucoseRecordDisplayCount,
    value.yearlyMealRecordDisplayCount,
    value.yearlyExerciseRecordDisplayCount,
    value.yearlyLongestStreakDisplayDays
  );
  const localHealthRows = localYearlyHealthOutcomeDisplayRows(
    value.yearlyGlucoseAverageDisplayValue,
    value.yearlyGlucoseHighestDisplayValue,
    value.yearlyGlucoseLowestDisplayValue
  );
  return {
    metricRows: backendMetricRows.length > 0 ? backendMetricRows : localMetricRows,
    healthRows: backendHealthRows.length > 0 ? backendHealthRows : localHealthRows
  };
}

export function localYearlyHighlightDisplayItems(
  recordCount: number,
  targetYear: number,
  mostRecordedType: readonly [string, number] | null,
  longestStreakDays: number
) {
  const boundedRecordCount = clampNumber(recordCount, 0, maxMobileCountValue);
  const boundedYear = clampNumber(targetYear, 1900, 9999);
  const boundedMostRecordedCount = clampNumber(mostRecordedType?.[1] ?? 0, 0, maxMobileCountValue);
  const boundedLongestStreakDays = clampNumber(longestStreakDays, 0, maxMobileCountValue);
  const items =
    boundedRecordCount === 0
      ? ["目前還沒有今年紀錄，開始記錄後會自動產生年度摘要。"]
      : [
          `${boundedYear} 年已有 ${boundedRecordCount} 筆紀錄。`,
          mostRecordedType
            ? `最常記錄的是${recordTypeLabel(mostRecordedType[0])}，共 ${boundedMostRecordedCount} 筆。`
            : "今年尚未累積足夠分類資料。",
          boundedLongestStreakDays > 0
            ? `最長連續記錄 ${boundedLongestStreakDays} 天。`
            : "連續記錄資料仍在累積中。"
        ];
  return items.map(resultChecklistItem);
}

export function yearReviewShareButtonLabel() {
  return boundDisplayText("產生年度分享卡", maxDisplayTextLength);
}

export function yearReviewShareButtonAccessibilityLabel() {
  return boundDisplayText("產生年度回顧公開摘要分享卡，確認隱私遮罩後開啟原生分享", maxDisplayDetailTextLength);
}

export function yearReviewRevokeShareButtonLabel() {
  return boundDisplayText("撤回年度分享", maxDisplayTextLength);
}

export function yearReviewRevokeShareButtonAccessibilityLabel() {
  return boundDisplayText("撤回最近建立的年度回顧分享 package，停止後續分享狀態更新", maxDisplayDetailTextLength);
}

export function yearReviewAiObservationCopy(recordCount: number, averageGlucose: number | null, longestStreak: number) {
  const boundedCount = clampNumber(recordCount, 0, maxMobileCountValue);
  const boundedStreak = clampNumber(longestStreak, 0, maxMobileCountValue);
  if (boundedCount <= 0) {
    return boundDisplayText("AI 年度觀察預覽：前一年度資料不足；正式版會在有資料時整理重要變化。", maxDisplayDetailTextLength);
  }
  const averageCopy = averageGlucose === null ? "平均血糖尚無足夠資料" : `年平均血糖 ${averageGlucose} mg/dL`;
  return boundDisplayText(
    `AI 年度觀察預覽：${averageCopy}，最長連續記錄 ${boundedStreak} 天；正式版會由年度報表服務產生重點觀察。`,
    maxDisplayDetailTextLength
  );
}

export function yearReviewAiEncouragementCopy(recordCount: number) {
  const boundedCount = clampNumber(recordCount, 0, maxMobileCountValue);
  return boundDisplayText(
    boundedCount > 0
      ? `AI 年度鼓勵預覽：你完成了 ${boundedCount} 筆健康紀錄，這些穩定累積能幫助你更了解自己的變化。`
      : "AI 年度鼓勵預覽：開始累積紀錄後，年度回顧會整理你的努力與下一步提醒。",
    maxDisplayDetailTextLength
  );
}

export function yearReviewBackendAiSummaryTexts(summary: YearReviewApiResponse | null) {
  return {
    encouragement: summary?.ai_summary.find((item) => item.kind === "encouragement")?.text,
    observation: summary?.ai_summary.find((item) => item.kind === "important_observation")?.text
  };
}

export function yearReviewInsightDisplayTexts(value: {
  recordCount: number;
  averageGlucose: number | null;
  longestStreakDays: number;
  backendObservation?: string | null;
  backendEncouragement?: string | null;
}) {
  return {
    glucoseAverage:
      value.averageGlucose === null
        ? ""
        : boundDisplayText(`前一年度血糖紀錄平均值為 ${value.averageGlucose} mg/dL。`, maxDisplayDetailTextLength),
    aiObservation: value.backendObservation
      ? boundDisplayText(value.backendObservation, maxDisplayDetailTextLength)
      : yearReviewAiObservationCopy(value.recordCount, value.averageGlucose, value.longestStreakDays),
    aiEncouragement: value.backendEncouragement
      ? boundDisplayText(value.backendEncouragement, maxDisplayDetailTextLength)
      : yearReviewAiEncouragementCopy(value.recordCount)
  };
}

export function futurePreviewSectionLabels() {
  const doctorTokenButton = boundDisplayText("查看授權碼狀態", maxDisplayTextLength);
  const doctorReportButton = boundDisplayText("查看報表邊界", maxDisplayTextLength);
  const healthPermissionButton = boundDisplayText("查看平台權限狀態", maxDisplayTextLength);
  const healthMeterButton = boundDisplayText("查看血糖機同步狀態", maxDisplayTextLength);
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
    returnFutureModulesAccessibility: boundDisplayText("返回未來擴充，不建立 future module 資料或呼叫 backend", maxDisplayDetailTextLength)
  };
}

export type FuturePreviewSectionLabels = ReturnType<typeof futurePreviewSectionLabels>;

export function futurePreviewCloseAccessibilityLabel(label: string) {
  return label;
}

export function futurePreviewBoundaryCopyText(display: { copy: string }) {
  return display.copy;
}

export function futurePreviewReadinessSectionLabel(labels: FuturePreviewSectionLabels) {
  return labels.formalReadiness;
}

export function futurePreviewReturnAccessibilityLabel(labels: FuturePreviewSectionLabels) {
  return labels.returnFutureModulesAccessibility;
}

export function futurePreviewReturnButtonLabel(labels: FuturePreviewSectionLabels) {
  return labels.returnFutureModules;
}

export function futurePreviewStatusDisplayTexts(value: {
  futureModuleActionStatus: string;
  doctorShareActionStatus: string;
  healthIntegrationActionStatus: string;
  reportLimit: number;
}) {
  const boundedReportLimit = clampNumber(value.reportLimit, 0, maxMobileCountValue);
  return {
    futureModuleAction: boundUiMessage(value.futureModuleActionStatus),
    doctorShareAction: boundUiMessage(value.doctorShareActionStatus),
    healthIntegrationAction: boundUiMessage(value.healthIntegrationActionStatus),
    doctorShareToken: boundUiMessage(
      "授權碼尚未啟用；目前不會建立 profile grant、share token、QR code 或醫師端 session。"
    ),
    doctorShareReportBoundary: boundUiMessage(
      `回診摘要可沿用 bounded detailed report 設計，最多 ${boundedReportLimit} 筆；目前不產生 PDF、不分享、不呼叫 AI。`
    ),
    healthIntegrationPermission: boundUiMessage(
      "平台權限尚未啟用；目前不會請求 HealthKit / Health Connect 權限，也不讀取任何外部健康資料。"
    ),
    healthIntegrationMeter: boundUiMessage(
      "血糖機同步尚未啟用；目前不掃描 BLE、不建立 import batch、不寫入 meter source 紀錄。"
    )
  };
}

export function futurePreviewStatusDisplayBundle(value: {
  futureModuleActionStatus: string;
  doctorShareActionStatus: string;
  healthIntegrationActionStatus: string;
  reportLimit: number;
}) {
  return {
    ...futurePreviewStatusDisplayTexts(value),
    boundaryRows: futureBoundaryRowsDisplayBundle()
  };
}

