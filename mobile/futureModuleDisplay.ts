import type { AppScreen } from "./navigationConfig";
import { currentRecordTypeStreakDays } from "./analysisDataTransforms";
import { formatLocalDateInput, localDateTimeInputs } from "./dateTimeTransforms";
import { recordDateTimeDisplay, recordTypeLabel } from "./recordDisplay";
import type { RecordItem } from "./recordBounds";
import { detailPairDisplayItem, metricDisplayItem, resultChecklistItem } from "./sharedDisplayItems";

const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxIdentifierTextLength = 128;
const maxMobileCountValue = 1_000_000;
const maxMobileGlucoseValue = 1000;
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

export type AchievementCategory = "glucose" | "meal" | "exercise";
export type AchievementKind = "cumulative" | "streak";

export type AchievementItem = {
  id: string;
  category: AchievementCategory;
  categoryLabel: string;
  kind: AchievementKind;
  kindLabel: string;
  level: number;
  title: string;
  description: string;
  icon: string;
  badgeColor: string;
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: string | null;
  newlyUnlocked: boolean;
};

export type AchievementApiItem = {
  id: string;
  category: AchievementCategory;
  category_label: string;
  kind: AchievementKind;
  kind_label: string;
  level: number;
  title: string;
  description: string;
  icon: string;
  badge_color: string;
  progress: number;
  target: number;
  unlocked: boolean;
  unlocked_at?: string | null;
  newly_unlocked?: boolean;
};

export type AchievementApiSummary = {
  levels: number[];
  unlocked_count: number;
  persisted_unlocked_count: number;
  newly_unlocked_count: number;
  next_remaining: number;
  items: AchievementApiItem[];
};

export type AchievementApiUnlock = AchievementApiItem;

export type CommunityLeaderboardType = "share_count" | "contribution" | "food_tester";

export type CommunityLeaderboardApiEntry = {
  account_id?: string | null;
  display_name: string;
  score: number;
};

export type CommunityLeaderboardApiResponse = {
  leaderboard_type: CommunityLeaderboardType;
  entries: CommunityLeaderboardApiEntry[];
};

export type CommunityLeaderboardDisplayEntry = {
  id: string;
  rankLabel: string;
  displayName: string;
  scoreLabel: string;
};

export type CommunityLeaderboardDisplaySection = {
  type: CommunityLeaderboardType;
  label: string;
  entries: CommunityLeaderboardDisplayEntry[];
  emptyCopy: string;
};

export type CommunityPublicSettings = {
  display_name: string;
  leaderboard_opt_in: boolean;
};

export type FoodCommunityCategory =
  | "vegetable"
  | "meat"
  | "seafood"
  | "egg"
  | "bean"
  | "starch"
  | "drink"
  | "fruit"
  | "snack"
  | "supplement";

export type FoodCommunityShare = {
  id: string;
  beforeGlucose: number;
  afterGlucose: number;
  glucoseDelta?: number;
  note: string;
};

export type FoodCommunityItem = {
  id: string;
  category: FoodCommunityCategory;
  title: string;
  aliases: string[];
  shareCount: number;
  averageRise: number;
  maximumRise: number;
  minimumRise: number;
  examples: FoodCommunityShare[];
};

export type FoodCommunityShareFields = {
  foodName: string;
  eatenDate: string;
  eatenTime: string;
  beforeGlucose: string;
  afterGlucose: string;
  note: string;
};

export type FoodCommunityApiCategory =
  | "vegetables"
  | "meat"
  | "seafood"
  | "eggs"
  | "beans"
  | "starches"
  | "drinks"
  | "fruit"
  | "snacks"
  | "supplements";

export type FoodCommunityApiCategoryRead = {
  code: FoodCommunityApiCategory;
  label: string;
  food_count?: number;
  sample_foods?: string[];
};

export type FoodCommunityApiStats = {
  share_count: number;
  average_glucose_delta: number | null;
  max_glucose_delta: number | null;
  min_glucose_delta: number | null;
};

export type FoodCommunityApiShare = {
  id: string;
  eaten_at: string;
  before_glucose: number;
  after_glucose: number;
  glucose_delta: number;
  serving_description?: string | null;
  public_note?: string | null;
  created_at: string;
};

export type FoodCommunityApiItem = {
  id: string;
  name: string;
  category: FoodCommunityApiCategory;
  category_label: string;
  stats: FoodCommunityApiStats;
  shares?: FoodCommunityApiShare[];
};

export type FoodCommunityApiShareResponse = {
  food: FoodCommunityApiItem;
  share: FoodCommunityApiShare;
  awarded_points: number;
};

export const foodCommunityCategories: Array<{ id: FoodCommunityCategory; label: string }> = [
  { id: "vegetable", label: "蔬菜" },
  { id: "meat", label: "肉類" },
  { id: "seafood", label: "海鮮" },
  { id: "egg", label: "蛋類" },
  { id: "bean", label: "豆類" },
  { id: "starch", label: "澱粉類" },
  { id: "drink", label: "飲料" },
  { id: "fruit", label: "水果" },
  { id: "snack", label: "零食" },
  { id: "supplement", label: "保健食品" }
];

