import type { AppScreen } from "./navigationConfig";
import { recordDateTimeDisplay } from "./recordDisplay";
import { resultChecklistItem } from "./sharedDisplayItems";

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

export type StoreCategory = "coupons" | "supplementDiscounts" | "partnerProducts" | "specialBadges" | "memberBenefits";

export type StoreProduct = {
  id: string;
  category: StoreCategory;
  badge?: string;
  title: string;
  description: string;
  pointsCost: string;
  icon: string;
  rewardStatus?: "preview" | "redeemable";
};

export type StoreRedemptionDisplayInput = {
  id: string;
  reward_code: string;
  points_cost: number;
  status?: string | null;
  fulfillment_type?: string | null;
  fulfillment_code?: string | null;
  used_at?: string | null;
  created_at?: string | null;
};

export const storeCategories: Array<{ id: StoreCategory; label: string }> = [
  { id: "coupons", label: "優惠券" },
  { id: "supplementDiscounts", label: "保健食品折扣" },
  { id: "partnerProducts", label: "合作商品" },
  { id: "specialBadges", label: "特殊徽章" },
  { id: "memberBenefits", label: "特殊會員福利" }
];

export const storeProducts: StoreProduct[] = [
  {
    id: "coupon_50",
    category: "coupons",
    badge: "可兌換",
    title: "合作通路 50 元優惠券",
    description: "可用社群點數兌換優惠券；backend ready 時會扣點並立即發出 bounded coupon code。",
    pointsCost: "100 點",
    icon: "%"
  },
  {
    id: "supplement_discount_10",
    category: "supplementDiscounts",
    badge: "可兌換",
    title: "保健食品 9 折折扣",
    description: "可用社群點數兌換保健食品折扣碼；文案不得宣稱醫療療效。",
    pointsCost: "150 點",
    icon: "折"
  },
  {
    id: "partner_product_trial",
    category: "partnerProducts",
    badge: "可兌換",
    title: "合作商品體驗兌換",
    description: "可用社群點數建立合作商品兌換 reservation；商品目錄、庫存、出貨與客服仍需後續 fulfillment。",
    pointsCost: "300 點",
    icon: "合"
  },
  {
    id: "annual_member_badge",
    category: "specialBadges",
    badge: "可兌換",
    title: "特殊會員徽章",
    description: "可用社群點數建立特殊徽章兌換 reservation；持有紀錄與展示仍需後續 fulfillment。",
    pointsCost: "80 點",
    icon: "章"
  },
  {
    id: "member_benefit_pack",
    category: "memberBenefits",
    badge: "可兌換",
    title: "特殊會員福利包",
    description: "可用社群點數建立會員福利兌換 reservation；entitlement、到期與 rollback 仍需後續 fulfillment。",
    pointsCost: "500 點",
    icon: "福"
  }
];

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
    id: "community",
    title: "食物社群資料庫",
    description: "食物升糖分享、分類搜尋、社群點數與公開排行。",
    readiness: "資料庫、分享、點數與排行榜已接 backend；貼文留言治理仍待正式開放。",
    requirements: ["貼文、留言、封鎖、檢舉與審核流程", "公開分享刪除與撤回治理", "退出後歷史資料撤回與 audit event"],
    safety: "預設不公開任何健康紀錄；公開榜單只使用 opt-in 使用者的非敏感統計。",
    icon: "群",
    target: "community"
  },
  {
    id: "achievements",
    title: "成就榜 / 徽章",
    description: "連續記錄、運動里程碑與習慣養成徽章。",
    readiness: "成就 taxonomy、backend summary、解鎖同步與已保存徽章已接上；公開展示 opt-in 與撤回治理仍待完成。",
    requirements: ["公開展示 opt-in 與跨使用者展示", "成就展示撤回治理", "公開徽章稽核與違規處置"],
    safety: "成就只能鼓勵紀錄習慣，不可暗示治療效果或公開健康數值。",
    icon: "徽",
    target: "achievements"
  },
  {
    id: "ranking",
    title: "排行榜",
    description: "連續記錄排行榜、社群競賽與公開排名 opt-in。",
    readiness: "分享次數、貢獻度與食物測試達人榜單已接 backend；封鎖、檢舉與退出後歷史撤回仍待正式開放。",
    requirements: ["封鎖、檢舉與審核流程", "榜單爭議處理與公開名稱違規處置", "排名退出後歷史資料撤回流程"],
    safety: "不公開血糖數值或健康內容；排行榜只能使用使用者同意的非敏感統計。",
    icon: "榜",
    target: "ranking"
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
    id: "store",
    title: "商城",
    description: "點數商城、優惠券、商品折扣、特殊徽章與會員獎勵入口。",
    readiness: "點數兌換與兌換券已接 backend；購物車、出貨、付款與法務仍待完成。",
    requirements: ["購物車、庫存 reservation 與 rollback", "出貨訂單、付款與退款流程", "商品法務、客服與履約稽核"],
    safety: "商城商品不得宣稱醫療療效；正式交易與出貨前仍需完成付款與商品審核。",
    icon: "商",
    target: "store"
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

export function futureModuleDetailBoundaryCopy() {
  return boundDisplayText(
    "這個頁面只整理 UI 入口、工程前置條件與資料安全邊界；目前不呼叫 API、不寫入資料、不啟動背景工作，也不呼叫 AI。",
    maxDisplayDetailTextLength
  );
}

export function futureModuleImplementationOrderCopy() {
  return boundDisplayText(
    "實作順序建議：先完成 production auth、權限模型、schema/source 欄位與 audit trail，再開啟任何外部分享、排行榜、匯入或圖片分析功能。",
    maxDisplayDetailTextLength
  );
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

export function storeRedeemableFulfillmentCopy(category: StoreCategory): string {
  if (category === "coupons" || category === "supplementDiscounts") {
    return "送出後 backend 會扣點並立即發出優惠券或折扣碼。";
  }
  return "送出後 backend 會扣點並建立兌換 reservation，後續仍需 fulfillment。";
}

export function storeCategoryDisplayItem(value: { id: StoreCategory; label: string }) {
  const label = boundDisplayText(value.label || "分類", 60);
  return {
    value: value.id,
    label,
    accessibilityLabel: boundDisplayText(`切換商城分類：${label}，不建立訂單或付款`, maxDisplayDetailTextLength)
  };
}

export function storeProductDisplayItem(value: StoreProduct) {
  const title = boundDisplayText(value.title || "商品", maxDisplayTextLength);
  const rewardStatus = value.rewardStatus ?? "preview";
  return {
    id: boundIdentifier(value.id),
    category: value.category,
    badge: value.badge ? boundDisplayText(value.badge, 24) : "",
    title,
    description: boundDisplayText(value.description || "尚未設定商品說明。", maxDisplayDetailTextLength),
    pointsCost: boundDisplayText(value.pointsCost || "點數未設定", 40),
    icon: boundDisplayText(value.icon || "品", 4),
    rewardStatus,
    actionAccessibilityLabel: boundDisplayText(
      rewardStatus === "redeemable" ? `兌換${title}` : `查看${title}兌換狀態`,
      maxDisplayTextLength
    ),
    actionStatus: boundUiMessage(
      rewardStatus === "redeemable"
        ? `${title} 可用社群點數兌換；${storeRedeemableFulfillmentCopy(value.category)}`
        : `${title} 目前只顯示點數兌換預覽；點數扣抵、庫存、結帳、訂單與 entitlement 寫入尚未啟用。`
    )
  };
}

export function storeRedemptionDisplayItem(value: StoreRedemptionDisplayInput) {
  const code = value.fulfillment_code ? boundIdentifier(value.fulfillment_code) : "";
  const rewardCode = boundIdentifier(value.reward_code);
  const status = boundDisplayText(value.status || "reserved", 24);
  const isUsable =
    status === "issued" &&
    Boolean(code) &&
    (value.fulfillment_type === "coupon" || value.fulfillment_type === "discount_code") &&
    !value.used_at;
  const fulfillmentLabel = value.fulfillment_type === "discount_code" ? "折扣碼" : "優惠券";
  const title = code ? `${fulfillmentLabel} ${code}` : `兌換 ${rewardCode}`;
  const createdAt = value.created_at ? recordDateTimeDisplay(value.created_at) : "尚未同步時間";
  const statusLabel =
    status === "used"
      ? `已使用${value.used_at ? ` · ${recordDateTimeDisplay(value.used_at)}` : ""}`
      : status === "issued"
        ? "可使用"
        : "處理中";
  return {
    id: boundIdentifier(value.id),
    title: boundDisplayText(title, maxDisplayTextLength),
    subtitle: boundDisplayText(`扣除 ${clampNumber(value.points_cost, 0, maxMobileCountValue)} 點 · ${createdAt}`, maxDisplayDetailTextLength),
    statusLabel: boundDisplayText(statusLabel, maxDisplayTextLength),
    actionLabel: isUsable ? "用" : "查",
    actionAccessibilityLabel: boundDisplayText(
      isUsable ? `標記${title}已使用` : `查看${title}狀態`,
      maxDisplayTextLength
    ),
    isUsable
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

export function yearReviewPreviewBoundaryCopy() {
  return boundDisplayText(
    "backend ready 時同步保存年度 snapshot，並準備 privacy-masked 年度分享 package；離線時使用已載入紀錄即時計算。",
    maxDisplayDetailTextLength
  );
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

export function yearReviewBadgeMaterialCopy() {
  return boundDisplayText(
    "你的努力值得這枚徽章；正式徽章素材可後續替換，年度分享卡使用 backend 隱私遮罩摘要。",
    maxDisplayDetailTextLength
  );
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