export const foodCommunityItems: FoodCommunityItem[] = [
  {
    id: "leafy-greens",
    category: "vegetable",
    title: "燙青菜",
    aliases: ["青菜", "葉菜"],
    shareCount: 128,
    averageRise: 8,
    maximumRise: 24,
    minimumRise: 0,
    examples: [
      { id: "leafy-greens-1", beforeGlucose: 102, afterGlucose: 110, note: "晚餐搭配蛋白質，升糖幅度低。" },
      { id: "leafy-greens-2", beforeGlucose: 118, afterGlucose: 126, note: "份量增加後仍維持平穩。" }
    ]
  },
  {
    id: "chicken-breast",
    category: "meat",
    title: "雞胸肉",
    aliases: ["雞肉", "舒肥雞"],
    shareCount: 96,
    averageRise: 5,
    maximumRise: 18,
    minimumRise: 0,
    examples: [
      { id: "chicken-breast-1", beforeGlucose: 109, afterGlucose: 114, note: "無糖醬料，單吃變化小。" },
      { id: "chicken-breast-2", beforeGlucose: 121, afterGlucose: 128, note: "搭配沙拉，飯後走路 15 分鐘。" }
    ]
  },
  {
    id: "salmon",
    category: "seafood",
    title: "鮭魚",
    aliases: ["魚", "煎鮭魚"],
    shareCount: 74,
    averageRise: 6,
    maximumRise: 20,
    minimumRise: 0,
    examples: [
      { id: "salmon-1", beforeGlucose: 111, afterGlucose: 118, note: "搭配蔬菜，沒有額外澱粉。" },
      { id: "salmon-2", beforeGlucose: 132, afterGlucose: 136, note: "份量正常，升糖不明顯。" }
    ]
  },
  {
    id: "boiled-egg",
    category: "egg",
    title: "水煮蛋",
    aliases: ["蛋", "雞蛋"],
    shareCount: 156,
    averageRise: 4,
    maximumRise: 14,
    minimumRise: 0,
    examples: [
      { id: "boiled-egg-1", beforeGlucose: 98, afterGlucose: 102, note: "早餐單顆，變化很小。" },
      { id: "boiled-egg-2", beforeGlucose: 124, afterGlucose: 129, note: "搭配無糖豆漿。" }
    ]
  },
  {
    id: "unsweetened-soymilk",
    category: "bean",
    title: "無糖豆漿",
    aliases: ["豆漿", "黃豆"],
    shareCount: 113,
    averageRise: 11,
    maximumRise: 32,
    minimumRise: 2,
    examples: [
      { id: "unsweetened-soymilk-1", beforeGlucose: 105, afterGlucose: 117, note: "早餐一杯，未加糖。" },
      { id: "unsweetened-soymilk-2", beforeGlucose: 116, afterGlucose: 130, note: "搭配蛋，升糖可接受。" }
    ]
  },
  {
    id: "white-rice",
    category: "starch",
    title: "白飯",
    aliases: ["米飯", "飯"],
    shareCount: 342,
    averageRise: 54,
    maximumRise: 118,
    minimumRise: 16,
    examples: [
      { id: "white-rice-1", beforeGlucose: 112, afterGlucose: 169, note: "半碗飯，飯後散步 20 分鐘。" },
      { id: "white-rice-2", beforeGlucose: 128, afterGlucose: 205, note: "一碗飯，上升明顯。" }
    ]
  },
  {
    id: "black-tea",
    category: "drink",
    title: "無糖紅茶",
    aliases: ["紅茶", "茶"],
    shareCount: 88,
    averageRise: 3,
    maximumRise: 12,
    minimumRise: 0,
    examples: [
      { id: "black-tea-1", beforeGlucose: 101, afterGlucose: 103, note: "確認為無糖。" },
      { id: "black-tea-2", beforeGlucose: 119, afterGlucose: 123, note: "冰飲，未加配料。" }
    ]
  },
  {
    id: "banana",
    category: "fruit",
    title: "香蕉",
    aliases: ["水果", "蕉"],
    shareCount: 167,
    averageRise: 38,
    maximumRise: 82,
    minimumRise: 10,
    examples: [
      { id: "banana-1", beforeGlucose: 108, afterGlucose: 146, note: "半根香蕉，飯後兩小時量測。" },
      { id: "banana-2", beforeGlucose: 122, afterGlucose: 174, note: "熟香蕉一根，上升較明顯。" }
    ]
  },
  {
    id: "crackers",
    category: "snack",
    title: "蘇打餅乾",
    aliases: ["餅乾", "零食"],
    shareCount: 91,
    averageRise: 29,
    maximumRise: 70,
    minimumRise: 6,
    examples: [
      { id: "crackers-1", beforeGlucose: 117, afterGlucose: 148, note: "三片餅乾，下午點心。" },
      { id: "crackers-2", beforeGlucose: 130, afterGlucose: 166, note: "搭配咖啡，未加糖。" }
    ]
  },
  {
    id: "fiber-powder",
    category: "supplement",
    title: "膳食纖維粉",
    aliases: ["纖維", "保健食品"],
    shareCount: 52,
    averageRise: 2,
    maximumRise: 11,
    minimumRise: 0,
    examples: [
      { id: "fiber-powder-1", beforeGlucose: 115, afterGlucose: 117, note: "依標示份量沖泡，不作療效判斷。" },
      { id: "fiber-powder-2", beforeGlucose: 126, afterGlucose: 128, note: "搭配正餐前飲用，僅作個人紀錄。" }
    ]
  }
];

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

export type StoreRewardApiCategory =
  | "coupons"
  | "supplement_discounts"
  | "partner_products"
  | "member_benefits"
  | "special_badges";

export type StoreRewardApiInput = {
  code: string;
  title: string;
  category: StoreRewardApiCategory;
  points_cost: number;
  status: "preview" | "redeemable";
};

export type StoreApiPointsBalance = {
  balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
};

export type StoreApiRedemption = {
  id: string;
  reward_code: string;
  points_cost: number;
  status: string;
  fulfillment_type?: string | null;
  fulfillment_code?: string | null;
  fulfilled_at?: string | null;
  used_at?: string | null;
  created_at: string;
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

export const achievementLevels = [10, 50, 100, 150, 200, 250];
export const achievementLevelStep = 50;

export const achievementCategoryDefinitions: Array<{
  id: AchievementCategory;
  label: string;
  recordType: string;
  cumulativeIcon: string;
  cumulativeColor: string;
}> = [
  { id: "glucose", label: "血糖記錄", recordType: "glucose", cumulativeIcon: "血", cumulativeColor: "#2F8F72" },
  { id: "meal", label: "飲食記錄", recordType: "meal", cumulativeIcon: "食", cumulativeColor: "#D97706" },
  { id: "exercise", label: "運動記錄", recordType: "exercise", cumulativeIcon: "動", cumulativeColor: "#2563EB" }
];

export const achievementLevelColors = ["#8DB7A5", "#3FA67F", "#2F8F72", "#D97706", "#B45309", "#2563EB"];
export const achievementStreakBadgeColor = "#8B5CF6";

export function achievementDynamicLevels(maxObservedRecords: number, maxObservedStreak: number) {
  const maxBaseLevel = achievementLevels[achievementLevels.length - 1] ?? 250;
  const maxObservedLevel = Math.max(
    clampNumber(maxObservedRecords, 0, maxMobileCountValue),
    clampNumber(maxObservedStreak, 0, maxMobileCountValue),
    maxBaseLevel
  );
  const dynamicLevels: number[] = [...achievementLevels];
  let nextLevel = maxBaseLevel + achievementLevelStep;
  while (maxObservedLevel >= maxBaseLevel && dynamicLevels.length < 16 && nextLevel <= maxObservedLevel + achievementLevelStep) {
    dynamicLevels.push(nextLevel);
    nextLevel += achievementLevelStep;
  }
  return dynamicLevels;
}

export function localAchievementItemsForDefinition(
  definition: (typeof achievementCategoryDefinitions)[number],
  dynamicLevels: number[],
  cumulativeProgress: number,
  streakProgress: number
): AchievementItem[] {
  return dynamicLevels.flatMap((level, levelIndex) => {
    const badgeColor = achievementLevelColors[levelIndex] ?? definition.cumulativeColor;
    return [
      {
        id: `${definition.id}-cumulative-${level}`,
        category: definition.id,
        categoryLabel: definition.label,
        kind: "cumulative",
        kindLabel: "累積型",
        level,
        title: `${definition.label}累積 ${level}`,
        description: `累積建立 ${level} 筆${definition.label}。`,
        icon: definition.cumulativeIcon,
        badgeColor,
        progress: Math.min(cumulativeProgress, level),
        target: level,
        unlocked: cumulativeProgress >= level,
        unlockedAt: null,
        newlyUnlocked: false
      },
      {
        id: `${definition.id}-streak-${level}`,
        category: definition.id,
        categoryLabel: definition.label,
        kind: "streak",
        kindLabel: "連續型",
        level,
        title: `${definition.label}連續 ${level}`,
        description: `連續 ${level} 天建立${definition.label}。`,
        icon: "連",
        badgeColor,
        progress: Math.min(streakProgress, level),
        target: level,
        unlocked: streakProgress >= level,
        unlockedAt: null,
        newlyUnlocked: false
      }
    ];
  });
}

export function localAchievementItemsForRecords(records: RecordItem[]): AchievementItem[] {
  const maxObservedRecords = records.length;
  const maxObservedStreak = Math.max(
    ...achievementCategoryDefinitions.map((definition) => currentRecordTypeStreakDays(records, definition.recordType)),
    0
  );
  const dynamicLevels = achievementDynamicLevels(maxObservedRecords, maxObservedStreak);

  return achievementCategoryDefinitions.flatMap((definition) => {
    const cumulativeProgress = records.filter((record) => record.record_type === definition.recordType).length;
    const streakProgress = currentRecordTypeStreakDays(records, definition.recordType);
    return localAchievementItemsForDefinition(definition, dynamicLevels, cumulativeProgress, streakProgress);
  });
}

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

function boundAchievementProgress(value: number, maxValue = maxMobileCountValue) {
  return clampNumber(value, 0, maxValue);
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

export function achievementDisplayItem(value: AchievementItem) {
  const target = Math.max(1, boundAchievementProgress(value.target));
  const progress = Math.min(target, boundAchievementProgress(value.progress, target));
  const kindLabel = boundDisplayText(value.kindLabel || "成就類型", 40);
  const categoryLabel = boundDisplayText(value.categoryLabel || "成就分類", 40);
  return {
    id: boundIdentifier(value.id),
    category: value.category,
    categoryLabel,
    kind: value.kind,
    kindLabel,
    level: clampNumber(value.level, 0, maxMobileCountValue),
    title: boundDisplayText(value.title || "成就", maxDisplayTextLength),
    description: boundDisplayText(value.description || "尚未設定成就說明。", maxDisplayDetailTextLength),
    icon: boundDisplayText(value.icon || "•", 4),
    badgeColor: boundDisplayText(value.badgeColor || "#3FA67F", 20),
    progress,
    target,
    unlocked: value.unlocked || progress >= target,
    unlockedAt: value.unlockedAt || null,
    newlyUnlocked: value.newlyUnlocked,
    progressLabel: boundDisplayText(`${progress}/${target}`, 40),
    statusLabel: boundDisplayText(value.unlocked || progress >= target ? "完成" : `${progress}/${target}`, 40),
    accessibilityLabel: boundDisplayText(
      `${categoryLabel}${kindLabel}徽章，等級 ${clampNumber(value.level, 0, maxMobileCountValue)}，進度 ${progress}/${target}`,
      maxDisplayDetailTextLength
    )
  };
}

export type AchievementDisplayItem = ReturnType<typeof achievementDisplayItem>;

export function achievementDisplayItems(items: AchievementItem[]) {
  return items.map(achievementDisplayItem);
}

export function limitedAchievementDisplayItems(items: AchievementItem[]) {
  return items.slice(0, maxListItems).map(achievementDisplayItem);
}

export function saveSuccessNewlyUnlockedAchievementDisplayItems(items: AchievementDisplayItem[]) {
  return items.slice(0, 3);
}

export function buildAchievementCategoryDisplaySections(items: AchievementDisplayItem[]) {
  return achievementCategoryDefinitions.map((definition) => ({
    key: boundIdentifier(`achievement-section-${definition.id}`),
    label: boundDisplayText(definition.label, 40),
    items: items.filter((item) => item.category === definition.id)
  }));
}

export function achievementBadgeSummary(items: AchievementDisplayItem[]) {
  const unlockedItems = items.filter((item) => item.progress >= item.target);
  const nextRemaining =
    items
      .filter((item) => item.progress < item.target)
      .map((item) => item.target - item.progress)
      .sort((first, second) => first - second)[0] ?? 0;
  const highestLevel =
    unlockedItems
      .map((item) => item.level)
      .sort((first, second) => second - first)[0] ?? 0;
  return {
    unlockedCount: unlockedItems.length,
    highestLevel,
    nextRemaining
  };
}

export function achievementItemFromApi(value: AchievementApiItem): AchievementItem {
  const category = achievementCategoryDefinitions.some((definition) => definition.id === value.category)
    ? value.category
    : "glucose";
  const kind = value.kind === "streak" ? "streak" : "cumulative";
  return {
    id: boundIdentifier(value.id),
    category,
    categoryLabel: boundDisplayText(value.category_label || "成就分類", 40),
    kind,
    kindLabel: boundDisplayText(value.kind_label || (kind === "streak" ? "連續型" : "累積型"), 40),
    level: clampNumber(value.level, 1, maxMobileCountValue),
    title: boundDisplayText(value.title || "成就", maxDisplayTextLength),
    description: boundDisplayText(value.description || "尚未設定成就說明。", maxDisplayDetailTextLength),
    icon: boundDisplayText(value.icon || "•", 4),
    badgeColor: boundDisplayText(value.badge_color || (kind === "streak" ? achievementStreakBadgeColor : "#3FA67F"), 20),
    progress: clampNumber(value.progress, 0, maxMobileCountValue),
    target: Math.max(1, clampNumber(value.target, 1, maxMobileCountValue)),
    unlocked: value.unlocked,
    unlockedAt: value.unlocked_at || null,
    newlyUnlocked: Boolean(value.newly_unlocked)
  };
}

export function achievementUnlockDisplayDate(value?: string | null) {
  if (!value) {
    return boundDisplayText("尚未保存解鎖時間", maxDisplayTextLength);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return boundDisplayText("解鎖時間格式無法顯示", maxDisplayTextLength);
  }
  return boundDisplayText(`解鎖於 ${formatLocalDateInput(parsed)}`, maxDisplayTextLength);
}

export function communityLeaderboardLabel(value: CommunityLeaderboardType) {
  if (value === "contribution") {
    return "貢獻度排行";
  }
  if (value === "food_tester") {
    return "食物測試達人排行";
  }
  return "分享次數排行";
}

export function communityLeaderboardScoreLabel(value: CommunityLeaderboardType, score: number) {
  const boundedScore = clampNumber(score, 0, maxMobileCountValue);
  if (value === "contribution") {
    return `${boundedScore} 點`;
  }
  if (value === "food_tester") {
    return `${boundedScore} 種食物`;
  }
  return `${boundedScore} 次分享`;
}

export function communityLeaderboardDisplaySection(value: CommunityLeaderboardApiResponse): CommunityLeaderboardDisplaySection {
  const type = ["share_count", "contribution", "food_tester"].includes(value.leaderboard_type)
    ? value.leaderboard_type
    : "share_count";
  const label = communityLeaderboardLabel(type);
  return {
    type,
    label: boundDisplayText(label, maxDisplayTextLength),
    entries: value.entries.slice(0, maxListItems).map((entry, index) => ({
      id: boundIdentifier(entry.account_id || `${type}-${index}`),
      rankLabel: boundDisplayText(`#${clampNumber(index + 1, 1, maxMobileCountValue)}`, 12),
      displayName: boundDisplayText(entry.display_name || "公開糖友", maxDisplayTextLength),
      scoreLabel: boundDisplayText(communityLeaderboardScoreLabel(type, entry.score), 40)
    })),
    emptyCopy: boundDisplayText("目前沒有 opt-in 的公開榜單資料。", maxDisplayDetailTextLength)
  };
}

export function boundCommunityPublicSettings(value: CommunityPublicSettings): CommunityPublicSettings {
  return {
    display_name: boundDisplayText(value.display_name || "糖友", maxDisplayTextLength),
    leaderboard_opt_in: Boolean(value.leaderboard_opt_in)
  };
}

export function foodCommunityCategoryDisplayItem(value: { id: FoodCommunityCategory; label: string; foodCount?: number; sampleFoods?: string[] }) {
  const label = boundDisplayText(value.label || "分類", 60);
  const foodCount = clampNumber(value.foodCount ?? 0, 0, maxMobileCountValue);
  const sampleFoods = (value.sampleFoods ?? [])
    .slice(0, 3)
    .map((food) => boundDisplayText(food, 40))
    .filter(Boolean);
  const summary = sampleFoods.length > 0
    ? boundDisplayText(`${foodCount} 種食物：${sampleFoods.join("、")}`, maxDisplayDetailTextLength)
    : boundDisplayText(foodCount > 0 ? `${foodCount} 種食物` : "尚未有個別食物", maxDisplayDetailTextLength);
  return {
    value: value.id,
    label,
    foodCount,
    sampleFoods,
    summary,
    accessibilityLabel: boundDisplayText(`切換食物分類：${label}，${summary}`, maxDisplayDetailTextLength)
  };
}

export function foodCommunityCategoryDisplayItems(
  values: Array<{ id: FoodCommunityCategory; label: string; foodCount?: number; sampleFoods?: string[] }>
) {
  return values.map(foodCommunityCategoryDisplayItem);
}

export function foodCommunityShareDisplayItem(value: FoodCommunityShare) {
  const before = clampNumber(value.beforeGlucose, 0, maxMobileGlucoseValue);
  const after = clampNumber(value.afterGlucose, 0, maxMobileGlucoseValue);
  const rise = clampNumber(value.glucoseDelta ?? after - before, -maxMobileGlucoseValue, maxMobileGlucoseValue);
  return {
    id: boundIdentifier(value.id),
    before,
    after,
    rise,
    note: boundDisplayText(value.note || "尚未提供心得。", maxDisplayDetailTextLength),
    summary: boundDisplayText(`食用前 ${before}，食用後 ${after}，血糖變化 ${rise} mg/dL`, maxDisplayDetailTextLength)
  };
}

export function foodCommunityItemDisplayItem(value: FoodCommunityItem) {
  const title = boundDisplayText(value.title || "食物", maxDisplayTextLength);
  const shareCount = clampNumber(value.shareCount, 0, maxMobileCountValue);
  const averageRise = clampNumber(value.averageRise, -maxMobileGlucoseValue, maxMobileGlucoseValue);
  const maximumRise = clampNumber(value.maximumRise, -maxMobileGlucoseValue, maxMobileGlucoseValue);
  const minimumRise = clampNumber(value.minimumRise, -maxMobileGlucoseValue, maxMobileGlucoseValue);
  return {
    id: boundIdentifier(value.id),
    category: value.category,
    title,
    aliases: value.aliases.map((alias) => boundDisplayText(alias, 40)).slice(0, 4),
    shareCount,
    averageRise,
    maximumRise,
    minimumRise,
    individualShareDisplayItems: value.examples.map(foodCommunityShareDisplayItem).slice(0, 3),
    accessibilityLabel: boundDisplayText(
      `查看${title}食物升糖資料頁，同步已載入食物分享統計與個別紀錄`,
      maxDisplayDetailTextLength
    ),
    metricSummary: boundDisplayText(
      `${shareCount} 人分享，實際升糖參考值 ${averageRise} mg/dL`,
      maxDisplayDetailTextLength
    )
  };
}

export function foodCommunityItemDisplayItems(items: FoodCommunityItem[]) {
  return items.map(foodCommunityItemDisplayItem);
}

export function visibleFoodCommunityDisplayItems(
  items: Array<ReturnType<typeof foodCommunityItemDisplayItem>>,
  category: FoodCommunityCategory,
  searchText: string
) {
  const query = searchText.trim().toLowerCase();
  return items.filter((item) => {
    const matchesCategory = query.length > 0 || item.category === category;
    const matchesSearch =
      query.length === 0 ||
      item.title.toLowerCase().includes(query) ||
      item.aliases.some((alias) => alias.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });
}

export function selectedFoodCommunityDisplayItem(
  items: Array<ReturnType<typeof foodCommunityItemDisplayItem>>,
  visibleItems: Array<ReturnType<typeof foodCommunityItemDisplayItem>>,
  selectedItemId: string
) {
  return items.find((item) => item.id === selectedItemId) ?? visibleItems[0] ?? items[0] ?? null;
}

export function foodCommunityDisplayBundle(value: {
  backendCategories: Array<{ id: FoodCommunityCategory; label: string; foodCount?: number; sampleFoods?: string[] }>;
  fallbackCategories: Array<{ id: FoodCommunityCategory; label: string; foodCount?: number; sampleFoods?: string[] }>;
  backendItems: FoodCommunityItem[];
  fallbackItems: FoodCommunityItem[];
  selectedCategory: FoodCommunityCategory;
  searchText: string;
  selectedItemId: string;
  shareFields: FoodCommunityShareFields;
  pointsBalance: StoreApiPointsBalance | null;
}) {
  const categoriesForDisplay =
    value.backendCategories.length > 0 ? value.backendCategories : value.fallbackCategories;
  const categoryDisplayOptions = foodCommunityCategoryDisplayItems(categoriesForDisplay);
  const selectedCategoryDisplay =
    categoryDisplayOptions.find((category) => category.value === value.selectedCategory) ??
    categoryDisplayOptions[0] ??
    null;
  const itemsForDisplay = value.backendItems.length > 0 ? value.backendItems : value.fallbackItems;
  const itemDisplayItems = foodCommunityItemDisplayItems(itemsForDisplay);
  const visibleItems = visibleFoodCommunityDisplayItems(itemDisplayItems, value.selectedCategory, value.searchText);
  const selectedItem = selectedFoodCommunityDisplayItem(itemDisplayItems, visibleItems, value.selectedItemId);

  return {
    categoriesForDisplay,
    categoryDisplayOptions,
    selectedCategoryDisplay,
    itemsForDisplay,
    itemDisplayItems,
    visibleItems,
    selectedItem,
    shareFieldRows: foodCommunityShareFieldDisplayRows(value.shareFields, selectedItem?.title),
    pointRows: foodCommunityPointDisplayRows(value.pointsBalance),
    rankingRows: foodCommunityRankingDisplayRows()
  };
}

export function foodCommunityShareFieldDisplayRows(
  fields: FoodCommunityShareFields,
  selectedFoodTitle: string | null | undefined
) {
  return ([
    ["食物名稱", fields.foodName || selectedFoodTitle || "由使用者輸入"],
    ["食用時間", `${fields.eatenDate} ${fields.eatenTime}`],
    ["食用前血糖", fields.beforeGlucose || "由使用者輸入"],
    ["食用後血糖", fields.afterGlucose || "由使用者輸入"],
    [
      "血糖上升值",
      fields.beforeGlucose && fields.afterGlucose
        ? `${clampNumber(Number(fields.afterGlucose) - Number(fields.beforeGlucose), -maxMobileGlucoseValue, maxMobileGlucoseValue)} mg/dL`
        : "系統自動計算"
    ],
    ["備註心得", fields.note || "使用者可補充份量與情境"]
  ] as const).map(detailPairDisplayItem);
}

export function foodCommunityPointDisplayRows(pointsBalance: StoreApiPointsBalance | null) {
  return ([
    ["本次分享", "+10 點"],
    [
      "點數餘額",
      pointsBalance ? `${clampNumber(pointsBalance.balance, 0, maxMobileCountValue)} 點` : "尚未同步"
    ],
    [
      "累積獲得",
      pointsBalance ? `${clampNumber(pointsBalance.lifetime_earned, 0, maxMobileCountValue)} 點` : "分享後同步"
    ],
    ["點數用途", "優惠券、商品折扣、特殊徽章、會員福利"]
  ] as const).map(detailPairDisplayItem);
}

export function foodCommunityRankingDisplayRows() {
  return ([
    ["分享次數排行", "統計公開分享筆數"],
    ["貢獻度排行", "加權完整度與審核狀態"],
    ["食物測試達人排行", "依測試食物種類計算"]
  ] as const).map(detailPairDisplayItem);
}

export function mobileFoodCategoryFromApi(value: string): FoodCommunityCategory {
  if (value === "vegetables") {
    return "vegetable";
  }
  if (value === "eggs") {
    return "egg";
  }
  if (value === "beans") {
    return "bean";
  }
  if (value === "starches") {
    return "starch";
  }
  if (value === "drinks") {
    return "drink";
  }
  if (value === "supplements") {
    return "supplement";
  }
  if (value === "snacks") {
    return "snack";
  }
  if (
    value === "meat" ||
    value === "seafood" ||
    value === "fruit"
  ) {
    return value;
  }
  return "vegetable";
}

export function apiFoodCategoryFromMobile(value: FoodCommunityCategory): FoodCommunityApiCategory {
  if (value === "vegetable") {
    return "vegetables";
  }
  if (value === "egg") {
    return "eggs";
  }
  if (value === "bean") {
    return "beans";
  }
  if (value === "starch") {
    return "starches";
  }
  if (value === "drink") {
    return "drinks";
  }
  if (value === "supplement") {
    return "supplements";
  }
  if (value === "snack") {
    return "snacks";
  }
  if (value === "meat" || value === "seafood" || value === "fruit") {
    return value;
  }
  return "vegetables";
}

export function foodCommunityItemFromApi(value: FoodCommunityApiItem): FoodCommunityItem {
  const stats = value.stats;
  const title = boundDisplayText(value.name || "食物", maxDisplayTextLength);
  return {
    id: boundIdentifier(value.id),
    category: mobileFoodCategoryFromApi(value.category),
    title,
    aliases: [value.category_label, title].filter(Boolean).map((alias) => boundDisplayText(alias, 40)),
    shareCount: clampNumber(stats.share_count, 0, maxMobileCountValue),
    averageRise: clampNumber(Math.round(stats.average_glucose_delta ?? 0), -maxMobileGlucoseValue, maxMobileGlucoseValue),
    maximumRise: clampNumber(stats.max_glucose_delta ?? 0, -maxMobileGlucoseValue, maxMobileGlucoseValue),
    minimumRise: clampNumber(stats.min_glucose_delta ?? 0, -maxMobileGlucoseValue, maxMobileGlucoseValue),
    examples: (value.shares ?? []).slice(0, 3).map((share) => ({
      id: boundIdentifier(share.id),
      beforeGlucose: clampNumber(share.before_glucose, 0, maxMobileGlucoseValue),
      afterGlucose: clampNumber(share.after_glucose, 0, maxMobileGlucoseValue),
      glucoseDelta: clampNumber(share.glucose_delta, -maxMobileGlucoseValue, maxMobileGlucoseValue),
      note: boundDisplayText(
        share.public_note || share.serving_description || recordDateTimeDisplay(share.eaten_at),
        maxDisplayDetailTextLength
      )
    }))
  };
}

export function emptyFoodCommunityShareFields(): FoodCommunityShareFields {
  const nowInputs = localDateTimeInputs(new Date());
  return {
    foodName: "",
    eatenDate: nowInputs.date,
    eatenTime: nowInputs.time,
    beforeGlucose: "",
    afterGlucose: "",
    note: ""
  };
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

export function storeCategoryDisplayItems(values: Array<{ id: StoreCategory; label: string }>) {
  return values.map(storeCategoryDisplayItem);
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

export function storeProductDisplayItems(products: StoreProduct[]) {
  return products.map(storeProductDisplayItem);
}

export function visibleStoreProductDisplayItems(
  products: Array<ReturnType<typeof storeProductDisplayItem>>,
  category: StoreCategory,
  searchText: string
) {
  const query = searchText.trim().toLowerCase();
  return products.filter((product) => {
    const matchesCategory = product.category === category;
    const matchesSearch =
      query.length === 0 ||
      `${product.title} ${product.description} ${product.pointsCost}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
}

export function storeDisplayBundle(value: {
  backendProducts: StoreProduct[];
  fallbackProducts: StoreProduct[];
  categories: Array<{ id: StoreCategory; label: string }>;
  selectedCategory: StoreCategory;
  searchText: string;
  redemptions: StoreRedemptionDisplayInput[];
  pointsBalance: StoreApiPointsBalance | null;
}) {
  const productsForDisplay = value.backendProducts.length > 0 ? value.backendProducts : value.fallbackProducts;
  const productDisplayItems = storeProductDisplayItems(productsForDisplay);
  return {
    productsForDisplay,
    productDisplayItems,
    redemptionDisplayItems: storeRedemptionWalletDisplayItems(value.redemptions),
    categoryDisplayOptions: storeCategoryDisplayItems(value.categories),
    visibleProducts: visibleStoreProductDisplayItems(productDisplayItems, value.selectedCategory, value.searchText),
    redemptionBoundaryRows: storeRedemptionBoundaryDisplayRows(
      value.pointsBalance,
      value.backendProducts.length > 0,
      value.redemptions.length
    )
  };
}

export function storeCategoryFromApi(value: StoreRewardApiCategory): StoreCategory {
  if (value === "supplement_discounts") {
    return "supplementDiscounts";
  }
  if (value === "partner_products") {
    return "partnerProducts";
  }
  if (value === "special_badges") {
    return "specialBadges";
  }
  if (value === "member_benefits") {
    return "memberBenefits";
  }
  return "coupons";
}

export function storeProductFromApi(value: StoreRewardApiInput): StoreProduct {
  return {
    id: boundIdentifier(value.code),
    category: storeCategoryFromApi(value.category),
    badge: value.status === "redeemable" ? "可兌換" : "預留",
    title: boundDisplayText(value.title || "兌換項目", maxDisplayTextLength),
    description: boundDisplayText(
      value.status === "redeemable"
        ? storeRedeemableFulfillmentCopy(storeCategoryFromApi(value.category))
        : "此項目仍保留給未來商品、庫存、法務或會員權益整合。",
      maxDisplayDetailTextLength
    ),
    pointsCost: boundDisplayText(`${clampNumber(value.points_cost, 0, maxMobileCountValue)} 點`, 40),
    icon: value.category === "coupons" ? "%" : value.category === "special_badges" ? "徽" : "兌",
    rewardStatus: value.status
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

export function storeRedemptionWalletDisplayItems(items: StoreRedemptionDisplayInput[]) {
  return items.slice(0, maxListItems).map(storeRedemptionDisplayItem);
}

export function storeRedemptionBoundaryDisplayRows(
  pointsBalance: StoreApiPointsBalance | null,
  hasBackendProducts: boolean,
  redemptionCount: number
) {
  return ([
    [
      "點數餘額",
      pointsBalance ? `${clampNumber(pointsBalance.balance, 0, maxMobileCountValue)} 點` : "尚未同步"
    ],
    ["可兌換項目", "優惠券、保健食品折扣、合作商品、特殊徽章、特殊會員福利"],
    ["仍待完成", "庫存、出貨訂單、付款與 rollback"],
    [
      "目前狀態",
      hasBackendProducts
        ? `已讀取 backend catalog，已同步 ${clampNumber(redemptionCount, 0, maxMobileCountValue)} 筆兌換券`
        : "本機預覽，不扣點、不建訂單、不發券"
    ]
  ] as const).map(detailPairDisplayItem);
}

export function commercePreviewOpenCartStatusMessage() {
  return boundUiMessage("已開啟購物車整合狀態；preview 不建立 cart、order、payment 或 backend write。");
}

export function commercePreviewReturnStoreStatusMessage() {
  return boundUiMessage("已返回商城；購物車整合狀態不建立訂單、不保存購物車，也不處理付款。");
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

export function communityBoundaryDisplayRows(isLeaderboardOptedIn: boolean) {
  return [
    ["健康紀錄", "預設私密"],
    ["公開排名", isLeaderboardOptedIn ? "已 opt-in" : "預設關閉"],
    ["留言治理", "封鎖/檢舉/審核"],
    ["AI 成本", "0 次呼叫"]
  ].map(([label, value]) => ({
    label: boundDisplayText(label, 60),
    value: boundDisplayText(value, 80)
  }));
}

export function communityReadinessChecklistDisplayItems() {
  return [
    "社群貼文、留言、封鎖、檢舉與審核流程",
    "健康資料不可自動公開，分享需明確 opt-in",
    "公開分享刪除、撤回與 audit-friendly event stream"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
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

export function rankingBoundaryDisplayRows() {
  return [
    ["公開排名", "預設關閉"],
    ["排名資料", "非敏感統計"],
    ["健康數值", "不可公開"],
    ["AI 成本", "0 次呼叫"]
  ].map(([label, value]) => ({
    label: boundDisplayText(label, 60),
    value: boundDisplayText(value, 80)
  }));
}

export function rankingReadinessChecklistDisplayItems() {
  return [
    "封鎖、檢舉與審核流程",
    "榜單爭議處理與公開名稱違規處置",
    "退出排名後的歷史資料撤回與 audit event"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
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

export function foodPhotoReadinessChecklistDisplayItems() {
  return [
    "相機 / 相簿權限與圖片壓縮上限",
    "圖片儲存、刪除與隱私遮罩策略",
    "Vision 成本上限、rate limit 與重試規則",
    "使用者確認後才可轉成飲食紀錄"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
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

export function achievementYearReviewStatusDisplayTexts(value: {
  achievementActionStatus: string;
  yearReviewActionStatus: string;
}) {
  return {
    achievementAction: boundUiMessage(value.achievementActionStatus),
    yearReviewAction: boundUiMessage(value.yearReviewActionStatus)
  };
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

export function storeCheckoutReadinessChecklistDisplayItems() {
  return [
    "商品目錄、庫存與價格來源",
    "購物車持久化、庫存 reservation 與 rollback 規則",
    "付款金流、receipt validation 與退款流程",
    "訂單狀態、出貨狀態與客服稽核"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function storeCartReturnButtonLabel() {
  return boundDisplayText("返回商城", maxDisplayTextLength);
}

export function storePreviewDisplayTexts(actionStatus: string) {
  return {
    actionStatus: boundUiMessage(actionStatus),
    previewBoundary: storePreviewBoundaryCopy(),
    cartButton: storeCartButtonLabel(),
    cartButtonAccessibility: storeCartButtonAccessibilityLabel(),
    localBoundary: storeLocalBoundaryCopy(),
    cartIntro: storeCartIntroCopy(),
    checkoutReadinessTitle: storeCheckoutReadinessTitle(),
    cartReturnButton: storeCartReturnButtonLabel()
  };
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

export function yearReviewTargetYear(value: Date) {
  return value.getFullYear() - 1;
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

export function yearReviewShareUnavailableStatusMessage() {
  return boundUiMessage("visual smoke 或 backend unavailable 時不啟動外部分享；backend ready 時可準備隱私遮罩分享卡並開啟原生分享。");
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
    badgeMaterial: yearReviewBadgeMaterialCopy(),
    shareButtonLabel: yearReviewShareButtonLabel(),
    shareAccessibilityLabel: yearReviewShareButtonAccessibilityLabel(),
    revokeShareButtonLabel: yearReviewRevokeShareButtonLabel(),
    revokeShareAccessibilityLabel: yearReviewRevokeShareButtonAccessibilityLabel()
  };
}

export function backendYearReviewMetricDisplayRows(summary: YearReviewApiResponse | null) {
  return summary?.annual_stats.slice(0, 7).map((item) => metricDisplayItem([item.label, String(item.value)] as const)) ?? [];
}

export function backendYearReviewHealthOutcomeDisplayRows(summary: YearReviewApiResponse | null) {
  return summary?.health_outcomes.slice(0, 3).map((item) => metricDisplayItem([item.label, String(item.value)] as const)) ?? [];
}

export function localYearlyReviewMetricDisplayRows(
  yearlyRecordDayDisplayCount: number,
  yearlyGlucoseRecordDisplayCount: number,
  yearlyMealRecordDisplayCount: number,
  yearlyExerciseRecordDisplayCount: number,
  yearlyLongestStreakDisplayDays: number,
  yearlyUnlockedBadgeDisplayCount: number,
  yearlyHighestBadgeDisplayLevel: number
) {
  return ([
    ["本年度總記錄天數", `${yearlyRecordDayDisplayCount} 天`],
    ["本年度血糖記錄次數", `${yearlyGlucoseRecordDisplayCount} 次`],
    ["本年度飲食記錄次數", `${yearlyMealRecordDisplayCount} 次`],
    ["本年度運動記錄次數", `${yearlyExerciseRecordDisplayCount} 次`],
    ["最長連續記錄天數", `${yearlyLongestStreakDisplayDays} 天`],
    ["達成徽章數量", `${yearlyUnlockedBadgeDisplayCount} 枚`],
    ["解鎖最高等級徽章", yearlyHighestBadgeDisplayLevel > 0 ? `${yearlyHighestBadgeDisplayLevel} 級` : "尚無"]
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

export function futurePreviewStatusDisplayTexts(value: {
  futureModuleActionStatus: string;
  doctorShareActionStatus: string;
  healthIntegrationActionStatus: string;
  communityActionStatus: string;
  rankingActionStatus: string;
  reportLimit: number;
}) {
  const boundedReportLimit = clampNumber(value.reportLimit, 0, maxMobileCountValue);
  return {
    futureModuleAction: boundUiMessage(value.futureModuleActionStatus),
    doctorShareAction: boundUiMessage(value.doctorShareActionStatus),
    healthIntegrationAction: boundUiMessage(value.healthIntegrationActionStatus),
    communityAction: boundUiMessage(value.communityActionStatus),
    rankingAction: boundUiMessage(value.rankingActionStatus),
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
    ),
    communityPosting: boundUiMessage(
      "社群發文尚未啟用；目前不建立貼文、不送出留言、不公開任何健康紀錄。"
    ),
    communityPrivacy: boundUiMessage(
      "公開名稱與排行榜 opt-in 已可同步 backend；社群貼文、留言、刪除撤回與審核流程仍未開放。"
    ),
    foodCommunityShare: boundUiMessage(
      "backend ready 時可送出食物分享、建立社群點數並刷新排行榜與商城點數；visual smoke 或 backend unavailable 時不寫入資料。"
    )
  };
}
