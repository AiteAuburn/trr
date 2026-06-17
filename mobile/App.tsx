import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Audio } from "expo-av";
import {
  benchmarkNativeLlama,
  benchmarkNativeWhisper,
  checkNativeLocalModules,
  parseWithNativeLlama,
  transcribeWithNativeWhisper
} from "./nativeLocalModels";
import { downloadModel, listDownloadedModels, type DownloadedModel } from "./modelStorage";
import {
  authAccessTokenMaxLength,
  authRefreshTokenMaxLength,
  clearStoredAuthSession,
  readStoredAuthSession,
  writeStoredAuthSession
} from "./authTokenStorage";
import {
  createAuthProviderChallenge,
  validateAuthProviderChallenge,
  type AuthProviderChallenge,
  type AuthProviderChallengeFailure
} from "./authProviderChallenge";

type Account = {
  id: string;
  email: string;
  display_name: string;
};

type Profile = {
  id: string;
  account_id: string;
  display_name: string;
  relationship: string;
};

type AiModelOption = {
  id: string;
  label: string;
  kind: "stt" | "llm";
  runtime: "browser" | "local" | "server_api" | "server_stub" | "cloud_disabled";
  available: boolean;
  description: string;
};

type AiModelOptions = {
  stt_models: AiModelOption[];
  llm_models: AiModelOption[];
};

type PendingRecord = {
  profile_id: string;
  record_type: string;
  occurred_at: string;
  payload_json: Record<string, unknown>;
  metadata_json?: Record<string, unknown>;
  source: string;
  confidence?: number;
  decision_trace?: string;
};

type TranscriptSegment = {
  segment_id: string;
  segment_type: string;
  source_text: string;
  confidence: number;
};

type RejectedEvent = {
  segment_id: string;
  source_text: string;
  reason: string;
};

type ParsePreviewResponse = {
  transcript: string;
  normalized_text: string;
  stt_model_id: string;
  llm_model_id: string;
  segments: TranscriptSegment[];
  records: PendingRecord[];
  rejected_events: RejectedEvent[];
};
type DevResetResponse = {
  status: string;
  deleted_counts: Record<string, number>;
};

type RecordItem = {
  id: string;
  profile_id: string;
  record_type: string;
  occurred_at: string;
  payload_json: Record<string, unknown>;
  metadata_json: Record<string, unknown>;
  source: string;
  created_at: string;
};

type VoiceQuota = {
  plan_code: string;
  status: string;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  referral_code?: string | null;
  preserves_intro_price: boolean;
  daily_limit_seconds: number;
  used_seconds_today: number;
  remaining_seconds_today: number;
};

type FoodCommunityApiCategory =
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

type FoodCommunityApiCategoryRead = {
  code: FoodCommunityApiCategory;
  label: string;
  food_count?: number;
  sample_foods?: string[];
};

type FoodCommunityApiStats = {
  share_count: number;
  average_glucose_delta: number | null;
  max_glucose_delta: number | null;
  min_glucose_delta: number | null;
};

type FoodCommunityApiShare = {
  id: string;
  eaten_at: string;
  before_glucose: number;
  after_glucose: number;
  glucose_delta: number;
  serving_description?: string | null;
  public_note?: string | null;
  created_at: string;
};

type FoodCommunityApiItem = {
  id: string;
  name: string;
  category: FoodCommunityApiCategory;
  category_label: string;
  stats: FoodCommunityApiStats;
  shares?: FoodCommunityApiShare[];
};

type FoodCommunityApiShareResponse = {
  food: FoodCommunityApiItem;
  share: FoodCommunityApiShare;
  awarded_points: number;
};

type CommunityPublicSettings = {
  display_name: string;
  leaderboard_opt_in: boolean;
};

type CommunityLeaderboardType = "share_count" | "contribution" | "food_tester";

type CommunityLeaderboardApiEntry = {
  account_id?: string | null;
  display_name: string;
  score: number;
};

type CommunityLeaderboardApiResponse = {
  leaderboard_type: CommunityLeaderboardType;
  entries: CommunityLeaderboardApiEntry[];
};

type StoreApiRewardCategory =
  | "coupons"
  | "supplement_discounts"
  | "partner_products"
  | "member_benefits"
  | "special_badges";

type StoreApiReward = {
  code: string;
  title: string;
  category: StoreApiRewardCategory;
  points_cost: number;
  status: "preview" | "redeemable";
};

type StoreApiPointsBalance = {
  balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
};

type StoreApiRedemption = {
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

type YearReviewApiMetric = {
  key: string;
  label: string;
  value: number | string;
};

type YearReviewApiObservation = {
  kind: "important_observation" | "encouragement";
  text: string;
};

type YearReviewApiResponse = {
  snapshot_id?: string | null;
  year: number;
  generated_for_previous_year: boolean;
  generated_at?: string | null;
  source?: "snapshot" | "generated";
  annual_stats: YearReviewApiMetric[];
  health_outcomes: YearReviewApiMetric[];
  ai_summary: YearReviewApiObservation[];
};

type YearReviewApiShareAsset = {
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

type YearReviewApiSharePackage = {
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

type AuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in: number;
};

type OidcLoginProvider = "apple" | "google" | "email";
type QuickEntryMode = "voice" | "text" | "manual";

type AuthSessionItem = {
  id: string;
  created_at: string;
  expires_at: string;
  last_used_at?: string | null;
  has_device_fingerprint: boolean;
};

type BasicReport = {
  profile_id: string;
  generated_at: string;
  record_count: number;
  glucose: {
    count: number;
    before_meal_count: number;
    after_meal_count: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    latest_value: number | null;
    latest_recorded_at: string | null;
  };
  meals: {
    count: number;
  };
  lifestyle: {
    exercise_count: number;
    medication_count: number;
    lifestyle_count: number;
    note_count: number;
  };
};

type AppScreen =
  | "today"
  | "record"
  | "transcriptReview"
  | "aiReview"
  | "aiSaveConfirm"
  | "aiSaveFailure"
  | "aiRemoveConfirm"
  | "editPreviewRecord"
  | "saveSuccess"
  | "deleteSuccess"
  | "updateSuccess"
  | "manualRecord"
  | "manualRecordConfirm"
  | "recordDetail"
  | "editRecord"
  | "deleteConfirm"
  | "history"
  | "analysis"
  | "detailedReport"
  | "subscription"
  | "subscriptionManagement"
  | "membershipStatus"
  | "menu"
  | "settings"
  | "accountSecurity"
  | "profileSettings"
  | "recordingQuotaSettings"
  | "reminderSettings"
  | "privacySettings"
  | "tutorial"
  | "achievements"
  | "yearReview"
  | "store"
  | "storeCart"
  | "foodPhoto"
  | "doctorShare"
  | "healthIntegration"
  | "community"
  | "ranking"
  | "futureModuleDetail"
  | "futureModules";

const defaultApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const enableDebugTools = process.env.EXPO_PUBLIC_ENABLE_DEBUG_TOOLS === "true";
const allowMobileDevAuth = process.env.EXPO_PUBLIC_ALLOW_DEV_AUTH === "true";
const visualSmokeInitialRoute = process.env.EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE ?? "";

const sampleText =
  "今天早上空腹血糖 138，早餐吃蛋餅跟無糖豆漿，下午散步 30 分鐘。";

const primaryScreens: Array<{ id: AppScreen; label: string }> = [
  { id: "today", label: "今日" },
  { id: "record", label: "記錄" },
  { id: "menu", label: "選單" }
];

const mvpFlowSteps: Array<{ id: AppScreen; label: string }> = [
  { id: "record", label: "記錄" },
  { id: "transcriptReview", label: "文字確認" },
  { id: "aiReview", label: "AI確認" },
  { id: "aiSaveConfirm", label: "儲存確認" },
  { id: "saveSuccess", label: "完成" }
];

const screenChrome: Record<AppScreen, { subtitle: string; backTo?: AppScreen; actionLabel?: string }> = {
  today: { subtitle: "" },
  record: { subtitle: "使用錄音預覽、文字輸入或手動新增紀錄。" },
  transcriptReview: { subtitle: "確認目前輸入的紀錄文字。", backTo: "record", actionLabel: "‹" },
  aiReview: { subtitle: "AI 已幫你整理完成，請確認資料是否正確。", backTo: "transcriptReview", actionLabel: "‹" },
  aiSaveConfirm: { subtitle: "確認要儲存 AI 候選紀錄。", backTo: "aiReview", actionLabel: "‹" },
  aiSaveFailure: { subtitle: "儲存未完成，請返回確認或改用手動新增。", backTo: "aiSaveConfirm", actionLabel: "‹" },
  aiRemoveConfirm: { subtitle: "確認要移除這筆 AI 候選紀錄。", backTo: "aiReview", actionLabel: "‹" },
  editPreviewRecord: { subtitle: "修改 AI 整理出的候選紀錄。", backTo: "aiReview", actionLabel: "‹" },
  saveSuccess: { subtitle: "紀錄已確認並完成儲存。", backTo: "today", actionLabel: "×" },
  deleteSuccess: { subtitle: "紀錄已從目前清單移除。", backTo: "today", actionLabel: "×" },
  updateSuccess: { subtitle: "紀錄已完成更新。", backTo: "today", actionLabel: "×" },
  manualRecord: { subtitle: "不經 AI，直接建立結構化紀錄。", backTo: "today", actionLabel: "‹" },
  manualRecordConfirm: { subtitle: "確認手動新增紀錄內容。", backTo: "manualRecord", actionLabel: "‹" },
  recordDetail: { subtitle: "查看單筆紀錄的完整內容。", backTo: "today", actionLabel: "‹" },
  editRecord: { subtitle: "修改紀錄欄位並儲存。", backTo: "recordDetail", actionLabel: "‹" },
  deleteConfirm: { subtitle: "確認是否刪除這筆紀錄。", backTo: "recordDetail", actionLabel: "‹" },
  history: { subtitle: "查詢過去的血糖、飲食與運動紀錄。" },
  analysis: { subtitle: "查看最近血糖趨勢與簡單摘要。" },
  detailedReport: { subtitle: "查看更完整的紀錄摘要。", backTo: "analysis", actionLabel: "‹" },
  subscription: { subtitle: "選擇適合你的方案，持續輕鬆記錄。", backTo: "menu", actionLabel: "‹" },
  subscriptionManagement: { subtitle: "查看訂閱管理、付款與權益同步邊界。", backTo: "settings", actionLabel: "‹" },
  membershipStatus: { subtitle: "查看試用、續訂與會員功能狀態。", backTo: "subscription", actionLabel: "‹" },
  menu: { subtitle: "快速前往你需要的功能。", backTo: "today", actionLabel: "×" },
  settings: { subtitle: "管理帳號、提醒與使用偏好。", backTo: "menu", actionLabel: "‹" },
  accountSecurity: { subtitle: "查看登入狀態與正式 auth 邊界。", backTo: "settings", actionLabel: "‹" },
  profileSettings: { subtitle: "查看個人資料與照護對象資料邊界。", backTo: "settings", actionLabel: "‹" },
  recordingQuotaSettings: { subtitle: "查看今日語音額度與付費方案限制。", backTo: "settings", actionLabel: "‹" },
  reminderSettings: { subtitle: "規劃記錄提醒與通知權限邊界。", backTo: "settings", actionLabel: "‹" },
  privacySettings: { subtitle: "查看通知、分享與資料權利邊界。", backTo: "settings", actionLabel: "‹" },
  tutorial: { subtitle: "簡單 4 步驟，輕鬆記錄每一天。", backTo: "menu", actionLabel: "‹" },
  achievements: { subtitle: "完成挑戰，養成穩定記錄習慣。", backTo: "menu", actionLabel: "‹" },
  yearReview: { subtitle: "看看前一年度的控糖成果。", backTo: "menu", actionLabel: "‹" },
  store: { subtitle: "瀏覽未來商城與優惠入口。", backTo: "menu", actionLabel: "‹" },
  storeCart: { subtitle: "確認未來購物車與結帳狀態。", backTo: "store", actionLabel: "‹" },
  foodPhoto: { subtitle: "食物拍照分析預覽，Vision 尚未串接。", backTo: "menu", actionLabel: "‹" },
  doctorShare: { subtitle: "醫師合作授權與回診報表預覽。", backTo: "futureModules", actionLabel: "‹" },
  healthIntegration: { subtitle: "健康平台與血糖機匯入預覽。", backTo: "futureModules", actionLabel: "‹" },
  community: { subtitle: "社群交流與公開資料邊界預覽。", backTo: "futureModules", actionLabel: "‹" },
  ranking: { subtitle: "排行榜統計與公開排名 opt-in 預覽。", backTo: "futureModules", actionLabel: "‹" },
  futureModuleDetail: { subtitle: "查看未來模組的啟用條件與安全邊界。", backTo: "futureModules", actionLabel: "‹" },
  futureModules: { subtitle: "預留醫師、社群、串接與圖片辨識入口。", backTo: "menu", actionLabel: "‹" }
};

const menuScreens: Array<{ id: AppScreen; label: string; icon: string }> = [
  { id: "today", label: "今日錄音", icon: "🎙" },
  { id: "history", label: "歷史紀錄", icon: "🗂" },
  { id: "analysis", label: "基本分析", icon: "📊" },
  { id: "achievements", label: "成就榜", icon: "🏆" },
  { id: "yearReview", label: "年度回顧", icon: "🔁" },
  { id: "store", label: "商城", icon: "🛍" },
  { id: "community", label: "食物社群（預留）", icon: "🤝" },
  { id: "ranking", label: "社群排行（預留）", icon: "🏅" },
  { id: "settings", label: "設定", icon: "⚙" }
];

const visualSmokeRouteJumps: Array<{ id: AppScreen; label: string }> = [
  { id: "today", label: "今日紀錄" },
  { id: "record", label: "快速記錄" },
  { id: "transcriptReview", label: "文字確認" },
  { id: "aiReview", label: "AI 整理確認" },
  { id: "editPreviewRecord", label: "AI 候選編輯" },
  { id: "aiRemoveConfirm", label: "AI 候選移除" },
  { id: "aiSaveConfirm", label: "AI 儲存確認" },
  { id: "aiSaveFailure", label: "AI 儲存失敗" },
  { id: "saveSuccess", label: "儲存完成" },
  { id: "deleteSuccess", label: "刪除完成" },
  { id: "updateSuccess", label: "更新完成" },
  { id: "manualRecordConfirm", label: "手動確認" },
  { id: "history", label: "歷史紀錄" },
  { id: "recordDetail", label: "記錄詳情" },
  { id: "editRecord", label: "編輯記錄" },
  { id: "deleteConfirm", label: "刪除確認" },
  { id: "manualRecord", label: "手動新增" },
  { id: "analysis", label: "基本分析" },
  { id: "detailedReport", label: "詳細報告" },
  { id: "subscription", label: "會員方案" },
  { id: "subscriptionManagement", label: "訂閱管理" },
  { id: "membershipStatus", label: "會員狀態" },
  { id: "settings", label: "設定" },
  { id: "accountSecurity", label: "帳號安全" },
  { id: "profileSettings", label: "個人資料" },
  { id: "recordingQuotaSettings", label: "錄音額度" },
  { id: "reminderSettings", label: "提醒設定" },
  { id: "privacySettings", label: "通知隱私" },
  { id: "tutorial", label: "使用教學" },
  { id: "menu", label: "功能選單" },
  { id: "futureModules", label: "未來擴充" },
  { id: "futureModuleDetail", label: "未來模組詳情" },
  { id: "doctorShare", label: "醫師合作" },
  { id: "healthIntegration", label: "健康串接" },
  { id: "community", label: "社群預覽" },
  { id: "ranking", label: "排行榜" },
  { id: "achievements", label: "成就榜" },
  { id: "yearReview", label: "年度回顧" },
  { id: "store", label: "商城" },
  { id: "storeCart", label: "購物車" },
  { id: "foodPhoto", label: "食物拍照" }
];

const visualSmokeRouteJumpIds = visualSmokeRouteJumps.map((route) => route.id);

function normalizeVisualSmokeInitialRoute(value: string): AppScreen | null {
  if (!enableDebugTools || !allowMobileDevAuth) {
    return null;
  }
  if (!visualSmokeRouteJumpIds.includes(value as AppScreen)) {
    return null;
  }
  return value as AppScreen;
}

function visualSmokeRouteFromDeepLinkUrl(value: string): AppScreen | null {
  if (!value.includes("visual-smoke")) {
    return null;
  }
  const queryText = value.includes("?") ? value.split("?")[1]?.split("#")[0] ?? "" : "";
  const route = new URLSearchParams(queryText).get("route") ?? new URLSearchParams(queryText).get("visualSmokeRoute") ?? "";
  return normalizeVisualSmokeInitialRoute(route);
}

const initialVisualSmokeScreen = normalizeVisualSmokeInitialRoute(visualSmokeInitialRoute);

type FutureModuleCard = {
  id: string;
  title: string;
  description: string;
  readiness: string;
  requirements: string[];
  safety: string;
  icon: string;
  target?: AppScreen;
};

const futureModuleCards: FutureModuleCard[] = [
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
    title: "社群",
    description: "糖友交流、留言討論與小型互動入口。",
    readiness: "需先完成公開/私密資料邊界、社群權限與內容治理。",
    requirements: ["公開顯示名稱與隱私設定", "留言、封鎖、檢舉與審核流程", "健康資料不可自動公開"],
    safety: "預設不公開任何健康紀錄；使用者必須明確 opt-in 才能發佈非敏感社群內容。",
    icon: "群",
    target: "community"
  },
  {
    id: "achievements",
    title: "成就榜 / 徽章",
    description: "連續記錄、運動里程碑與習慣養成徽章。",
    readiness: "需先完成 achievement definitions、後端同步與隱私邊界。",
    requirements: ["streak days 與 badge definitions", "achievement records 同步", "公開展示需使用者 opt-in"],
    safety: "成就只能鼓勵紀錄習慣，不可暗示治療效果或公開健康數值。",
    icon: "徽",
    target: "achievements"
  },
  {
    id: "ranking",
    title: "排行榜",
    description: "連續記錄排行榜、社群競賽與公開排名 opt-in。",
    readiness: "需先完成公開排名 opt-in、統計資料最小化與撤回流程。",
    requirements: ["user public ranking opt-in", "ranking stats structure", "排名退出與歷史資料撤回流程"],
    safety: "不公開血糖數值或健康內容；排行榜只能使用使用者同意的非敏感統計。",
    icon: "榜",
    target: "ranking"
  },
  {
    id: "yearReview",
    title: "年度回顧",
    description: "年度血糖、飲食、運動與連續記錄摘要。",
    readiness: "需先累積年度資料、完成隱私遮罩與分享權限。",
    requirements: ["年度 aggregate job 或報表查詢", "分享圖隱私遮罩", "使用者分享與刪除控制"],
    safety: "年度回顧只能做紀錄摘要與鼓勵，不提供診療建議或療效宣稱。",
    icon: "年",
    target: "yearReview"
  },
  {
    id: "store",
    title: "商城",
    description: "健康商品、書籍、優惠券與會員獎勵入口。",
    readiness: "需先完成商品、庫存、優惠、訂單、付款與法務審核。",
    requirements: ["商品目錄與庫存來源", "購物車、優惠券與訂單狀態", "付款、退款與商品法務審核"],
    safety: "商城商品不得宣稱醫療療效；正式交易前需完成付款與商品審核。",
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

type RecordEditFields = {
  glucoseValue: string;
  glucoseUnit: string;
  glucoseTiming: string;
  mealType: string;
  foodItems: string;
  exerciseActivity: string;
  exerciseMinutes: string;
  medicationName: string;
  medicationDose: string;
  noteKind: string;
  noteTags: string;
  fallbackJson: string;
};

function recordEditFieldMaxLength(field: keyof RecordEditFields) {
  if (field === "fallbackJson") {
    return maxFormJsonTextLength;
  }
  if (field === "foodItems" || field === "noteTags") {
    return maxFormLongTextLength;
  }
  return maxFormTextLength;
}

function boundRecordEditField<K extends keyof RecordEditFields>(
  field: K,
  value: RecordEditFields[K]
): RecordEditFields[K] {
  return value.slice(0, recordEditFieldMaxLength(field)) as RecordEditFields[K];
}

type ManualRecordType = "glucose" | "meal" | "exercise" | "medication" | "note";
type HistoryDetailMode = "structured" | "raw";
type AnalysisRange = "week" | "month" | "custom";
type AchievementCategory = "glucose" | "meal" | "exercise";
type AchievementKind = "cumulative" | "streak";
type FoodCommunityCategory =
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
type AchievementItem = {
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
type AchievementApiItem = {
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
type AchievementApiSummary = {
  levels: number[];
  unlocked_count: number;
  persisted_unlocked_count: number;
  newly_unlocked_count: number;
  next_remaining: number;
  items: AchievementApiItem[];
};
type AchievementApiUnlock = AchievementApiItem;
type StoreCategory = "coupons" | "supplementDiscounts" | "partnerProducts" | "specialBadges" | "memberBenefits";
type FoodCommunityShare = {
  id: string;
  beforeGlucose: number;
  afterGlucose: number;
  glucoseDelta?: number;
  note: string;
};
type FoodCommunityItem = {
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
type FoodCommunityShareFields = {
  foodName: string;
  beforeGlucose: string;
  afterGlucose: string;
  note: string;
};
type CommunityLeaderboardDisplayEntry = {
  id: string;
  rankLabel: string;
  displayName: string;
  scoreLabel: string;
};
type CommunityLeaderboardDisplaySection = {
  type: CommunityLeaderboardType;
  label: string;
  entries: CommunityLeaderboardDisplayEntry[];
  emptyCopy: string;
};
type StoreProduct = {
  id: string;
  category: StoreCategory;
  badge?: string;
  title: string;
  description: string;
  pointsCost: string;
  icon: string;
  rewardStatus?: "preview" | "redeemable";
};

function storeRedeemableFulfillmentCopy(category: StoreCategory): string {
  if (category === "coupons" || category === "supplementDiscounts") {
    return "送出後 backend 會扣點並立即發出優惠券或折扣碼。";
  }
  return "送出後 backend 會扣點並建立兌換 reservation，後續仍需 fulfillment。";
}

type SettingsRow = {
  id: string;
  label: string;
  icon: string;
  helper?: string;
  target?: AppScreen;
};
type SaveEntryMethod = "ai" | "manual" | null;

const manualRecordTypes: Array<{ id: ManualRecordType; label: string }> = [
  { id: "glucose", label: "血糖" },
  { id: "meal", label: "飲食" },
  { id: "exercise", label: "運動" },
  { id: "medication", label: "用藥" },
  { id: "note", label: "備註" }
];

const historyDetailModes: Array<{ id: HistoryDetailMode; label: string; accessibilityCopy: string }> = [
  { id: "structured", label: "AI 整理", accessibilityCopy: "查看 AI 分析整理後的紀錄" },
  { id: "raw", label: "原始紀錄", accessibilityCopy: "查看原始語音轉文字內容" }
];

const analysisRanges: Array<{ id: AnalysisRange; label: string }> = [
  { id: "week", label: "本週" },
  { id: "month", label: "本月" },
  { id: "custom", label: "自訂日期區間" }
];

const achievementLevels = [10, 50, 100, 150, 200, 250];
const achievementLevelStep = 50;

const achievementCategoryDefinitions: Array<{
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

const achievementLevelColors = ["#8DB7A5", "#3FA67F", "#2F8F72", "#D97706", "#B45309", "#2563EB"];
const achievementStreakBadgeColor = "#8B5CF6";

const foodCommunityCategories: Array<{ id: FoodCommunityCategory; label: string }> = [
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

const foodCommunityItems: FoodCommunityItem[] = [
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

const storeCategories: Array<{ id: StoreCategory; label: string }> = [
  { id: "coupons", label: "優惠券" },
  { id: "supplementDiscounts", label: "保健食品折扣" },
  { id: "partnerProducts", label: "合作商品" },
  { id: "specialBadges", label: "特殊徽章" },
  { id: "memberBenefits", label: "特殊會員福利" }
];

const storeProducts: StoreProduct[] = [
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

const glucoseUnitOptions = ["mg/dL", "mmol/L"] as const;

const glucoseTimingOptions = [
  ["fasting", "空腹"],
  ["before_meal", "飯前"],
  ["after_meal", "飯後"],
  ["bedtime", "睡前"],
  ["unknown", "未指定"]
] as const;

const mealTypeOptions = [
  ["breakfast", "早餐"],
  ["lunch", "午餐"],
  ["dinner", "晚餐"],
  ["snack", "點心"],
  ["unknown", "未指定"]
] as const;

const subscriptionComparisonRows = [
  ["語音記錄", "每日 5 分鐘", "每日 10 分鐘"],
  ["AI 整理", "每日 5 次", "✓ 完整使用"],
  ["基本分析", "部分功能", "✓ 完整趨勢"],
  ["歷史紀錄", "最近 7 天", "✓ 完整保存"]
] as const;

const settingsRows: SettingsRow[] = [
  { id: "auth", label: "登入狀態", icon: "鑰", helper: "dev auth、production auth 與 session 邊界" },
  { id: "profile", label: "個人資料", icon: "人", helper: "姓名、登入方式與基本資料" },
  { id: "reminders", label: "提醒設定", icon: "鈴", helper: "記錄提醒與回診提醒" },
  { id: "quota", label: "錄音額度", icon: "麥", helper: "今日語音使用狀態" },
  { id: "privacy", label: "通知與隱私", icon: "盾", helper: "通知、資料分享與隱私設定" },
  { id: "tutorial", label: "使用教學", icon: "書", helper: "重新查看 4 步驟教學", target: "tutorial" },
  { id: "subscription", label: "訂閱管理", icon: "卡", helper: "試用、年費與方案管理" }
];

const authProviderPreviews: ReadonlyArray<{
  provider: OidcLoginProvider;
  title: string;
  status: string;
  copy: string;
}> = [
  {
    provider: "apple",
    title: "Apple",
    status: "系統登入",
    copy: "需完成 Sign in with Apple、token exchange、refresh token rotation 與 revoke。"
  },
  {
    provider: "google",
    title: "Google",
    status: "OAuth/OIDC",
    copy: "需完成 OIDC callback、nonce/state 驗證、server-side session 建立與撤銷。"
  },
  {
    provider: "email",
    title: "Email",
    status: "密碼或 magic link",
    copy: "需完成 email 驗證、rate limit、裝置/session 管理與安全儲存。"
  }
] as const;

const sessionManagementPreviews = [
  ["目前裝置", "本機預覽", "正式版需顯示裝置名稱、最後使用時間、IP / 地區粗略資訊與 session id。"],
  ["其他裝置", "需後端列表", "需由後端提供可分頁 session list，mobile 不保存完整 token 或 session 清單。"],
  ["登出全部裝置", "撤銷未啟用", "需完成 refresh token revoke、server-side session invalidation 與安全儲存清除。"]
] as const;

const productionAuthReadinessRows = [
  ["Provider", "待串接", "Apple / Google / Email token exchange 尚未接到 mobile。"],
  ["Backend verify", "待串接", "後端需驗證 JWT、issuer、audience、profile scope 與撤銷狀態。"],
  ["Secure storage", "待串接", "access token 只能短暫使用；refresh token 必須走 Keychain / Keystore 與 rotation。"],
  ["Session revoke", "待串接", "logout 與登出全部裝置需呼叫 server-side revoke，不只清除本機狀態。"],
  ["Audit", "待串接", "正式 auth 事件需 PHI-safe audit，不記錄 raw token、健康內容或 request body。"]
] as const;

const subscriptionManagementRows = [
  ["付款來源", "未串接", "正式版需由 App Store / Play Store 或會員後台開啟管理頁。"],
  ["Receipt validation", "必做", "後端驗證收據並以 webhook 更新 entitlement，不信任前端狀態。"],
  ["優惠資格", "保留欄位", "創始會員價、KOL 導流碼與續訂保價需由 server-side policy 決定。"],
  ["取消 / 到期", "待串接", "取消、到期、退款與 grace period 都需同步到 voice quota。"]
] as const;

const privacyControlRows = [
  ["醫師 / 照護者分享", "尚未啟用", "需要授權碼、到期、撤銷與唯讀範圍。"],
  ["社群公開資料", "預設關閉", "任何紀錄公開前都要逐項 opt-in。"],
  ["資料匯出 / 刪除", "待後端流程", "需要身份驗證、批次狀態與稽核紀錄。"]
] as const;

const maxFutureSkewMs = 5 * 60 * 1000;
const maxDateInputLength = 10;
const maxTimeInputLength = 5;
const maxFormTextLength = 160;
const maxFormLongTextLength = 500;
const maxFormJsonTextLength = 4000;
const maxListItems = 12;
const maxIdentifierTextLength = 128;
const maxEmailTextLength = 160;
const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxTranscriptTextLength = 1200;
const maxTranscriptNumericValues = 90;
const maxStoreSearchTextLength = 80;
const maxBackendUrlLength = 256;
const maxNativeDebugInputLength = 1024;
const maxOidcProviderLength = 32;
const maxOidcIdTokenLength = 4096;
const maxOidcNonceLength = 128;
const maxDeviceFingerprintLength = 256;
const maxUiMessageLength = 300;
const maxMobileProfiles = 20;
const maxMobileModelOptions = 30;
const maxDownloadedModelRows = 20;
const maxMobilePreviewRecords = 20;
const maxMobilePreviewSegments = 40;
const maxMobileRejectedEvents = 40;
const maxMobileCountValue = 1_000_000;
const maxMobileVoiceSeconds = 86_400;
const mobileSingleRecordingLimitSeconds = 60;
const maxMobileGlucoseValue = 1000;
const maxDevResetDeletedCountKeys = 20;
const mobileRecordSyncLimit = 100;
const maxMobileRecordCacheLimit = 500;
const mobileReportQueryLimit = 500;
const voiceQuotaLowWarningThresholdSeconds = 120;

const tutorialSteps = [
  ["🎙", "按住說話", "按住首頁或記錄頁的大按鈕開始錄音預覽。"],
  ["✋", "放開結束", "若已選擇本機 Whisper 模型，會先轉成文字並進入確認。"],
  ["✅", "確認內容", "檢查文字與 AI 候選紀錄，確認前不會儲存。"],
  ["💾", "儲存完成", "確認後送出，即可加入今日紀錄。"]
];

function normalizeApiBaseUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

function displayPayload(recordType: string, payload: Record<string, unknown>) {
  if (recordType === "glucose") {
    const unit = displayTextValue(payload.unit, 20) || "mg/dL";
    const timing = payload.meal_timing ? ` · ${glucoseTimingLabel(payload.meal_timing)}` : "";
    return payload.value === undefined
      ? displayJsonPayload(payload)
      : boundDisplayText(`血糖 ${boundDisplayText(String(payload.value), 20)} ${unit}${timing}`);
  }

  if (recordType === "meal") {
    const items = payload.food_items;
    if (Array.isArray(items)) {
      const names = items
        .slice(0, maxListItems)
        .map((item) =>
          typeof item === "object" && item !== null && "name" in item
            ? displayTextValue((item as { name: unknown }).name, 40)
            : ""
        )
        .filter(Boolean);
      if (names.length > 0) {
        return boundDisplayText(`飲食：${names.join("、")}`);
      }
    }
  }

  if (recordType === "exercise") {
    const activity = displayTextValue(payload.activity, 60) || "運動";
    const minutes = payload.minutes;
    return minutes === undefined || minutes === null
      ? activity
      : boundDisplayText(`${activity} ${boundDisplayText(String(minutes), 20)} 分鐘`);
  }

  if (recordType === "medication") {
    return boundDisplayText(`用藥：${displayTextValue(payload.name, 60) || "未命名"}`);
  }

  return displayJsonPayload(payload);
}

function recordTypeLabel(recordType: string) {
  if (recordType === "glucose") {
    return "血糖";
  }
  if (recordType === "meal") {
    return "飲食";
  }
  if (recordType === "exercise") {
    return "運動";
  }
  if (recordType === "medication") {
    return "用藥";
  }
  if (recordType === "note") {
    return "備註";
  }
  if (recordType === "weight") {
    return "體重";
  }
  return boundDisplayText(recordType, 40);
}

function recordTypeIcon(recordType: string) {
  if (recordType === "glucose") {
    return "💧";
  }
  if (recordType === "meal") {
    return "🥣";
  }
  if (recordType === "exercise") {
    return "🚶";
  }
  if (recordType === "medication") {
    return "💊";
  }
  if (recordType === "note") {
    return "📝";
  }
  return "•";
}

function aiReviewDateLabel(records: PendingRecord[]) {
  if (records.length === 0) {
    return "尚未解析日期時間";
  }
  const labels = records.map((record) =>
    new Date(record.occurred_at).toLocaleString("zh-TW", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  );
  const uniqueLabels = Array.from(new Set(labels));
  const label = uniqueLabels.length === 1
    ? uniqueLabels[0]
    : `${uniqueLabels[0]} 等 ${uniqueLabels.length} 個時間`;
  return boundDisplayText(label, 80);
}

function recordDateDisplay(value?: string) {
  if (!value) {
    return "尚無";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "尚無";
  }
  return boundDisplayText(date.toLocaleDateString(), 40);
}

function recordTimeDisplay(value?: string) {
  if (!value) {
    return "尚無";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "尚無";
  }
  return boundDisplayText(
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }),
    40
  );
}

function recordListDisplayItem(record: RecordItem, keyPrefix = "record") {
  const typeLabel = boundDisplayText(recordTypeLabel(record.record_type), 80);
  const payloadSummary = boundDisplayText(
    displayPayload(record.record_type, record.payload_json),
    maxDisplayDetailTextLength
  );
  const timeLabel = boundDisplayText(recordTimeDisplay(record.occurred_at), 40);
  return {
    key: `${keyPrefix}-${boundIdentifier(record.id)}`,
    record,
    icon: boundDisplayText(recordTypeIcon(record.record_type), 4),
    typeLabel,
    payloadSummary,
    timeLabel,
    accessibilityLabel: boundDisplayText(`查看${typeLabel}紀錄：${payloadSummary}，時間 ${timeLabel}`, maxDisplayDetailTextLength)
  };
}

function recordDetailDisplayItem(record: RecordItem) {
  const listItem = recordListDisplayItem(record, "selected");
  return {
    ...listItem,
    dateLabel: boundDisplayText(recordDateDisplay(record.occurred_at), 40),
    dateTimeLabel: boundDisplayText(recordDateTimeDisplay(record.occurred_at), 80),
    sourceLabel: recordSourceDisplay(record.source),
    exerciseSummary:
      record.record_type === "exercise"
        ? boundDisplayText(displayPayload("exercise", record.payload_json), maxDisplayDetailTextLength)
        : "無",
    medicationSummary:
      record.record_type === "medication"
        ? boundDisplayText(displayPayload("medication", record.payload_json), maxDisplayDetailTextLength)
        : "無",
    detailRows: recordPayloadDetailRows(record.record_type, record.payload_json).map((row) => ({
      label: boundDisplayText(row.label, 40),
      value: boundDisplayText(row.value, maxDisplayDetailTextLength)
    }))
  };
}

function manualRecordConfirmDisplayItem(
  recordType: ManualRecordType,
  payload: Record<string, unknown> | null,
  date: string,
  time: string
) {
  return {
    icon: boundDisplayText(recordTypeIcon(recordType), 4),
    typeLabel: boundDisplayText(recordTypeLabel(recordType), 80),
    payloadSummary:
      payload === null
        ? "尚未完成必填欄位"
        : boundDisplayText(displayPayload(recordType, payload), maxDisplayDetailTextLength),
    sourceLine: boundDisplayText(`${date} ${time} · source: manual`, maxDisplayDetailTextLength)
  };
}

function recordDateTimeDisplay(value?: string) {
  if (!value) {
    return "尚未選擇紀錄";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "尚未選擇紀錄";
  }
  return boundDisplayText(date.toLocaleString(), 80);
}

function recordSourceDisplay(value?: string) {
  return boundDisplayText(value || "尚無", 40);
}

function glucoseTimingLabel(value: unknown) {
  if (value === "fasting") {
    return "空腹";
  }
  if (value === "before_meal") {
    return "飯前";
  }
  if (value === "after_meal") {
    return "飯後";
  }
  if (value === "bedtime") {
    return "睡前";
  }
  return "未指定";
}

function normalizedGlucoseTiming(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isBeforeMealGlucoseTiming(value: unknown) {
  const timing = normalizedGlucoseTiming(value);
  return timing === "fasting" || timing === "before_meal" || timing === "before-meal" || timing === "before";
}

function isAfterMealGlucoseTiming(value: unknown) {
  const timing = normalizedGlucoseTiming(value);
  return timing === "after_meal" || timing === "after-meal" || timing === "after";
}

function mealTypeLabel(value: unknown) {
  if (value === "breakfast") {
    return "早餐";
  }
  if (value === "lunch") {
    return "午餐";
  }
  if (value === "dinner") {
    return "晚餐";
  }
  if (value === "snack") {
    return "點心";
  }
  return "未指定";
}

function foodItemsLabel(value: unknown) {
  if (!Array.isArray(value)) {
    return "未填寫";
  }
  const items = value
    .slice(0, maxListItems)
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "";
      }
      const candidate = item as Record<string, unknown>;
      return [displayTextValue(candidate.name, 40), displayTextValue(candidate.amount, 30)]
        .filter(Boolean)
        .join(" ");
    })
    .filter(Boolean);
  return items.length > 0 ? boundDisplayText(items.join("、"), maxDisplayDetailTextLength) : "未填寫";
}

function recordPayloadDetailRows(recordType: string, payload: Record<string, unknown>) {
  if (recordType === "glucose") {
    const unit = displayTextValue(payload.unit, 20) || "mg/dL";
    return [
      { label: "狀態", value: glucoseTimingLabel(payload.meal_timing) },
      {
        label: "數值",
        value: payload.value === undefined ? "未填寫" : `${boundDisplayText(String(payload.value), 20)} ${unit}`
      },
      { label: "備註", value: displayTextValue(payload.note, maxDisplayDetailTextLength) || "無" }
    ];
  }

  if (recordType === "meal") {
    return [
      { label: "餐別", value: mealTypeLabel(payload.meal_type) },
      { label: "飲食內容", value: foodItemsLabel(payload.food_items) },
      { label: "備註", value: displayTextValue(payload.note, maxDisplayDetailTextLength) || "無" }
    ];
  }

  if (recordType === "exercise") {
    return [
      { label: "運動", value: displayTextValue(payload.activity, maxDisplayDetailTextLength) || "未填寫" },
      {
        label: "時長",
        value: payload.minutes === undefined ? "未填寫" : `${boundDisplayText(String(payload.minutes), 20)} 分鐘`
      },
      { label: "備註", value: displayTextValue(payload.note, maxDisplayDetailTextLength) || "無" }
    ];
  }

  if (recordType === "medication") {
    return [
      { label: "用藥", value: displayTextValue(payload.name, maxDisplayDetailTextLength) || "未填寫" },
      {
        label: "劑量",
        value:
          displayTextValue(payload.dose, maxDisplayDetailTextLength) ||
          displayTextValue(payload.dose_text, maxDisplayDetailTextLength) ||
          "未填寫"
      },
      { label: "備註", value: displayTextValue(payload.note, maxDisplayDetailTextLength) || "無" }
    ];
  }

  if (recordType === "note") {
    const tags = Array.isArray(payload.tags)
      ? payload.tags
          .slice(0, maxListItems)
          .filter((tag): tag is string => typeof tag === "string")
          .map((tag) => boundDisplayText(tag, 40))
          .join("、")
      : "";
    return [
      { label: "類型", value: displayTextValue(payload.kind, maxDisplayDetailTextLength) || "未填寫" },
      { label: "標籤", value: boundDisplayText(tags, maxDisplayDetailTextLength) || "無" }
    ];
  }

  return [{ label: "payload", value: displayJsonPayload(payload) }];
}

function emptyRecordEditFields(): RecordEditFields {
  return {
    glucoseValue: "",
    glucoseUnit: "mg/dL",
    glucoseTiming: "unknown",
    mealType: "unknown",
    foodItems: "",
    exerciseActivity: "",
    exerciseMinutes: "",
    medicationName: "",
    medicationDose: "",
    noteKind: "",
    noteTags: "",
    fallbackJson: "{}"
  };
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function displayTextValue(value: unknown, maxLength = maxDisplayTextLength) {
  return boundDisplayText(textValue(value), maxLength);
}

function displayJsonPayload(payload: Record<string, unknown>) {
  try {
    return boundDisplayText(JSON.stringify(payload), maxDisplayDetailTextLength);
  } catch {
    return "payload 無法顯示";
  }
}

function recordPayloadToEditFields(record: { record_type: string; payload_json: Record<string, unknown> }): RecordEditFields {
  const fields = emptyRecordEditFields();
  const payload = record.payload_json;
  fields.fallbackJson = boundRecordEditField("fallbackJson", JSON.stringify(payload, null, 2));

  if (record.record_type === "glucose") {
    fields.glucoseValue = boundRecordEditField(
      "glucoseValue",
      payload.value === undefined || payload.value === null ? "" : String(payload.value)
    );
    fields.glucoseUnit = boundRecordEditField("glucoseUnit", textValue(payload.unit) || "mg/dL");
    fields.glucoseTiming = boundRecordEditField("glucoseTiming", textValue(payload.meal_timing) || "unknown");
  }

  if (record.record_type === "meal") {
    fields.mealType = boundRecordEditField("mealType", textValue(payload.meal_type) || "unknown");
    if (Array.isArray(payload.food_items)) {
      fields.foodItems = boundRecordEditField(
        "foodItems",
        payload.food_items
          .slice(0, maxListItems)
        .map((item) => {
          if (!item || typeof item !== "object") {
            return "";
          }
          const candidate = item as Record<string, unknown>;
          const name = textValue(candidate.name);
          const amount = textValue(candidate.amount);
          return [name, amount].filter(Boolean).join(" ");
        })
        .filter(Boolean)
          .join("、")
      );
    }
  }

  if (record.record_type === "exercise") {
    fields.exerciseActivity = boundRecordEditField("exerciseActivity", textValue(payload.activity));
    fields.exerciseMinutes = boundRecordEditField(
      "exerciseMinutes",
      payload.minutes === undefined || payload.minutes === null ? "" : String(payload.minutes)
    );
  }

  if (record.record_type === "medication") {
    fields.medicationName = boundRecordEditField("medicationName", textValue(payload.name));
    fields.medicationDose = boundRecordEditField(
      "medicationDose",
      textValue(payload.dose) || textValue(payload.dose_text)
    );
  }

  if (record.record_type === "note") {
    fields.noteKind = boundRecordEditField("noteKind", textValue(payload.kind));
    fields.noteTags = boundRecordEditField(
      "noteTags",
      Array.isArray(payload.tags)
        ? payload.tags
            .slice(0, maxListItems)
            .filter((tag): tag is string => typeof tag === "string")
            .join("、")
        : ""
    );
  }

  return fields;
}

function splitListText(value: string) {
  return value
    .split(/[、,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxListItems);
}

function isTooLong(value: string, maxLength = maxFormTextLength) {
  return value.trim().length > maxLength;
}

function boundNativeDebugInput(value: string) {
  return value.slice(0, maxNativeDebugInputLength);
}

function countNumericValues(value: string) {
  return value.match(/\d+(?:\.\d+)?/g)?.length ?? 0;
}

function validateTranscriptForParser(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "請先輸入文字";
  }
  if (normalized.length > maxTranscriptTextLength) {
    return `文字過長，請縮短到 ${maxTranscriptTextLength} 字內，或分批整理`;
  }
  if (countNumericValues(normalized) > maxTranscriptNumericValues) {
    return "數字太多，請分批整理，避免 parser 成本過高";
  }
  return null;
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function formatLocalDateInput(value: Date) {
  return `${value.getFullYear()}-${padDatePart(value.getMonth() + 1)}-${padDatePart(value.getDate())}`;
}

function formatLocalTimeInput(value: Date) {
  return `${padDatePart(value.getHours())}:${padDatePart(value.getMinutes())}`;
}

function boundDateInputText(value: string) {
  return value.slice(0, maxDateInputLength);
}

function boundTimeInputText(value: string) {
  return value.slice(0, maxTimeInputLength);
}

function boundStoreSearchText(value: string) {
  return value.slice(0, maxStoreSearchTextLength);
}

function boundUiMessage(value: string) {
  return value.slice(0, maxUiMessageLength);
}

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string) {
  return value.slice(0, maxIdentifierTextLength);
}

function boundAccount(value: Account): Account {
  return {
    id: boundIdentifier(value.id),
    email: boundDisplayText(value.email, maxEmailTextLength),
    display_name: boundDisplayText(value.display_name)
  };
}

function boundProfile(value: Profile): Profile {
  return {
    id: boundIdentifier(value.id),
    account_id: boundIdentifier(value.account_id),
    display_name: boundDisplayText(value.display_name),
    relationship: boundDisplayText(value.relationship, 40)
  };
}

function boundProfiles(value: Profile[]) {
  return value.slice(0, maxMobileProfiles).map(boundProfile);
}

function boundAuthTokenResponse(value: AuthTokenResponse): AuthTokenResponse | null {
  const accessToken = value.access_token.trim();
  const refreshToken = value.refresh_token.trim();
  const expiresIn = clampNumber(value.expires_in, 1, 86_400);
  if (
    !accessToken ||
    !refreshToken ||
    accessToken.length > authAccessTokenMaxLength ||
    refreshToken.length > authRefreshTokenMaxLength
  ) {
    return null;
  }
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: value.token_type === "bearer" ? "bearer" : undefined,
    expires_in: expiresIn
  };
}

function boundRefreshTokenForRequest(value: string) {
  const token = value.trim();
  if (!token || token.length > authRefreshTokenMaxLength) {
    return "";
  }
  return token;
}

function boundOidcProviderForRequest(value: string): OidcLoginProvider | "" {
  const provider = value.trim().toLowerCase().slice(0, maxOidcProviderLength);
  if (provider === "apple" || provider === "google" || provider === "email") {
    return provider;
  }
  return "";
}

function boundOidcIdTokenForRequest(value: string) {
  const token = value.trim();
  if (!token || token.length > maxOidcIdTokenLength || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    return "";
  }
  return token;
}

function boundOidcNonceForRequest(value: string) {
  const nonce = value.trim();
  if (!nonce || nonce.length < 16 || nonce.length > maxOidcNonceLength || !/^[A-Za-z0-9._~+-]+$/.test(nonce)) {
    return "";
  }
  return nonce;
}

function boundDeviceFingerprintForRequest(value: string | null | undefined) {
  const fingerprint = (value ?? "").trim();
  if (!fingerprint) {
    return undefined;
  }
  return fingerprint.slice(0, maxDeviceFingerprintLength);
}

function authSessionDisplayItem(value: AuthSessionItem, index: number) {
  const id = boundIdentifier(value.id);
  const boundedIndex = clampNumber(index + 1, 1, maxMobileCountValue);
  return {
    key: `auth-session-${boundedIndex}-${id.slice(0, 12)}`,
    title: boundDisplayText(`Session ${boundedIndex}`, maxDisplayTextLength),
    copy: boundDisplayText(
      `建立 ${recordDateTimeDisplay(value.created_at)} · 到期 ${recordDateTimeDisplay(value.expires_at)}`,
      maxDisplayDetailTextLength
    ),
    statusLabel: boundDisplayText(value.has_device_fingerprint ? "裝置已識別" : "無裝置指紋", 40),
    lastUsed: boundDisplayText(
      value.last_used_at ? `最後使用 ${recordDateTimeDisplay(value.last_used_at)}` : "尚無最後使用時間",
      maxDisplayDetailTextLength
    )
  };
}

function boundAiModelOption(value: AiModelOption): AiModelOption {
  return {
    id: boundIdentifier(value.id),
    label: boundDisplayText(value.label),
    kind: value.kind,
    runtime: value.runtime,
    available: Boolean(value.available),
    description: boundDisplayText(value.description, maxDisplayDetailTextLength)
  };
}

function boundAiModelOptions(value: AiModelOptions): AiModelOptions {
  return {
    stt_models: value.stt_models.slice(0, maxMobileModelOptions).map(boundAiModelOption),
    llm_models: value.llm_models.slice(0, maxMobileModelOptions).map(boundAiModelOption)
  };
}

function boundDownloadedModel(value: DownloadedModel): DownloadedModel {
  return {
    kind: value.kind,
    fileName: boundDisplayText(value.fileName),
    uri: boundNativeDebugInput(value.uri),
    exists: Boolean(value.exists),
    size: typeof value.size === "number" && Number.isFinite(value.size) && value.size >= 0 ? value.size : undefined,
    md5: value.md5 ? boundIdentifier(value.md5) : undefined
  };
}

function boundDownloadedModels(value: DownloadedModel[]) {
  return value.slice(0, maxDownloadedModelRows).map(boundDownloadedModel);
}

function downloadedModelDisplayLabel(value: DownloadedModel) {
  const fileName = boundDisplayText(value.fileName || "model file", 80);
  const checksum = value.md5 ? ` · md5 ${boundIdentifier(value.md5).slice(0, 12)}` : "";
  return boundUiMessage(`${value.kind} · ${fileName}${checksum}`);
}

function downloadedWhisperModelDisplayItem(value: DownloadedModel) {
  const fileName = boundDisplayText(value.fileName || "whisper model", 80);
  const checksum = value.md5 ? ` · md5 ${boundIdentifier(value.md5).slice(0, 12)}` : "";
  const label = boundDisplayText(fileName, maxDisplayTextLength);
  const summary = boundDisplayText(`Whisper · ${fileName}${checksum}`, maxDisplayDetailTextLength);
  return {
    sourceUri: boundNativeDebugInput(value.uri),
    label,
    summary,
    selectedLabel: boundDisplayText("使用中", 24),
    accessibilityLabel: boundDisplayText(`選擇本機 Whisper 模型：${fileName}，只用於本機錄音轉文字`, maxDisplayDetailTextLength)
  };
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

function futureModuleCardDisplayItem(value: FutureModuleCard) {
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

function selectedFutureModuleDisplayItem(value: FutureModuleCard | null) {
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

function boundAchievementProgress(value: number, maxValue = maxMobileCountValue) {
  return clampNumber(value, 0, maxValue);
}

function achievementDisplayItem(value: AchievementItem) {
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

function achievementItemFromApi(value: AchievementApiItem): AchievementItem {
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

function achievementUnlockDisplayDate(value?: string | null) {
  if (!value) {
    return boundDisplayText("尚未保存解鎖時間", maxDisplayTextLength);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return boundDisplayText("解鎖時間格式無法顯示", maxDisplayTextLength);
  }
  return boundDisplayText(`解鎖於 ${formatLocalDateInput(parsed)}`, maxDisplayTextLength);
}

function storeProductDisplayItem(value: StoreProduct) {
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

function mobileFoodCategoryFromApi(value: string): FoodCommunityCategory {
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

function apiFoodCategoryFromMobile(value: FoodCommunityCategory): FoodCommunityApiCategory {
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

function foodCommunityItemFromApi(value: FoodCommunityApiItem): FoodCommunityItem {
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

function storeCategoryFromApi(value: StoreApiRewardCategory): StoreCategory {
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

function storeProductFromApi(value: StoreApiReward): StoreProduct {
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

function storeRedemptionDisplayItem(value: StoreApiRedemption) {
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

function emptyFoodCommunityShareFields(): FoodCommunityShareFields {
  return {
    foodName: "",
    beforeGlucose: "",
    afterGlucose: "",
    note: ""
  };
}

function boundCommunityPublicSettings(value: CommunityPublicSettings): CommunityPublicSettings {
  return {
    display_name: boundDisplayText(value.display_name || "糖友", maxDisplayTextLength),
    leaderboard_opt_in: Boolean(value.leaderboard_opt_in)
  };
}

function communityLeaderboardLabel(value: CommunityLeaderboardType) {
  if (value === "contribution") {
    return "貢獻度排行";
  }
  if (value === "food_tester") {
    return "食物測試達人排行";
  }
  return "分享次數排行";
}

function communityLeaderboardScoreLabel(value: CommunityLeaderboardType, score: number) {
  const boundedScore = clampNumber(score, 0, maxMobileCountValue);
  if (value === "contribution") {
    return `${boundedScore} 點`;
  }
  if (value === "food_tester") {
    return `${boundedScore} 種食物`;
  }
  return `${boundedScore} 次分享`;
}

function communityLeaderboardDisplaySection(value: CommunityLeaderboardApiResponse): CommunityLeaderboardDisplaySection {
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

function settingsRowDisplayItem(value: SettingsRow) {
  const label = boundDisplayText(value.label || "設定", maxDisplayTextLength);
  const helper = value.helper ? boundDisplayText(value.helper, maxDisplayDetailTextLength) : "";
  return {
    ...value,
    id: boundIdentifier(value.id),
    label,
    icon: boundDisplayText(value.icon || "•", 4),
    helper,
    accessibilityLabel: boundDisplayText(`前往${label}設定：${helper || "查看設定狀態"}`, maxDisplayDetailTextLength)
  };
}

function tutorialStepDisplayItem(value: readonly string[]) {
  return {
    icon: boundDisplayText(value[0] || "•", 4),
    title: boundDisplayText(value[1] || "教學步驟", maxDisplayTextLength),
    description: boundDisplayText(value[2] || "尚未設定教學說明。", maxDisplayDetailTextLength)
  };
}

function previewTupleDisplayItem(value: readonly [string, string, string]) {
  const title = boundDisplayText(value[0] || "項目", maxDisplayTextLength);
  return {
    title,
    statusLabel: boundDisplayText(value[1] || "未設定", 40),
    copy: boundDisplayText(value[2] || "尚未設定說明。", maxDisplayDetailTextLength),
    icon: boundDisplayText(title[0] || "•", 4)
  };
}

function authProviderPreviewDisplayItem(value: (typeof authProviderPreviews)[number]) {
  const item = previewTupleDisplayItem([value.title, value.status, value.copy]);
  const provider = boundOidcProviderForRequest(value.provider);
  return {
    ...item,
    provider,
    accessibilityLabel: boundDisplayText(`查看${item.title}登入整合狀態，不保存 provider token`, maxDisplayDetailTextLength),
    actionStatus: boundUiMessage(
      `${item.title} 原生 provider callback 尚未接入；callback 拿到 id_token 後會走 /auth/oidc-login、SecureStore 與 session revoke 流程。`
    )
  };
}

function sessionManagementPreviewDisplayItem(value: readonly [string, string, string]) {
  const item = previewTupleDisplayItem(value);
  return {
    ...item,
    accessibilityLabel: boundDisplayText(`查看${item.title}session 管理狀態，不顯示 raw token`, maxDisplayDetailTextLength),
    actionStatus: boundUiMessage(
      `${item.title} 尚未啟用；需完成 server-side session list、refresh token revoke、裝置識別與安全儲存清除後才可操作。`
    )
  };
}

function boundaryMetricDisplayItem(value: readonly [string, string]) {
  return {
    label: boundDisplayText(value[0] || "狀態", 60),
    value: boundDisplayText(value[1] || "未設定", 80)
  };
}

function metricDisplayItem(value: readonly [string, string]) {
  return {
    label: boundDisplayText(value[0] || "指標", 60),
    value: boundDisplayText(value[1] || "尚無", 80)
  };
}

function detailPairDisplayItem(value: readonly [string, string]) {
  return {
    label: boundDisplayText(value[0] || "項目", 60),
    value: boundDisplayText(value[1] || "尚未設定", maxDisplayDetailTextLength)
  };
}

function reminderPreviewDisplayItem(value: readonly [string, string, string, string]) {
  return {
    title: boundDisplayText(value[0] || "提醒", maxDisplayTextLength),
    time: boundDisplayText(value[1] || "尚未設定", 60),
    copy: boundDisplayText(value[2] || "尚未設定提醒說明。", maxDisplayDetailTextLength),
    statusLabel: boundDisplayText(value[3] || "未設定", 40)
  };
}

function optionDisplayItem(value: string) {
  const label = boundDisplayText(value || "選項", 60);
  return {
    value: boundDisplayText(value || "unknown", 40),
    label,
    accessibilityLabel: boundDisplayText(`選擇${label}選項`, maxDisplayTextLength)
  };
}

function valueLabelDisplayItem(value: readonly [string, string]) {
  const label = boundDisplayText(value[1] || "選項", 60);
  return {
    value: boundDisplayText(value[0] || "unknown", 40),
    label,
    accessibilityLabel: boundDisplayText(`選擇${label}選項`, maxDisplayTextLength)
  };
}

function manualRecordTypeDisplayItem(value: { id: ManualRecordType; label: string }) {
  const label = boundDisplayText(value.label || "紀錄", 60);
  return {
    value: value.id,
    label,
    accessibilityLabel: boundDisplayText(`選擇${label}紀錄類型，不呼叫 AI 或 parser`, maxDisplayDetailTextLength)
  };
}

function historyDetailModeDisplayItem(value: { id: HistoryDetailMode; label: string; accessibilityCopy: string }) {
  const label = boundDisplayText(value.label || "紀錄模式", 60);
  return {
    value: value.id,
    label,
    accessibilityLabel: boundDisplayText(value.accessibilityCopy || `查看${label}`, maxDisplayDetailTextLength)
  };
}

function historyCalendarDayDisplayItem(date: Date, selectedDateKey: string, recordsByDate: Map<string, RecordItem[]>) {
  const dateKey = formatLocalDateInput(date);
  const recordCount = clampNumber(recordsByDate.get(dateKey)?.length ?? 0, 0, maxMobileCountValue);
  const dayLabel = boundDisplayText(String(date.getDate()), 4);
  return {
    key: `history-calendar-${boundIdentifier(dateKey)}`,
    value: dateKey,
    dayLabel,
    recordCount,
    hasRecords: recordCount > 0,
    isSelected: dateKey === selectedDateKey,
    accessibilityLabel: boundDisplayText(
      `${dateKey}，${recordCount > 0 ? `有 ${recordCount} 筆紀錄` : "沒有紀錄"}，點擊查看日期`,
      maxDisplayDetailTextLength
    )
  };
}

function historyRawRecordDisplayItem(record: RecordItem, index: number) {
  const item = recordListDisplayItem(record, `history-raw-${index}`);
  const sourceText = record.metadata_json?.source_text;
  const hasSourceText = typeof sourceText === "string" && sourceText.trim().length > 0;
  const rawText = hasSourceText
    ? boundDisplayText(sourceText, maxDisplayDetailTextLength)
    : "尚無原始片段；此筆紀錄只保留結構化資料。";
  return {
    ...item,
    sourceStatusLabel: boundDisplayText(hasSourceText ? "原始片段" : "僅結構化", 40),
    rawText
  };
}

function analysisRangeDisplayItem(value: { id: AnalysisRange; label: string }) {
  const label = boundDisplayText(value.label || "時間範圍", 60);
  return {
    value: value.id,
    label,
    accessibilityLabel: boundDisplayText(`切換分析範圍：${label}，同步 backend bounded report`, maxDisplayDetailTextLength)
  };
}

function storeCategoryDisplayItem(value: { id: StoreCategory; label: string }) {
  const label = boundDisplayText(value.label || "分類", 60);
  return {
    value: value.id,
    label,
    accessibilityLabel: boundDisplayText(`切換商城分類：${label}，不建立訂單或付款`, maxDisplayDetailTextLength)
  };
}

function foodCommunityCategoryDisplayItem(value: { id: FoodCommunityCategory; label: string; foodCount?: number; sampleFoods?: string[] }) {
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

function foodCommunityShareDisplayItem(value: FoodCommunityShare) {
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

function foodCommunityItemDisplayItem(value: FoodCommunityItem) {
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
    accessibilityLabel: boundDisplayText(`查看${title}食物升糖資料頁，只顯示本機預覽`, maxDisplayDetailTextLength),
    metricSummary: boundDisplayText(
      `${shareCount} 人分享，平均上升 ${averageRise} mg/dL`,
      maxDisplayDetailTextLength
    )
  };
}

function primaryTabAccessibilityLabel(label: string) {
  const safeLabel = boundDisplayText(label || "分頁", 60);
  return boundDisplayText(`前往${safeLabel}分頁，只切換 App 內頁面`, maxDisplayDetailTextLength);
}

function menuScreenDisplayItem(value: { id: AppScreen; label: string; icon: string }) {
  const label = boundDisplayText(value.label || "功能", 60);
  return {
    target: value.id,
    label,
    icon: boundDisplayText(value.icon || "•", 4),
    accessibilityLabel: boundDisplayText(`前往${label}`, maxDisplayTextLength)
  };
}

function visualSmokeRouteJumpDisplayItem(value: { id: AppScreen; label: string }) {
  const label = boundDisplayText(value.label || "頁面", maxDisplayTextLength);
  return {
    target: value.id,
    label,
    accessibilityLabel: boundDisplayText(`Visual smoke 前往${label}`, maxDisplayTextLength)
  };
}

function comparisonDisplayItem(value: readonly [string, string, string]) {
  return {
    feature: boundDisplayText(value[0] || "功能", 80),
    trial: boundDisplayText(value[1] || "未設定", 80),
    annual: boundDisplayText(value[2] || "未設定", 80)
  };
}

function destinationCardDisplayItem(value: readonly string[]) {
  const label = boundDisplayText(value[1] || "前往頁面", maxDisplayTextLength);
  return {
    icon: boundDisplayText(value[0] || "•", 4),
    label,
    helper: boundDisplayText(value[2] || "查看相關頁面。", maxDisplayDetailTextLength),
    accessibilityLabel: boundDisplayText(`前往${label}`, maxDisplayTextLength),
    target: value[3] as AppScreen
  };
}

function resultChecklistItem(value: string) {
  return boundDisplayText(value, maxDisplayDetailTextLength);
}

function boundMetadataValue(value: unknown): unknown {
  if (typeof value === "string") {
    return boundDisplayText(value, maxDisplayDetailTextLength);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "boolean" || value === null) {
    return value;
  }
  return undefined;
}

function boundMetadata(metadata?: Record<string, unknown>, preserveSourceText = false) {
  if (!metadata) {
    return undefined;
  }
  const sanitized = preserveSourceText
    ? {
        ...stripRawTextMetadata(metadata),
        ...(typeof metadata.source_text === "string"
          ? { source_text: boundDisplayText(metadata.source_text, maxDisplayDetailTextLength) }
          : {})
      }
    : stripRawTextMetadata(metadata);
  if (!sanitized) {
    return undefined;
  }
  const entries = Object.entries(sanitized)
    .slice(0, maxListItems)
    .map(([key, value]) => [boundIdentifier(key), boundMetadataValue(value)] as const)
    .filter(([, value]) => value !== undefined);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function isRawPayloadKey(key: string) {
  const normalized = key.toLowerCase();
  return [
    "transcript",
    "normalized_text",
    "raw_text",
    "raw_prompt",
    "raw_model_output",
    "source_text",
    "decision_trace",
    "rawtext",
    "rawprompt",
    "rawmodeloutput",
    "sourcetext",
    "decisiontrace"
  ].includes(normalized);
}

function boundRecordPayloadValue(value: unknown, depth = 0): unknown {
  if (typeof value === "string") {
    return boundDisplayText(value, maxDisplayDetailTextLength);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? clampNumber(value, -maxMobileCountValue, maxMobileCountValue) : undefined;
  }
  if (typeof value === "boolean" || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    if (depth >= 2) {
      return undefined;
    }
    const items = value
      .slice(0, maxListItems)
      .map((item) => boundRecordPayloadValue(item, depth + 1))
      .filter((item) => item !== undefined);
    return items.length > 0 ? items : undefined;
  }
  if (typeof value === "object" && value !== null) {
    if (depth >= 2) {
      return undefined;
    }
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !isRawPayloadKey(key))
      .slice(0, maxListItems)
      .map(([key, item]) => [boundIdentifier(key), boundRecordPayloadValue(item, depth + 1)] as const)
      .filter(([, item]) => item !== undefined);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }
  return undefined;
}

function boundRecordPayload(recordType: string, payload: Record<string, unknown>): Record<string, unknown> {
  const bounded = boundRecordPayloadValue(payload);
  const result = bounded && typeof bounded === "object" && !Array.isArray(bounded)
    ? (bounded as Record<string, unknown>)
    : {};
  if (recordType === "glucose" && typeof result.value === "number") {
    result.value = clampNumber(result.value, 0, maxMobileGlucoseValue);
  }
  if (recordType === "exercise" && typeof result.minutes === "number") {
    result.minutes = clampNumber(result.minutes, 0, maxMobileVoiceSeconds);
  }
  return result;
}

function boundRecordItem(value: RecordItem): RecordItem {
  const recordType = boundIdentifier(value.record_type);
  return {
    ...value,
    id: boundIdentifier(value.id),
    profile_id: boundIdentifier(value.profile_id),
    record_type: recordType,
    occurred_at: boundDisplayText(value.occurred_at, 40),
    payload_json: boundRecordPayload(recordType, value.payload_json),
    metadata_json: boundMetadata(value.metadata_json) ?? {},
    source: boundDisplayText(value.source, 40),
    created_at: boundDisplayText(value.created_at, 40)
  };
}

function mergeRecordsByCursorOrder(current: RecordItem[], incoming: RecordItem[]) {
  const byId = new Map<string, RecordItem>();
  for (const record of [...current, ...incoming].map(boundRecordItem)) {
    if (record.id) {
      byId.set(record.id, record);
    }
  }
  return Array.from(byId.values())
    .sort((left, right) => {
      const occurredDelta = Date.parse(right.occurred_at) - Date.parse(left.occurred_at);
      if (Number.isFinite(occurredDelta) && occurredDelta !== 0) {
        return occurredDelta;
      }
      const createdDelta = Date.parse(right.created_at) - Date.parse(left.created_at);
      return Number.isFinite(createdDelta) ? createdDelta : 0;
    })
    .slice(0, maxMobileRecordCacheLimit);
}

function boundRecordsList(value: RecordItem[], limit = maxMobileRecordCacheLimit) {
  return value.slice(0, limit).map(boundRecordItem);
}

function boundPendingRecord(value: PendingRecord): PendingRecord {
  return {
    ...value,
    profile_id: boundIdentifier(value.profile_id),
    record_type: boundIdentifier(value.record_type),
    occurred_at: boundDisplayText(value.occurred_at, 40),
    metadata_json: boundMetadata(value.metadata_json, true),
    source: boundDisplayText(value.source, 40),
    confidence:
      typeof value.confidence === "number" && Number.isFinite(value.confidence)
        ? Math.max(0, Math.min(1, value.confidence))
        : undefined,
    decision_trace: value.decision_trace
      ? boundDisplayText(value.decision_trace, maxDisplayDetailTextLength)
      : undefined
  };
}

function boundTranscriptSegment(value: TranscriptSegment): TranscriptSegment {
  return {
    segment_id: boundIdentifier(value.segment_id),
    segment_type: boundDisplayText(value.segment_type, 40),
    source_text: boundDisplayText(value.source_text, maxDisplayDetailTextLength),
    confidence: Number.isFinite(value.confidence) ? Math.max(0, Math.min(1, value.confidence)) : 0
  };
}

function boundRejectedEvent(value: RejectedEvent): RejectedEvent {
  return {
    segment_id: boundIdentifier(value.segment_id),
    source_text: boundDisplayText(value.source_text, maxDisplayDetailTextLength),
    reason: boundDisplayText(value.reason, 80)
  };
}

function boundParsePreviewResponse(value: ParsePreviewResponse): ParsePreviewResponse {
  return {
    transcript: "",
    normalized_text: "",
    stt_model_id: boundIdentifier(value.stt_model_id),
    llm_model_id: boundIdentifier(value.llm_model_id),
    segments: value.segments.slice(0, maxMobilePreviewSegments).map(boundTranscriptSegment),
    records: value.records.slice(0, maxMobilePreviewRecords).map(boundPendingRecord),
    rejected_events: value.rejected_events.slice(0, maxMobileRejectedEvents).map(boundRejectedEvent)
  };
}

function visualSmokeDemoDate(hoursAgo: number) {
  const value = new Date(Date.now() - clampNumber(hoursAgo, 1, 72) * 60 * 60 * 1000);
  value.setSeconds(0, 0);
  return value;
}

function visualSmokeDemoOccurredAt() {
  const value = visualSmokeDemoDate(3);
  value.setMinutes(10, 0, 0);
  return value.toISOString();
}

function visualSmokeDemoIsoAt(hoursAgo: number, minute: number) {
  const value = visualSmokeDemoDate(hoursAgo);
  value.setMinutes(minute, 0, 0);
  return value.toISOString();
}

function visualSmokeDemoRecord(): RecordItem {
  return boundRecordItem({
    id: "visual-smoke-record-001",
    profile_id: "visual-smoke-profile",
    record_type: "glucose",
    occurred_at: visualSmokeDemoOccurredAt(),
    payload_json: {
      value: 138,
      unit: "mg/dL",
      meal_timing: "fasting"
    },
    metadata_json: {},
    source: "visual_smoke_demo",
    created_at: visualSmokeDemoIsoAt(3, 12)
  });
}

function visualSmokeDemoRecords(): RecordItem[] {
  return boundRecordsList([
    visualSmokeDemoRecord(),
    {
      id: "visual-smoke-record-002",
      profile_id: "visual-smoke-profile",
      record_type: "meal",
      occurred_at: visualSmokeDemoIsoAt(2, 30),
      payload_json: {
        meal_type: "breakfast",
        food_items: [{ name: "水煮蛋" }, { name: "無糖豆漿" }]
      },
      metadata_json: {},
      source: "visual_smoke_demo",
      created_at: visualSmokeDemoIsoAt(2, 32)
    },
    {
      id: "visual-smoke-record-003",
      profile_id: "visual-smoke-profile",
      record_type: "exercise",
      occurred_at: visualSmokeDemoIsoAt(1, 50),
      payload_json: {
        activity: "步行",
        minutes: 25
      },
      metadata_json: {},
      source: "visual_smoke_demo",
      created_at: visualSmokeDemoIsoAt(1, 52)
    }
  ]);
}

function visualSmokeDemoPreview(): ParsePreviewResponse {
  return boundParsePreviewResponse({
    transcript: "",
    normalized_text: "",
    stt_model_id: "visual-smoke-stt",
    llm_model_id: "visual-smoke-parser",
    segments: [
      {
        segment_id: "visual-smoke-segment-001",
        segment_type: "glucose",
        source_text: "Visual smoke demo text only.",
        confidence: 0.99
      }
    ],
    records: [
      {
        profile_id: "visual-smoke-profile",
        record_type: "glucose",
        occurred_at: visualSmokeDemoOccurredAt(),
        payload_json: {
          value: 138,
          unit: "mg/dL",
          meal_timing: "fasting"
        },
        metadata_json: {
          source_text: "Visual smoke demo text only."
        },
        source: "visual_smoke_demo",
        confidence: 0.99,
        decision_trace: "visual-smoke-local-seed"
      }
    ],
    rejected_events: []
  });
}

function visualSmokeDemoReport(): BasicReport {
  return boundBasicReport({
    profile_id: "visual-smoke-profile",
    generated_at: visualSmokeDemoIsoAt(0, 0),
    record_count: 3,
    glucose: {
      count: 1,
      before_meal_count: 1,
      after_meal_count: 0,
      average: 138,
      minimum: 138,
      maximum: 138,
      latest_value: 138,
      latest_recorded_at: visualSmokeDemoOccurredAt()
    },
    meals: {
      count: 1
    },
    lifestyle: {
      exercise_count: 1,
      medication_count: 0,
      lifestyle_count: 1,
      note_count: 0
    }
  });
}

function visualSmokeDemoRecordEditFields(): RecordEditFields {
  return recordPayloadToEditFields(visualSmokeDemoRecord());
}

function visualSmokeNeedsPreview(screen: AppScreen | null) {
  return (
    screen === "aiReview" ||
    screen === "editPreviewRecord" ||
    screen === "aiRemoveConfirm" ||
    screen === "aiSaveConfirm" ||
    screen === "aiSaveFailure"
  );
}

function visualSmokeNeedsRecord(screen: AppScreen | null) {
  return (
    screen === "today" ||
    screen === "history" ||
    screen === "analysis" ||
    screen === "detailedReport" ||
    screen === "recordDetail" ||
    screen === "editRecord" ||
    screen === "deleteConfirm" ||
    screen === "deleteSuccess" ||
    screen === "updateSuccess" ||
    screen === "saveSuccess"
  );
}

function visualSmokeNeedsSelectedRecord(screen: AppScreen | null) {
  return (
    screen === "recordDetail" ||
    screen === "editRecord" ||
    screen === "deleteConfirm" ||
    screen === "updateSuccess" ||
    screen === "saveSuccess"
  );
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

function clampNullableNumber(value: number | null | undefined, min: number, max: number) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return clampNumber(value, min, max);
}

function boundOptionalDateTime(value?: string | null) {
  return typeof value === "string" ? boundDisplayText(value, 40) : null;
}

function boundVoiceQuota(value: VoiceQuota): VoiceQuota {
  const dailyLimit = clampNumber(value.daily_limit_seconds, 0, maxMobileVoiceSeconds);
  const used = clampNumber(value.used_seconds_today, 0, maxMobileVoiceSeconds);
  const remaining = clampNumber(value.remaining_seconds_today, 0, maxMobileVoiceSeconds);
  return {
    plan_code: boundIdentifier(value.plan_code),
    status: boundDisplayText(value.status, 40),
    trial_started_at: boundOptionalDateTime(value.trial_started_at),
    trial_ends_at: boundOptionalDateTime(value.trial_ends_at),
    referral_code: value.referral_code ? boundDisplayText(value.referral_code, 80) : null,
    preserves_intro_price: Boolean(value.preserves_intro_price),
    daily_limit_seconds: dailyLimit,
    used_seconds_today: Math.min(used, dailyLimit || used),
    remaining_seconds_today: Math.min(remaining, dailyLimit || remaining)
  };
}

function boundBasicReport(value: BasicReport): BasicReport {
  return {
    profile_id: boundIdentifier(value.profile_id),
    generated_at: boundDisplayText(value.generated_at, 40),
    record_count: clampNumber(value.record_count, 0, maxMobileCountValue),
    glucose: {
      count: clampNumber(value.glucose.count, 0, maxMobileCountValue),
      before_meal_count: clampNumber(value.glucose.before_meal_count, 0, maxMobileCountValue),
      after_meal_count: clampNumber(value.glucose.after_meal_count, 0, maxMobileCountValue),
      average: clampNullableNumber(value.glucose.average, 0, maxMobileGlucoseValue),
      minimum: clampNullableNumber(value.glucose.minimum, 0, maxMobileGlucoseValue),
      maximum: clampNullableNumber(value.glucose.maximum, 0, maxMobileGlucoseValue),
      latest_value: clampNullableNumber(value.glucose.latest_value, 0, maxMobileGlucoseValue),
      latest_recorded_at: boundOptionalDateTime(value.glucose.latest_recorded_at)
    },
    meals: {
      count: clampNumber(value.meals.count, 0, maxMobileCountValue)
    },
    lifestyle: {
      exercise_count: clampNumber(value.lifestyle.exercise_count, 0, maxMobileCountValue),
      medication_count: clampNumber(value.lifestyle.medication_count, 0, maxMobileCountValue),
      lifestyle_count: clampNumber(value.lifestyle.lifestyle_count, 0, maxMobileCountValue),
      note_count: clampNumber(value.lifestyle.note_count, 0, maxMobileCountValue)
    }
  };
}

function boundDevResetResponse(value: DevResetResponse): DevResetResponse {
  return {
    status: boundDisplayText(value.status, 40),
    deleted_counts: Object.fromEntries(
      Object.entries(value.deleted_counts)
        .slice(0, maxDevResetDeletedCountKeys)
        .map(([key, count]) => [
          boundIdentifier(key),
          clampNumber(count, 0, maxMobileCountValue)
        ])
    )
  };
}

function isSameLocalDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function localDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return formatLocalDateInput(date);
}

function formatChartDateLabel(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function startOfCurrentWeek() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - mondayOffset);
  return date;
}

function startOfCurrentMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function parseDateBoundary(value: string, edge: "start" | "end") {
  const date = new Date(`${value}T${edge === "start" ? "00:00:00.000" : "23:59:59.999"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function analysisDateBounds(range: AnalysisRange, customStart: string, customEnd: string) {
  const now = endOfToday();
  if (range === "week") {
    return { start: startOfCurrentWeek(), end: now };
  }
  if (range === "month") {
    return { start: startOfCurrentMonth(), end: now };
  }
  const start = parseDateBoundary(customStart, "start");
  const end = parseDateBoundary(customEnd, "end");
  if (start && end && start <= end) {
    return { start, end };
  }
  return { start: startOfCurrentMonth(), end: now };
}

function currentRecordStreakDays(records: RecordItem[]) {
  const recordedDays = new Set(records.map((record) => localDateKey(record.occurred_at)).filter(Boolean));
  let streak = 0;
  for (let offset = 0; offset < 366; offset += 1) {
    const day = localDateKey(daysAgo(offset));
    if (!recordedDays.has(day)) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function currentRecordTypeStreakDays(records: RecordItem[], recordType: string) {
  const recordedDays = new Set(
    records
      .filter((record) => record.record_type === recordType)
      .map((record) => localDateKey(record.occurred_at))
      .filter(Boolean)
  );
  let streak = 0;
  for (let offset = 0; offset < 366; offset += 1) {
    const day = localDateKey(daysAgo(offset));
    if (!recordedDays.has(day)) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function uniqueRecordDaysInLast(records: RecordItem[], days: number, predicate: (record: RecordItem) => boolean) {
  const start = daysAgo(days - 1);
  const now = new Date();
  const daysWithRecords = new Set<string>();
  for (const record of records) {
    const occurredAt = new Date(record.occurred_at);
    if (occurredAt >= start && occurredAt <= now && predicate(record)) {
      daysWithRecords.add(localDateKey(occurredAt));
    }
  }
  return daysWithRecords.size;
}

function longestRecordStreakDays(records: RecordItem[]) {
  const sortedDays = Array.from(
    new Set(records.map((record) => localDateKey(record.occurred_at)).filter(Boolean))
  ).sort();
  let longest = 0;
  let current = 0;
  let previousTime: number | null = null;

  for (const day of sortedDays) {
    const currentTime = new Date(`${day}T00:00:00`).getTime();
    if (previousTime === null || currentTime - previousTime === 86_400_000) {
      current += 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
    previousTime = currentTime;
  }

  return longest;
}

function yearReviewTargetYear(value: Date) {
  return value.getFullYear() - 1;
}

function nextYearReviewGenerationLabel(value: Date) {
  const nextYear = value.getMonth() === 0 && value.getDate() === 1 ? value.getFullYear() + 1 : value.getFullYear() + 1;
  return boundDisplayText(`${nextYear} 年 1 月 1 日自動產生前一年度回顧`, maxDisplayDetailTextLength);
}

function averageNumber(values: number[]) {
  if (values.length === 0) {
    return null;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function formatVoiceMinutes(seconds: number) {
  const safeSeconds = Math.max(0, Math.min(3600, seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes} 分鐘`;
  }
  return `${minutes} 分 ${remainingSeconds} 秒`;
}

function captureVoiceQuotaCopy(quota: VoiceQuota | null) {
  if (!quota) {
    return "語音額度載入後，只有接近上限時才會提醒。";
  }
  if (isVoiceQuotaLow(quota)) {
    return `今日錄音剩餘 ${formatVoiceMinutes(quota.remaining_seconds_today)}，請分段記錄或改用文字輸入。`;
  }
  return "今日錄音額度正常；接近上限 2 分鐘內才會顯示剩餘時間。";
}

function isVoiceQuotaLow(quota: VoiceQuota | null) {
  return Boolean(quota && quota.remaining_seconds_today <= voiceQuotaLowWarningThresholdSeconds);
}

function planDisplayName(planCode?: string) {
  if (planCode === "trial") {
    return "試用版";
  }
  if (planCode === "annual" || planCode === "founder_annual") {
    return "年費會員";
  }
  return "會員方案";
}

function subscriptionStatusLabel(status?: string) {
  if (status === "trialing") {
    return "試用中";
  }
  if (status === "active") {
    return "有效";
  }
  if (status === "cancelled" || status === "canceled") {
    return "已取消";
  }
  if (status === "expired") {
    return "已到期";
  }
  return "尚未載入";
}

function modelRuntimeLabel(runtime?: AiModelOption["runtime"]) {
  if (runtime === "local") {
    return "本地模型";
  }
  if (runtime === "browser") {
    return "裝置/瀏覽器";
  }
  if (runtime === "server_stub") {
    return "後端測試模型";
  }
  if (runtime === "server_api") {
    return "後端 API";
  }
  if (runtime === "cloud_disabled") {
    return "雲端停用";
  }
  return "尚未載入";
}

function rejectedReasonLabel(reason?: string) {
  const normalized = reason?.trim().toLowerCase();
  if (!normalized) {
    return "未建立原因尚未提供";
  }
  if (normalized.includes("negative")) {
    return "這句像是否定或未量測事件";
  }
  if (normalized.includes("invalid")) {
    return "內容不符合可儲存紀錄格式";
  }
  if (normalized.includes("duplicate")) {
    return "可能與既有候選重複";
  }
  if (normalized.includes("unsupported")) {
    return "目前尚未支援這類紀錄";
  }
  if (normalized.includes("unknown")) {
    return "無法判斷可儲存紀錄類型";
  }
  return boundDisplayText(normalized, 80);
}

function shortDecisionTrace(trace?: string) {
  const trimmed = trace?.trim();
  if (!trimmed) {
    return "";
  }
  return boundDisplayText(trimmed, 80);
}

function confidencePercentDisplay(value: unknown) {
  const numericValue = typeof value === "number" ? value : 0;
  return clampNumber(Math.round(numericValue * 100), 0, 100);
}

function pendingRecordSourceDisplayText(record: PendingRecord) {
  return typeof record.metadata_json?.source_text === "string"
    ? boundDisplayText(record.metadata_json.source_text, maxDisplayDetailTextLength)
    : "等待使用者確認";
}

function pendingRecordDisplayItem(record: PendingRecord, index: number, keyPrefix = "candidate") {
  const decisionTrace = shortDecisionTrace(record.decision_trace);
  const lowConfidence = (record.confidence ?? 1) < 0.7;
  const typeLabel = boundDisplayText(recordTypeLabel(record.record_type), 80);
  const payloadSummary = boundDisplayText(
    displayPayload(record.record_type, record.payload_json),
    maxDisplayDetailTextLength
  );
  return {
    key: `${keyPrefix}-${boundIdentifier(record.record_type)}-${clampNumber(index, 0, maxMobilePreviewRecords)}`,
    index,
    record,
    icon: boundDisplayText(recordTypeIcon(record.record_type), 4),
    typeLabel,
    payloadSummary,
    editAccessibilityLabel: boundDisplayText(`修改${typeLabel}候選紀錄：${payloadSummary}`, maxDisplayDetailTextLength),
    removeAccessibilityLabel: boundDisplayText(`移除${typeLabel}候選紀錄：${payloadSummary}`, maxDisplayDetailTextLength),
    sourceText: pendingRecordSourceDisplayText(record),
    confidencePercent: confidencePercentDisplay(record.confidence),
    lowConfidence,
    decisionTraceDisplayText: decisionTrace
      ? boundDisplayText(`建立理由：${decisionTrace}`, maxDisplayDetailTextLength)
      : ""
  };
}

function stripRawTextMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) {
    return undefined;
  }
  const blockedKeys = new Set([
    "transcript",
    "raw_transcript",
    "raw_text",
    "rawText",
    "original_text",
    "normalized_text",
    "evidence",
    "description"
  ]);
  const sanitized = Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !blockedKeys.has(key))
  );
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function pendingRecordForSave(record: PendingRecord): PendingRecord {
  const sanitizedMetadata = boundMetadata(record.metadata_json, true);
  return {
    ...record,
    ...(sanitizedMetadata ? { metadata_json: sanitizedMetadata } : { metadata_json: undefined })
  };
}

function createClientSaveBatchId() {
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `mobile-save-${timestamp}-${randomSuffix}`;
}

function trialDaysLeft(trialEndsAt?: string | null) {
  if (!trialEndsAt) {
    return null;
  }
  const end = new Date(trialEndsAt).getTime();
  if (Number.isNaN(end)) {
    return null;
  }
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}

function localDateTimeInputs(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return {
      date: formatLocalDateInput(now),
      time: formatLocalTimeInput(now)
    };
  }
  return {
    date: formatLocalDateInput(date),
    time: formatLocalTimeInput(date)
  };
}

function parseLocalDateTimeInput(dateText: string, timeText: string) {
  const date = dateText.trim();
  const time = timeText.trim() || "00:00";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error("請使用 YYYY-MM-DD 日期與 HH:mm 時間格式");
  }
  const parsed = new Date(`${date}T${time}:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("日期或時間格式不正確");
  }
  if (parsed.getTime() > Date.now() + maxFutureSkewMs) {
    throw new Error("紀錄時間不能是明顯未來時間");
  }
  return parsed;
}

function localDateTimeToIso(dateText: string, timeText: string) {
  return parseLocalDateTimeInput(dateText, timeText).toISOString();
}

function validateRecordForm(
  recordType: string,
  fields: RecordEditFields,
  dateText: string,
  timeText: string
) {
  try {
    parseLocalDateTimeInput(dateText, timeText);
  } catch (error) {
    return error instanceof Error ? error.message : "日期或時間格式不正確";
  }

  if (recordType === "glucose") {
    const value = Number(fields.glucoseValue);
    if (!fields.glucoseValue.trim() || !Number.isFinite(value) || value < 20 || value > 600) {
      return "血糖數值需介於 20 到 600";
    }
    return null;
  }

  if (recordType === "meal") {
    const foodItems = splitListText(fields.foodItems);
    if (isTooLong(fields.foodItems, maxFormLongTextLength)) {
      return "飲食內容過長，請縮短後再儲存";
    }
    if (foodItems.length === 0) {
      return "請至少輸入一項飲食內容";
    }
    return null;
  }

  if (recordType === "exercise") {
    if (isTooLong(fields.exerciseActivity)) {
      return "運動類型過長，請縮短後再儲存";
    }
    if (!fields.exerciseActivity.trim()) {
      return "請輸入運動類型";
    }
    if (fields.exerciseMinutes.trim()) {
      const minutes = Number(fields.exerciseMinutes);
      if (!Number.isFinite(minutes) || minutes < 0 || minutes > 1440) {
        return "運動時長需介於 0 到 1440 分鐘";
      }
    }
    return null;
  }

  if (recordType === "medication") {
    if (isTooLong(fields.medicationName) || isTooLong(fields.medicationDose)) {
      return "用藥欄位過長，請縮短後再儲存";
    }
    if (!fields.medicationName.trim()) {
      return "請輸入藥名或胰島素描述";
    }
    return null;
  }

  if (recordType === "note") {
    if (isTooLong(fields.noteKind) || isTooLong(fields.noteTags, maxFormLongTextLength)) {
      return "備註欄位過長，請縮短後再儲存";
    }
    if (!fields.noteKind.trim() && splitListText(fields.noteTags).length === 0) {
      return "備註需至少輸入類型或標籤";
    }
    return null;
  }

  try {
    if (fields.fallbackJson.length > maxFormJsonTextLength) {
      return "payload_json 過長，請縮短後再儲存";
    }
    const payload = JSON.parse(fields.fallbackJson) as unknown;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return "payload_json 必須是物件";
    }
  } catch {
    return "payload_json 不是有效 JSON";
  }
  return null;
}

function buildPayloadFromEditFields(recordType: string, fields: RecordEditFields) {
  if (recordType === "glucose") {
    return {
      value: Number(fields.glucoseValue),
      unit: fields.glucoseUnit || "mg/dL",
      meal_timing: fields.glucoseTiming || "unknown"
    };
  }

  if (recordType === "meal") {
    return {
      meal_type: fields.mealType || "unknown",
      food_items: splitListText(fields.foodItems).map((name) => ({ name }))
    };
  }

  if (recordType === "exercise") {
    return {
      activity: fields.exerciseActivity.trim(),
      minutes: fields.exerciseMinutes.trim() ? Number(fields.exerciseMinutes) : undefined
    };
  }

  if (recordType === "medication") {
    return {
      name: fields.medicationName.trim(),
      dose: fields.medicationDose.trim() || undefined
    };
  }

  if (recordType === "note") {
    const tags = splitListText(fields.noteTags);
    return {
      kind: fields.noteKind.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined
    };
  }

  return JSON.parse(fields.fallbackJson) as Record<string, unknown>;
}

async function requestJson<T>(
  apiBaseUrl: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function requestNoContent(apiBaseUrl: string, path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status}`);
  }
}

function protectedRequestHeaders(accountId: string, accessToken: string): Record<string, string> {
  const token = accessToken.trim();
  const devAccountId = boundIdentifier(accountId.trim());
  if (token.length > authAccessTokenMaxLength) {
    return {};
  }
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  if (allowMobileDevAuth && devAccountId) {
    return { "X-Account-Id": devAccountId };
  }
  return {};
}

function safeUiError(error: unknown, fallback: string) {
  if (error instanceof Error && /^\S+ failed: \d{3}$/.test(error.message)) {
    return boundUiMessage(error.message);
  }
  return boundUiMessage(fallback);
}

function bootFailureDisplayMessages(message: string) {
  return {
    status: boundUiMessage(`${message}；已清除未完成連線狀態，請確認 backend 後重新連線。`),
    authStatus: boundUiMessage("連線未完成；已清除可能不完整的帳號、模型、額度與紀錄狀態。")
  };
}

function backendUrlChangedDisplayMessages() {
  return {
    status: boundUiMessage("Backend URL 已變更，請重新連線。"),
    authStatus: boundUiMessage(
      "已清除舊 backend 的本機帳號、紀錄與模型清單狀態，避免跨環境沿用 dev auth 或 parser model。"
    )
  };
}

function devLoginDisabledDisplayMessages() {
  return {
    status: boundUiMessage("dev login 未啟用；本機預覽請確認 mobile/.env。"),
    authStatus: boundUiMessage(
      "Mobile dev auth is opt-in. For local preview set EXPO_PUBLIC_ALLOW_DEV_AUTH=true in mobile/.env; production builds should connect JWT/OIDC login before protected endpoints."
    )
  };
}

function backendReconnectProgressStatusMessage() {
  return boundUiMessage("連線 backend...");
}

function backendReconnectSuccessStatusMessage() {
  return boundUiMessage("已連線，可開始整理文字");
}

function mainInitialStatusMessage() {
  return boundUiMessage("尚未連線");
}

function backendReconnectFailureDisplayMessages(error: unknown) {
  return bootFailureDisplayMessages(safeUiError(error, "連線失敗"));
}

function devResetFailureDisplayMessages(message: string) {
  return {
    devResetStatus: boundUiMessage(`${message}；已保守清除本機狀態，請重新連線確認 backend 資料。`),
    status: boundUiMessage("Dev reset 未確認完成；已清除本機狀態，請重新連線 backend。")
  };
}

function devResetUnavailableStatusMessage() {
  return boundUiMessage("Dev reset 只在 EXPO_PUBLIC_ALLOW_DEV_AUTH=true 的本機開發環境顯示。");
}

function devResetBusyStatusMessage() {
  return boundUiMessage("目前仍有請求處理中，請稍後再重置測試資料。");
}

function devResetProgressStatusMessage() {
  return boundUiMessage("正在呼叫 backend dev reset...");
}

function devResetSuccessDisplayMessages(recordsCount: number) {
  return {
    devResetStatus: boundUiMessage(
      `已重置 backend 測試資料；records ${clampNumber(recordsCount, 0, maxMobileCountValue)} 筆。請重新連線。`
    ),
    status: boundUiMessage("Dev reset 已完成，請重新連線 backend。")
  };
}

function devResetFailureMessages(error: unknown) {
  return devResetFailureDisplayMessages(
    safeUiError(error, "Dev reset 失敗；請確認 backend /dev/reset-data 是否在本機開發環境啟用。")
  );
}

function localClearDisplayMessages() {
  return {
    authStatus: boundUiMessage(
      "已清除本機帳號、照護對象、模型清單、語音額度、紀錄、報表與候選狀態。正式登出仍需 refresh token revoke、session list 更新與安全儲存清除。"
    ),
    status: boundUiMessage("已清除本機 session 狀態")
  };
}

function authOperationBusyStatusMessage() {
  return boundUiMessage("Auth 操作仍在處理中，請稍後再試。");
}

function authRefreshUnavailableStatusMessage() {
  return boundUiMessage("沒有可用 refresh token；請先完成正式登入或重新登入。");
}

function authRefreshProgressStatusMessage() {
  return boundUiMessage("正在安全刷新 session...");
}

function authRefreshSuccessStatusMessage(expiresIn: number) {
  return boundUiMessage(
    `session 已刷新；access token 仍只短暫放在記憶體，約 ${clampNumber(expiresIn, 1, 86_400)} 秒後到期。`
  );
}

function authRefreshStorageFailureStatusMessage() {
  return boundUiMessage("刷新成功但安全儲存失敗；已 fail closed 並清除本機 token，請重新登入。");
}

function authRefreshFailureStatusMessage(error: unknown) {
  return safeUiError(error, "session refresh 失敗；請重新登入。");
}

function oidcExchangeUnavailableStatusMessage() {
  return boundUiMessage("Provider callback 尚未提供可交換的 id_token 與 nonce；請先完成 Apple / Google / Email 原生登入。");
}

function authProviderChallengeCreatedStatusMessage(provider: string) {
  return boundUiMessage(
    `${boundDisplayText(provider, 40)} nonce/state challenge 已建立；等待原生 provider SDK callback 回傳 id_token 與 state。`
  );
}

function authProviderChallengeFailureStatusMessage(reason: AuthProviderChallengeFailure) {
  const copyByReason: Record<AuthProviderChallengeFailure, string> = {
    invalid_provider: "Provider 不在允許清單內；不會啟動登入流程。",
    invalid_challenge: "登入 challenge 不完整；請重新開始 provider 登入。",
    state_mismatch: "Provider state 驗證不一致；已拒絕 callback。",
    challenge_expired: "Provider challenge 已過期；請重新開始登入。",
    secure_random_unavailable: "安全亂數不可用；正式登入 fail closed。"
  };
  return boundUiMessage(copyByReason[reason]);
}

function authProviderCallbackRejectedStatusMessage(reason: AuthProviderChallengeFailure) {
  return boundUiMessage(`Provider callback 已拒絕：${authProviderChallengeFailureStatusMessage(reason)}`);
}

function oidcExchangeProgressStatusMessage(provider: string) {
  return boundUiMessage(`正在交換 ${boundDisplayText(provider, 40)} provider token...`);
}

function oidcExchangeSuccessStatusMessage(expiresIn: number) {
  return boundUiMessage(
    `正式登入完成；token 已寫入 SecureStore，access token 約 ${clampNumber(expiresIn, 1, 86_400)} 秒後到期。`
  );
}

function oidcExchangeStorageFailureStatusMessage() {
  return boundUiMessage("OIDC exchange 成功但 SecureStore 寫入失敗；已 fail closed 並清除本機 token。");
}

function oidcExchangeFailureStatusMessage(error: unknown) {
  return safeUiError(error, "OIDC exchange 失敗；不會保存 provider token，請重新登入。");
}

function authLogoutProgressStatusMessage() {
  return boundUiMessage("正在呼叫 backend revoke 並清除本機 token...");
}

function authLogoutSuccessStatusMessage() {
  return boundUiMessage("已登出並清除本機安全 token；若 backend 無法找到 session 也會視為本機登出完成。");
}

function authLogoutFailureStatusMessage(error: unknown) {
  return safeUiError(error, "logout revoke 失敗；已保守清除本機 token，請稍後重新確認 session。");
}

function authLogoutAllProgressStatusMessage() {
  return boundUiMessage("正在撤銷全部 session...");
}

function authLogoutAllSuccessStatusMessage(revokedSessions: number) {
  return boundUiMessage(
    `已送出全部裝置登出；backend 回報撤銷 ${clampNumber(revokedSessions, 0, maxMobileCountValue)} 個 session。`
  );
}

function authSessionsProgressStatusMessage() {
  return boundUiMessage("正在載入 session list...");
}

function authSessionsSuccessStatusMessage(count: number) {
  return boundUiMessage(`已載入 ${clampNumber(count, 0, maxMobileCountValue)} 個 active session metadata。`);
}

function authSessionsUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "保護 API 尚未 ready"}；目前不讀取 session list。`);
}

function authSessionsFailureStatusMessage(error: unknown) {
  return safeUiError(error, "session list 載入失敗；mobile 不會保留舊 session metadata。");
}

function voiceQuotaUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend account 尚未 ready"}；目前不送出語音額度同步請求。`);
}

function voiceQuotaInitialStatusMessage() {
  return boundUiMessage("語音額度尚未載入");
}

function voiceQuotaSyncSuccessStatusMessage() {
  return boundUiMessage("語音額度已同步");
}

function voiceQuotaSyncFailureStatusMessage() {
  return boundUiMessage("語音額度暫時無法載入，不影響文字記錄");
}

function detailedReportNotLoadedStatusMessage() {
  return boundUiMessage("詳細報告尚未載入");
}

function detailedReportResetStatusMessage() {
  return boundUiMessage("尚未載入詳細報告");
}

function detailedReportUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前顯示本機已載入資料摘要，不送出報表請求。`);
}

function detailedReportInFlightStatusMessage() {
  return boundUiMessage("詳細報告已在載入中...");
}

function detailedReportLoadingStatusMessage() {
  return boundUiMessage("詳細報告載入中...");
}

function detailedReportSuccessStatusMessage() {
  return boundUiMessage("已載入 backend 報表摘要");
}

function detailedReportFailureStatusMessage() {
  return boundUiMessage("backend 報表暫時無法載入，顯示本機已載入資料摘要。");
}

function analysisReportInFlightStatusMessage() {
  return boundUiMessage("分析統計已在同步中...");
}

function analysisReportLoadingStatusMessage() {
  return boundUiMessage("正在同步 backend 分析統計...");
}

function analysisReportSuccessStatusMessage() {
  return boundUiMessage("已同步 backend 分析統計。");
}

function analysisReportFailureStatusMessage() {
  return boundUiMessage("backend 分析統計暫時無法載入，顯示 mobile 已同步紀錄摘要。");
}

function aiSaveUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前不會送出 AI 候選儲存請求。`);
}

function aiPartialSaveFailureStatusMessage(message: string) {
  return boundUiMessage(`${message}；已保留未儲存候選紀錄，不會自動重試。`);
}

function aiSaveProgressStatusMessage() {
  return boundUiMessage("儲存候選紀錄...");
}

function aiSaveSuccessStatusMessage() {
  return boundUiMessage("已儲存");
}

function aiSaveFailureStatusMessage(error: unknown) {
  return safeUiError(error, "儲存失敗");
}

function aiSaveRecordsStatusMessage(count: number) {
  return boundUiMessage(`已新增 ${clampNumber(count, 0, maxMobileCountValue)} 筆紀錄`);
}

function aiSaveSuccessSummaryMessage(count: number) {
  return boundUiMessage(`已儲存 ${clampNumber(count, 0, maxMobileCountValue)} 筆 AI 整理紀錄`);
}

function aiPartialSaveRecordsStatusMessage(savedCount: number, unsavedCount: number) {
  return boundUiMessage(
    `已新增 ${clampNumber(savedCount, 0, maxMobileCountValue)} 筆；${clampNumber(
      unsavedCount,
      0,
      maxMobileCountValue
    )} 筆尚未儲存`
  );
}

function aiPartialSaveSummaryMessage(savedCount: number, unsavedCount: number) {
  return boundUiMessage(
    `已儲存 ${clampNumber(savedCount, 0, maxMobileCountValue)} 筆；${clampNumber(
      unsavedCount,
      0,
      maxMobileCountValue
    )} 筆尚未儲存，請返回確認頁檢查。`
  );
}

function recordSyncUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前不送出紀錄同步請求。`);
}

function recordSyncInitialStatusMessage() {
  return boundUiMessage("尚未連線帳號或照護對象");
}

function recordSyncLoadingStatusMessage() {
  return boundUiMessage("紀錄同步中...");
}

function recordSyncPageLoadingStatusMessage() {
  return boundUiMessage("正在載入更早紀錄...");
}

function recordSyncSuccessStatusMessage(count: number, pageLimit: number, cacheLimit: number, hasMore: boolean) {
  const boundedCount = clampNumber(count, 0, maxMobileCountValue);
  const boundedPageLimit = clampNumber(pageLimit, 0, maxMobileCountValue);
  const boundedCacheLimit = clampNumber(cacheLimit, 0, maxMobileCountValue);
  const moreCopy = hasMore ? "可繼續載入更早紀錄" : "目前沒有更多已知紀錄";
  return boundUiMessage(`已同步 ${boundedCount} 筆紀錄（每頁 ${boundedPageLimit} 筆，本機上限 ${boundedCacheLimit} 筆）；${moreCopy}。`);
}

function recordSyncPageSuccessStatusMessage(count: number, pageCount: number, cacheLimit: number, hasMore: boolean) {
  const boundedCount = clampNumber(count, 0, maxMobileCountValue);
  const boundedPageCount = clampNumber(pageCount, 0, maxMobileCountValue);
  const boundedCacheLimit = clampNumber(cacheLimit, 0, maxMobileCountValue);
  const moreCopy = hasMore ? "仍可繼續載入" : "已無更多已知紀錄";
  return boundUiMessage(`已載入更早 ${boundedPageCount} 筆，目前本機共有 ${boundedCount} 筆（上限 ${boundedCacheLimit} 筆）；${moreCopy}。`);
}

function recordSyncFailureStatusMessage() {
  return boundUiMessage("紀錄暫時無法同步；目前只顯示已載入資料或範例。");
}

function visualSmokeRecordSyncStatusMessage() {
  return boundUiMessage("Visual smoke demo records loaded locally; no backend sync, database write, AI, STT, Vision, or payment call.");
}

function recordUpdateUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前不會送出紀錄更新請求。`);
}

function recordDeleteUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前不會送出紀錄刪除請求。`);
}

function recordUpdateProgressStatusMessage() {
  return boundUiMessage("儲存修改...");
}

function recordUpdateSuccessStatusMessage() {
  return boundUiMessage("紀錄已更新");
}

function recordUpdateFailureStatusMessage(error: unknown) {
  return safeUiError(error, "更新失敗");
}

function recordUpdateSummaryMessage(count: number) {
  return boundUiMessage(`已更新 ${clampNumber(count, 0, maxMobileCountValue)} 筆紀錄`);
}

function recordDeleteProgressStatusMessage() {
  return boundUiMessage("刪除紀錄...");
}

function recordDeleteSuccessStatusMessage() {
  return boundUiMessage("紀錄已刪除");
}

function recordDeleteFailureStatusMessage(error: unknown) {
  return safeUiError(error, "刪除失敗");
}

function recordDeleteSummaryMessage(count: number) {
  return boundUiMessage(`已刪除 ${clampNumber(count, 0, maxMobileCountValue)} 筆紀錄`);
}

function manualRecordCreateUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前不會送出手動紀錄建立請求。`);
}

function manualRecordCreateProgressStatusMessage() {
  return boundUiMessage("建立手動紀錄...");
}

function manualRecordCreateSuccessStatusMessage() {
  return boundUiMessage("手動紀錄已建立");
}

function manualRecordCreateFailureStatusMessage(error: unknown) {
  return safeUiError(error, "手動紀錄建立失敗");
}

function manualRecordCreateSummaryMessage(count: number) {
  return boundUiMessage(`已建立 ${clampNumber(count, 0, maxMobileCountValue)} 筆手動紀錄`);
}

function parserBackendUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "backend 尚未 ready"}；目前不送出 parser 請求，避免無效重試與額外成本。`);
}

function parserModelUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message}；目前不送出 parser 請求，請先在設定選擇可用模型。`);
}

function parserSampleBlockedStatusMessage() {
  return boundUiMessage("範例文字不會送入 parser；請改成自己的紀錄內容，或使用手動新增避免 LLM 成本。");
}

function parserProgressStatusMessage() {
  return boundUiMessage("送入 parser...");
}

function parserSuccessStatusMessage(count: number) {
  return boundUiMessage(`整理完成：${clampNumber(count, 0, maxMobileCountValue)} 筆候選紀錄`);
}

function parserVoiceQuotaSyncedStatusMessage(count: number, voiceSeconds: number) {
  return boundUiMessage(
    `整理完成：${clampNumber(count, 0, maxMobileCountValue)} 筆候選紀錄；已送出 ${clampNumber(voiceSeconds, 0, maxMobileCountValue)} 秒語音額度。`
  );
}

function parserFailureStatusMessage(error: unknown) {
  return safeUiError(error, "Parser 失敗");
}

function parserFailureRecoveryMessage(message: string) {
  return boundUiMessage(`${message}。可以修改文字後再整理，或改用手動新增避免再次呼叫 parser。`);
}

function aiCandidateEditOpenStatusMessage() {
  return boundUiMessage("請確認 AI 整理的單筆紀錄");
}

function aiCandidateEditCancelStatusMessage() {
  return boundUiMessage("已取消修改；候選紀錄保留在 AI 整理確認清單。");
}

function aiCandidateRemoveConfirmStatusMessage() {
  return boundUiMessage("請確認是否移除這筆 AI 候選紀錄");
}

function aiCandidateRemoveCancelStatusMessage() {
  return boundUiMessage("已取消移除；候選紀錄保留在 AI 整理確認清單。");
}

function aiCandidateRemoveResultStatusMessage(count: number) {
  const boundedCount = clampNumber(count, 0, maxMobileCountValue);
  return boundedCount === 0 ? boundUiMessage("已移除所有候選紀錄") : boundUiMessage(`剩餘 ${boundedCount} 筆候選紀錄`);
}

function aiCandidateEditSuccessStatusMessage() {
  return boundUiMessage("候選紀錄已更新，請再次確認後儲存");
}

function aiCandidateEditFailureStatusMessage(error: unknown) {
  return safeUiError(error, "候選紀錄更新失敗");
}

function busyActionStatusMessage() {
  return boundUiMessage("目前仍在處理上一個動作，請稍候");
}

function recordingQuotaExhaustedStatusMessage() {
  return boundUiMessage("今日錄音額度已用完，請改用文字或手動新增。");
}

function recordingStartedStatusMessage(isLowQuota: boolean) {
  return boundUiMessage(isLowQuota ? "錄音中；今日錄音額度剩餘不到 2 分鐘。" : "錄音中，放開即結束。");
}

function recordingResetStatusMessage() {
  return boundUiMessage("可重新按住錄音，或直接使用文字輸入。");
}

function recordingTextFallbackStatusMessage() {
  return boundUiMessage("錄音已結束；尚未設定 Whisper 模型，請用文字輸入，確認後再交給 AI 整理。");
}

function recordingPermissionDeniedStatusMessage() {
  return boundUiMessage("麥克風權限未允許，請到系統設定開啟，或改用文字/手動新增。");
}

function recordingStartFailureStatusMessage(error: unknown) {
  return safeUiError(error, "錄音無法開始");
}

function recordingStopFailureStatusMessage(error: unknown) {
  return safeUiError(error, "錄音停止失敗");
}

function recordingLimitReachedStatusMessage(limitSeconds: number) {
  return boundUiMessage(`已達單次錄音上限 ${clampNumber(limitSeconds, 0, maxMobileCountValue)} 秒，已自動結束。`);
}

function recordingFinishedStatusMessage(elapsedSeconds: number) {
  const boundedSeconds = clampNumber(elapsedSeconds, 0, maxMobileCountValue);
  return boundUiMessage(
    boundedSeconds <= 1
      ? "錄音太短，請按住說完後再放開。"
      : "錄音已結束；音檔已保留於本機，可用 Whisper 轉文字後進入確認。"
  );
}

function recordingWhisperMissingModelStatusMessage() {
  return boundUiMessage("錄音已保留；請先在設定填入 Whisper model path，或改用文字輸入。");
}

function recordingWhisperProgressStatusMessage() {
  return boundUiMessage("正在將錄音轉成文字，完成後會進入文字確認。");
}

function recordingWhisperSuccessStatusMessage() {
  return boundUiMessage("錄音已轉成文字；請確認內容後再交給 AI 整理。");
}

function recordingWhisperEmptyStatusMessage() {
  return boundUiMessage("Whisper 沒有產生文字；請重新錄音或改用文字輸入。");
}

function recordingWhisperFailureStatusMessage(error: unknown) {
  return safeUiError(error, "錄音轉文字失敗");
}

function transcriptReviewReadyStatusMessage() {
  return boundUiMessage("請確認文字內容，下一步才會交給 AI 整理");
}

function transcriptReturnEditStatusMessage() {
  return boundUiMessage("請修改文字；按下一步整理時才會重新送入 parser。");
}

function transcriptReviewBackStatusMessage() {
  return boundUiMessage("已返回上一頁；目前文字保留，尚未送入 AI 整理。");
}

function transcriptClearedStatusMessage() {
  return boundUiMessage("已清空目前文字，可回到記錄頁重新輸入。");
}

function nativeDebugDefaultStatusMessage() {
  return boundUiMessage("Expo Go 可跑 UI；whisper.rn / llama.rn 需要 Dev Client。");
}

function nativeDebugDisabledStatusMessage() {
  return boundUiMessage("Debug tools are disabled.");
}

function nativeDownloadedModelsFailureStatusMessage(error: unknown) {
  return safeUiError(error, "讀取模型清單失敗");
}

function nativeModelDownloadProgressStatusMessage() {
  return boundUiMessage("下載模型中...");
}

function nativeModelDownloadSuccessStatusMessage() {
  return boundUiMessage("模型已下載，已更新本機模型清單。");
}

function nativeModelDownloadFailureStatusMessage(error: unknown) {
  return safeUiError(error, "模型下載失敗");
}

function nativeModuleCheckProgressStatusMessage() {
  return boundUiMessage("檢查 native modules...");
}

function nativeModuleCheckResultStatusMessage(message: string) {
  return boundUiMessage(message);
}

function nativeModuleCheckFailureStatusMessage(error: unknown) {
  return safeUiError(error, "Native module check failed");
}

function nativeWhisperMissingInputStatusMessage() {
  return boundUiMessage("請先填 whisper model path 和 audio file path");
}

function nativeWhisperProgressStatusMessage() {
  return boundUiMessage("本機 Whisper 轉錄中...");
}

function nativeWhisperSuccessStatusMessage() {
  return boundUiMessage("Whisper 轉錄完成，已填入文字輸入框");
}

function nativeWhisperFailureStatusMessage(error: unknown) {
  return safeUiError(error, "Whisper failed");
}

function recordingModelRefreshStatusMessage(count: number) {
  return boundUiMessage(`已找到 ${clampNumber(count, 0, maxMobileCountValue)} 個本機 Whisper 模型。`);
}

function recordingModelRefreshFailureStatusMessage(error: unknown) {
  return safeUiError(error, "讀取本機 Whisper 模型失敗");
}

function recordingModelSelectedStatusMessage(label: string) {
  return boundUiMessage(`已選擇本機 Whisper 模型：${boundDisplayText(label, 80)}。`);
}

function recordingModelRefreshButtonLabel() {
  return boundDisplayText("重新掃描本機模型", maxDisplayTextLength);
}

function recordingModelRefreshAccessibilityLabel() {
  return boundDisplayText("重新掃描本機已下載 Whisper 模型，不呼叫雲端或上傳音檔", maxDisplayDetailTextLength);
}

function nativeLlamaMissingInputStatusMessage() {
  return boundUiMessage("請先填 GGUF model path 和 transcript");
}

function nativeLlamaProgressStatusMessage() {
  return boundUiMessage("本機 llama.cpp 解析中...");
}

function nativeLlamaOutputSummaryMessage(outputLength: number) {
  return boundUiMessage(
    `llama.cpp 輸出已產生（${clampNumber(outputLength, 0, maxMobileCountValue)} chars）；為避免保留 raw model output，UI 不顯示完整內容。`
  );
}

function nativeLlamaSuccessStatusMessage() {
  return boundUiMessage("llama.cpp constrained JSON 輸出完成；完整輸出未保留在 UI。");
}

function nativeLlamaFailureStatusMessage(error: unknown) {
  return safeUiError(error, "llama.cpp failed");
}

function nativeBenchmarkProgressStatusMessage() {
  return boundUiMessage("本機模型 benchmark 中...");
}

function nativeBenchmarkMissingInputStatusMessage() {
  return boundUiMessage("請先填模型與測試輸入後再 benchmark。");
}

function nativeBenchmarkResultStatusMessage(results: Array<{ task: string; ok: boolean; durationMs: number; outputChars: number }>) {
  return boundUiMessage(
    results
      .slice(0, maxListItems)
      .map((result) =>
        [
          `${displayTextValue(result.task, 30)}: ${result.ok ? "ok" : "failed"}`,
          `${clampNumber(result.durationMs, 0, maxMobileCountValue)}ms`,
          `${clampNumber(result.outputChars, 0, maxMobileCountValue)} chars`
        ].join(" ")
      )
      .join("\n")
  );
}

function historyReturnTodayStatusMessage() {
  return boundUiMessage("已從歷史紀錄回到今日紀錄；只使用已載入紀錄，不額外查詢 backend。");
}

function historyManualEntryStatusMessage() {
  return boundUiMessage("已從歷史紀錄進入手動新增；此路徑不呼叫 AI、LLM 或 STT。");
}

function historyRecordDetailStatusMessage() {
  return boundUiMessage("已從歷史紀錄查看單筆詳情；返回會回到歷史紀錄，不呼叫 AI。");
}

function previewActionClearStatusMessage() {
  return "";
}

function accountDisplayNameDisplayText(account: Account | null) {
  return boundDisplayText(account?.display_name ?? "尚未連線帳號");
}

function accountEmailDisplayValue(account: Account | null) {
  return boundDisplayText(account?.email ?? "尚未取得登入識別", maxEmailTextLength);
}

function accountLoginDisplayValue(account: Account | null) {
  return account?.email
    ? boundDisplayText(`Email 登入・${account.email}`, maxDisplayDetailTextLength)
    : boundDisplayText("尚未連線帳號");
}

function doctorShareAccountBoundaryText(account: Account | null) {
  return boundDisplayText(
    account
      ? "已連線帳號；正式分享仍需 production auth、權限與授權碼流程。"
      : "尚未連線帳號；不可建立任何外部分享。",
    maxDisplayDetailTextLength
  );
}

function activeProfileLabelText(activeProfile: Profile | null, profileCount: number) {
  if (activeProfile) {
    return boundDisplayText(activeProfile.display_name);
  }
  return boundDisplayText(profileCount === 0 ? "尚未建立照護對象" : "尚未選擇照護對象");
}

function activeProfileInlineText(activeProfileLabel: string) {
  return boundDisplayText(`目前對象：${activeProfileLabel}`, maxDisplayDetailTextLength);
}

function activeProfileRelationshipText(activeProfile: Profile | null) {
  return boundDisplayText(activeProfile?.relationship ?? "未載入", 40);
}

function accountPublicDisplayNameText(account: Account | null) {
  return account ? accountDisplayNameDisplayText(account) : boundDisplayText("尚未設定");
}

function quotaPlanDisplayText(quota: VoiceQuota | null, fallback = "額度尚未載入") {
  return boundDisplayText(quota ? planDisplayName(quota.plan_code) : fallback, 80);
}

function subscriptionStatusSummaryText(quota: VoiceQuota | null, trialDays: number | null, fallback: string) {
  if (!quota) {
    return boundDisplayText(fallback, maxDisplayDetailTextLength);
  }
  const trialCopy = trialDays === null ? "" : ` · 試用剩 ${clampNumber(trialDays, 0, maxMobileCountValue)} 天`;
  return boundDisplayText(`${subscriptionStatusLabel(quota.status)}${trialCopy}`, maxDisplayDetailTextLength);
}

function membershipTrialDaysText(trialDays: number | null) {
  return boundDisplayText(
    trialDays === null ? "試用天數尚未載入" : `還剩 ${clampNumber(trialDays, 0, maxMobileCountValue)} 天`,
    80
  );
}

function quotaUsedDisplayValue(quota: VoiceQuota | null) {
  return boundDisplayText(quota ? `已用 ${formatVoiceMinutes(quota.used_seconds_today)}` : "已用 尚未載入", 80);
}

function quotaRemainingDisplayValue(quota: VoiceQuota | null) {
  return boundDisplayText(quota ? `剩餘 ${formatVoiceMinutes(quota.remaining_seconds_today)}` : "剩餘 尚未載入", 80);
}

function settingsQuotaHelperText(quota: VoiceQuota | null) {
  return boundDisplayText(
    quota ? `今日錄音剩餘 ${formatVoiceMinutes(quota.remaining_seconds_today)}` : "錄音額度尚未載入",
    maxDisplayDetailTextLength
  );
}

function parserModelUnavailableText(llmModel: AiModelOption | null, sttModel: AiModelOption | null) {
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

function todayRecordSummaryText(recordCount: number) {
  if (recordCount <= 0) {
    return boundDisplayText("今日尚未載入紀錄", 80);
  }
  return boundDisplayText(`今日已記錄 ${clampNumber(recordCount, 0, maxMobileCountValue)} 筆`, 80);
}

function noRealRecordHealthValueCopy(scope: "general" | "history") {
  return boundDisplayText(
    scope === "history"
      ? "目前尚未載入真實紀錄；歷史頁不顯示固定範例健康數值。"
      : "目前尚未載入真實紀錄；不顯示固定範例健康數值。",
    maxDisplayDetailTextLength
  );
}

function loadedRecordActionCopy() {
  return boundDisplayText("點擊真實紀錄可查看詳情並進行編輯或刪除。", maxDisplayDetailTextLength);
}

function analysisNoDataStatusLabel() {
  return boundDisplayText("尚無資料", 24);
}

function analysisNoDataCopy() {
  return boundDisplayText(
    "建立真實紀錄後才會顯示趨勢與統計；目前不使用固定範例血糖數字。",
    maxDisplayDetailTextLength
  );
}

function analysisBoundaryDataCopy(isPreviewMode: boolean) {
  return boundDisplayText(
    isPreviewMode
      ? "目前沒有可分析的真實紀錄；不顯示固定 mock 血糖數字。"
      : "六項統計優先使用 backend bounded report；圖表使用 mobile 已載入紀錄。",
    maxDisplayDetailTextLength
  );
}

function reportSourceDisplayItem(report: BasicReport | null, localRecordCount: number, queryLimit: number) {
  if (report) {
    return {
      label: boundDisplayText("Backend 報表", 24),
      copy: boundUiMessage(`資料來自 /reports/basic，並套用 ${clampNumber(queryLimit, 0, maxMobileCountValue)} 筆查詢上限。`)
    };
  }
  if (localRecordCount > 0) {
    return {
      label: boundDisplayText("本機摘要", 24),
      copy: boundUiMessage("backend 報表暫未使用；目前只根據 mobile 已載入紀錄計算。")
    };
  }
  return {
    label: boundDisplayText("尚無資料", 24),
    copy: boundUiMessage("目前沒有可分析的已載入紀錄；此頁只顯示空摘要。")
  };
}

function basicReportRequestKey(
  apiBaseUrl: string,
  accountId: string,
  profileId: string,
  range: AnalysisRange,
  customStart: string,
  customEnd: string,
  limit: number
) {
  return [
    apiBaseUrl,
    accountId,
    profileId,
    range,
    customStart,
    customEnd,
    String(limit)
  ].join(":");
}

function storeCartUnavailableDisplayItem() {
  return {
    title: boundDisplayText("購物車尚未啟用", maxDisplayTextLength),
    copy: boundDisplayText("目前不建立訂單、不保留購物車內容，也不處理付款或折價券。", maxDisplayDetailTextLength),
    evidence: boundDisplayText("需等商品、庫存、優惠、付款與退款規則完成後再接 backend。", maxDisplayDetailTextLength),
    checkoutLabel: boundDisplayText("結帳整合尚未啟用", maxDisplayTextLength),
    legalWarning: boundDisplayText("商城商品不得宣稱醫療療效；正式交易前需完成法務、付款與商品審核。", maxDisplayDetailTextLength)
  };
}

function storePreviewBoundaryCopy() {
  return boundDisplayText(
    "點數商城一般操作路徑會同步 backend 目錄與點數；優惠券與保健食品折扣可立即發碼，合作商品與會員福利仍需後續 fulfillment，不建立出貨訂單，也不處理付款。",
    maxDisplayDetailTextLength
  );
}

function storeEmptySearchDisplayItem() {
  return {
    title: boundDisplayText("找不到符合的商品", maxDisplayTextLength),
    copy: boundDisplayText("請清除搜尋文字或切換分類。", maxDisplayDetailTextLength),
    evidence: boundDisplayText("搜尋會篩選已同步的 backend 目錄；backend unavailable 時才使用本機預覽。", maxDisplayDetailTextLength)
  };
}

function storeCartButtonLabel() {
  return boundDisplayText("查看兌換整合狀態", maxDisplayTextLength);
}

function storeCartButtonAccessibilityLabel() {
  return boundDisplayText("查看點數兌換整合狀態，不扣點、不建立訂單或付款", maxDisplayDetailTextLength);
}

function storeLocalBoundaryCopy() {
  return boundDisplayText(
    "商城目前可同步點數、發出優惠券 / 折扣碼並建立兌換紀錄；庫存、出貨、付款與 entitlement fulfillment 尚未啟用，也不宣稱醫療療效。",
    maxDisplayDetailTextLength
  );
}

function storeCartIntroCopy() {
  return boundDisplayText("點數帳本、兌換券與折扣碼已可同步；購物車、出貨訂單與付款仍未接上。", maxDisplayDetailTextLength);
}

function storeCheckoutReadinessTitle() {
  return boundDisplayText("正式結帳前需要完成", maxDisplayTextLength);
}

function storeCartReturnButtonLabel() {
  return boundDisplayText("返回商城", maxDisplayTextLength);
}

function foodPhotoVisionBoundaryDisplayItem() {
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

function foodPhotoEmptyResultChecklistDisplayItems() {
  return [
    "尚未產生分析結果。",
    "拍攝或上傳流程尚未接上，因此不顯示任何營養估算。",
    "這裡不使用固定範例數字，避免把 mock 結果誤認為實際 AI 分析。",
    "沒有真實分析結果時不可加入紀錄；正式啟用時必須先讓使用者確認食物與數值。"
  ].map(resultChecklistItem);
}

function foodPhotoIntroCopy() {
  return boundDisplayText(
    "目前先保留拍照分析 UI 與確認流程入口；Vision 尚未串接，不會估算營養或寫入紀錄。",
    maxDisplayDetailTextLength
  );
}

function foodPhotoUploadBoxLabel() {
  return boundDisplayText("拍攝或上傳照片", maxDisplayTextLength);
}

function foodPhotoResultTitle() {
  return boundDisplayText("AI 分析結果", maxDisplayTextLength);
}

function foodPhotoReadinessTitle() {
  return boundDisplayText("正式啟用前需要完成", maxDisplayTextLength);
}

function foodPhotoIntegrationButtonLabel() {
  return boundDisplayText("查看拍照整合狀態", maxDisplayTextLength);
}

function foodPhotoIntegrationButtonAccessibilityLabel() {
  return boundDisplayText("查看拍照整合狀態，不讀取照片或呼叫 Vision", maxDisplayDetailTextLength);
}

function foodPhotoRetakeButtonLabel() {
  return boundDisplayText("查看重新拍攝整合狀態", maxDisplayTextLength);
}

function foodPhotoRetakeButtonAccessibilityLabel() {
  return boundDisplayText("查看重新拍攝整合狀態，目前沒有暫存圖片可清除", maxDisplayDetailTextLength);
}

function yearReviewShareUnavailableStatusMessage() {
  return boundUiMessage("visual smoke 或 backend unavailable 時不啟動外部分享；backend ready 時可準備隱私遮罩分享卡並開啟原生分享。");
}

function yearReviewBoundaryDisplayCopy() {
  return boundDisplayText(
    "年度回顧由 backend snapshot 保存年度統計、AI-style 觀察與鼓勵；不提供診療建議或療效宣稱。",
    maxDisplayDetailTextLength
  );
}

function futurePreviewBoundaryDisplayItem(badge: string, copy: string) {
  return {
    badge: boundDisplayText(badge, 40),
    copy: boundDisplayText(copy, maxDisplayDetailTextLength)
  };
}

function doctorSharePreviewBoundaryDisplayItem() {
  return futurePreviewBoundaryDisplayItem(
    "授權未啟用",
    "目前不產生授權碼、不建立 share token、不新增 grants、不呼叫醫師端 API；只顯示未來合作流程與安全邊界。"
  );
}

function doctorShareBackendBoundaryCopy() {
  return boundDisplayText(
    "後端已有 profile grant / shared profile / basic report 的基礎能力；mobile 正式開放前仍需完成 production auth、使用者確認 UI、撤銷入口與醫師端唯讀頁。",
    maxDisplayDetailTextLength
  );
}

function healthIntegrationPreviewBoundaryDisplayItem() {
  return futurePreviewBoundaryDisplayItem(
    "串接未啟用",
    "目前不請求 HealthKit / Health Connect 權限、不掃描 BLE、不讀取血糖機、不寫入 records；只顯示同步資料邊界。"
  );
}

function healthIntegrationExternalDataBoundaryCopy() {
  return boundDisplayText(
    "外部資料不能覆蓋使用者手動紀錄；正式匯入後仍需保留來源、同步批次、同步狀態與去重證據。",
    maxDisplayDetailTextLength
  );
}

function communityPreviewBoundaryDisplayItem() {
  return futurePreviewBoundaryDisplayItem(
    "社群未啟用",
    "目前不建立貼文、不送出留言、不公開任何紀錄；只顯示公開資料邊界、權限與內容治理需求。"
  );
}

function communityPublicNameBoundaryCopy() {
  return boundDisplayText(
    "正式社群需先完成 display name、公開/私密資料邊界與使用者 opt-in。",
    maxDisplayDetailTextLength
  );
}

function rankingPreviewBoundaryDisplayItem() {
  return futurePreviewBoundaryDisplayItem(
    "公開榜單",
    "一般操作路徑只讀取 opt-in 公開榜單與非敏感統計；不公開健康數值、不上傳 streak、不呼叫 AI。"
  );
}

function rankingLocalPreviewBoundaryCopy() {
  return boundDisplayText("本機連續天數僅供自己查看；公開榜單只使用 backend 已聚合的 opt-in 社群統計。", maxDisplayDetailTextLength);
}

function modelOptionDisplayLabel(model: AiModelOption) {
  const label = displayTextValue(model.label, 80);
  return boundDisplayText(model.available ? label : `${label}（未啟用）`, 100);
}

function settingsProfileChoiceDisplayItem(profile: Profile) {
  const label = boundDisplayText(profile.display_name);
  return {
    id: boundIdentifier(profile.id),
    sourceId: profile.id,
    label,
    accessibilityLabel: boundDisplayText(
      `選擇照護對象：${label}；只切換本機 active profile，不寫入個資`,
      maxDisplayDetailTextLength
    )
  };
}

function settingsModelChoiceDisplayItem(model: AiModelOption, kind: "LLM" | "STT") {
  const label = modelOptionDisplayLabel(model);
  return {
    ...model,
    id: boundIdentifier(model.id),
    sourceId: model.id,
    label,
    accessibilityLabel: boundDisplayText(
      `選擇${kind}模型：${label}；未啟用模型不可選，雲端 fallback 預設停用`,
      maxDisplayDetailTextLength
    )
  };
}

function modelSelectionBoundaryCopy() {
  return boundDisplayText("未啟用模型不可選；雲端 fallback 在 v1 預設停用。", maxDisplayDetailTextLength);
}

function accountSecurityProviderBoundaryCopy() {
  return boundDisplayText(
    "原生 Apple / Google / Email provider SDK 尚未接入；provider callback 拿到 id_token 後，mobile 已有 /auth/oidc-login exchange 與 SecureStore 寫入邊界。",
    maxDisplayDetailTextLength
  );
}

function accountSecuritySessionBoundaryCopy() {
  return boundDisplayText(
    "Session refresh、session list、logout 與 logout-all 已接 backend；所有 token persistence 只走 SecureStore，不顯示 raw token。",
    maxDisplayDetailTextLength
  );
}

function accountSecurityReadinessBoundaryCopy() {
  return boundDisplayText(
    "後端 OIDC exchange、mobile SecureStore 與 session 維護已建立；下一步是接原生 provider SDK、nonce/state 與 callback UI。",
    maxDisplayDetailTextLength
  );
}

function accountSecurityNoActionBoundaryCopy() {
  return boundDisplayText(
    "此頁不呼叫 AI、不輸出 PHI、不顯示 raw token；provider buttons 不會假造登入，只有真實 callback token 才會交換 session。",
    maxDisplayDetailTextLength
  );
}

function profileNoActionBoundaryCopy() {
  return boundDisplayText(
    "此頁不寫入個人資料、不建立本機草稿、不呼叫 profile update API、不呼叫 AI，也不保存測試姓名或聯絡方式。",
    maxDisplayDetailTextLength
  );
}

function recordingQuotaDataBoundaryCopy() {
  return boundDisplayText(
    "此頁不呼叫 parser、不呼叫 AI、不上傳音檔、不保存逐字稿；只有使用者手動同步時才讀取 backend quota 狀態。",
    maxDisplayDetailTextLength
  );
}

function reminderPreviewBoundaryDisplayItem() {
  return futurePreviewBoundaryDisplayItem(
    "通知預覽",
    "目前不請求系統通知權限、不建立背景工作、不寫入 reminder table；只呈現未來設定結構。"
  );
}

function privacyPreviewBoundaryDisplayItem() {
  return futurePreviewBoundaryDisplayItem(
    "隱私控制預覽",
    "目前不寫入偏好、不建立分享、不匯出資料、不呼叫 API；正式啟用前必須接權限、audit 與資料刪除流程。"
  );
}

function quickRecordIntroCopy() {
  return boundDisplayText("首頁只保留按住錄音；文字整理與手動新增請從記錄頁進入，整理前都會先進文字確認。", maxDisplayDetailTextLength);
}

function quickEntryModeDisplayItems() {
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

function quickEntryVoicePromptStatusMessage() {
  return boundUiMessage("請按住下方大型麥克風按鈕開始錄音預覽；放開後才會結束。");
}

function quickEntryTextModeStatusMessage() {
  return boundUiMessage("已切到文字整理流程；輸入內容後會先進文字確認，再交給 AI 整理。");
}

function todayManualEntryStatusMessage() {
  return boundUiMessage("已從今日紀錄進入手動新增；此路徑不呼叫 AI、LLM 或 STT。");
}

function todayRecordEntryStatusMessage() {
  return boundUiMessage("已從今日紀錄進入文字記錄；送出前不會呼叫 parser 或 LLM。");
}

function todayRecordDetailStatusMessage() {
  return boundUiMessage("已從今日紀錄查看單筆詳情；只使用已同步紀錄，不呼叫 AI。");
}

function todayAnalysisStatusMessage() {
  return boundUiMessage("已前往基本分析；只使用已載入紀錄摘要，不呼叫 AI 或 LLM。");
}

function recordManualEntryStatusMessage() {
  return boundUiMessage("已從快速記錄進入手動新增；此路徑不呼叫 AI、LLM 或 STT。");
}

function aiReviewManualEntryStatusMessage() {
  return boundUiMessage("已從 AI 整理確認改用手動新增；不會重新呼叫 AI 或自動送出 backend。");
}

function transcriptReviewManualEntryStatusMessage() {
  return boundUiMessage("已從文字確認改用手動新增；不會重送 parser，也不呼叫 AI 或 STT。");
}

function recordingIdlePreviewCopy() {
  return boundDisplayText("放開後保留本機音檔；轉文字需接 Whisper 或改用下方文字輸入", maxDisplayDetailTextLength);
}

function recordingActivePreviewCopy(elapsedSeconds: number) {
  return boundDisplayText(`${clampNumber(elapsedSeconds, 0, maxMobileCountValue)} 秒 · 放開結束`, 80);
}

function homeRecordingSecondaryHint(isRecording: boolean, elapsedSeconds: number) {
  if (!isRecording) {
    return boundDisplayText("放開即結束", 40);
  }
  return boundDisplayText(
    `已錄音 ${clampNumber(elapsedSeconds, 0, maxMobileCountValue)} 秒，放開即結束`,
    80
  );
}

function homeRecordingPreviewBoundaryCopy() {
  return boundDisplayText(
    "首頁按住會使用 expo-av 擷取本機音檔；放開只停止錄音，不自動呼叫 STT、AI、LLM 或寫入 backend。",
    maxDisplayDetailTextLength
  );
}

function recordPageRecordingPreviewBoundaryCopy() {
  return boundDisplayText(
    "按住會使用 expo-av 擷取本機音檔；若已設定 Whisper model path，可轉文字後進入確認，儲存前仍必須先文字確認。",
    maxDisplayDetailTextLength
  );
}

function recordingSimulatedResultCopy(elapsedSeconds: number) {
  return boundDisplayText(
    `錄音已擷取 ${clampNumber(elapsedSeconds, 0, maxMobileCountValue)} 秒；可用 Whisper 轉文字後確認，或改用文字輸入。`,
    maxDisplayDetailTextLength
  );
}

function recordingElapsedSecondsCopy(elapsedSeconds: number) {
  return boundDisplayText(`${clampNumber(elapsedSeconds, 0, maxMobileCountValue)} 秒`, 40);
}

function recordingEffectiveLimitSeconds(quota: VoiceQuota | null) {
  if (quota && quota.remaining_seconds_today > 0) {
    return clampNumber(
      Math.min(mobileSingleRecordingLimitSeconds, quota.remaining_seconds_today),
      1,
      mobileSingleRecordingLimitSeconds
    );
  }
  return mobileSingleRecordingLimitSeconds;
}

function recordingLimitCopy(limitSeconds: number) {
  return boundDisplayText(`單次最多 ${clampNumber(limitSeconds, 1, mobileSingleRecordingLimitSeconds)} 秒`, 80);
}

function recordingResultBodyCopy(elapsedSeconds: number) {
  const boundedSeconds = clampNumber(elapsedSeconds, 0, maxMobileCountValue);
  return boundDisplayText(
    boundedSeconds <= 1
      ? "錄音時間太短，建議重新按住錄音。"
      : "錄音已結束並保留本機音檔；已設定 Whisper 時可轉文字後確認，否則請改用下方文字輸入。",
    maxDisplayDetailTextLength
  );
}

function recordingResultPrimaryActionLabel(elapsedSeconds: number) {
  const boundedSeconds = clampNumber(elapsedSeconds, 0, maxMobileCountValue);
  return boundDisplayText(boundedSeconds <= 1 ? "再錄一次" : "使用文字輸入", maxDisplayTextLength);
}

function aiReviewNoCandidateTitleCopy() {
  return boundDisplayText("沒有可儲存的候選紀錄", maxDisplayTextLength);
}

function aiReviewNoCandidateBodyCopy() {
  return boundDisplayText("請返回修改文字，或改用手動新增。", maxDisplayDetailTextLength);
}

function aiReviewNoCandidateBoundaryCopy() {
  return boundDisplayText("不會送出儲存請求，也不會新增額外 AI 呼叫。", maxDisplayDetailTextLength);
}

function aiReviewNoPreviewTitleCopy() {
  return boundDisplayText("尚未產生整理結果", maxDisplayTextLength);
}

function aiReviewNoPreviewBodyCopy() {
  return boundDisplayText("請先完成文字確認，再進行 AI 整理。", maxDisplayDetailTextLength);
}

function aiReviewIntroCopy() {
  return boundDisplayText("儲存前請逐筆確認；修改候選紀錄不會重新呼叫 AI。", maxDisplayDetailTextLength);
}

function aiReviewLowConfidenceCopy() {
  return boundDisplayText("信心偏低，請仔細確認後再儲存。", maxDisplayDetailTextLength);
}

function aiReviewRejectedEventsCopy() {
  return boundDisplayText("以下片段沒有轉成候選紀錄；不會自動儲存，也不會自動重新呼叫 AI。", maxDisplayDetailTextLength);
}

function aiReviewRejectedReasonCopy(reasonLabel: string) {
  return boundDisplayText(`原因：${boundDisplayText(reasonLabel, 80)}`, maxDisplayDetailTextLength);
}

function aiReviewBackendRequiredCopy() {
  return boundDisplayText("請先連線 backend，才可儲存候選紀錄。", maxDisplayDetailTextLength);
}

function aiSaveConfirmIntroCopy() {
  return boundDisplayText(
    "這些候選紀錄已完成 AI 整理；按下確認後才會逐筆送到後端建立紀錄。",
    maxDisplayDetailTextLength
  );
}

function aiSaveConfirmReadyStatusMessage() {
  return boundUiMessage("請最後確認候選紀錄；按下確認儲存才會送到 backend。");
}

function aiSaveConfirmReturnStatusMessage() {
  return boundUiMessage("已返回 AI 整理確認；候選紀錄保留，可繼續編輯或移除。");
}

function aiSaveFailureBackAiReviewStatusMessage() {
  return boundUiMessage("已回到 AI 整理確認；候選紀錄保留，不會自動重試或重新呼叫 AI。");
}

function aiSaveFailureReturnSaveConfirmStatusMessage() {
  return boundUiMessage("已返回儲存確認；請確認後手動送出，不會自動重試 backend。");
}

function saveSuccessProcessUnsavedStatusMessage() {
  return boundUiMessage("已返回 AI 整理確認；只處理未儲存候選，不會重新呼叫 AI。");
}

function aiSaveFailureManualFallbackStatusMessage() {
  return boundUiMessage("已改用手動新增；AI 候選保留在確認流程，不會自動重試或重新呼叫 AI。");
}

function saveSuccessDestinationStatusMessage(target: AppScreen) {
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

function saveSuccessManualContinueStatusMessage() {
  return boundUiMessage("已從儲存完成繼續手動新增；沿用原返回目標，不會呼叫 AI、LLM 或 STT。");
}

function saveSuccessRecordEntryStatusMessage() {
  return boundUiMessage("已從儲存完成前往文字記錄；不會自動整理、不送 backend request。");
}

function saveSuccessViewDetailStatusMessage() {
  return boundUiMessage("已從儲存完成查看紀錄詳情；返回會回到儲存完成頁，不會呼叫 AI。");
}

function aiSaveConfirmSubmitLabel(isBusy: boolean, isBlockedByBackend: boolean, hasWarnings: boolean) {
  return boundDisplayText(
    isBusy
      ? "儲存中..."
      : isBlockedByBackend
        ? "等待 backend 連線"
        : hasWarnings
          ? "了解提醒並儲存候選"
          : "確認儲存",
    maxDisplayTextLength
  );
}

function aiRemoveConfirmBoundaryLabel() {
  return boundDisplayText("只會移除待確認候選", maxDisplayTextLength);
}

function aiRemoveConfirmBoundaryCopy() {
  return boundDisplayText(
    "這筆 AI 整理結果尚未寫入資料庫；移除後不會送出刪除 API，也不會重新呼叫 AI。",
    maxDisplayDetailTextLength
  );
}

function aiRemoveConfirmSourceCopy(confidencePercent: number) {
  const boundedPercent = clampNumber(confidencePercent, 0, 100);
  return boundDisplayText(`信心 ${boundedPercent}% · source: AI candidate`, maxDisplayDetailTextLength);
}

function transcriptReviewIntroCopy() {
  return boundDisplayText("確認目前輸入或本機 Whisper 轉出的紀錄文字，若有錯誤可直接修改。", maxDisplayDetailTextLength);
}

function transcriptReviewPreParseGuidanceCopy() {
  return boundDisplayText(
    "確認後，AI 會幫你整理成血糖、飲食與運動紀錄；範例文字不會送 parser。",
    maxDisplayDetailTextLength
  );
}

function transcriptReviewSampleWarningCopy() {
  return boundDisplayText(
    "目前是範例文字；請改成自己的紀錄內容後再整理，避免不必要的 parser / LLM 成本。",
    maxDisplayDetailTextLength
  );
}

function transcriptReviewPreflightPassedCopy() {
  return boundDisplayText("已通過本機長度與數字密度檢查；下一步才會送出 parser 請求。", maxDisplayDetailTextLength);
}

function previewRecordEditBoundaryCopy() {
  return boundDisplayText("這裡只修改待確認候選紀錄；按下確認儲存前不會寫入資料庫。", maxDisplayDetailTextLength);
}

function manualRecordConfirmIntroCopy() {
  return boundDisplayText(
    "這筆紀錄不經 AI parser，送出後會透過後端驗證、權限與 audit 路徑建立。",
    maxDisplayDetailTextLength
  );
}

function manualRecordConfirmSubmitLabel(isBusy: boolean) {
  return boundDisplayText(isBusy ? "建立中..." : "確認建立", maxDisplayTextLength);
}

function manualRecordConfirmReadyStatusMessage() {
  return boundUiMessage("請確認手動紀錄；送出前不會呼叫 AI 或 LLM。");
}

function manualRecordConfirmReturnStatusMessage() {
  return boundUiMessage("已返回手動新增；目前輸入已保留，可繼續修改。");
}

function manualRecordReturnStatusMessage(target: AppScreen) {
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

function recordDetailReturnStatusMessage(target: AppScreen) {
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

function tutorialRecordEntryStatusMessage() {
  return boundUiMessage("已從使用教學前往快速記錄；送出文字前不會呼叫 parser 或 LLM。");
}

function tutorialManualEntryStatusMessage() {
  return boundUiMessage("已從使用教學進入手動新增；此路徑不呼叫 AI、LLM 或 STT。");
}

function deleteConfirmIntroCopy() {
  return boundDisplayText(
    "刪除後會從目前清單移除；目前不保留本機復原副本。若 backend 已同步，請以後端狀態為準。",
    maxDisplayDetailTextLength
  );
}

function deleteConfirmRecordMetaCopy(dateTimeLabel: string, sourceLabel: string) {
  return boundDisplayText(
    `${boundDisplayText(dateTimeLabel, 80)} · ${boundDisplayText(sourceLabel, 80)}`,
    maxDisplayDetailTextLength
  );
}

function deleteConfirmSubmitLabel(isBusy: boolean) {
  return boundDisplayText(isBusy ? "刪除中..." : "確認刪除", maxDisplayTextLength);
}

function deleteConfirmReadyStatusMessage() {
  return boundUiMessage("請確認是否刪除這筆紀錄；按下確認刪除前不會送出 delete request。");
}

function deleteConfirmReturnStatusMessage() {
  return boundUiMessage("已取消刪除；紀錄保留，已返回記錄詳情。");
}

function recordEditIntroCopy() {
  return boundDisplayText(
    "修改以下內容，然後儲存。欄位會轉成後端結構化 payload。",
    maxDisplayDetailTextLength
  );
}

function recordEditOpenStatusMessage() {
  return boundUiMessage("正在編輯這筆紀錄；按下儲存修改前不會送出 update request。");
}

function recordEditCancelStatusMessage() {
  return boundUiMessage("已取消編輯；正式紀錄未變更，已返回記錄詳情。");
}

function recordResultDestinationStatusMessage(kind: "delete" | "update", target: AppScreen) {
  const kindLabel = kind === "delete" ? "刪除完成" : "更新完成";
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
  return boundUiMessage(`已從${kindLabel}前往${targetLabel}；不會重新送出 backend request 或呼叫 AI。`);
}

function historyNoRecordsTitleCopy() {
  return boundDisplayText("還沒有可顯示的歷史紀錄", maxDisplayTextLength);
}

function historyNoRecordsBodyCopy() {
  return boundDisplayText("建立真實紀錄後，這裡會依日期分組顯示你的資料。", maxDisplayDetailTextLength);
}

function historyNoRangeRecordsTitleCopy() {
  return boundDisplayText("這個範圍沒有紀錄", maxDisplayTextLength);
}

function historyNoRangeRecordsBodyCopy() {
  return boundDisplayText("可以切換時間範圍，或回到今日頁新增新的紀錄。", maxDisplayDetailTextLength);
}

function analysisSafetyIntroCopy() {
  return boundDisplayText("只做趨勢摘要，不提供診療建議。", maxDisplayDetailTextLength);
}

function analysisChartEmptyCopy() {
  return boundDisplayText("目前範圍沒有血糖資料", maxDisplayTextLength);
}

function analysisRangeSummaryCopy(recordCount: number, isPreviewMode: boolean) {
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

function analysisCustomRangeStatusCopy(range: AnalysisRange, customStart: string, customEnd: string) {
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

function analysisReportButtonLabel(isLoading: boolean) {
  return boundDisplayText(isLoading ? "報告載入中..." : "查看詳細報告", maxDisplayTextLength);
}

function analysisCustomApplyStatusMessage() {
  return boundUiMessage("已套用自訂日期區間並同步 bounded report；不呼叫 AI 或 LLM。");
}

function analysisManualEntryStatusMessage() {
  return boundUiMessage("已從基本分析進入手動新增；此路徑不呼叫 AI、LLM 或 STT。");
}

function analysisReturnTodayStatusMessage() {
  return boundUiMessage("已從基本分析回到今日紀錄；只使用已載入紀錄，不額外查詢 backend。");
}

function analysisDetailedReportStatusMessage() {
  return boundUiMessage("已開啟詳細報告；會使用固定查詢上限，且不呼叫 AI 或 LLM。");
}

function detailedReportReturnAnalysisStatusMessage() {
  return boundUiMessage("已從詳細報告返回基本分析；不重新查詢 backend 或呼叫 AI。");
}

function detailedReportManualEntryStatusMessage() {
  return boundUiMessage("已從詳細報告進入手動新增；此路徑不呼叫 AI、LLM 或 STT。");
}

function detailedReportReturnTodayStatusMessage() {
  return boundUiMessage("已從詳細報告回到今日紀錄；不重新查詢 backend 或呼叫 AI。");
}

function coreFlowSectionLabels() {
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
    enterSaveConfirm: boundDisplayText("進入儲存確認", maxDisplayTextLength),
    enterSaveConfirmAccessibility: boundDisplayText("進入儲存確認，不儲存也不重新呼叫 AI", maxDisplayDetailTextLength),
    returnTextConfirm: boundDisplayText("回文字確認", maxDisplayTextLength),
    returnTextConfirmAccessibility: boundDisplayText("回文字確認，不送 parser 或寫入資料", maxDisplayDetailTextLength),
    returnConfirm: boundDisplayText("返回確認", maxDisplayTextLength),
    returnConfirmAccessibility: boundDisplayText("返回確認，保留候選紀錄且不送 backend", maxDisplayDetailTextLength),
    submitAiSaveAccessibility: boundDisplayText("確認儲存目前候選紀錄，送 backend 驗證與 audit", maxDisplayDetailTextLength),
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

function auxiliarySectionLabels() {
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
    storePreview: boundDisplayText("商城預覽", maxDisplayTextLength),
    storeProductStatus: boundDisplayText("商品整合狀態", maxDisplayTextLength),
    foodPhotoStatus: boundDisplayText("拍照整合狀態", maxDisplayTextLength),
    achievementsReturnAccessibility: boundDisplayText("返回上一個功能入口，不寫入成就資料", maxDisplayDetailTextLength),
    yearReviewReturnAccessibility: boundDisplayText("返回上一個功能入口，不產生分享圖或公開資料", maxDisplayDetailTextLength),
    storeReturnAccessibility: boundDisplayText("返回上一個功能入口，不建立訂單或付款", maxDisplayDetailTextLength),
    storeCartCheckoutAccessibility: boundDisplayText("結帳尚未開放，不建立訂單或付款", maxDisplayDetailTextLength),
    storeCartReturnAccessibility: boundDisplayText("返回商城預覽，不建立訂單或付款", maxDisplayDetailTextLength),
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

function advancedSettingsToggleLabel(isExpanded: boolean) {
  return boundDisplayText(isExpanded ? "收合進階設定" : "顯示進階設定", maxDisplayTextLength);
}

function backendReconnectButtonLabel(isConnecting: boolean) {
  return boundDisplayText(isConnecting ? "連線中..." : "重新連線", maxDisplayTextLength);
}

function nativeModuleCheckButtonLabel(isRunning: boolean) {
  return boundDisplayText(isRunning ? "處理中..." : "檢查 native modules", maxDisplayTextLength);
}

function nativeModelDownloadButtonLabel(isRunning: boolean, progress: number) {
  const boundedProgress = clampNumber(Math.round(progress * 100), 0, 100);
  return boundDisplayText(
    `${isRunning ? "處理中 " : "下載模型 "}${boundedProgress > 0 ? `${boundedProgress}%` : ""}`,
    maxDisplayTextLength
  );
}

function nativeDownloadKindAccessibilityLabel(kind: "whisper" | "llama", selectedKind: "whisper" | "llama") {
  const label = kind === "whisper" ? "Whisper" : "Llama";
  const selectedCopy = kind === selectedKind ? "目前選取" : "切換下載類型";
  return boundDisplayText(`${selectedCopy} ${label} 本機模型下載；不呼叫雲端 AI`, maxDisplayDetailTextLength);
}

function nativeModuleCheckAccessibilityLabel(isRunning: boolean) {
  return boundDisplayText(
    isRunning ? "正在檢查 native modules，不呼叫 backend 或 AI" : "檢查 native modules，不呼叫 backend 或 AI",
    maxDisplayDetailTextLength
  );
}

function nativeModelDownloadAccessibilityLabel(isRunning: boolean, progress: number) {
  const boundedProgress = clampNumber(Math.round(progress * 100), 0, 100);
  return boundDisplayText(
    isRunning
      ? `正在下載本機模型 ${boundedProgress}%；只更新本機檔案狀態`
      : "下載本機模型；不送出健康資料、不呼叫 LLM",
    maxDisplayDetailTextLength
  );
}

function nativeWhisperRunAccessibilityLabel(isRunning: boolean) {
  return boundDisplayText(
    isRunning ? "正在執行本機 Whisper，輸出仍需使用者確認" : "執行本機 Whisper，僅讀取指定本機音檔",
    maxDisplayDetailTextLength
  );
}

function nativeLlamaRunAccessibilityLabel(isRunning: boolean) {
  return boundDisplayText(
    isRunning ? "正在執行本機 Llama，只顯示 bounded 摘要" : "執行本機 Llama，不顯示完整 raw model output",
    maxDisplayDetailTextLength
  );
}

function nativeBenchmarkAccessibilityLabel(isRunning: boolean) {
  return boundDisplayText(
    isRunning ? "正在執行本機 benchmark，不呼叫雲端模型" : "執行本機 Whisper 與 Llama benchmark，不呼叫雲端模型",
    maxDisplayDetailTextLength
  );
}

function returnDestinationButtonLabel(destination: AppScreen) {
  if (destination === "futureModules") {
    return boundDisplayText("返回未來擴充", maxDisplayTextLength);
  }
  if (destination === "menu") {
    return boundDisplayText("返回功能選單", maxDisplayTextLength);
  }
  return boundDisplayText("返回上一頁", maxDisplayTextLength);
}

function headerActionAccessibilityLabel(chrome: { actionLabel?: string }) {
  if (chrome.actionLabel === "×") {
    return boundDisplayText("關閉目前頁面", maxDisplayTextLength);
  }
  if (chrome.actionLabel === "‹") {
    return boundDisplayText("返回上一頁", maxDisplayTextLength);
  }
  return boundDisplayText("開啟功能選單", maxDisplayTextLength);
}

function recordingButtonAccessibilityLabel(isRecording: boolean) {
  return boundDisplayText(isRecording ? "錄音預覽進行中，放開結束" : "按住開始錄音預覽", maxDisplayTextLength);
}

function subscriptionTrialBoundaryCopy() {
  return boundDisplayText("7天免費試用，正式付款串接前不會啟動試用或自動轉年費。", maxDisplayDetailTextLength);
}

function subscriptionPaymentUnwiredCopy() {
  return boundDisplayText(
    "目前只顯示會員與額度 UI；不會啟動試用、不會收款，也不會改變 entitlements。",
    maxDisplayDetailTextLength
  );
}

function subscriptionCtaBoundaryCopy() {
  return boundDisplayText(
    "目前 CTA 只顯示整合狀態，不會建立訂閱、不會收款，也不會改變會員權益。",
    maxDisplayDetailTextLength
  );
}

function subscriptionSyncButtonLabel(isSyncing: boolean) {
  return boundDisplayText(isSyncing ? "同步中..." : "同步", maxDisplayTextLength);
}

function subscriptionManagementIntroCopy() {
  return boundDisplayText("查看付款、receipt 驗證與會員權益同步的正式整合邊界。", maxDisplayDetailTextLength);
}

function subscriptionManagementNoActionCopy() {
  return boundDisplayText(
    "此頁不開啟付款、不建立試用、不改變會員權益、不寫入 entitlement，也不呼叫 AI 或 LLM。",
    maxDisplayDetailTextLength
  );
}

function subscriptionManagementSyncButtonLabel(isSyncing: boolean) {
  return boundDisplayText(isSyncing ? "同步中..." : "同步狀態", maxDisplayTextLength);
}

function subscriptionManagementOpenStatusMessage() {
  return boundUiMessage("已前往訂閱管理；目前只顯示付款與 entitlement 同步邊界，不會建立訂閱。");
}

function subscriptionMembershipStatusOpenStatusMessage() {
  return boundUiMessage("已前往會員狀態；只顯示目前已同步狀態，不會收款或改變 entitlement。");
}

function subscriptionManagementReturnSettingsStatusMessage() {
  return boundUiMessage("已返回設定；訂閱管理頁不會建立試用、收款或改變會員權益。");
}

function settingsAccountSecurityOpenStatusMessage() {
  return boundUiMessage("已前往帳號與登入安全；本頁不呼叫 AI，也不寫入健康紀錄。");
}

function settingsSubpageReturnStatusMessage() {
  return boundUiMessage("已返回設定；子頁預覽不會呼叫 AI、LLM 或寫入 backend。");
}

function menuReturnStatusMessage(target: AppScreen) {
  const targetLabel = target === "today" ? "今日紀錄" : target === "record" ? "快速記錄" : "上一頁";
  return boundUiMessage(`已返回${targetLabel}；功能選單導覽不呼叫 AI、LLM、STT、Vision 或 backend write。`);
}

function membershipStatusReturnSubscriptionStatusMessage() {
  return boundUiMessage("已返回會員方案；會員狀態頁只讀取目前同步資料，不會呼叫付款或 AI。");
}

function recordingQuotaIntroCopy() {
  return boundDisplayText("顯示今日語音用量；平時不打擾，接近上限才提醒。", maxDisplayDetailTextLength);
}

function recordingQuotaControlCopy() {
  return boundDisplayText(
    "額度由 backend entitlement / quota API 決定；mobile 不自行信任本機計數，也不把錄音檔或逐字稿寫入此頁。",
    maxDisplayDetailTextLength
  );
}

function recordingQuotaSyncButtonLabel(isSyncing: boolean) {
  return boundDisplayText(isSyncing ? "同步中..." : "同步額度", maxDisplayTextLength);
}

function recordingQuotaSyncAccessibilityLabel(isSyncing: boolean) {
  return boundDisplayText(
    isSyncing ? "正在同步語音額度，不上傳錄音或逐字稿" : "同步語音額度，只讀取 backend quota metadata",
    maxDisplayDetailTextLength
  );
}

function reminderSettingsIntroCopy() {
  return boundDisplayText("先規劃提醒 UI；正式通知與背景排程尚未啟用。", maxDisplayDetailTextLength);
}

function reminderIntegrationButtonLabel() {
  return boundDisplayText("查看通知整合狀態", maxDisplayTextLength);
}

function reminderIntegrationAccessibilityLabel() {
  return boundDisplayText("查看通知整合狀態，不建立通知或背景排程", maxDisplayDetailTextLength);
}

function privacySettingsIntroCopy() {
  return boundDisplayText("先定義分享、匯出、刪除與通知內容邊界。", maxDisplayDetailTextLength);
}

function privacyIntegrationButtonLabel() {
  return boundDisplayText("查看隱私整合狀態", maxDisplayTextLength);
}

function privacyIntegrationAccessibilityLabel() {
  return boundDisplayText("查看隱私整合狀態，不匯出、刪除或公開資料", maxDisplayDetailTextLength);
}

function settingsSubscriptionSectionLabels() {
  const syncQuota = boundDisplayText("同步", maxDisplayTextLength);
  const trialIntegrationButton = boundDisplayText("查看試用整合狀態", maxDisplayTextLength);
  const manageSubscribedPlan = boundDisplayText("已訂閱？管理方案", maxDisplayTextLength);
  const memberStatusButton = boundDisplayText("查看會員狀態", maxDisplayTextLength);
  const returnSettings = boundDisplayText("返回設定", maxDisplayTextLength);
  const paymentIntegrationButton = boundDisplayText("查看付款整合狀態", maxDisplayTextLength);
  const renewalIntegrationButton = boundDisplayText("查看續訂整合狀態", maxDisplayTextLength);
  const managePlan = boundDisplayText("管理方案", maxDisplayTextLength);
  return {
    trialPaymentBoundary: boundDisplayText("試用付款邊界", maxDisplayTextLength),
    paymentUnwired: boundDisplayText("付款未串接", maxDisplayTextLength),
    currentStatus: boundDisplayText("目前狀態", maxDisplayTextLength),
    todayRecordingQuota: boundDisplayText("今日錄音額度", maxDisplayTextLength),
    trialPlan: boundDisplayText("試用版", maxDisplayTextLength),
    annualPlan: boundDisplayText("年費會員", maxDisplayTextLength),
    featureComparison: boundDisplayText("功能比較", maxDisplayTextLength),
    formalReadiness: boundDisplayText("正式啟用前需要完成", maxDisplayTextLength),
    syncQuotaAccessibility: boundDisplayText(`${syncQuota}會員額度狀態，不建立訂閱或收款`, maxDisplayDetailTextLength),
    trialIntegrationButton,
    trialIntegrationAccessibility: boundDisplayText(`${trialIntegrationButton}，只顯示付款與 entitlement 邊界`, maxDisplayDetailTextLength),
    trialIntegrationStatus: boundDisplayText("試用整合狀態", maxDisplayTextLength),
    manageSubscribedPlan,
    manageSubscribedPlanAccessibility: boundDisplayText(`${manageSubscribedPlan}，前往訂閱管理預覽`, maxDisplayDetailTextLength),
    memberStatusButton,
    memberStatusAccessibility: boundDisplayText(`${memberStatusButton}，查看目前同步會員資料`, maxDisplayDetailTextLength),
    currentMemberStatus: boundDisplayText("目前會員狀態", maxDisplayTextLength),
    noAction: boundDisplayText("目前不做的事", maxDisplayTextLength),
    returnSettings,
    returnSettingsAccessibility: boundDisplayText(`${returnSettings}，不改變會員權益`, maxDisplayDetailTextLength),
    paymentIntegrationButton,
    paymentIntegrationAccessibility: boundDisplayText(`${paymentIntegrationButton}，只顯示付款串接狀態`, maxDisplayDetailTextLength),
    paymentIntegrationStatus: boundDisplayText("付款整合狀態", maxDisplayTextLength),
    memberFeatures: boundDisplayText("會員專屬功能", maxDisplayTextLength),
    founderAnnualPrice: boundDisplayText("創始會員年費", maxDisplayTextLength),
    renewalUnwired: boundDisplayText("續訂未串接", maxDisplayTextLength),
    renewalIntegrationButton,
    renewalIntegrationAccessibility: boundDisplayText(`${renewalIntegrationButton}，前往訂閱管理預覽`, maxDisplayDetailTextLength),
    managePlan,
    managePlanAccessibility: boundDisplayText(`${managePlan}，前往訂閱管理預覽`, maxDisplayDetailTextLength),
    authProviderPreview: boundDisplayText("正式登入方式預覽", maxDisplayTextLength),
    sessionPreview: boundDisplayText("裝置與 Session 管理預覽", maxDisplayTextLength),
    authReadiness: boundDisplayText("正式 auth readiness", maxDisplayTextLength),
    authBoundary: boundDisplayText("正式 auth 必備邊界", maxDisplayTextLength),
    localStateResult: boundDisplayText("本機狀態結果", maxDisplayTextLength),
    localClearButton: boundDisplayText("清除本機狀態", maxDisplayTextLength),
    localClearAccessibility: boundDisplayText("清除本機 session 與預覽狀態，不刪除 backend 紀錄", maxDisplayDetailTextLength),
    advancedSettingsToggleAccessibility: boundDisplayText("展開或收合進階設定，不連線 backend 或啟動模型", maxDisplayDetailTextLength),
    backendReconnectAccessibility: boundDisplayText("重新連線 backend，會清除 stale session/model/record state", maxDisplayDetailTextLength),
    refreshSession: boundDisplayText("刷新 session", maxDisplayTextLength),
    refreshSessionAccessibility: boundDisplayText("刷新 session，使用 SecureStore refresh token rotation", maxDisplayDetailTextLength),
    loadSessions: boundDisplayText("載入 sessions", maxDisplayTextLength),
    loadSessionsAccessibility: boundDisplayText("載入 sessions，只顯示 bounded session metadata", maxDisplayDetailTextLength),
    logoutLocal: boundDisplayText("登出本機", maxDisplayTextLength),
    logoutLocalAccessibility: boundDisplayText("登出本機，revoke session 並清除本機安全 token", maxDisplayDetailTextLength),
    logoutAll: boundDisplayText("登出全部", maxDisplayTextLength),
    logoutAllAccessibility: boundDisplayText("登出全部裝置，revoke backend sessions 並清除本機 token", maxDisplayDetailTextLength),
    profileEditReadiness: boundDisplayText("正式編輯前需要完成", maxDisplayTextLength),
    editIntegrationButton: boundDisplayText("查看編輯整合狀態", maxDisplayTextLength),
    editIntegrationAccessibility: boundDisplayText("查看個人資料編輯整合狀態，不寫入個資或照護對象", maxDisplayDetailTextLength),
    editIntegrationStatus: boundDisplayText("編輯整合狀態", maxDisplayTextLength),
    voiceUsageStatus: boundDisplayText("今日語音使用狀態", maxDisplayTextLength),
    dataCostBoundary: boundDisplayText("資料與成本邊界", maxDisplayTextLength),
    quotaSyncStatus: boundDisplayText("額度同步狀態", maxDisplayTextLength),
    notificationStatus: boundDisplayText("通知整合狀態", maxDisplayTextLength),
    privacyStatus: boundDisplayText("隱私整合狀態", maxDisplayTextLength)
  };
}

function futureModuleDetailBoundaryCopy() {
  return boundDisplayText(
    "這個頁面只整理 UI 入口、工程前置條件與資料安全邊界；目前不呼叫 API、不寫入資料、不啟動背景工作，也不呼叫 AI。",
    maxDisplayDetailTextLength
  );
}

function futureModuleImplementationOrderCopy() {
  return boundDisplayText(
    "實作順序建議：先完成 production auth、權限模型、schema/source 欄位與 audit trail，再開啟任何外部分享、排行榜、匯入或圖片分析功能。",
    maxDisplayDetailTextLength
  );
}

function futurePreviewSectionLabels() {
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

function futureModulesOpenStatusMessage() {
  return boundUiMessage("已開啟未來擴充清單；預覽入口不呼叫 backend、AI、Vision 或 payment。");
}

function futureModulesReturnMenuStatusMessage() {
  return boundUiMessage("已從未來擴充返回功能選單；未來模組預覽不會寫入資料或呼叫 AI。");
}

function futureModuleDetailReturnStatusMessage() {
  return boundUiMessage("已返回未來擴充清單；未完成模組詳情只顯示本機預覽。");
}

function futurePreviewReturnStatusMessage(target: AppScreen) {
  const targetLabel = target === "menu" ? "功能選單" : target === "futureModules" ? "未來擴充" : "上一頁";
  return boundUiMessage(`已返回${targetLabel}；preview 不呼叫 backend、AI、Vision 或 payment。`);
}

function commercePreviewOpenCartStatusMessage() {
  return boundUiMessage("已開啟購物車整合狀態；preview 不建立 cart、order、payment 或 backend write。");
}

function commercePreviewReturnStoreStatusMessage() {
  return boundUiMessage("已返回商城預覽；購物車 preview 不建立訂單、不保存購物車，也不處理付款。");
}

function achievementPreviewBoundaryCopy() {
  return boundDisplayText(
    "成就可同步 backend 依記錄聚合的 MVP 徽章摘要；backend 不可用或 visual smoke 時保留本機推算。",
    maxDisplayDetailTextLength
  );
}

function achievementLocalComputationCopy() {
  return boundDisplayText(
    "成就摘要只讀取既有紀錄並聚合進度；按下同步才會保存已解鎖徽章，不呼叫 AI、不更新排行榜，也不提供醫療建議。",
    maxDisplayDetailTextLength
  );
}

function achievementNextBadgeCopy(remainingProgress: number) {
  const boundedProgress = clampNumber(remainingProgress, 0, maxMobileCountValue);
  return boundDisplayText(
    boundedProgress > 0 ? `下一個徽章還差 ${boundedProgress} 點進度` : "目前清單已全部完成",
    maxDisplayTextLength
  );
}

function achievementIntegrationButtonLabel() {
  return boundDisplayText("同步徽章解鎖", maxDisplayTextLength);
}

function achievementIntegrationButtonAccessibilityLabel() {
  return boundDisplayText("同步成就徽章解鎖紀錄，不更新排行榜或公開資料", maxDisplayDetailTextLength);
}

function yearReviewPreviewBoundaryCopy() {
  return boundDisplayText(
    "backend ready 時同步保存年度 snapshot，並準備 privacy-masked 年度分享 package；離線時使用已載入紀錄即時計算。",
    maxDisplayDetailTextLength
  );
}

function yearReviewHeroRecordCountCopy(count: number) {
  const boundedCount = clampNumber(count, 0, maxMobileCountValue);
  return boundDisplayText(`前一年度共記錄 ${boundedCount} 次`, maxDisplayTextLength);
}

function yearReviewLiveCalculationCopy(targetYear: number, generationLabel: string) {
  return boundDisplayText(`${targetYear} 年資料；${generationLabel}。同步成功後會使用 backend snapshot。`, maxDisplayDetailTextLength);
}

function yearReviewSourceDisplayCopy(summary: YearReviewApiResponse | null, sharePackageId: string) {
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

function yearReviewBadgeMaterialCopy() {
  return boundDisplayText(
    "你的努力值得這枚徽章；正式徽章素材可後續替換，年度分享卡使用 backend 隱私遮罩摘要。",
    maxDisplayDetailTextLength
  );
}

function yearReviewShareButtonLabel() {
  return boundDisplayText("產生年度分享卡", maxDisplayTextLength);
}

function yearReviewShareButtonAccessibilityLabel() {
  return boundDisplayText("產生年度回顧公開摘要分享卡，確認隱私遮罩後開啟原生分享", maxDisplayDetailTextLength);
}

function yearReviewRevokeShareButtonLabel() {
  return boundDisplayText("撤回年度分享", maxDisplayTextLength);
}

function yearReviewRevokeShareButtonAccessibilityLabel() {
  return boundDisplayText("撤回最近建立的年度回顧分享 package，停止後續分享狀態更新", maxDisplayDetailTextLength);
}

function yearReviewAiObservationCopy(recordCount: number, averageGlucose: number | null, longestStreak: number) {
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

function yearReviewAiEncouragementCopy(recordCount: number) {
  const boundedCount = clampNumber(recordCount, 0, maxMobileCountValue);
  return boundDisplayText(
    boundedCount > 0
      ? `AI 年度鼓勵預覽：你完成了 ${boundedCount} 筆健康紀錄，這些穩定累積能幫助你更了解自己的變化。`
      : "AI 年度鼓勵預覽：開始累積紀錄後，年度回顧會整理你的努力與下一步提醒。",
    maxDisplayDetailTextLength
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(initialVisualSmokeScreen ?? "today");
  const [apiBaseUrl, setApiBaseUrl] = useState(defaultApiBaseUrl);
  const [account, setAccount] = useState<Account | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [tokenStorageStatus, setTokenStorageStatus] = useState("安全 token storage 尚未讀取。");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState("");
  const [models, setModels] = useState<AiModelOptions>({ stt_models: [], llm_models: [] });
  const [sttModelId, setSttModelId] = useState("browser-web-speech");
  const [llmModelId, setLlmModelId] = useState("deepseek-chat");
  const [transcript, setTranscript] = useState(
    initialVisualSmokeScreen === "transcriptReview" ? sampleText : ""
  );
  const [transcriptVoiceSeconds, setTranscriptVoiceSeconds] = useState(0);
  const [isTranscriptSample, setIsTranscriptSample] = useState(false);
  const [preview, setPreview] = useState<ParsePreviewResponse | null>(
    visualSmokeNeedsPreview(initialVisualSmokeScreen) ? visualSmokeDemoPreview() : null
  );
  const [records, setRecords] = useState<RecordItem[]>(
    visualSmokeNeedsRecord(initialVisualSmokeScreen) ? visualSmokeDemoRecords() : []
  );
  const [isVisualSmokePreviewMode, setIsVisualSmokePreviewMode] = useState(Boolean(initialVisualSmokeScreen));
  const [recordsStatus, setRecordsStatus] = useState(recordSyncInitialStatusMessage());
  const [recordsHasMore, setRecordsHasMore] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(
    visualSmokeNeedsSelectedRecord(initialVisualSmokeScreen) ? visualSmokeDemoRecord() : null
  );
  const [selectedFutureModule, setSelectedFutureModule] = useState<FutureModuleCard | null>(
    initialVisualSmokeScreen === "futureModuleDetail" ? futureModuleCards[0] ?? null : null
  );
  const [menuReturnScreen, setMenuReturnScreen] = useState<AppScreen>("today");
  const [recordDetailReturnScreen, setRecordDetailReturnScreen] = useState<AppScreen>("today");
  const [transcriptReviewReturnScreen, setTranscriptReviewReturnScreen] =
    useState<AppScreen>("record");
  const [manualRecordReturnScreen, setManualRecordReturnScreen] = useState<AppScreen>("today");
  const [subscriptionReturnScreen, setSubscriptionReturnScreen] = useState<AppScreen>("menu");
  const [tutorialReturnScreen, setTutorialReturnScreen] = useState<AppScreen>("menu");
  const [foodPhotoReturnScreen, setFoodPhotoReturnScreen] = useState<AppScreen>("menu");
  const [doctorShareReturnScreen, setDoctorShareReturnScreen] = useState<AppScreen>("futureModules");
  const [healthIntegrationReturnScreen, setHealthIntegrationReturnScreen] = useState<AppScreen>("futureModules");
  const [communityReturnScreen, setCommunityReturnScreen] = useState<AppScreen>("futureModules");
  const [rankingReturnScreen, setRankingReturnScreen] = useState<AppScreen>("futureModules");
  const [achievementsReturnScreen, setAchievementsReturnScreen] = useState<AppScreen>("menu");
  const [yearReviewReturnScreen, setYearReviewReturnScreen] = useState<AppScreen>("menu");
  const [storeReturnScreen, setStoreReturnScreen] = useState<AppScreen>("menu");
  const [saveSuccessReturnScreen, setSaveSuccessReturnScreen] = useState<AppScreen>("today");
  const [lastSavedSummary, setLastSavedSummary] = useState(
    initialVisualSmokeScreen === "saveSuccess" ? "Visual smoke demo save result." : ""
  );
  const [lastSaveErrorSummary, setLastSaveErrorSummary] = useState(
    initialVisualSmokeScreen === "aiSaveFailure" ? "Visual smoke demo save failure." : ""
  );
  const [lastSaveEntryMethod, setLastSaveEntryMethod] = useState<SaveEntryMethod>(
    initialVisualSmokeScreen === "saveSuccess" ? "ai" : null
  );
  const [lastDeletedSummary, setLastDeletedSummary] = useState(
    initialVisualSmokeScreen === "deleteSuccess" ? "Visual smoke demo delete result." : ""
  );
  const [lastUpdatedSummary, setLastUpdatedSummary] = useState(
    initialVisualSmokeScreen === "updateSuccess" ? "Visual smoke demo update result." : ""
  );
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number | null>(
    initialVisualSmokeScreen === "editPreviewRecord" ? 0 : null
  );
  const [pendingPreviewRemoveIndex, setPendingPreviewRemoveIndex] = useState<number | null>(
    initialVisualSmokeScreen === "aiRemoveConfirm" ? 0 : null
  );
  const [previewEditFields, setPreviewEditFields] = useState<RecordEditFields>(() =>
    initialVisualSmokeScreen === "editPreviewRecord" ? visualSmokeDemoRecordEditFields() : emptyRecordEditFields()
  );
  const [recordEditFields, setRecordEditFields] = useState<RecordEditFields>(() =>
    initialVisualSmokeScreen === "editRecord" ? visualSmokeDemoRecordEditFields() : emptyRecordEditFields()
  );
  const [manualRecordType, setManualRecordType] = useState<ManualRecordType>("glucose");
  const [manualRecordFields, setManualRecordFields] = useState<RecordEditFields>(() =>
    initialVisualSmokeScreen === "manualRecordConfirm" ? visualSmokeDemoRecordEditFields() : emptyRecordEditFields()
  );
  const [recordEditDate, setRecordEditDate] = useState(formatLocalDateInput(new Date()));
  const [recordEditTime, setRecordEditTime] = useState(formatLocalTimeInput(new Date()));
  const [previewEditDate, setPreviewEditDate] = useState(formatLocalDateInput(new Date()));
  const [previewEditTime, setPreviewEditTime] = useState(formatLocalTimeInput(new Date()));
  const [manualRecordDate, setManualRecordDate] = useState(formatLocalDateInput(new Date()));
  const [manualRecordTime, setManualRecordTime] = useState(formatLocalTimeInput(new Date()));
  const [status, setStatus] = useState(mainInitialStatusMessage());
  const [parserRecoveryMessage, setParserRecoveryMessage] = useState("");
  const [authActionStatus, setAuthActionStatus] = useState("");
  const [authSessions, setAuthSessions] = useState<AuthSessionItem[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [isQuotaSyncing, setIsQuotaSyncing] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isAuthOperationInFlight, setIsAuthOperationInFlight] = useState(false);
  const bootInFlight = useRef(false);
  const latestBootKey = useRef("");
  const quotaSyncInFlightKeys = useRef<Set<string>>(new Set());
  const latestQuotaSyncKey = useRef("");
  const reportLoadInFlightKeys = useRef<Set<string>>(new Set());
  const latestReportLoadKey = useRef("");
  const recordSyncInFlightKeys = useRef<Set<string>>(new Set());
  const latestRecordSyncKey = useRef("");
  const pendingOidcChallenge = useRef<AuthProviderChallenge | null>(null);
  const parsePreviewInFlight = useRef(false);
  const previewSaveInFlight = useRef(false);
  const recordUpdateInFlight = useRef(false);
  const recordDeleteInFlight = useRef(false);
  const manualCreateInFlight = useRef(false);
  const communitySyncInFlightKeys = useRef<Set<string>>(new Set());
  const latestCommunitySyncKey = useRef("");
  const foodCommunityDetailInFlightKeys = useRef<Set<string>>(new Set());
  const latestFoodCommunityDetailKey = useRef("");
  const rankingSyncInFlightKeys = useRef<Set<string>>(new Set());
  const latestRankingSyncKey = useRef("");
  const storeSyncInFlightKeys = useRef<Set<string>>(new Set());
  const latestStoreSyncKey = useRef("");
  const achievementSyncInFlightKeys = useRef<Set<string>>(new Set());
  const latestAchievementSyncKey = useRef("");
  const yearReviewSyncInFlightKeys = useRef<Set<string>>(new Set());
  const latestYearReviewSyncKey = useRef("");
  const foodShareInFlight = useRef(false);
  const storeRedemptionInFlight = useRef(false);
  const audioRecordingRef = useRef<Audio.Recording | null>(null);
  const recordingStartInFlight = useRef(false);
  const recordingStopInFlight = useRef(false);
  const visualSmokePreviewActive = useRef(Boolean(initialVisualSmokeScreen));
  const [nativeStatus, setNativeStatus] = useState(nativeDebugDefaultStatusMessage());
  const [whisperModelPath, setWhisperModelPath] = useState("");
  const [audioPath, setAudioPath] = useState("");
  const [llamaModelPath, setLlamaModelPath] = useState("");
  const [llamaDebugOutput, setLlamaDebugOutput] = useState("");
  const [modelUrl, setModelUrl] = useState("");
  const [downloadKind, setDownloadKind] = useState<"whisper" | "llama">("llama");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedModels, setDownloadedModels] = useState<DownloadedModel[]>([]);
  const [voiceQuota, setVoiceQuota] = useState<VoiceQuota | null>(null);
  const [quotaStatus, setQuotaStatus] = useState(voiceQuotaInitialStatusMessage());
  const [subscriptionActionStatus, setSubscriptionActionStatus] = useState("");
  const [subscriptionManagementActionStatus, setSubscriptionManagementActionStatus] = useState("");
  const [basicReport, setBasicReport] = useState<BasicReport | null>(
    initialVisualSmokeScreen === "detailedReport" ? visualSmokeDemoReport() : null
  );
  const [basicReportKey, setBasicReportKey] = useState(initialVisualSmokeScreen === "detailedReport" ? "visual-smoke" : "");
  const [reportStatus, setReportStatus] = useState(
    initialVisualSmokeScreen === "detailedReport"
      ? visualSmokeRecordSyncStatusMessage()
      : detailedReportNotLoadedStatusMessage()
  );
  const [isRecordingPreview, setIsRecordingPreview] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [recordingElapsedSeconds, setRecordingElapsedSeconds] = useState(0);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(formatLocalDateInput(new Date()));
  const [historyDetailMode, setHistoryDetailMode] = useState<HistoryDetailMode>("structured");
  const [analysisRange, setAnalysisRange] = useState<AnalysisRange>("month");
  const [analysisCustomStart, setAnalysisCustomStart] = useState(formatLocalDateInput(startOfCurrentMonth()));
  const [analysisCustomEnd, setAnalysisCustomEnd] = useState(formatLocalDateInput(new Date()));
  const [selectedAnalysisPointIndex, setSelectedAnalysisPointIndex] = useState<number | null>(null);
  const [storeCategory, setStoreCategory] = useState<StoreCategory>("coupons");
  const [storeSearchText, setStoreSearchText] = useState("");
  const [storeActionStatus, setStoreActionStatus] = useState("");
  const [storeBackendProducts, setStoreBackendProducts] = useState<StoreProduct[]>([]);
  const [storePointsBalance, setStorePointsBalance] = useState<StoreApiPointsBalance | null>(null);
  const [storeRedemptions, setStoreRedemptions] = useState<StoreApiRedemption[]>([]);
  const [foodPhotoActionStatus, setFoodPhotoActionStatus] = useState("");
  const [doctorShareActionStatus, setDoctorShareActionStatus] = useState(previewActionClearStatusMessage());
  const [healthIntegrationActionStatus, setHealthIntegrationActionStatus] = useState(previewActionClearStatusMessage());
  const [communityActionStatus, setCommunityActionStatus] = useState(previewActionClearStatusMessage());
  const [foodCommunityCategory, setFoodCommunityCategory] = useState<FoodCommunityCategory>("vegetable");
  const [foodCommunityBackendCategories, setFoodCommunityBackendCategories] = useState<Array<{ id: FoodCommunityCategory; label: string; foodCount: number; sampleFoods: string[] }>>([]);
  const [foodCommunitySearchText, setFoodCommunitySearchText] = useState("");
  const [selectedFoodCommunityItemId, setSelectedFoodCommunityItemId] = useState("leafy-greens");
  const [foodCommunityBackendItems, setFoodCommunityBackendItems] = useState<FoodCommunityItem[]>([]);
  const [foodCommunityShareFields, setFoodCommunityShareFields] = useState<FoodCommunityShareFields>(() => emptyFoodCommunityShareFields());
  const [communityPublicSettings, setCommunityPublicSettings] = useState<CommunityPublicSettings | null>(null);
  const [communityPublicDisplayNameDraft, setCommunityPublicDisplayNameDraft] = useState("");
  const [rankingActionStatus, setRankingActionStatus] = useState(previewActionClearStatusMessage());
  const [rankingLeaderboardSections, setRankingLeaderboardSections] = useState<CommunityLeaderboardDisplaySection[]>([]);
  const [achievementBackendItems, setAchievementBackendItems] = useState<AchievementItem[]>([]);
  const [achievementNewlyUnlockedItems, setAchievementNewlyUnlockedItems] = useState<AchievementItem[]>([]);
  const [achievementUnlockedItems, setAchievementUnlockedItems] = useState<AchievementItem[]>([]);
  const [achievementActionStatus, setAchievementActionStatus] = useState("");
  const [yearReviewActionStatus, setYearReviewActionStatus] = useState("");
  const [yearReviewBackendSummary, setYearReviewBackendSummary] = useState<YearReviewApiResponse | null>(null);
  const [yearReviewSharePackageId, setYearReviewSharePackageId] = useState("");
  const [futureModuleActionStatus, setFutureModuleActionStatus] = useState(previewActionClearStatusMessage());
  const [devResetStatus, setDevResetStatus] = useState("");
  const [profileActionStatus, setProfileActionStatus] = useState("");
  const [recordingQuotaActionStatus, setRecordingQuotaActionStatus] = useState("");
  const [reminderActionStatus, setReminderActionStatus] = useState("");
  const [privacyActionStatus, setPrivacyActionStatus] = useState("");
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const normalizedApiBaseUrl = useMemo(() => normalizeApiBaseUrl(apiBaseUrl), [apiBaseUrl]);
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? null;
  const selectedSttModel = models.stt_models.find((model) => model.id === sttModelId) ?? null;
  const selectedLlmModel = models.llm_models.find((model) => model.id === llmModelId) ?? null;
  const parserModelUnavailableMessage = parserModelUnavailableText(selectedLlmModel, selectedSttModel);
  const parserModelReady = parserModelUnavailableMessage.length === 0;
  const accountDisplayName = accountDisplayNameDisplayText(account);
  const accountEmailDisplayText = accountEmailDisplayValue(account);
  const accountLoginDisplayText = accountLoginDisplayValue(account);
  const doctorShareAccountBoundaryDisplayText = doctorShareAccountBoundaryText(account);
  const activeProfileLabel = activeProfileLabelText(activeProfile, profiles.length);
  const activeProfileInlineDisplayText = activeProfileInlineText(activeProfileLabel);
  const activeProfileRelationshipDisplayText = activeProfileRelationshipText(activeProfile);
  const accountPublicDisplayNameDisplayText = communityPublicSettings?.display_name ?? accountPublicDisplayNameText(account);
  const authModeLabel = allowMobileDevAuth ? "Dev Auth" : "Production Auth Required";
  const authModeCopy = allowMobileDevAuth
    ? "目前使用本機開發登入；正式 build 應關閉 dev auth 並接 JWT/OIDC。"
    : "dev login 已停用；本機預覽請先複製 mobile/.env.example 到 .env，正式版需接 JWT/OIDC 與安全 token 儲存。";
  const authModeDisplayLabel = boundDisplayText(authModeLabel, 40);
  const authModeDisplayCopy = boundDisplayText(authModeCopy, maxDisplayDetailTextLength);
  const accountSecurityCardAccessibilityLabel = boundDisplayText(
    `前往帳號安全設定：${accountDisplayName}，${accountLoginDisplayText}，${authModeDisplayLabel}`,
    maxDisplayDetailTextLength
  );
  const normalizedAccessToken = accessToken.trim();
  const accessTokenTooLarge = normalizedAccessToken.length > authAccessTokenMaxLength;
  const protectedHeaderMode =
    accessTokenTooLarge
      ? "token 過長"
      : normalizedAccessToken
      ? "Bearer token"
      : allowMobileDevAuth
        ? "Dev X-Account-Id"
        : "未可用";
  const tokenStorageMode = refreshToken ? "SecureStore 已載入" : normalizedAccessToken ? "記憶體暫存" : "未保存";
  const protectedAuthReady = Boolean(!accessTokenTooLarge && (normalizedAccessToken || allowMobileDevAuth));
  const protectedAccountBackendReady = Boolean(account && protectedAuthReady);
  const protectedBackendReady = Boolean(
    account && activeProfile && protectedAuthReady
  );
  const protectedAccountBackendUnavailableMessage = accessTokenTooLarge
    ? "access token 過長，請重新登入"
    : !account
      ? "請先連線 backend"
      : !normalizedAccessToken && !allowMobileDevAuth
        ? "請先完成正式登入或啟用 dev auth"
        : "";
  const protectedBackendUnavailableMessage =
    protectedAccountBackendUnavailableMessage ||
    (!activeProfile ? "請先選擇照護對象" : "");
  const parserModelUnavailableDisplayMessage = boundUiMessage(parserModelUnavailableMessage);
  const protectedBackendUnavailableDisplayMessage = boundUiMessage(protectedBackendUnavailableMessage);
  const recordsForDisplay = useMemo(
    () => (isVisualSmokePreviewMode ? visualSmokeDemoRecords() : records),
    [isVisualSmokePreviewMode, records]
  );
  const todayRecords = useMemo(
    () =>
      recordsForDisplay.filter((record) => {
        const occurredAt = new Date(record.occurred_at);
        const now = new Date();
        return isSameLocalDay(occurredAt, now);
      }),
    [recordsForDisplay]
  );
  const historyRecords = recordsForDisplay;
  const groupedHistoryRecords = useMemo(() => {
    const groups = new Map<string, RecordItem[]>();
    for (const record of historyRecords) {
      const key = new Date(record.occurred_at).toLocaleDateString("zh-TW", {
        month: "numeric",
        day: "numeric",
        weekday: "short"
      });
      groups.set(key, [...(groups.get(key) ?? []), record]);
    }
    return Array.from(groups.entries());
  }, [historyRecords]);
  const todayRecordDisplayItems = useMemo(
    () => todayRecords.map((record) => recordListDisplayItem(record, "today")),
    [todayRecords]
  );
  const groupedHistoryRecordDisplaySections = useMemo(
    () =>
      groupedHistoryRecords.map(([date, sectionRecords], sectionIndex) => ({
        key: `history-section-${boundIdentifier(date)}-${clampNumber(sectionIndex, 0, maxMobileCountValue)}`,
        dateLabel: boundDisplayText(date, 40),
        records: sectionRecords.map((record) => recordListDisplayItem(record, "history"))
      })),
    [groupedHistoryRecords]
  );
  const historyRecordsByDate = useMemo(() => {
    const groups = new Map<string, RecordItem[]>();
    for (const record of recordsForDisplay) {
      const key = localDateKey(record.occurred_at);
      if (!key) {
        continue;
      }
      groups.set(key, [...(groups.get(key) ?? []), record]);
    }
    return groups;
  }, [recordsForDisplay]);
  const historyCalendarMonthStart = useMemo(() => {
    const selected = new Date(`${selectedHistoryDate}T00:00:00`);
    const base = Number.isNaN(selected.getTime()) ? new Date() : selected;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }, [selectedHistoryDate]);
  const historyCalendarTitle = boundDisplayText(
    `${historyCalendarMonthStart.getFullYear()} 年 ${historyCalendarMonthStart.getMonth() + 1} 月`,
    40
  );
  const historyCalendarDisplayItems = useMemo(() => {
    const year = historyCalendarMonthStart.getFullYear();
    const month = historyCalendarMonthStart.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) =>
      historyCalendarDayDisplayItem(new Date(year, month, index + 1), selectedHistoryDate, historyRecordsByDate)
    );
  }, [historyCalendarMonthStart, historyRecordsByDate, selectedHistoryDate]);
  const selectedHistoryRecords = historyRecordsByDate.get(selectedHistoryDate) ?? [];
  const selectedHistoryRecordDisplayItems = useMemo(
    () => selectedHistoryRecords.map((record) => recordListDisplayItem(record, "history-selected")),
    [selectedHistoryRecords]
  );
  const selectedHistoryRawDisplayItems = useMemo(
    () => selectedHistoryRecords.map(historyRawRecordDisplayItem),
    [selectedHistoryRecords]
  );
  const selectedHistoryRecordDisplayCount = clampNumber(
    selectedHistoryRecords.length,
    0,
    maxMobileCountValue
  );
  const selectedHistoryDateDisplayText = boundDisplayText(selectedHistoryDate, 40);
  const historyPreviousMonthButtonLabel = boundDisplayText("上一月", 20);
  const historyNextMonthButtonLabel = boundDisplayText("下一月", 20);
  const historyPreviousMonthAccessibilityLabel = boundDisplayText(
    "查看上一個月份月曆，不呼叫 AI 或寫入資料",
    maxDisplayDetailTextLength
  );
  const historyNextMonthAccessibilityLabel = boundDisplayText(
    "查看下一個月份月曆，不呼叫 AI 或寫入資料",
    maxDisplayDetailTextLength
  );
  const analysisSelectedDateBounds = useMemo(
    () => analysisDateBounds(analysisRange, analysisCustomStart, analysisCustomEnd),
    [analysisCustomEnd, analysisCustomStart, analysisRange]
  );
  const analysisRecords = useMemo(() => {
    const { start, end } = analysisSelectedDateBounds;
    return recordsForDisplay.filter((record) => {
      const occurredAt = new Date(record.occurred_at);
      return occurredAt >= start && occurredAt <= end;
    });
  }, [analysisSelectedDateBounds, recordsForDisplay]);
  const analysisGlucoseRecords = useMemo(
    () =>
      analysisRecords
        .map((record) => ({
          record,
          value:
            record.record_type === "glucose" && typeof record.payload_json.value === "number"
              ? record.payload_json.value
              : null
        }))
        .filter((entry): entry is { record: RecordItem; value: number } => entry.value !== null),
    [analysisRecords]
  );
  const analysisGlucoseValues = analysisGlucoseRecords.map((entry) => entry.value);
  const analysisPreviewMode = recordsForDisplay.length === 0;
  const analysisRangeDisplayLabel = boundDisplayText(
    analysisRange === "custom"
      ? `${analysisCustomStart} - ${analysisCustomEnd}`
      : analysisRanges.find((item) => item.id === analysisRange)?.label ?? "本月",
    maxDisplayDetailTextLength
  );
  const analysisCustomRangeStatusDisplayText = analysisCustomRangeStatusCopy(
    analysisRange,
    analysisCustomStart,
    analysisCustomEnd
  );
  const analysisChartPoints = useMemo(() => {
    if (analysisGlucoseRecords.length > 0) {
      return analysisGlucoseRecords.slice(-12).map(({ record, value }) => ({
        id: record.id,
        label: formatChartDateLabel(record.occurred_at),
        value,
        preview: false
      }));
    }
    return [];
  }, [analysisGlucoseRecords]);
  const chartValues = analysisChartPoints.map((point) => point.value);
  const chartMinimum = chartValues.length > 0 ? Math.min(...chartValues, 80) : 80;
  const chartMaximum = chartValues.length > 0 ? Math.max(...chartValues, 220) : 220;
  const chartRange = Math.max(1, chartMaximum - chartMinimum);
  const selectedAnalysisPoint =
    selectedAnalysisPointIndex === null ? null : analysisChartPoints[selectedAnalysisPointIndex] ?? null;
  const averageGlucose = averageNumber(analysisGlucoseValues);
  const highestGlucose =
    analysisGlucoseValues.length === 0 ? null : Math.max(...analysisGlucoseValues);
  const lowestGlucose =
    analysisGlucoseValues.length === 0 ? null : Math.min(...analysisGlucoseValues);
  const beforeMealGlucoseCount = analysisGlucoseRecords.filter(
    ({ record }) => isBeforeMealGlucoseTiming(record.payload_json.meal_timing)
  ).length;
  const afterMealGlucoseCount = analysisGlucoseRecords.filter(
    ({ record }) => isAfterMealGlucoseTiming(record.payload_json.meal_timing)
  ).length;
  const quotaUsageRatio =
    voiceQuota && voiceQuota.daily_limit_seconds > 0
      ? Math.min(1, voiceQuota.used_seconds_today / voiceQuota.daily_limit_seconds)
      : 0;
  const quotaUsageDisplayPercent = clampNumber(Math.round(quotaUsageRatio * 100), 0, 100);
  const quotaRemainingLow =
    voiceQuota !== null &&
    voiceQuota.remaining_seconds_today > 0 &&
    voiceQuota.remaining_seconds_today <= 120;
  const quotaTrialDaysLeft = trialDaysLeft(voiceQuota?.trial_ends_at);
  const isAnyRequestInFlight = isBusy || isQuotaSyncing || isReportLoading || isAuthOperationInFlight;
  const unsavedPreviewRecordCount = preview?.records.length ?? 0;
  const unsavedPreviewRecordDisplayCount = clampNumber(unsavedPreviewRecordCount, 0, maxMobilePreviewRecords);
  const mobileRecordSyncDisplayLimit = clampNumber(mobileRecordSyncLimit, 0, maxMobileCountValue);
  const mobileReportQueryDisplayLimit = clampNumber(mobileReportQueryLimit, 0, maxMobileCountValue);
  const noRealRecordHealthValueDisplayText = noRealRecordHealthValueCopy("general");
  const historyNoRealRecordHealthValueDisplayText = noRealRecordHealthValueCopy("history");
  const analysisNoDataStatusDisplayLabel = analysisNoDataStatusLabel();
  const analysisNoDataDisplayCopy = analysisNoDataCopy();
  const analysisBoundaryDataDisplayCopy = analysisBoundaryDataCopy(analysisPreviewMode);
  const lowConfidencePreviewRecordCount =
    preview?.records.filter((record) => (record.confidence ?? 1) < 0.7).length ?? 0;
  const rejectedPreviewEventCount = preview?.rejected_events.length ?? 0;
  const lowConfidencePreviewRecordDisplayCount = clampNumber(lowConfidencePreviewRecordCount, 0, maxMobilePreviewRecords);
  const rejectedPreviewEventDisplayCount = clampNumber(rejectedPreviewEventCount, 0, maxMobileRejectedEvents);
  const rejectedPreviewDisplayItems =
    preview?.rejected_events.map((event) => ({
      id: boundIdentifier(event.segment_id),
      sourceText: boundDisplayText(event.source_text, maxDisplayDetailTextLength),
      reasonLabel: boundDisplayText(rejectedReasonLabel(event.reason), 80),
      reasonDisplayText: aiReviewRejectedReasonCopy(rejectedReasonLabel(event.reason))
    })) ?? [];
  const aiReviewDateDisplayLabel = boundDisplayText(
    preview ? aiReviewDateLabel(preview.records) : "",
    maxDisplayDetailTextLength
  );
  const aiReviewNoCandidateTitleDisplayText = aiReviewNoCandidateTitleCopy();
  const aiReviewNoCandidateBodyDisplayText = aiReviewNoCandidateBodyCopy();
  const aiReviewNoCandidateBoundaryDisplayText = aiReviewNoCandidateBoundaryCopy();
  const aiReviewNoPreviewTitleDisplayText = aiReviewNoPreviewTitleCopy();
  const aiReviewNoPreviewBodyDisplayText = aiReviewNoPreviewBodyCopy();
  const aiReviewIntroDisplayText = aiReviewIntroCopy();
  const aiReviewLowConfidenceDisplayText = aiReviewLowConfidenceCopy();
  const aiReviewRejectedEventsDisplayText = aiReviewRejectedEventsCopy();
  const aiReviewBackendRequiredDisplayText = aiReviewBackendRequiredCopy();
  const hasAiSaveConfirmWarnings =
    lowConfidencePreviewRecordCount > 0 || rejectedPreviewEventCount > 0;
  const isAiSaveConfirmBlockedByBackend = !protectedBackendReady;
  const aiSaveConfirmIntroDisplayText = aiSaveConfirmIntroCopy();
  const aiSaveConfirmSubmitDisplayLabel = aiSaveConfirmSubmitLabel(
    isBusy,
    isAiSaveConfirmBlockedByBackend,
    hasAiSaveConfirmWarnings
  );
  const hasUnsavedPreviewRecords = unsavedPreviewRecordCount > 0;
  const hasPartialAiSave = lastSaveEntryMethod === "ai" && hasUnsavedPreviewRecords;
  const hasManualFallbackWithAiCandidates =
    lastSaveEntryMethod === "manual" && hasUnsavedPreviewRecords;
  const aiSaveConfirmChecklistItems = [
    "只會儲存目前畫面上的候選紀錄。",
    `本次最多送出 ${unsavedPreviewRecordDisplayCount} 筆候選 payload，不會批次載入完整歷史。`,
    "送往 backend 的內容以確認後資料為主，不會附帶整段紀錄歷史或模型 debug trace。",
    "不會儲存未建立片段，也不會自動重新呼叫 AI。",
    "每筆紀錄仍會經過後端驗證、權限與 audit 路徑。",
    "若部分儲存失敗，已成功紀錄會保留，未儲存候選會回到確認流程。"
  ].map(resultChecklistItem);
  const aiReviewCostBoundaryChecklistItems = [
    "此頁只顯示 parser 已回傳的候選紀錄。",
    "逐筆編輯、移除或進入儲存確認都不會重新呼叫 AI。",
    "未建立片段不會自動儲存，也不會自動重跑 parser。",
    "返回修改後，只有再次按下一步整理才會產生新的 parser / AI 成本。",
    "mobile 不保留 raw prompt、raw model output 或模型 debug trace。"
  ].map(resultChecklistItem);
  const transcriptReviewCostBoundaryChecklistItems = [
    "空文字、過長文字或範例文字不會送 parser。",
    "下一步整理只送目前這段文字一次，不會批次載入歷史紀錄。",
    "手動新增可完全避開 AI parser，適合補登明確紀錄。",
    protectedBackendReady
      ? parserModelReady
        ? "backend ready；送出前仍會先做前端長度與數字密度檢查。"
        : boundUiMessage(`${parserModelUnavailableDisplayMessage}；目前不能送 parser，避免無效模型請求。`)
      : boundUiMessage("backend 尚未 ready；目前不能送 parser，避免無效重試。")
  ].map(resultChecklistItem);
  const saveSuccessBoundaryChecklistItems = [
    lastSaveEntryMethod === "manual"
      ? hasManualFallbackWithAiCandidates
        ? "手動新增沒有 parser / LLM 成本；原本 AI 候選仍保留在確認流程，需由使用者手動處理。"
        : "手動新增沒有 parser / LLM 成本，也沒有 AI 候選紀錄需要保留。"
      : "AI 原始文字與目前輸入已清空；成功頁不保留 raw prompt、raw model output 或 debug trace。",
    hasUnsavedPreviewRecords
      ? `仍有 ${unsavedPreviewRecordDisplayCount} 筆候選紀錄留在確認流程；系統不會自動重試或重新呼叫 AI。`
      : "沒有未儲存候選需要自動重試；下一步只做頁面導覽。",
    `回到今日 / 歷史 / 分析只使用已同步紀錄；mobile 每頁載入 ${mobileRecordSyncDisplayLimit} 筆，可用歷史頁載入更多。`,
    "成功頁不新增 backend request，除非使用者主動進入其他頁面觸發既有同步。"
  ].map(resultChecklistItem);
  const deleteSuccessBoundaryChecklistItems = [
    "成功頁不保留被刪除紀錄的本機復原副本。",
    "不會呼叫 parser、AI 或 LLM，成本為 0。",
    "不會保留 raw transcript、raw prompt、raw model output 或模型 debug trace。",
    "失敗不會自動重試；若需要確認 backend 狀態，請稍後重新同步。",
    `回到今日 / 歷史只使用已同步紀錄；mobile 每頁載入 ${mobileRecordSyncDisplayLimit} 筆，可用歷史頁載入更多。`
  ].map(resultChecklistItem);
  const updateSuccessBoundaryChecklistItems = [
    "成功頁只反映目前已更新的選取紀錄與本機清單。",
    "不會呼叫 parser、AI 或 LLM，成本為 0。",
    "不會保留 raw transcript、raw prompt、raw model output 或模型 debug trace。",
    "失敗不會自動重試；若需要確認其他裝置狀態，請稍後重新同步。",
    `回到今日 / 歷史 / 分析只使用已同步紀錄；mobile 每頁載入 ${mobileRecordSyncDisplayLimit} 筆，可用歷史頁載入更多。`
  ].map(resultChecklistItem);
  const manualSubmitChecklistItems = [
    "不會呼叫 AI 或 LLM，成本為 0。",
    "只會送出 1 筆手動紀錄 payload，不會批次載入完整歷史。",
    "不會附帶 raw transcript、raw prompt、raw model output 或模型 debug trace。",
    "日期、時間、類型與欄位會送到後端再次驗證。",
    "建立中按鈕會停用；失敗時不會自動重試。"
  ].map(resultChecklistItem);
  const recordDetailBoundaryChecklistItems = [
    "只顯示目前已載入的單筆紀錄，不額外查詢完整歷史。",
    "不會呼叫 parser、AI 或 LLM，成本為 0。",
    "不會保留 raw transcript、raw prompt、raw model output 或模型 debug trace。",
    "編輯與刪除必須進入各自確認流程，詳情頁本身不直接寫入資料。"
  ].map(resultChecklistItem);
  const recordEntrySettingsChecklistItems = [
    "手動新增可完全避開 AI parser，適合補登明確紀錄。",
    "文字整理每次只送出目前文字一次，不批次載入歷史紀錄。",
    "確認儲存前不會寫入資料庫；候選紀錄可先逐筆修改或移除。",
    "mobile 不保存 raw prompt、raw model output 或模型 debug trace。",
    protectedBackendReady
      ? "backend ready；送出前仍會先做本機長度與數字密度檢查。"
      : boundUiMessage("backend 尚未 ready；目前不能送 parser，避免無效重試與額外成本。")
  ].map(resultChecklistItem);
  const aiCandidateRemoveChecklistItems = [
    "只影響目前 AI 整理確認清單。",
    "已經儲存的正式紀錄不受影響。",
    "若移除錯誤，可返回文字確認頁重新整理；這會重新產生 parser / AI 成本。"
  ].map(resultChecklistItem);
  const aiSaveFailureChecklistItems = [
    `目前保留 ${unsavedPreviewRecordDisplayCount} 筆候選紀錄在確認流程中。`,
    "系統不會自動重試，也不會重新呼叫 parser / AI。",
    "你可以返回儲存確認後再送出，或回 AI 整理確認逐筆編輯。",
    "若 backend 持續不可用，可改用手動新增單筆明確紀錄。"
  ].map(resultChecklistItem);
  const historyBoundaryChecklistItems = [
    "月曆選取日期只套用在 mobile 目前已載入的紀錄。",
    `每頁最多載入 ${mobileRecordSyncDisplayLimit} 筆，本機最多保留 ${maxMobileRecordCacheLimit} 筆；這不是完整歷史匯出。`,
    "點擊月曆日期或切換 AI 整理 / 原始紀錄不會額外查詢 backend，也不會呼叫 AI。",
    "載入更多使用 backend cursor pagination，只追加更早紀錄並以 id 去重。",
    recordsForDisplay.length === 0 ? noRealRecordHealthValueDisplayText : loadedRecordActionCopy()
  ].map(resultChecklistItem);
  const deleteConfirmChecklistItems = [
    "只會刪除目前選取的這一筆紀錄。",
    "只送出單筆 delete request，不批次載入完整歷史。",
    "不會自動刪除其他日期、分析統計或未儲存候選紀錄。",
    "不會呼叫 parser、AI 或 LLM，成本為 0。",
    "不會附帶 raw transcript、raw prompt、raw model output 或模型 debug trace。",
    "目前沒有本機 undo；刪除成功後會進入刪除完成頁。",
    "刪除中按鈕會停用；失敗時不會自動重試，刪除請求仍走後端權限與 audit 路徑。"
  ].map(resultChecklistItem);
  const recordUpdateChecklistItems = [
    "只會更新目前選取的這一筆紀錄。",
    "只送出確認後的結構化 payload，不批次載入完整歷史。",
    "不會呼叫 parser、AI 或 LLM，成本為 0。",
    "不會附帶 raw transcript、raw prompt、raw model output 或模型 debug trace。",
    "儲存中按鈕會停用；失敗時不會自動重試。"
  ].map(resultChecklistItem);
  const analysisBoundaryChecklistItems = [
    analysisBoundaryDataDisplayCopy,
    `mobile 本機分析最多基於目前已同步的 ${maxMobileRecordCacheLimit} 筆紀錄。`,
    "基本分析不呼叫 AI，不會產生診療建議。",
    `詳細報告會使用 ${mobileReportQueryDisplayLimit} 筆上限查詢，避免一次載入過多資料。`
  ].map(resultChecklistItem);
  const saveSuccessDestinationItems = [
    ...(hasUnsavedPreviewRecords
      ? [["⚠", "返回確認", "處理尚未儲存的候選紀錄", "aiReview"]]
      : []),
    ["📅", "今日紀錄", "查看剛剛新增的資料", "today"],
    ["🗂", "歷史紀錄", "依日期回看所有紀錄", "history"],
    ["📊", "基本分析", "查看趨勢與摘要", "analysis"]
  ].map(destinationCardDisplayItem);
  const deleteSuccessDestinationItems = [
    ["📅", "今日紀錄", "回到今日時間軸", "today"],
    ["🗂", "歷史紀錄", "確認指定日期紀錄", "history"]
  ].map(destinationCardDisplayItem);
  const updateSuccessDestinationItems = [
    ["📋", "記錄詳情", "查看更新後內容", "recordDetail"],
    ["📅", "今日紀錄", "回到今日時間軸", "today"],
    ["🗂", "歷史紀錄", "依日期回看紀錄", "history"],
    ["📊", "基本分析", "查看摘要是否更新", "analysis"]
  ]
    .filter(([, , , target]) => target !== "recordDetail" || selectedRecord)
    .map(destinationCardDisplayItem);
  const currentChrome = screenChrome[currentScreen];
  const headerBackTarget =
    currentScreen === "menu"
      ? menuReturnScreen
      : currentScreen === "recordDetail"
      ? recordDetailReturnScreen
      : currentScreen === "deleteConfirm"
        ? "recordDetail"
      : currentScreen === "manualRecordConfirm"
        ? "manualRecord"
      : currentScreen === "aiSaveConfirm"
        ? "aiReview"
      : currentScreen === "aiSaveFailure"
        ? "aiSaveConfirm"
      : currentScreen === "aiRemoveConfirm"
        ? "aiReview"
      : currentScreen === "transcriptReview"
        ? transcriptReviewReturnScreen
      : currentScreen === "manualRecord"
        ? manualRecordReturnScreen
        : currentScreen === "subscription"
          ? subscriptionReturnScreen
        : currentScreen === "subscriptionManagement"
          ? "settings"
        : currentScreen === "accountSecurity"
          ? "settings"
        : currentScreen === "profileSettings"
          ? "settings"
        : currentScreen === "recordingQuotaSettings"
          ? "settings"
        : currentScreen === "reminderSettings"
          ? "settings"
        : currentScreen === "privacySettings"
          ? "settings"
        : currentScreen === "tutorial"
          ? tutorialReturnScreen
        : currentScreen === "foodPhoto"
          ? foodPhotoReturnScreen
        : currentScreen === "doctorShare"
          ? doctorShareReturnScreen
        : currentScreen === "healthIntegration"
          ? healthIntegrationReturnScreen
        : currentScreen === "community"
          ? communityReturnScreen
        : currentScreen === "ranking"
          ? rankingReturnScreen
        : currentScreen === "achievements"
          ? achievementsReturnScreen
        : currentScreen === "yearReview"
          ? yearReviewReturnScreen
        : currentScreen === "store"
          ? storeReturnScreen
        : currentScreen === "saveSuccess"
          ? saveSuccessReturnScreen
        : currentChrome.backTo ?? "menu";
  const showPrimaryTabs = currentScreen !== "today" && primaryScreens.some((screen) => screen.id === currentScreen);
  const mvpFlowCurrentScreen = currentScreen === "aiSaveFailure" ? "aiSaveConfirm" : currentScreen;
  const mvpFlowStepIndex = mvpFlowSteps.findIndex((step) => step.id === mvpFlowCurrentScreen);
  const showMvpFlowStepper =
    mvpFlowStepIndex >= 0 &&
    currentScreen !== "today" &&
    (currentScreen !== "saveSuccess" || lastSaveEntryMethod !== "manual" || hasUnsavedPreviewRecords);
  const localAchievements = useMemo<AchievementItem[]>(() => {
    const maxObservedRecords = recordsForDisplay.length;
    const maxObservedStreak = Math.max(
      ...achievementCategoryDefinitions.map((definition) => currentRecordTypeStreakDays(recordsForDisplay, definition.recordType)),
      0
    );
    const maxBaseLevel = achievementLevels[achievementLevels.length - 1] ?? 250;
    const maxObservedLevel = Math.max(maxObservedRecords, maxObservedStreak, maxBaseLevel);
    const dynamicLevels: number[] = [...achievementLevels];
    let nextLevel = maxBaseLevel + achievementLevelStep;
    while (maxObservedLevel >= maxBaseLevel && dynamicLevels.length < 16 && nextLevel <= maxObservedLevel + achievementLevelStep) {
      dynamicLevels.push(nextLevel);
      nextLevel += achievementLevelStep;
    }

    return achievementCategoryDefinitions.flatMap((definition) => {
      const cumulativeProgress = recordsForDisplay.filter(
        (record) => record.record_type === definition.recordType
      ).length;
      const streakProgress = currentRecordTypeStreakDays(recordsForDisplay, definition.recordType);
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
    });
  }, [recordsForDisplay]);
  const achievements = achievementBackendItems.length > 0 ? achievementBackendItems : localAchievements;
  const achievementDisplayItems = useMemo(() => achievements.map(achievementDisplayItem), [achievements]);
  const achievementUnlockedDisplayItems = useMemo(
    () => achievementUnlockedItems.slice(0, maxListItems).map(achievementDisplayItem),
    [achievementUnlockedItems]
  );
  const achievementNewlyUnlockedDisplayItems = useMemo(
    () => achievementNewlyUnlockedItems.slice(0, maxListItems).map(achievementDisplayItem),
    [achievementNewlyUnlockedItems]
  );
  const saveSuccessNewlyUnlockedDisplayItems = achievementNewlyUnlockedDisplayItems.slice(0, 3);
  const achievementCategoryDisplaySections = useMemo(
    () =>
      achievementCategoryDefinitions.map((definition) => ({
        key: boundIdentifier(`achievement-section-${definition.id}`),
        label: boundDisplayText(definition.label, 40),
        items: achievementDisplayItems.filter((item) => item.category === definition.id)
      })),
    [achievementDisplayItems]
  );
  const unlockedAchievementCount = achievementDisplayItems.filter((item) => item.progress >= item.target).length;
  const nextAchievementDays =
    achievementDisplayItems
      .filter((item) => item.progress < item.target)
      .map((item) => item.target - item.progress)
      .sort((first, second) => first - second)[0] ?? 0;
  const unlockedAchievementDisplayCount = clampNumber(unlockedAchievementCount, 0, maxMobileCountValue);
  const nextAchievementDisplayDays = clampNumber(nextAchievementDays, 0, maxMobileCountValue);
  const achievementActionStatusDisplayText = boundUiMessage(achievementActionStatus);
  const currentYear = new Date().getFullYear();
  const yearReviewTargetDisplayYear = yearReviewTargetYear(new Date());
  const yearReviewGenerationDisplayText = nextYearReviewGenerationLabel(new Date());
  const yearlyRecords = useMemo(
    () =>
      records.filter((record) => {
        const occurredAt = new Date(record.occurred_at);
        return !Number.isNaN(occurredAt.getTime()) && occurredAt.getFullYear() === yearReviewTargetDisplayYear;
      }),
    [records, yearReviewTargetDisplayYear]
  );
  const yearlyTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of yearlyRecords) {
      counts.set(record.record_type, (counts.get(record.record_type) ?? 0) + 1);
    }
    return counts;
  }, [yearlyRecords]);
  const yearlyMostRecordedType =
    Array.from(yearlyTypeCounts.entries()).sort((first, second) => second[1] - first[1])[0] ?? null;
  const yearlyLongestStreak = useMemo(() => longestRecordStreakDays(yearlyRecords), [yearlyRecords]);
  const yearlyGlucoseValues = yearlyRecords
    .filter((record) => record.record_type === "glucose" && typeof record.payload_json.value === "number")
    .map((record) => Number(record.payload_json.value));
  const yearlyGlucoseAverage = averageNumber(yearlyGlucoseValues);
  const yearlyGlucoseHighest = yearlyGlucoseValues.length > 0 ? Math.max(...yearlyGlucoseValues) : null;
  const yearlyGlucoseLowest = yearlyGlucoseValues.length > 0 ? Math.min(...yearlyGlucoseValues) : null;
  const yearlyRecordDayCount = new Set(yearlyRecords.map((record) => localDateKey(record.occurred_at)).filter(Boolean)).size;
  const yearlyUnlockedBadgeCount = achievementDisplayItems.filter((item) => item.progress >= item.target).length;
  const yearlyHighestBadgeLevel =
    achievementDisplayItems
      .filter((item) => item.progress >= item.target)
      .map((item) => item.level)
      .sort((first, second) => second - first)[0] ?? 0;
  const yearlyUnlockedBadgeDisplayCount = clampNumber(yearlyUnlockedBadgeCount, 0, maxMobileCountValue);
  const yearlyHighestBadgeDisplayLevel = clampNumber(yearlyHighestBadgeLevel, 0, maxMobileCountValue);
  const yearlyRecordDayDisplayCount = clampNumber(yearlyRecordDayCount, 0, maxMobileCountValue);
  const yearlyGlucoseAverageDisplayValue = clampNullableNumber(yearlyGlucoseAverage, 0, maxMobileGlucoseValue);
  const yearlyGlucoseHighestDisplayValue = clampNullableNumber(yearlyGlucoseHighest, 0, maxMobileGlucoseValue);
  const yearlyGlucoseLowestDisplayValue = clampNullableNumber(yearlyGlucoseLowest, 0, maxMobileGlucoseValue);
  const yearlyRecordDisplayCount = clampNumber(yearlyRecords.length, 0, maxMobileCountValue);
  const yearlyGlucoseRecordDisplayCount = clampNumber(yearlyTypeCounts.get("glucose") ?? 0, 0, maxMobileCountValue);
  const yearlyExerciseRecordDisplayCount = clampNumber(yearlyTypeCounts.get("exercise") ?? 0, 0, maxMobileCountValue);
  const yearlyMealRecordDisplayCount = clampNumber(yearlyTypeCounts.get("meal") ?? 0, 0, maxMobileCountValue);
  const yearlyLongestStreakDisplayDays = clampNumber(yearlyLongestStreak, 0, maxMobileCountValue);
  const yearlyMostRecordedDisplayCount = clampNumber(yearlyMostRecordedType?.[1] ?? 0, 0, maxMobileCountValue);
  const backendYearMetricRows = yearReviewBackendSummary?.annual_stats
    .slice(0, 7)
    .map((item) => metricDisplayItem([item.label, String(item.value)] as const)) ?? [];
  const backendYearHealthRows = yearReviewBackendSummary?.health_outcomes
    .slice(0, 3)
    .map((item) => metricDisplayItem([item.label, String(item.value)] as const)) ?? [];
  const backendYearAiObservation = yearReviewBackendSummary?.ai_summary.find(
    (item) => item.kind === "important_observation"
  )?.text;
  const backendYearAiEncouragement = yearReviewBackendSummary?.ai_summary.find(
    (item) => item.kind === "encouragement"
  )?.text;
  const localYearlyReviewMetricRows = ([
    ["本年度總記錄天數", `${yearlyRecordDayDisplayCount} 天`],
    ["本年度血糖記錄次數", `${yearlyGlucoseRecordDisplayCount} 次`],
    ["本年度飲食記錄次數", `${yearlyMealRecordDisplayCount} 次`],
    ["本年度運動記錄次數", `${yearlyExerciseRecordDisplayCount} 次`],
    ["最長連續記錄天數", `${yearlyLongestStreakDisplayDays} 天`],
    ["達成徽章數量", `${yearlyUnlockedBadgeDisplayCount} 枚`],
    ["解鎖最高等級徽章", yearlyHighestBadgeDisplayLevel > 0 ? `${yearlyHighestBadgeDisplayLevel} 級` : "尚無"]
  ] as const).map(metricDisplayItem);
  const yearlyReviewMetricRows = backendYearMetricRows.length > 0 ? backendYearMetricRows : localYearlyReviewMetricRows;
  const localYearlyHealthOutcomeRows = ([
    ["年平均血糖", yearlyGlucoseAverageDisplayValue === null ? "尚無" : `${yearlyGlucoseAverageDisplayValue} mg/dL`],
    ["年度最高血糖", yearlyGlucoseHighestDisplayValue === null ? "尚無" : `${yearlyGlucoseHighestDisplayValue} mg/dL`],
    ["年度最低血糖", yearlyGlucoseLowestDisplayValue === null ? "尚無" : `${yearlyGlucoseLowestDisplayValue} mg/dL`]
  ] as const).map(metricDisplayItem);
  const yearlyHealthOutcomeRows = backendYearHealthRows.length > 0 ? backendYearHealthRows : localYearlyHealthOutcomeRows;
  const yearlyGlucoseAverageDisplayText =
    yearlyGlucoseAverageDisplayValue === null
      ? ""
      : boundDisplayText(`前一年度血糖紀錄平均值為 ${yearlyGlucoseAverageDisplayValue} mg/dL。`, maxDisplayDetailTextLength);
  const yearlyHighlightTexts =
    yearlyRecords.length === 0
      ? ["目前還沒有今年紀錄，開始記錄後會自動產生年度摘要。"]
      : [
          `${yearReviewTargetDisplayYear} 年已有 ${yearlyRecordDisplayCount} 筆紀錄。`,
          yearlyMostRecordedType
            ? `最常記錄的是${recordTypeLabel(yearlyMostRecordedType[0])}，共 ${yearlyMostRecordedDisplayCount} 筆。`
            : "今年尚未累積足夠分類資料。",
          yearlyLongestStreak > 0
            ? `最長連續記錄 ${yearlyLongestStreakDisplayDays} 天。`
            : "連續記錄資料仍在累積中。"
        ];
  const yearlyHighlightDisplayTexts = yearlyHighlightTexts.map(resultChecklistItem);
  const yearlyAiObservationDisplayText = backendYearAiObservation
    ? boundDisplayText(backendYearAiObservation, maxDisplayDetailTextLength)
    : yearReviewAiObservationCopy(
        yearlyRecordDisplayCount,
        yearlyGlucoseAverageDisplayValue,
        yearlyLongestStreakDisplayDays
      );
  const yearlyAiEncouragementDisplayText = backendYearAiEncouragement
    ? boundDisplayText(backendYearAiEncouragement, maxDisplayDetailTextLength)
    : yearReviewAiEncouragementCopy(yearlyRecordDisplayCount);
  const yearReviewActionStatusDisplayText = boundUiMessage(yearReviewActionStatus);
  const yearReviewShareStatusMessage = yearReviewShareUnavailableStatusMessage();
  const yearReviewBoundaryDisplayText = yearReviewBoundaryDisplayCopy();
  const doctorSharePreviewBoundaryDisplay = doctorSharePreviewBoundaryDisplayItem();
  const doctorShareBackendBoundaryDisplayText = doctorShareBackendBoundaryCopy();
  const healthIntegrationPreviewBoundaryDisplay = healthIntegrationPreviewBoundaryDisplayItem();
  const healthIntegrationExternalDataBoundaryDisplayText = healthIntegrationExternalDataBoundaryCopy();
  const communityPreviewBoundaryDisplay = communityPreviewBoundaryDisplayItem();
  const communityPublicNameBoundaryDisplayText = communityPublicNameBoundaryCopy();
  const rankingPreviewBoundaryDisplay = rankingPreviewBoundaryDisplayItem();
  const rankingLocalPreviewBoundaryDisplayText = rankingLocalPreviewBoundaryCopy();
  const modelSelectionBoundaryDisplayText = modelSelectionBoundaryCopy();
  const accountSecurityProviderBoundaryDisplayText = accountSecurityProviderBoundaryCopy();
  const accountSecuritySessionBoundaryDisplayText = accountSecuritySessionBoundaryCopy();
  const accountSecurityReadinessBoundaryDisplayText = accountSecurityReadinessBoundaryCopy();
  const accountSecurityNoActionBoundaryDisplayText = accountSecurityNoActionBoundaryCopy();
  const profileNoActionBoundaryDisplayText = profileNoActionBoundaryCopy();
  const recordingQuotaDataBoundaryDisplayText = recordingQuotaDataBoundaryCopy();
  const reminderPreviewBoundaryDisplay = reminderPreviewBoundaryDisplayItem();
  const privacyPreviewBoundaryDisplay = privacyPreviewBoundaryDisplayItem();
  const quickRecordIntroDisplayText = quickRecordIntroCopy();
  const quickEntryModeDisplayItemsForRender = quickEntryModeDisplayItems();
  const recordingPreviewDisplayText = isRecordingPreview
    ? recordingActivePreviewCopy(recordingElapsedSeconds)
    : recordingIdlePreviewCopy();
  const recordingEffectiveLimitDisplaySeconds = recordingEffectiveLimitSeconds(voiceQuota);
  const recordingLimitDisplayText = recordingLimitCopy(recordingEffectiveLimitDisplaySeconds);
  const homeRecordingSecondaryHintDisplayText = homeRecordingSecondaryHint(
    isRecordingPreview,
    recordingElapsedSeconds
  );
  const homeRecordingPreviewBoundaryDisplayText = homeRecordingPreviewBoundaryCopy();
  const recordPageRecordingPreviewBoundaryDisplayText = recordPageRecordingPreviewBoundaryCopy();
  const recordingSimulatedResultDisplayText = recordingSimulatedResultCopy(recordingElapsedSeconds);
  const recordingElapsedSecondsDisplayText = recordingElapsedSecondsCopy(recordingElapsedSeconds);
  const recordingResultBodyDisplayText = recordingResultBodyCopy(recordingElapsedSeconds);
  const recordingResultPrimaryActionDisplayText = recordingResultPrimaryActionLabel(recordingElapsedSeconds);
  const storeProductsForDisplay = storeBackendProducts.length > 0 ? storeBackendProducts : storeProducts;
  const storeProductDisplayItems = useMemo(
    () => storeProductsForDisplay.map(storeProductDisplayItem),
    [storeProductsForDisplay]
  );
  const storeRedemptionDisplayItems = useMemo(
    () => storeRedemptions.slice(0, maxListItems).map(storeRedemptionDisplayItem),
    [storeRedemptions]
  );
  const storeCategoryDisplayOptions = useMemo(() => storeCategories.map(storeCategoryDisplayItem), []);
  const foodCommunityCategoriesForDisplay =
    foodCommunityBackendCategories.length > 0 ? foodCommunityBackendCategories : foodCommunityCategories;
  const foodCommunityCategoryDisplayOptions = useMemo(
    () => foodCommunityCategoriesForDisplay.map(foodCommunityCategoryDisplayItem),
    [foodCommunityCategoriesForDisplay]
  );
  const selectedFoodCommunityCategoryDisplay =
    foodCommunityCategoryDisplayOptions.find((category) => category.value === foodCommunityCategory) ??
    foodCommunityCategoryDisplayOptions[0] ??
    null;
  const foodCommunityItemsForDisplay =
    foodCommunityBackendItems.length > 0 ? foodCommunityBackendItems : foodCommunityItems;
  const foodCommunityDisplayItems = useMemo(
    () => foodCommunityItemsForDisplay.map(foodCommunityItemDisplayItem),
    [foodCommunityItemsForDisplay]
  );
  const visibleFoodCommunityItems = foodCommunityDisplayItems.filter((item) => {
    const query = foodCommunitySearchText.trim().toLowerCase();
    const matchesCategory = query.length > 0 || item.category === foodCommunityCategory;
    const matchesSearch =
      query.length === 0 ||
      item.title.toLowerCase().includes(query) ||
      item.aliases.some((alias) => alias.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });
  const selectedFoodCommunityItem =
    foodCommunityDisplayItems.find((item) => item.id === selectedFoodCommunityItemId) ??
    visibleFoodCommunityItems[0] ??
    foodCommunityDisplayItems[0] ??
    null;
  const foodCommunityShareFieldTuples: Array<readonly [string, string]> = [
    ["食物名稱", foodCommunityShareFields.foodName || selectedFoodCommunityItem?.title || "由使用者輸入"],
    ["食用前血糖", foodCommunityShareFields.beforeGlucose || "由使用者輸入"],
    ["食用後血糖", foodCommunityShareFields.afterGlucose || "由使用者輸入"],
    [
      "血糖上升值",
      foodCommunityShareFields.beforeGlucose && foodCommunityShareFields.afterGlucose
        ? `${clampNumber(Number(foodCommunityShareFields.afterGlucose) - Number(foodCommunityShareFields.beforeGlucose), -maxMobileGlucoseValue, maxMobileGlucoseValue)} mg/dL`
        : "系統自動計算"
    ],
    ["備註心得", foodCommunityShareFields.note || "使用者可補充份量與情境"]
  ];
  const foodCommunityShareFieldRows = foodCommunityShareFieldTuples.map(detailPairDisplayItem);
  const foodCommunityPointTuples: Array<readonly [string, string]> = [
    ["本次分享", "+10 點"],
    [
      "點數餘額",
      storePointsBalance
        ? `${clampNumber(storePointsBalance.balance, 0, maxMobileCountValue)} 點`
        : "尚未同步"
    ],
    [
      "累積獲得",
      storePointsBalance
        ? `${clampNumber(storePointsBalance.lifetime_earned, 0, maxMobileCountValue)} 點`
        : "分享後同步"
    ],
    ["點數用途", "優惠券、商品折扣、特殊徽章、會員福利"]
  ];
  const foodCommunityPointRows = foodCommunityPointTuples.map(detailPairDisplayItem);
  const foodCommunityRankingTuples: Array<readonly [string, string]> = [
    ["分享次數排行", "統計公開分享筆數"],
    ["貢獻度排行", "加權完整度與審核狀態"],
    ["食物測試達人排行", "依測試食物種類計算"]
  ];
  const foodCommunityRankingRows = foodCommunityRankingTuples.map(detailPairDisplayItem);
  const visibleStoreProducts = storeProductDisplayItems.filter((product) => {
    const query = storeSearchText.trim().toLowerCase();
    const matchesCategory = product.category === storeCategory;
    const matchesSearch =
      query.length === 0 ||
      `${product.title} ${product.description} ${product.pointsCost}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  const storeRedemptionBoundaryTuples: Array<readonly [string, string]> = [
    [
      "點數餘額",
      storePointsBalance
        ? `${clampNumber(storePointsBalance.balance, 0, maxMobileCountValue)} 點`
        : "尚未同步"
    ],
    ["可兌換項目", "優惠券、保健食品折扣、合作商品、特殊徽章、特殊會員福利"],
    ["正式啟用前", "需完成點數帳本、庫存、訂單、付款與 rollback"],
    [
      "目前狀態",
      storeBackendProducts.length > 0
        ? `已讀取 backend catalog，已同步 ${clampNumber(storeRedemptions.length, 0, maxMobileCountValue)} 筆兌換券`
        : "本機預覽，不扣點、不建訂單、不發券"
    ]
  ];
  const storeRedemptionBoundaryRows = storeRedemptionBoundaryTuples.map(detailPairDisplayItem);
  const settingsDisplayRows = useMemo(() => settingsRows.map(settingsRowDisplayItem), []);
  const profileChoiceDisplayItems = useMemo(
    () => profiles.map(settingsProfileChoiceDisplayItem),
    [profiles]
  );
  const llmModelChoiceDisplayItems = useMemo(
    () => models.llm_models.map((model) => settingsModelChoiceDisplayItem(model, "LLM")),
    [models.llm_models]
  );
  const sttModelChoiceDisplayItems = useMemo(
    () => models.stt_models.map((model) => settingsModelChoiceDisplayItem(model, "STT")),
    [models.stt_models]
  );
  const tutorialDisplaySteps = useMemo(() => tutorialSteps.map(tutorialStepDisplayItem), []);
  const authProviderDisplayItems = useMemo(() => authProviderPreviews.map(authProviderPreviewDisplayItem), []);
  const sessionManagementDisplayItems = useMemo(
    () => sessionManagementPreviews.map(sessionManagementPreviewDisplayItem),
    []
  );
  const authSessionDisplayItems = useMemo(
    () => authSessions.slice(0, 20).map(authSessionDisplayItem),
    [authSessions]
  );
  const productionAuthReadinessDisplayRows = useMemo(
    () => productionAuthReadinessRows.map(previewTupleDisplayItem),
    []
  );
  const glucoseUnitDisplayOptions = useMemo(() => glucoseUnitOptions.map(optionDisplayItem), []);
  const glucoseTimingDisplayOptions = useMemo(() => glucoseTimingOptions.map(valueLabelDisplayItem), []);
  const mealTypeDisplayOptions = useMemo(() => mealTypeOptions.map(valueLabelDisplayItem), []);
  const manualRecordTypeDisplayOptions = useMemo(
    () => manualRecordTypes.map(manualRecordTypeDisplayItem),
    []
  );
  const historyDetailModeDisplayOptions = useMemo(() => historyDetailModes.map(historyDetailModeDisplayItem), []);
  const analysisRangeDisplayOptions = useMemo(() => analysisRanges.map(analysisRangeDisplayItem), []);
  const menuDisplayItems = useMemo(() => menuScreens.map(menuScreenDisplayItem), []);
  const visualSmokeRouteJumpDisplayItems = useMemo(
    () => visualSmokeRouteJumps.map(visualSmokeRouteJumpDisplayItem),
    []
  );
  const futureModuleDisplayCards = useMemo(
    () => futureModuleCards.map(futureModuleCardDisplayItem),
    []
  );
  const selectedFutureModuleDisplay = useMemo(
    () => selectedFutureModuleDisplayItem(selectedFutureModule),
    [selectedFutureModule]
  );
  const subscriptionComparisonDisplayRows = useMemo(
    () => subscriptionComparisonRows.map(comparisonDisplayItem),
    []
  );
  const subscriptionReadinessChecklistItems = [
    "App Store / Play Store 或正式付款後台",
    "receipt validation 與訂閱狀態 webhook",
    "trial start/end、取消、續訂與優惠價保留規則",
    "entitlement 與 voice quota 的 server-side enforcement"
  ].map(resultChecklistItem);
  const subscriptionManagementDisplayRows = useMemo(
    () => subscriptionManagementRows.map(previewTupleDisplayItem),
    []
  );
  const subscriptionManagementReadinessChecklistItems = [
    "商店付款或正式會員後台深連結，讓使用者可以管理續訂與取消。",
    "receipt validation、訂閱 webhook、idempotent entitlement update。",
    "trial start/end、grace period、退款與取消狀態需回寫 backend。",
    "voice quota、AI 額度與歷史存取權限必須只依 server-side entitlement 判斷。"
  ].map(resultChecklistItem);
  const privacyControlDisplayRows = useMemo(() => privacyControlRows.map(previewTupleDisplayItem), []);
  const accountSecurityBoundaryRows = ([
    ["帳號", account ? "已載入" : "未連線"],
    ["照護對象", activeProfile ? "已選擇" : "未選擇"],
    ["dev auth", allowMobileDevAuth ? "允許" : "停用"],
    ["API header", protectedHeaderMode],
    ["Token storage", tokenStorageMode],
    ["Token guard", accessTokenTooLarge ? "過長拒用" : "通過"],
    ["Session list", authSessionDisplayItems.length > 0 ? `${authSessionDisplayItems.length} 筆` : "未載入"],
    ["保護 API", protectedBackendReady ? "可操作" : "需登入"]
  ] as const).map(boundaryMetricDisplayItem);
  const profileSettingsBoundaryRows = ([
    ["帳號資料", account ? "已同步" : "未連線"],
    ["照護對象", activeProfile ? activeProfileLabel : "未選擇"],
    ["relationship", activeProfileRelationshipDisplayText],
    ["本機編輯", "停用"]
  ] as const).map(boundaryMetricDisplayItem);
  const membershipFeatureRows = ([
    ["語音記錄", "輕鬆說，隨時記"],
    ["AI 整理", "自動歸納重點，儲存前仍需確認"],
    ["基本分析", "趨勢與摘要一目了然"],
    ["歷史回顧", "完整保存並支援查詢"]
  ] as const).map(detailPairDisplayItem);
  const authBoundaryChecklistItems = [
    "Apple / Google / Email 登入需由正式 auth provider 控制。",
    "access token 只能短效，refresh token 需要 rotation 與 revoke。",
    "mobile token persistence 只可走 SecureStore / Keychain / Keystore；不可 fallback 到一般 storage。",
    "空白或超過 4096 字元的 access token 不會組成 Authorization header。",
    "mobile token 必須放 Keychain / Keystore，不放一般 storage。",
    "所有受保護 API 都要由後端驗證帳號、profile 與權限 scope。"
  ].map(resultChecklistItem);
  const profileReadinessChecklistItems = [
    "production auth / OIDC 或 JWT 邊界，避免 dev account 被當成正式個資。",
    "profile update API、欄位驗證、錯誤狀態與 optimistic update rollback。",
    "帳號與照護對象權限檢查：只能編輯自己有權限的 profile。",
    "敏感欄位需定義最小化策略；目前不收集生日、身分證或醫療診斷資料。"
  ].map(resultChecklistItem);
  const quotaReadinessChecklistItems = [
    "quota API 必須由 production auth 驗證 account / profile，不信任前端傳入的使用量。",
    "錄音開始時先檢查剩餘額度；parser 成功或失敗都要有一致的 usage rollback / commit 規則。",
    "試用版每日 5 分鐘、付費版每日 10 分鐘；價格與優惠資格由 entitlement 決定。",
    "接近剩餘 2 分鐘才提醒；避免首頁長期顯示倒數造成壓力。"
  ].map(resultChecklistItem);
  const reminderPreviewDisplayItems = ([
    ["晨間空腹血糖", "每天 07:30", "提醒記錄起床後或早餐前血糖。", "建議"],
    ["晚餐後兩小時", "每天 20:30", "協助建立飯後血糖紀錄習慣。", "可選"],
    ["回診前整理", "回診前 3 天", "提醒查看歷史紀錄與基本分析。", "未啟用"]
  ] as const).map(reminderPreviewDisplayItem);
  const reminderReadinessChecklistItems = [
    "系統通知權限請求與拒絕後的替代說明。",
    "安靜時段、時區與語言設定。",
    "後端 reminder schema、idempotent 排程與取消流程。",
    "通知內容不得包含敏感健康數值或完整紀錄。"
  ].map(resultChecklistItem);
  const privacyReadinessChecklistItems = [
    "通知內容最小化：推播不可包含血糖數值、完整餐點或用藥內容。",
    "資料分享 opt-in / opt-out：醫師、照護者、社群與排行榜都必須分開授權。",
    "資料匯出與刪除請求：需有狀態追蹤、身份驗證與 audit trail。",
    "撤銷與到期：任何 share token、grant、公開顯示都必須可撤回。"
  ].map(resultChecklistItem);
  const tutorialSafetyChecklistItems = [
    "AI 只整理成候選紀錄，確認前不會寫入資料庫。",
    "文字為空時不送 parser，避免不必要的 API 與 LLM 成本。",
    "手動新增可完全避開 AI parser，適合快速補登明確資料。",
    "儲存後會回到今日、歷史與分析；不提供診療建議。"
  ].map(resultChecklistItem);
  const doctorShareReadinessChecklistItems = [
    "share token / authorization grant 產生、到期與撤銷",
    "doctor grant 僅允許 profile:read / profile:export 的明確授權範圍",
    "回診摘要報表需使用 bounded report query，不載入無上限歷史資料",
    "所有分享、查看、匯出與撤銷都必須寫入 audit log"
  ].map(resultChecklistItem);
  const healthIntegrationReadinessChecklistItems = [
    "使用者授權、撤權與資料刪除流程",
    "external integration layer 與平台權限隔離",
    "import batch id、sync status 與錯誤復原",
    "duplicate detection，避免同一筆血糖被重複匯入"
  ].map(resultChecklistItem);
  const communityReadinessChecklistItems = [
    "公開顯示名稱與可見範圍設定",
    "社群貼文、留言、封鎖、檢舉與審核流程",
    "健康資料不可自動公開，分享需明確 opt-in",
    "社群權限、刪除、撤回與 audit-friendly event stream"
  ].map(resultChecklistItem);
  const rankingReadinessChecklistItems = [
    "user public ranking opt-in 與退出流程",
    "ranking stats structure，只儲存非敏感統計",
    "公開顯示名稱、封鎖與檢舉流程",
    "退出排名後的歷史資料撤回與 audit event"
  ].map(resultChecklistItem);
  const storeCheckoutReadinessChecklistItems = [
    "商品目錄、庫存與價格來源",
    "購物車持久化、優惠券與折扣規則",
    "付款金流、receipt validation 與退款流程",
    "訂單狀態、出貨狀態與客服稽核"
  ].map(resultChecklistItem);
  const storeCartUnavailableDisplay = storeCartUnavailableDisplayItem();
  const foodPhotoVisionBoundaryDisplay = foodPhotoVisionBoundaryDisplayItem();
  const foodPhotoEmptyResultChecklistItems = foodPhotoEmptyResultChecklistDisplayItems();
  const foodPhotoReadinessChecklistItems = [
    "相機 / 相簿權限與圖片壓縮上限",
    "圖片儲存、刪除與隱私遮罩策略",
    "Vision 成本上限、rate limit 與重試規則",
    "使用者確認後才可轉成飲食紀錄"
  ].map(resultChecklistItem);
  const currentBasicReportKey =
    account && activeProfile
      ? basicReportRequestKey(
          normalizedApiBaseUrl,
          account.id,
          activeProfile.id,
          analysisRange,
          analysisCustomStart,
          analysisCustomEnd,
          mobileReportQueryLimit
        )
      : "";
  const activeAnalysisReport = basicReportKey === currentBasicReportKey ? basicReport : null;
  const reportRecordCount = activeAnalysisReport?.record_count ?? analysisRecords.length;
  const reportGlucoseAverage = activeAnalysisReport?.glucose.average ?? averageGlucose;
  const reportGlucoseMinimum =
    activeAnalysisReport?.glucose.minimum ??
    (analysisGlucoseValues.length > 0 ? Math.min(...analysisGlucoseValues) : null);
  const reportGlucoseMaximum = activeAnalysisReport?.glucose.maximum ?? highestGlucose;
  const reportBeforeMealGlucoseCount = activeAnalysisReport?.glucose.before_meal_count ?? beforeMealGlucoseCount;
  const reportAfterMealGlucoseCount = activeAnalysisReport?.glucose.after_meal_count ?? afterMealGlucoseCount;
  const reportMealCount =
    activeAnalysisReport?.meals.count ?? analysisRecords.filter((record) => record.record_type === "meal").length;
  const reportExerciseCount =
    activeAnalysisReport?.lifestyle.exercise_count ??
    analysisRecords.filter((record) => record.record_type === "exercise").length;
  const reportMedicationCount =
    activeAnalysisReport?.lifestyle.medication_count ??
    analysisRecords.filter((record) => record.record_type === "medication").length;
  const reportSourceDisplay = reportSourceDisplayItem(
    activeAnalysisReport,
    analysisRecords.length,
    mobileReportQueryDisplayLimit
  );
  const reportStatusDisplayText = boundUiMessage(reportStatus);
  const reportSourceDisplayLabel = reportSourceDisplay.label;
  const reportSourceDisplayCopy = reportSourceDisplay.copy;
  const reportGeneratedAtDisplayText = activeAnalysisReport
    ? boundDisplayText(`產生時間：${recordDateTimeDisplay(activeAnalysisReport.generated_at)}`, maxDisplayDetailTextLength)
    : "以 mobile 目前已載入資料計算。";
  const futureModuleActionStatusDisplayText = boundUiMessage(futureModuleActionStatus);
  const futurePreviewDisplayLabels = futurePreviewSectionLabels();
  const doctorShareActionStatusDisplayText = boundUiMessage(doctorShareActionStatus);
  const healthIntegrationActionStatusDisplayText = boundUiMessage(healthIntegrationActionStatus);
  const communityActionStatusDisplayText = boundUiMessage(communityActionStatus);
  const rankingActionStatusDisplayText = boundUiMessage(rankingActionStatus);
  const doctorShareTokenStatusMessage = boundUiMessage(
    "授權碼尚未啟用；目前不會建立 profile grant、share token、QR code 或醫師端 session。"
  );
  const doctorShareReportBoundaryStatusMessage = boundUiMessage(
    `回診摘要可沿用 bounded detailed report 設計，最多 ${mobileReportQueryDisplayLimit} 筆；目前不產生 PDF、不分享、不呼叫 AI。`
  );
  const healthIntegrationPermissionStatusMessage = boundUiMessage(
    "平台權限尚未啟用；目前不會請求 HealthKit / Health Connect 權限，也不讀取任何外部健康資料。"
  );
  const healthIntegrationMeterStatusMessage = boundUiMessage(
    "血糖機同步尚未啟用；目前不掃描 BLE、不建立 import batch、不寫入 meter source 紀錄。"
  );
  const communityPostingStatusMessage = boundUiMessage(
    "社群發文尚未啟用；目前不建立貼文、不送出留言、不公開任何健康紀錄。"
  );
  const communityPrivacyStatusMessage = boundUiMessage(
    "公開名稱與排行榜 opt-in 已可同步 backend；社群貼文、留言、刪除撤回與審核流程仍未開放。"
  );
  const foodCommunityShareStatusMessage = boundUiMessage(
    "backend ready 時可送出食物分享、建立社群點數並刷新排行榜與商城點數；visual smoke 或 backend unavailable 時不寫入資料。"
  );
  const foodCommunityShareButtonDisplayLabel = boundDisplayText("送出食物分享", maxDisplayTextLength);
  const foodCommunityShareAccessibilityDisplayLabel = boundDisplayText(
    `${foodCommunityShareButtonDisplayLabel}，backend 會計算升糖幅度並建立社群點數`,
    maxDisplayDetailTextLength
  );
  const storeActionStatusDisplayText = boundUiMessage(storeActionStatus);
  const storePreviewBoundaryDisplayText = storePreviewBoundaryCopy();
  const storeEmptySearchDisplay = storeEmptySearchDisplayItem();
  const storeCartButtonDisplayLabel = storeCartButtonLabel();
  const storeCartButtonAccessibilityDisplayLabel = storeCartButtonAccessibilityLabel();
  const storeLocalBoundaryDisplayText = storeLocalBoundaryCopy();
  const storeCartIntroDisplayText = storeCartIntroCopy();
  const storeCheckoutReadinessTitleDisplayText = storeCheckoutReadinessTitle();
  const storeCartReturnButtonDisplayLabel = storeCartReturnButtonLabel();
  const rankingOptInButtonDisplayLabel = boundDisplayText(
    communityPublicSettings?.leaderboard_opt_in ? "關閉排行榜 opt-in" : "開啟排行榜 opt-in",
    maxDisplayTextLength
  );
  const rankingOptInAccessibilityDisplayLabel = boundDisplayText(
    `${rankingOptInButtonDisplayLabel}，更新 backend 公開排名設定且不公開健康數值`,
    maxDisplayDetailTextLength
  );
  const foodPhotoActionStatusDisplayText = boundUiMessage(foodPhotoActionStatus);
  const foodPhotoUploadStatusMessage = boundUiMessage(
    "相機與照片上傳尚未啟用；正式開放前需要圖片權限、壓縮上限、儲存策略與 Vision 成本控制。"
  );
  const foodPhotoIntegrationStatusMessage = boundUiMessage(
    "相機與照片上傳尚未啟用；需先完成圖片儲存、權限、成本控制與使用者確認流程。"
  );
  const foodPhotoRetakeStatusMessage = boundUiMessage(
    "重新拍攝需等相機/相簿流程接上；目前沒有暫存圖片或分析結果可清除。"
  );
  const foodPhotoIntroDisplayText = foodPhotoIntroCopy();
  const foodPhotoUploadBoxDisplayLabel = foodPhotoUploadBoxLabel();
  const foodPhotoResultDisplayTitle = foodPhotoResultTitle();
  const foodPhotoReadinessTitleDisplayText = foodPhotoReadinessTitle();
  const foodPhotoIntegrationButtonDisplayLabel = foodPhotoIntegrationButtonLabel();
  const foodPhotoRetakeButtonDisplayLabel = foodPhotoRetakeButtonLabel();
  const foodPhotoIntegrationAccessibilityDisplayLabel = foodPhotoIntegrationButtonAccessibilityLabel();
  const foodPhotoRetakeAccessibilityDisplayLabel = foodPhotoRetakeButtonAccessibilityLabel();
  const quotaStatusDisplayText = boundUiMessage(quotaStatus);
  const subscriptionPlanDisplayText = quotaPlanDisplayText(voiceQuota);
  const subscriptionManagementPlanDisplayText = quotaPlanDisplayText(voiceQuota, "尚未同步");
  const subscriptionStatusDisplayText = subscriptionStatusSummaryText(
    voiceQuota,
    quotaTrialDaysLeft,
    quotaStatusDisplayText
  );
  const subscriptionManagementStatusDisplayText = subscriptionStatusSummaryText(
    voiceQuota,
    quotaTrialDaysLeft,
    "請先同步 backend quota / entitlement。"
  );
  const membershipTrialHeroLabelDisplayText = boundDisplayText(
    voiceQuota?.status === "trialing" ? "7 天免費試用即將結束" : "會員狀態",
    80
  );
  const membershipTrialDaysDisplayText = membershipTrialDaysText(quotaTrialDaysLeft);
  const membershipPlanStatusDisplayText = boundDisplayText(
    voiceQuota
      ? `${planDisplayName(voiceQuota.plan_code)} · ${subscriptionStatusLabel(voiceQuota.status)}`
      : "請先同步會員與錄音額度。",
    maxDisplayDetailTextLength
  );
  const quotaUsedDisplayText = quotaUsedDisplayValue(voiceQuota);
  const quotaRemainingDisplayText = quotaRemainingDisplayValue(voiceQuota);
  const quotaDailyLimitDisplayText = boundDisplayText(
    voiceQuota
      ? `每日上限 ${formatVoiceMinutes(voiceQuota.daily_limit_seconds)}；剩餘 2 分鐘內才提醒使用者。`
      : "連線 backend 後會顯示試用或會員的每日上限。",
    maxDisplayDetailTextLength
  );
  const subscriptionQuotaDailyLimitDisplayText = boundDisplayText(
    voiceQuota
      ? `每日上限 ${formatVoiceMinutes(voiceQuota.daily_limit_seconds)}；剩餘 2 分鐘內才需要提醒使用者。`
      : "每日上限會在額度同步後顯示。",
    maxDisplayDetailTextLength
  );
  const settingsQuotaHelperDisplayText = settingsQuotaHelperText(voiceQuota);
  const subscriptionActionStatusDisplayText = boundUiMessage(subscriptionActionStatus);
  const subscriptionManagementActionStatusDisplayText = boundUiMessage(subscriptionManagementActionStatus);
  const subscriptionTrialIntegrationStatusMessage = boundUiMessage(
    "試用啟動需要正式付款/商店串接；目前不會建立訂閱，也不會變更會員狀態。"
  );
  const subscriptionRenewalIntegrationStatusMessage = boundUiMessage(
    "續訂啟用需要正式付款/商店串接與 receipt validation；目前不會建立訂閱。"
  );
  const subscriptionManagementSyncingStatusMessage = boundUiMessage("正在同步 backend entitlement 與語音額度。");
  const subscriptionManagementUnavailableStatusMessage = boundUiMessage(
    `${protectedAccountBackendUnavailableMessage || "backend account 尚未 ready"}；目前不讀取訂閱或 entitlement。`
  );
  const subscriptionManagementPaymentStatusMessage = boundUiMessage(
    "訂閱管理目前是 UI 預覽；正式啟用需要付款深連結、receipt validation、webhook 與 entitlement policy。"
  );
  const authActionStatusDisplayText = boundUiMessage(authActionStatus);
  const nativeStatusDisplayText = boundUiMessage(nativeStatus);
  const devResetStatusDisplayText = boundUiMessage(devResetStatus);
  const profileActionStatusDisplayText = boundUiMessage(profileActionStatus);
  const recordingQuotaActionStatusDisplayText = boundUiMessage(recordingQuotaActionStatus);
  const reminderActionStatusDisplayText = boundUiMessage(reminderActionStatus);
  const privacyActionStatusDisplayText = boundUiMessage(privacyActionStatus);
  const profileEditIntegrationStatusMessage = boundUiMessage(
    "個人資料編輯尚未啟用；需完成 production auth、profile update API、權限檢查與 rollback 流程。"
  );
  const recordingQuotaSyncingStatusMessage = boundUiMessage("正在同步 backend 語音額度。");
  const recordingQuotaUnavailableStatusMessage = boundUiMessage(
    `${protectedAccountBackendUnavailableMessage || "backend account 尚未 ready"}；目前不讀取語音額度。`
  );
  const reminderIntegrationStatusMessage = boundUiMessage(
    "提醒設定目前是 UI 預覽；需完成通知權限、背景排程、時區與後端 reminder schema 後才會啟用。"
  );
  const privacyIntegrationStatusMessage = boundUiMessage(
    "隱私控制目前是 UI 預覽；正式啟用需要 permission service、export/delete workflow、share revoke 與 PHI-safe audit。"
  );
  const recordsStatusDisplayText = boundUiMessage(recordsStatus);
  const todayRecordSummaryDisplayText = todayRecordSummaryText(todayRecords.length);
  const historyRecordDisplayCount = clampNumber(historyRecords.length, 0, maxMobileCountValue);
  const rankingStreakDisplayDays = clampNumber(currentRecordStreakDays(records), 0, maxMobileCountValue);
  const analysisGlucoseRecordDisplayCount = clampNumber(analysisGlucoseRecords.length, 0, maxMobileCountValue);
  const analysisAverageDisplayValue = clampNullableNumber(activeAnalysisReport?.glucose.average ?? averageGlucose, 0, maxMobileGlucoseValue);
  const analysisHighestDisplayValue = clampNullableNumber(activeAnalysisReport?.glucose.maximum ?? highestGlucose, 0, maxMobileGlucoseValue);
  const analysisLowestDisplayValue = clampNullableNumber(activeAnalysisReport?.glucose.minimum ?? lowestGlucose, 0, maxMobileGlucoseValue);
  const analysisBeforeMealGlucoseDisplayCount = clampNumber(activeAnalysisReport?.glucose.before_meal_count ?? beforeMealGlucoseCount, 0, maxMobileCountValue);
  const analysisAfterMealGlucoseDisplayCount = clampNumber(activeAnalysisReport?.glucose.after_meal_count ?? afterMealGlucoseCount, 0, maxMobileCountValue);
  const analysisGlucoseMetricCount = clampNumber(activeAnalysisReport?.glucose.count ?? analysisGlucoseRecords.length, 0, maxMobileCountValue);
  const analysisMetricRows = ([
    ["最高血糖", analysisHighestDisplayValue === null ? "尚無" : String(analysisHighestDisplayValue)],
    ["最低血糖", analysisLowestDisplayValue === null ? "尚無" : String(analysisLowestDisplayValue)],
    ["平均血糖", analysisAverageDisplayValue === null ? "尚無" : String(analysisAverageDisplayValue)],
    ["血糖測量總次數", String(analysisGlucoseMetricCount)],
    ["飯前血糖次數", String(analysisBeforeMealGlucoseDisplayCount)],
    ["飯後血糖次數", String(analysisAfterMealGlucoseDisplayCount)]
  ] as const).map(metricDisplayItem);
  const reportRecordDisplayCount = clampNumber(reportRecordCount, 0, maxMobileCountValue);
  const reportGlucoseAverageDisplayValue = clampNullableNumber(reportGlucoseAverage, 0, maxMobileGlucoseValue);
  const reportGlucoseMinimumDisplayValue = clampNullableNumber(reportGlucoseMinimum, 0, maxMobileGlucoseValue);
  const reportGlucoseMaximumDisplayValue = clampNullableNumber(reportGlucoseMaximum, 0, maxMobileGlucoseValue);
  const reportBeforeMealGlucoseDisplayCount = clampNumber(reportBeforeMealGlucoseCount, 0, maxMobileCountValue);
  const reportAfterMealGlucoseDisplayCount = clampNumber(reportAfterMealGlucoseCount, 0, maxMobileCountValue);
  const reportMealDisplayCount = clampNumber(reportMealCount, 0, maxMobileCountValue);
  const reportExerciseDisplayCount = clampNumber(reportExerciseCount, 0, maxMobileCountValue);
  const reportMedicationDisplayCount = clampNumber(reportMedicationCount, 0, maxMobileCountValue);
  const detailedReportMetricRows = ([
    ["血糖平均", reportGlucoseAverageDisplayValue === null ? "尚無" : `${reportGlucoseAverageDisplayValue} mg/dL`],
    ["最低血糖", reportGlucoseMinimumDisplayValue === null ? "尚無" : `${reportGlucoseMinimumDisplayValue} mg/dL`],
    ["最高血糖", reportGlucoseMaximumDisplayValue === null ? "尚無" : `${reportGlucoseMaximumDisplayValue} mg/dL`],
    ["飯前血糖", `${reportBeforeMealGlucoseDisplayCount} 次`],
    ["飯後血糖", `${reportAfterMealGlucoseDisplayCount} 次`],
    ["飲食紀錄", `${reportMealDisplayCount} 筆`],
    ["運動紀錄", `${reportExerciseDisplayCount} 筆`],
    ["用藥紀錄", `${reportMedicationDisplayCount} 筆`]
  ] as const).map(metricDisplayItem);
  const aiSaveConfirmBoundaryRows = ([
    ["候選紀錄", `${unsavedPreviewRecordDisplayCount} 筆`],
    ["低信心", `${lowConfidencePreviewRecordDisplayCount} 筆`],
    ["未建立片段", `${rejectedPreviewEventDisplayCount} 筆`],
    ["額外 AI 成本", "0 次呼叫"]
  ] as const).map(boundaryMetricDisplayItem);
  const detailedReportBoundaryRows = ([
    ["資料來源", reportSourceDisplayLabel],
    ["AI 成本", "0 次呼叫"],
    ["資料上限", `最多 ${mobileReportQueryDisplayLimit} 筆`],
    ["醫療建議", "不提供"]
  ] as const).map(boundaryMetricDisplayItem);
  const doctorShareBoundaryRows = ([
    ["授權碼", "未產生"],
    ["醫師權限", "唯讀預留"],
    ["報表來源", "/reports/basic 預留"],
    ["AI 成本", "0 次呼叫"]
  ] as const).map(boundaryMetricDisplayItem);
  const healthIntegrationBoundaryRows = ([
    ["來源欄位", "meter / healthkit / health_connect"],
    ["同步批次", "import_batch_id 預留"],
    ["同步狀態", "pending / synced / failed"],
    ["AI 成本", "0 次呼叫"]
  ] as const).map(boundaryMetricDisplayItem);
  const communityBoundaryRows = ([
    ["健康紀錄", "預設私密"],
    ["公開排名", communityPublicSettings?.leaderboard_opt_in ? "已 opt-in" : "預設關閉"],
    ["留言治理", "封鎖/檢舉/審核"],
    ["AI 成本", "0 次呼叫"]
  ] as const).map(boundaryMetricDisplayItem);
  const rankingBoundaryRows = ([
    ["公開排名", "預設關閉"],
    ["排名資料", "非敏感統計"],
    ["健康數值", "不可公開"],
    ["AI 成本", "0 次呼叫"]
  ] as const).map(boundaryMetricDisplayItem);
  const recordingQuotaBoundaryRows = ([
    ["目前方案", quotaPlanDisplayText(voiceQuota, "尚未載入")],
    ["會員狀態", voiceQuota ? subscriptionStatusLabel(voiceQuota.status) : "尚未同步"],
    ["提醒規則", quotaRemainingLow ? "立即提醒" : "低干擾"],
    ["AI 成本", "0 次呼叫"]
  ] as const).map(boundaryMetricDisplayItem);
  const privacyBoundaryRows = ([
    ["健康紀錄", "預設私密"],
    ["通知內容", "不含數值"],
    ["外部分享", "需明確授權"],
    ["AI 成本", "0 次呼叫"]
  ] as const).map(boundaryMetricDisplayItem);
  const selectedPreviewRecord =
    selectedPreviewIndex === null ? null : preview?.records[selectedPreviewIndex] ?? null;
  const pendingPreviewRemoveRecord =
    pendingPreviewRemoveIndex === null ? null : preview?.records[pendingPreviewRemoveIndex] ?? null;
  const previewRecordDisplayItems =
    preview?.records.map((record, index) => pendingRecordDisplayItem(record, index, "review")) ?? [];
  const previewSaveConfirmDisplayItems =
    preview?.records.map((record, index) => pendingRecordDisplayItem(record, index, "save-confirm")) ?? [];
  const selectedPreviewRecordDisplayItem =
    selectedPreviewRecord && selectedPreviewIndex !== null
      ? pendingRecordDisplayItem(selectedPreviewRecord, selectedPreviewIndex, "edit-preview")
      : null;
  const pendingPreviewRemoveDisplayItem =
    pendingPreviewRemoveRecord && pendingPreviewRemoveIndex !== null
      ? pendingRecordDisplayItem(pendingPreviewRemoveRecord, pendingPreviewRemoveIndex, "remove-preview")
      : null;
  const aiRemoveConfirmBoundaryDisplayLabel = aiRemoveConfirmBoundaryLabel();
  const aiRemoveConfirmBoundaryDisplayText = aiRemoveConfirmBoundaryCopy();
  const aiRemoveConfirmSourceDisplayText = pendingPreviewRemoveDisplayItem
    ? aiRemoveConfirmSourceCopy(pendingPreviewRemoveDisplayItem.confidencePercent)
    : "";
  const transcriptReviewIntroDisplayText = transcriptReviewIntroCopy();
  const transcriptReviewPreParseGuidanceDisplayText = transcriptReviewPreParseGuidanceCopy();
  const transcriptReviewSampleWarningDisplayText = transcriptReviewSampleWarningCopy();
  const transcriptReviewPreflightPassedDisplayText = transcriptReviewPreflightPassedCopy();
  const previewRecordEditBoundaryDisplayText = previewRecordEditBoundaryCopy();
  const selectedRecordDisplayItem = selectedRecord ? recordDetailDisplayItem(selectedRecord) : null;
  const manualRecordConfirmIntroDisplayText = manualRecordConfirmIntroCopy();
  const manualRecordConfirmSubmitDisplayLabel = manualRecordConfirmSubmitLabel(isBusy);
  const deleteConfirmIntroDisplayText = deleteConfirmIntroCopy();
  const deleteConfirmRecordMetaDisplayText = selectedRecordDisplayItem
    ? deleteConfirmRecordMetaCopy(selectedRecordDisplayItem.dateTimeLabel, selectedRecordDisplayItem.sourceLabel)
    : "";
  const deleteConfirmSubmitDisplayLabel = deleteConfirmSubmitLabel(isBusy);
  const recordEditIntroDisplayText = recordEditIntroCopy();
  const historyNoRecordsTitleDisplayText = historyNoRecordsTitleCopy();
  const historyNoRecordsBodyDisplayText = historyNoRecordsBodyCopy();
  const historyNoRangeRecordsTitleDisplayText = historyNoRangeRecordsTitleCopy();
  const historyNoRangeRecordsBodyDisplayText = historyNoRangeRecordsBodyCopy();
  const analysisSafetyIntroDisplayText = analysisSafetyIntroCopy();
  const analysisChartEmptyDisplayText = analysisChartEmptyCopy();
  const analysisRangeSummaryDisplayText = analysisRangeSummaryCopy(
    analysisGlucoseMetricCount,
    analysisPreviewMode
  );
  const analysisReportButtonDisplayLabel = analysisReportButtonLabel(isReportLoading);
  const coreFlowDisplayLabels = coreFlowSectionLabels();
  const auxiliaryDisplayLabels = auxiliarySectionLabels();
  const advancedSettingsToggleDisplayLabel = advancedSettingsToggleLabel(showAdvancedSettings);
  const backendReconnectDisplayLabel = backendReconnectButtonLabel(isAnyRequestInFlight);
  const nativeModuleCheckDisplayLabel = nativeModuleCheckButtonLabel(isBusy);
  const nativeModelDownloadDisplayLabel = nativeModelDownloadButtonLabel(isBusy, downloadProgress);
  const nativeWhisperDownloadKindAccessibilityDisplayLabel = nativeDownloadKindAccessibilityLabel("whisper", downloadKind);
  const nativeLlamaDownloadKindAccessibilityDisplayLabel = nativeDownloadKindAccessibilityLabel("llama", downloadKind);
  const nativeModuleCheckAccessibilityDisplayLabel = nativeModuleCheckAccessibilityLabel(isBusy);
  const nativeModelDownloadAccessibilityDisplayLabel = nativeModelDownloadAccessibilityLabel(isBusy, downloadProgress);
  const nativeWhisperRunAccessibilityDisplayLabel = nativeWhisperRunAccessibilityLabel(isBusy);
  const nativeLlamaRunAccessibilityDisplayLabel = nativeLlamaRunAccessibilityLabel(isBusy);
  const nativeBenchmarkAccessibilityDisplayLabel = nativeBenchmarkAccessibilityLabel(isBusy);
  const recordingModelRefreshDisplayLabel = recordingModelRefreshButtonLabel();
  const recordingModelRefreshAccessibilityDisplayLabel = recordingModelRefreshAccessibilityLabel();
  const downloadedWhisperModelChoiceItems = downloadedModels
    .filter((model) => model.kind === "whisper" && model.exists)
    .map(downloadedWhisperModelDisplayItem);
  const achievementsReturnButtonDisplayLabel = returnDestinationButtonLabel(achievementsReturnScreen);
  const yearReviewReturnButtonDisplayLabel = returnDestinationButtonLabel(yearReviewReturnScreen);
  const storeReturnButtonDisplayLabel = returnDestinationButtonLabel(storeReturnScreen);
  const foodPhotoReturnButtonDisplayLabel = returnDestinationButtonLabel(foodPhotoReturnScreen);
  const headerActionDisplayAccessibilityLabel = headerActionAccessibilityLabel(currentChrome);
  const recordingButtonDisplayAccessibilityLabel = recordingButtonAccessibilityLabel(isRecordingPreview);
  const subscriptionTrialBoundaryDisplayText = subscriptionTrialBoundaryCopy();
  const subscriptionPaymentUnwiredDisplayText = subscriptionPaymentUnwiredCopy();
  const subscriptionCtaBoundaryDisplayText = subscriptionCtaBoundaryCopy();
  const subscriptionSyncButtonDisplayLabel = subscriptionSyncButtonLabel(isQuotaSyncing);
  const subscriptionManagementIntroDisplayText = subscriptionManagementIntroCopy();
  const subscriptionManagementNoActionDisplayText = subscriptionManagementNoActionCopy();
  const subscriptionManagementSyncButtonDisplayLabel = subscriptionManagementSyncButtonLabel(isQuotaSyncing);
  const recordingQuotaIntroDisplayText = recordingQuotaIntroCopy();
  const recordingQuotaControlDisplayText = recordingQuotaControlCopy();
  const recordingQuotaSyncButtonDisplayLabel = recordingQuotaSyncButtonLabel(isQuotaSyncing);
  const recordingQuotaSyncAccessibilityDisplayLabel = recordingQuotaSyncAccessibilityLabel(isQuotaSyncing);
  const reminderSettingsIntroDisplayText = reminderSettingsIntroCopy();
  const reminderIntegrationButtonDisplayLabel = reminderIntegrationButtonLabel();
  const reminderIntegrationAccessibilityDisplayLabel = reminderIntegrationAccessibilityLabel();
  const privacySettingsIntroDisplayText = privacySettingsIntroCopy();
  const privacyIntegrationButtonDisplayLabel = privacyIntegrationButtonLabel();
  const privacyIntegrationAccessibilityDisplayLabel = privacyIntegrationAccessibilityLabel();
  const settingsSubscriptionDisplayLabels = settingsSubscriptionSectionLabels();
  const futureModuleDetailBoundaryDisplayText = futureModuleDetailBoundaryCopy();
  const futureModuleImplementationOrderDisplayText = futureModuleImplementationOrderCopy();
  const achievementPreviewBoundaryDisplayText = achievementPreviewBoundaryCopy();
  const achievementLocalComputationDisplayText = achievementLocalComputationCopy();
  const achievementNextBadgeDisplayText = achievementNextBadgeCopy(nextAchievementDisplayDays);
  const achievementIntegrationButtonDisplayLabel = achievementIntegrationButtonLabel();
  const achievementIntegrationAccessibilityDisplayLabel = achievementIntegrationButtonAccessibilityLabel();
  const yearReviewPreviewBoundaryDisplayText = yearReviewPreviewBoundaryCopy();
  const yearReviewHeroRecordCountDisplayText = yearReviewHeroRecordCountCopy(yearlyRecordDisplayCount);
  const yearReviewLiveCalculationDisplayText = yearReviewLiveCalculationCopy(
    yearReviewTargetDisplayYear,
    yearReviewGenerationDisplayText
  );
  const yearReviewSourceDisplayText = yearReviewSourceDisplayCopy(
    yearReviewBackendSummary,
    yearReviewSharePackageId
  );
  const yearReviewBadgeMaterialDisplayText = yearReviewBadgeMaterialCopy();
  const yearReviewShareButtonDisplayLabel = yearReviewShareButtonLabel();
  const yearReviewShareAccessibilityDisplayLabel = yearReviewShareButtonAccessibilityLabel();
  const yearReviewRevokeShareButtonDisplayLabel = yearReviewRevokeShareButtonLabel();
  const yearReviewRevokeShareAccessibilityDisplayLabel = yearReviewRevokeShareButtonAccessibilityLabel();
  const selectedRecordDetailRows = selectedRecordDisplayItem?.detailRows ?? [];
  const transcriptValidationError = useMemo(
    () => validateTranscriptForParser(transcript),
    [transcript]
  );
  const manualRecordValidationError = useMemo(
    () => validateRecordForm(manualRecordType, manualRecordFields, manualRecordDate, manualRecordTime),
    [manualRecordDate, manualRecordFields, manualRecordTime, manualRecordType]
  );
  const manualRecordPreviewPayload = useMemo(() => {
    if (manualRecordValidationError) {
      return null;
    }
    try {
      const payload = buildPayloadFromEditFields(manualRecordType, manualRecordFields);
      return payload && typeof payload === "object" && !Array.isArray(payload) ? payload : null;
    } catch {
      return null;
    }
  }, [manualRecordFields, manualRecordType, manualRecordValidationError]);
  const manualRecordConfirmDisplay = manualRecordConfirmDisplayItem(
    manualRecordType,
    manualRecordPreviewPayload,
    manualRecordDate,
    manualRecordTime
  );
  const selectedRecordEditValidationError = useMemo(
    () =>
      selectedRecord
        ? validateRecordForm(
            selectedRecord.record_type,
            recordEditFields,
            recordEditDate,
            recordEditTime
          )
        : null,
    [recordEditDate, recordEditFields, recordEditTime, selectedRecord]
  );
  const previewRecordEditValidationError = useMemo(
    () =>
      selectedPreviewRecord
        ? validateRecordForm(
            selectedPreviewRecord.record_type,
            previewEditFields,
            previewEditDate,
            previewEditTime
          )
        : null,
    [previewEditDate, previewEditFields, previewEditTime, selectedPreviewRecord]
  );
  const transcriptValidationDisplayText = boundUiMessage(
    transcriptValidationError
      ? transcript.trim()
        ? transcriptValidationError
        : "請先輸入文字，或按「填入範例」查看確認 UI；範例不會送 parser。"
      : ""
  );
  const transcriptReviewValidationDisplayText = boundUiMessage(
    transcriptValidationError
      ? transcript.trim()
        ? transcriptValidationError
        : "請先輸入文字，再進行 AI 整理。"
      : ""
  );
  const manualRecordValidationDisplayText = boundUiMessage(manualRecordValidationError || "");
  const selectedRecordEditValidationDisplayText = boundUiMessage(selectedRecordEditValidationError || "");
  const previewRecordEditValidationDisplayText = boundUiMessage(previewRecordEditValidationError || "");
  const parserRecoveryDisplayText = boundUiMessage(parserRecoveryMessage);
  const lastSavedSummaryDisplayText = boundUiMessage(lastSavedSummary || "紀錄已加入今日紀錄與歷史紀錄。");
  const lastSaveErrorSummaryDisplayText = boundUiMessage(
    lastSaveErrorSummary || "候選紀錄尚未儲存，請返回確認頁檢查後再送出。"
  );
  const lowConfidenceWarningDisplayText = boundUiMessage(
    `仍有 ${lowConfidencePreviewRecordDisplayCount} 筆候選信心偏低；建議返回確認逐筆檢查後再儲存。返回確認不會重新呼叫 AI。`
  );
  const rejectedPreviewWarningDisplayText = boundUiMessage(
    `有 ${rejectedPreviewEventDisplayCount} 段文字沒有建立候選紀錄；確認儲存只會送出目前候選，不會儲存這些片段，也不會自動重新呼叫 AI。`
  );
  const aiSaveBackendBlockedDisplayText = boundUiMessage(
    `${protectedBackendUnavailableDisplayMessage || "backend 尚未 ready"}；目前不會送出儲存請求，避免無效重試與重複寫入。`
  );
  const transcriptBackendUnavailableDisplayText = boundUiMessage(
    `${protectedBackendUnavailableDisplayMessage}，才可送出 parser。`
  );
  const transcriptModelUnavailableDisplayText = boundUiMessage(
    `${parserModelUnavailableDisplayMessage}，請先在設定選擇可用模型。`
  );
  const manualRecordBackendUnavailableDisplayText = boundUiMessage(
    `${protectedBackendUnavailableDisplayMessage}，才可建立手動紀錄。`
  );
  const recordsAtCacheLimit = recordsForDisplay.length >= maxMobileRecordCacheLimit;
  const canLoadMoreRecords =
    protectedBackendReady && recordsHasMore && !recordsAtCacheLimit && recordsForDisplay.length > 0 && !isBusy;
  const historySyncBoundaryDisplayText = resultChecklistItem(
    recordsAtCacheLimit
      ? `已達本機紀錄上限 ${maxMobileRecordCacheLimit} 筆；避免 mobile 一次保留過多健康紀錄。`
      : recordsHasMore
        ? `目前已同步 ${recordsForDisplay.length} 筆；可用 cursor pagination 載入更早紀錄。`
        : `目前已同步 ${recordsForDisplay.length} 筆；backend 未回傳更多紀錄。`
  );
  const analysisSyncBoundaryDisplayText = resultChecklistItem(
    `本機分析使用目前已同步紀錄，最多保留 ${maxMobileRecordCacheLimit} 筆；若要固定查詢範圍，請使用詳細報告。`
  );
  const detailedReportQueryLimitDisplayText = resultChecklistItem(
    `報表查詢限制 ${mobileReportQueryDisplayLimit} 筆，避免 mobile 與 backend 一次載入過多資料。`
  );
  const detailedReportNoteDisplayItems = [
    "本報告只做紀錄摘要，不提供診斷或治療建議。",
    "backend 報表載入成功時使用 `/reports/basic`，否則使用本機已載入紀錄。",
    detailedReportQueryLimitDisplayText
  ].map(resultChecklistItem);

  function openTranscriptReview() {
    if (isBusy) {
      setStatus(busyActionStatusMessage());
      return;
    }
    if (transcriptValidationError) {
      setStatus(transcriptValidationError);
      return;
    }
    setPreview(null);
    setTranscriptReviewReturnScreen(currentScreen === "today" ? "today" : "record");
    setCurrentScreen("transcriptReview");
    setStatus(transcriptReviewReadyStatusMessage());
  }

  function returnToTranscriptEdit() {
    setPreview(null);
    setSelectedPreviewIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    setCurrentScreen("transcriptReview");
    setStatus(transcriptReturnEditStatusMessage());
  }

  function returnFromTranscriptReview() {
    setPreview(null);
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    setParserRecoveryMessage("");
    setCurrentScreen(transcriptReviewReturnScreen);
    setStatus(transcriptReviewBackStatusMessage());
  }

  function retryTranscriptInput() {
    setIsRecordingPreview(false);
    setRecordingStartedAt(null);
    setRecordingElapsedSeconds(0);
    setTranscript("");
    setTranscriptVoiceSeconds(0);
    setIsTranscriptSample(false);
    setPreview(null);
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    setParserRecoveryMessage("");
    setCurrentScreen(transcriptReviewReturnScreen);
    setStatus(transcriptClearedStatusMessage());
  }

  function updateTranscriptDraft(
    value: string,
    source: "user" | "sample" | "voice" = "user",
    voiceSeconds = 0
  ) {
    const boundedValue = value.slice(0, maxTranscriptTextLength);
    setTranscript(boundedValue);
    setIsTranscriptSample(source === "sample" && boundedValue.trim().length > 0);
    setTranscriptVoiceSeconds(
      source === "voice" && boundedValue.trim().length > 0
        ? clampNumber(voiceSeconds, 0, maxMobileCountValue)
        : 0
    );
    setPreview(null);
    setParserRecoveryMessage("");
  }

  function fillTranscriptSampleDraft() {
    updateTranscriptDraft(sampleText, "sample");
  }

  function renderFieldLabel(icon: string, label: string) {
    return (
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabelIcon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    );
  }

  function openManualRecord(returnScreen: AppScreen = currentScreen) {
    const nowInputs = localDateTimeInputs(new Date());
    setManualRecordDate(nowInputs.date);
    setManualRecordTime(nowInputs.time);
    setManualRecordReturnScreen(returnScreen);
    setCurrentScreen("manualRecord");
  }

  function openRecordManualRecord() {
    openManualRecord("record");
    setStatus(recordManualEntryStatusMessage());
  }

  function openAiReviewManualRecord() {
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    openManualRecord("aiReview");
    setStatus(aiReviewManualEntryStatusMessage());
  }

  function openTranscriptReviewManualRecord() {
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    openManualRecord("transcriptReview");
    setStatus(transcriptReviewManualEntryStatusMessage());
  }

  function returnFromManualRecord() {
    setCurrentScreen(manualRecordReturnScreen);
    setStatus(manualRecordReturnStatusMessage(manualRecordReturnScreen));
  }

  function returnFromRecordDetail() {
    setCurrentScreen(recordDetailReturnScreen);
    setStatus(recordDetailReturnStatusMessage(recordDetailReturnScreen));
  }

  function openTutorialRecordEntry() {
    setCurrentScreen("record");
    setStatus(tutorialRecordEntryStatusMessage());
  }

  function openTutorialManualRecord() {
    openManualRecord("tutorial");
    setStatus(tutorialManualEntryStatusMessage());
  }

  function openTodayManualRecord() {
    openManualRecord("today");
    setStatus(todayManualEntryStatusMessage());
  }

  function openTodayRecordEntry() {
    setCurrentScreen("record");
    setStatus(todayRecordEntryStatusMessage());
  }

  function openTodayRecordDetail(record: RecordItem) {
    openRecordDetail(record, "today");
    setStatus(todayRecordDetailStatusMessage());
  }

  function openTodayRecordDetailCard(record: RecordItem) {
    openTodayRecordDetail(record);
  }

  function pressTodayRecordDetailCard(item: ReturnType<typeof recordListDisplayItem>) {
    openTodayRecordDetailCard(item.record);
  }

  function openTodayAnalysis() {
    setCurrentScreen("analysis");
    setStatus(todayAnalysisStatusMessage());
  }

  function returnFromHistoryToToday() {
    setCurrentScreen("today");
    setStatus(historyReturnTodayStatusMessage());
  }

  function openHistoryManualRecord() {
    openManualRecord("history");
    setStatus(historyManualEntryStatusMessage());
  }

  function openHistoryRecordDetail(record: RecordItem) {
    openRecordDetail(record, "history");
    setStatus(historyRecordDetailStatusMessage());
  }

  function openHistoryRecordDetailCard(record: RecordItem) {
    openHistoryRecordDetail(record);
  }

  function pressHistoryRecordDetailCard(item: ReturnType<typeof recordListDisplayItem>) {
    openHistoryRecordDetailCard(item.record);
  }

  function openAnalysisManualRecord() {
    openManualRecord("analysis");
    setStatus(analysisManualEntryStatusMessage());
  }

  function returnFromAnalysisToToday() {
    setCurrentScreen("today");
    setStatus(analysisReturnTodayStatusMessage());
  }

  function openAnalysisDetailedReport() {
    setStatus(analysisDetailedReportStatusMessage());
    void openDetailedReport();
  }

  function returnFromDetailedReportToAnalysis() {
    setCurrentScreen("analysis");
    setStatus(detailedReportReturnAnalysisStatusMessage());
  }

  function openDetailedReportManualRecord() {
    openManualRecord("detailedReport");
    setStatus(detailedReportManualEntryStatusMessage());
  }

  function returnFromDetailedReportToToday() {
    setCurrentScreen("today");
    setStatus(detailedReportReturnTodayStatusMessage());
  }

  function selectManualRecordType(type: ManualRecordType) {
    setManualRecordType(type);
  }

  function pressManualRecordTypeOption(type: ReturnType<typeof manualRecordTypeDisplayItem>) {
    selectManualRecordType(type.value);
  }

  function selectHistoryCalendarDate(dateKey: string) {
    setSelectedHistoryDate(boundDateInputText(dateKey));
    setHistoryDetailMode("structured");
  }

  function pressHistoryCalendarDay(item: ReturnType<typeof historyCalendarDayDisplayItem>) {
    selectHistoryCalendarDate(item.value);
  }

  function selectHistoryCalendarMonthOffset(offset: number) {
    const nextMonth = new Date(
      historyCalendarMonthStart.getFullYear(),
      historyCalendarMonthStart.getMonth() + offset,
      1
    );
    setSelectedHistoryDate(formatLocalDateInput(nextMonth));
    setHistoryDetailMode("structured");
  }

  function openPreviousHistoryMonth() {
    selectHistoryCalendarMonthOffset(-1);
  }

  function openNextHistoryMonth() {
    selectHistoryCalendarMonthOffset(1);
  }

  function selectHistoryDetailMode(mode: HistoryDetailMode) {
    setHistoryDetailMode(mode);
  }

  function pressHistoryDetailModeOption(item: ReturnType<typeof historyDetailModeDisplayItem>) {
    selectHistoryDetailMode(item.value);
  }

  function showHistoryStructuredRecords() {
    selectHistoryDetailMode("structured");
  }

  function showHistoryRawRecords() {
    selectHistoryDetailMode("raw");
  }

  function selectAnalysisRange(range: AnalysisRange) {
    setAnalysisRange(range);
    setSelectedAnalysisPointIndex(null);
  }

  function pressAnalysisRangeOption(item: ReturnType<typeof analysisRangeDisplayItem>) {
    selectAnalysisRange(item.value);
  }

  function updateAnalysisCustomStartInput(value: string) {
    setAnalysisCustomStart(boundDateInputText(value));
    setSelectedAnalysisPointIndex(null);
  }

  function updateAnalysisCustomEndInput(value: string) {
    setAnalysisCustomEnd(boundDateInputText(value));
    setSelectedAnalysisPointIndex(null);
  }

  async function applyAnalysisCustomRange() {
    if (isReportLoading) {
      return;
    }
    setSelectedAnalysisPointIndex(null);
    setStatus(analysisCustomApplyStatusMessage());
    await loadBasicReportForCurrentRange("analysis");
  }

  function toggleAnalysisPoint(index: number) {
    setSelectedAnalysisPointIndex((currentIndex) => (currentIndex === index ? null : index));
  }

  function pressAnalysisChartPoint(index: number) {
    toggleAnalysisPoint(index);
  }

  function enterManualRecordConfirm() {
    const validationError = validateRecordForm(
      manualRecordType,
      manualRecordFields,
      manualRecordDate,
      manualRecordTime
    );
    if (validationError) {
      setStatus(validationError);
      setCurrentScreen("manualRecord");
      return;
    }
    if (!protectedBackendReady) {
      setStatus(manualRecordCreateUnavailableStatusMessage(protectedBackendUnavailableMessage));
      setCurrentScreen("manualRecord");
      return;
    }
    setCurrentScreen("manualRecordConfirm");
    setStatus(manualRecordConfirmReadyStatusMessage());
  }

  function returnFromManualRecordConfirm() {
    setCurrentScreen("manualRecord");
    setStatus(manualRecordConfirmReturnStatusMessage());
  }

  function handleQuickEntryMode(mode: QuickEntryMode, returnScreen: AppScreen = currentScreen) {
    if (mode === "voice") {
      setStatus(quickEntryVoicePromptStatusMessage());
      return;
    }
    if (mode === "manual") {
      openManualRecord(returnScreen);
      return;
    }
    setStatus(quickEntryTextModeStatusMessage());
    setCurrentScreen("record");
  }

  function handleTodayQuickEntryMode(mode: QuickEntryMode) {
    handleQuickEntryMode(mode, "today");
  }

  function pressTodayQuickEntryItem(item: ReturnType<typeof quickEntryModeDisplayItems>[number]) {
    handleTodayQuickEntryMode(item.key);
  }

  function handleRecordQuickEntryMode(mode: QuickEntryMode) {
    handleQuickEntryMode(mode, "record");
  }

  function pressRecordQuickEntryItem(item: ReturnType<typeof quickEntryModeDisplayItems>[number]) {
    handleRecordQuickEntryMode(item.key);
  }

  function activateVisualSmokePreview() {
    visualSmokePreviewActive.current = true;
    setIsVisualSmokePreviewMode(true);
    latestBootKey.current = "visual-smoke";
    bootInFlight.current = false;
    latestRecordSyncKey.current = "visual-smoke";
    recordSyncInFlightKeys.current.clear();
    setIsBusy(false);
    setRecordsStatus(visualSmokeRecordSyncStatusMessage());
    setRecordsHasMore(false);
  }

  function clearMobileSessionState(options: { clearAuthTokens?: boolean } = {}) {
    const clearAuthTokens = options.clearAuthTokens ?? true;
    visualSmokePreviewActive.current = false;
    setIsVisualSmokePreviewMode(false);
    setAccount(null);
    if (clearAuthTokens) {
      setAccessToken("");
      setRefreshToken("");
      setTokenStorageStatus("安全 token storage 已清除；本機不保留正式 token。");
      void clearStoredAuthSession();
    }
    setAuthSessions([]);
    setProfiles([]);
    setActiveProfileId("");
    setVoiceQuota(null);
    setQuotaStatus(voiceQuotaInitialStatusMessage());
    setModels({ stt_models: [], llm_models: [] });
    setSttModelId("browser-web-speech");
    setLlmModelId("deepseek-chat");
    setNativeStatus(nativeDebugDefaultStatusMessage());
    setWhisperModelPath("");
    setAudioPath("");
    setLlamaModelPath("");
    setLlamaDebugOutput("");
    setModelUrl("");
    setDownloadKind("llama");
    setDownloadProgress(0);
    setDownloadedModels([]);
    setRecords([]);
    setRecordsStatus(recordSyncInitialStatusMessage());
    setRecordsHasMore(false);
    setBasicReport(null);
    setBasicReportKey("");
    latestBootKey.current = "";
    bootInFlight.current = false;
    latestQuotaSyncKey.current = "";
    quotaSyncInFlightKeys.current.clear();
    latestReportLoadKey.current = "";
    reportLoadInFlightKeys.current.clear();
    latestRecordSyncKey.current = "";
    recordSyncInFlightKeys.current.clear();
    pendingOidcChallenge.current = null;
    parsePreviewInFlight.current = false;
    previewSaveInFlight.current = false;
    setPreview(null);
    setTranscript("");
    setTranscriptVoiceSeconds(0);
    setIsTranscriptSample(false);
    setSelectedRecord(null);
    setBasicReport(null);
    setReportStatus(detailedReportResetStatusMessage());
  }

  async function refreshProductionAuthSession() {
    if (isAuthOperationInFlight) {
      setAuthActionStatus(authOperationBusyStatusMessage());
      return;
    }
    const boundedRefreshToken = boundRefreshTokenForRequest(refreshToken);
    if (!boundedRefreshToken) {
      setAuthActionStatus(authRefreshUnavailableStatusMessage());
      return;
    }
    setIsAuthOperationInFlight(true);
    setAuthActionStatus(authRefreshProgressStatusMessage());
    try {
      const response = await requestJson<AuthTokenResponse>(normalizedApiBaseUrl, "/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: boundedRefreshToken })
      });
      const boundedResponse = boundAuthTokenResponse(response);
      if (!boundedResponse) {
        clearMobileSessionState();
        setAuthActionStatus(authRefreshStorageFailureStatusMessage());
        return;
      }
      const stored = await writeStoredAuthSession({
        accessToken: boundedResponse.access_token,
        refreshToken: boundedResponse.refresh_token
      });
      if (!stored.ok || !stored.session) {
        clearMobileSessionState();
        setAuthActionStatus(authRefreshStorageFailureStatusMessage());
        return;
      }
      setAccessToken(stored.session.accessToken);
      setRefreshToken(stored.session.refreshToken);
      setTokenStorageStatus("SecureStore 已保存 rotated session；refresh token 未顯示。");
      setAuthActionStatus(authRefreshSuccessStatusMessage(boundedResponse.expires_in));
    } catch (error) {
      setAuthActionStatus(authRefreshFailureStatusMessage(error));
    } finally {
      setIsAuthOperationInFlight(false);
    }
  }

  async function logoutProductionAuthSession() {
    if (isAuthOperationInFlight) {
      setAuthActionStatus(authOperationBusyStatusMessage());
      return;
    }
    const boundedRefreshToken = boundRefreshTokenForRequest(refreshToken);
    if (!boundedRefreshToken) {
      clearMobileSessionState();
      setAuthActionStatus(authLogoutSuccessStatusMessage());
      return;
    }
    setIsAuthOperationInFlight(true);
    setAuthActionStatus(authLogoutProgressStatusMessage());
    try {
      await requestJson<{ revoked: boolean }>(normalizedApiBaseUrl, "/auth/logout", {
        method: "POST",
        headers: protectedRequestHeaders(account?.id ?? "", accessToken),
        body: JSON.stringify({ refresh_token: boundedRefreshToken })
      });
      clearMobileSessionState();
      setAuthActionStatus(authLogoutSuccessStatusMessage());
      setStatus(boundUiMessage("已登出"));
    } catch (error) {
      clearMobileSessionState();
      setAuthActionStatus(authLogoutFailureStatusMessage(error));
      setStatus(boundUiMessage("已清除本機 token"));
    } finally {
      setIsAuthOperationInFlight(false);
    }
  }

  async function logoutAllProductionAuthSessions() {
    if (isAuthOperationInFlight) {
      setAuthActionStatus(authOperationBusyStatusMessage());
      return;
    }
    if (!protectedAccountBackendReady) {
      setAuthActionStatus(authSessionsUnavailableStatusMessage(protectedAccountBackendUnavailableMessage));
      return;
    }
    const currentAccount = account;
    if (!currentAccount) {
      setAuthActionStatus(authSessionsUnavailableStatusMessage(protectedAccountBackendUnavailableMessage));
      return;
    }
    setIsAuthOperationInFlight(true);
    setAuthActionStatus(authLogoutAllProgressStatusMessage());
    try {
      const response = await requestJson<{ revoked_sessions: number }>(normalizedApiBaseUrl, "/auth/logout-all", {
        method: "POST",
        headers: protectedRequestHeaders(currentAccount.id, accessToken)
      });
      clearMobileSessionState();
      setAuthActionStatus(authLogoutAllSuccessStatusMessage(response.revoked_sessions));
      setStatus(boundUiMessage("已登出全部裝置"));
    } catch (error) {
      clearMobileSessionState();
      setAuthActionStatus(authLogoutFailureStatusMessage(error));
      setStatus(boundUiMessage("已清除本機 token"));
    } finally {
      setIsAuthOperationInFlight(false);
    }
  }

  async function loadProductionAuthSessions() {
    if (isAuthOperationInFlight) {
      setAuthActionStatus(authOperationBusyStatusMessage());
      return;
    }
    if (!protectedAccountBackendReady) {
      setAuthSessions([]);
      setAuthActionStatus(authSessionsUnavailableStatusMessage(protectedAccountBackendUnavailableMessage));
      return;
    }
    const currentAccount = account;
    if (!currentAccount) {
      setAuthSessions([]);
      setAuthActionStatus(authSessionsUnavailableStatusMessage(protectedAccountBackendUnavailableMessage));
      return;
    }
    setIsAuthOperationInFlight(true);
    setAuthActionStatus(authSessionsProgressStatusMessage());
    try {
      const response = await requestJson<AuthSessionItem[]>(normalizedApiBaseUrl, "/auth/sessions?limit=20", {
        headers: protectedRequestHeaders(currentAccount.id, accessToken)
      });
      const boundedSessions = response.slice(0, 20).map((session) => ({
        id: boundIdentifier(session.id),
        created_at: boundDisplayText(session.created_at, 80),
        expires_at: boundDisplayText(session.expires_at, 80),
        last_used_at: session.last_used_at ? boundDisplayText(session.last_used_at, 80) : null,
        has_device_fingerprint: Boolean(session.has_device_fingerprint)
      }));
      setAuthSessions(boundedSessions);
      setAuthActionStatus(authSessionsSuccessStatusMessage(boundedSessions.length));
    } catch (error) {
      setAuthSessions([]);
      setAuthActionStatus(authSessionsFailureStatusMessage(error));
    } finally {
      setIsAuthOperationInFlight(false);
    }
  }

  async function bootstrapAuthenticatedAccount(bootKey: string, tokenForHeaders: string): Promise<Account> {
    const accountResponse = await requestJson<Account>(bootKey, "/auth/me", {
      headers: protectedRequestHeaders("", tokenForHeaders)
    });
    if (latestBootKey.current !== bootKey) {
      return boundAccount(accountResponse);
    }
    const boundedAccount = boundAccount(accountResponse);
    setAccount(boundedAccount);
    await loadVoiceQuota(boundedAccount.id, tokenForHeaders);

    if (latestBootKey.current !== bootKey) {
      return boundedAccount;
    }
    const modelOptionsResponse = await requestJson<AiModelOptions>(bootKey, "/ai/models");
    if (latestBootKey.current !== bootKey) {
      return boundedAccount;
    }
    const modelOptions = boundAiModelOptions(modelOptionsResponse);
    setModels(modelOptions);
    const defaultStt = modelOptions.stt_models.find((model) => model.available) ?? modelOptions.stt_models[0];
    if (defaultStt) {
      setSttModelId(defaultStt.id);
    }
    const preferredLlm =
      modelOptions.llm_models.find((model) => model.id === "deepseek-chat" && model.available) ??
      modelOptions.llm_models.find((model) => model.id === "ollama-qwen2.5-1.5b" && model.available) ??
      modelOptions.llm_models.find((model) => model.available) ??
      modelOptions.llm_models[0];
    if (preferredLlm) {
      setLlmModelId(preferredLlm.id);
    }

    const profileHeaders = protectedRequestHeaders(boundedAccount.id, tokenForHeaders);
    let nextProfiles = await requestJson<Profile[]>(bootKey, "/profiles", {
      headers: profileHeaders
    });
    if (latestBootKey.current !== bootKey) {
      return boundedAccount;
    }
    if (nextProfiles.length === 0) {
      const created = await requestJson<Profile>(bootKey, "/profiles", {
        method: "POST",
        headers: profileHeaders,
        body: JSON.stringify({ display_name: "自己", relationship: "self" })
      });
      if (latestBootKey.current !== bootKey) {
        return boundedAccount;
      }
      nextProfiles = [created];
    }
    const boundedProfiles = boundProfiles(nextProfiles);
    setProfiles(boundedProfiles);
    setActiveProfileId(boundedProfiles[0]?.id ?? "");
    return boundedAccount;
  }

  async function completeOidcLoginFromProviderToken(
    providerValue: string,
    idTokenValue: string,
    nonceValue: string,
    deviceFingerprintValue?: string
  ) {
    if (isAuthOperationInFlight) {
      setAuthActionStatus(authOperationBusyStatusMessage());
      return;
    }
    const provider = boundOidcProviderForRequest(providerValue);
    const idToken = boundOidcIdTokenForRequest(idTokenValue);
    const nonce = boundOidcNonceForRequest(nonceValue);
    if (!provider || !idToken || !nonce) {
      setAuthActionStatus(oidcExchangeUnavailableStatusMessage());
      return;
    }
    const bootKey = normalizedApiBaseUrl;
    latestBootKey.current = bootKey;
    setIsAuthOperationInFlight(true);
    setIsBusy(true);
    setAuthActionStatus(oidcExchangeProgressStatusMessage(provider));
    try {
      const response = await requestJson<AuthTokenResponse>(bootKey, "/auth/oidc-login", {
        method: "POST",
        body: JSON.stringify({
          provider,
          id_token: idToken,
          nonce,
          device_fingerprint: boundDeviceFingerprintForRequest(deviceFingerprintValue)
        })
      });
      const boundedResponse = boundAuthTokenResponse(response);
      if (!boundedResponse) {
        clearMobileSessionState();
        setAuthActionStatus(oidcExchangeStorageFailureStatusMessage());
        return;
      }
      const stored = await writeStoredAuthSession({
        accessToken: boundedResponse.access_token,
        refreshToken: boundedResponse.refresh_token
      });
      if (!stored.ok || !stored.session) {
        clearMobileSessionState();
        setAuthActionStatus(oidcExchangeStorageFailureStatusMessage());
        return;
      }
      setAccessToken(stored.session.accessToken);
      setRefreshToken(stored.session.refreshToken);
      setTokenStorageStatus("SecureStore 已保存 OIDC session；refresh token 未顯示。");
      await bootstrapAuthenticatedAccount(bootKey, stored.session.accessToken);
      if (latestBootKey.current === bootKey) {
        setStatus(backendReconnectSuccessStatusMessage());
        setAuthActionStatus(oidcExchangeSuccessStatusMessage(boundedResponse.expires_in));
      }
    } catch (error) {
      clearMobileSessionState();
      setAuthActionStatus(oidcExchangeFailureStatusMessage(error));
    } finally {
      if (latestBootKey.current === bootKey) {
        setIsBusy(false);
      }
      setIsAuthOperationInFlight(false);
    }
  }

  function beginOidcProviderChallenge(providerValue: string) {
    if (isAuthOperationInFlight) {
      setAuthActionStatus(authOperationBusyStatusMessage());
      return;
    }
    const result = createAuthProviderChallenge(providerValue);
    if (!result.ok) {
      pendingOidcChallenge.current = null;
      setAuthActionStatus(authProviderChallengeFailureStatusMessage(result.reason));
      return;
    }
    pendingOidcChallenge.current = result.challenge;
    setAuthActionStatus(authProviderChallengeCreatedStatusMessage(result.challenge.provider));
  }

  async function completeOidcLoginFromProviderCallback(
    providerValue: string,
    idTokenValue: string,
    stateValue: string,
    deviceFingerprintValue?: string
  ) {
    const result = validateAuthProviderChallenge(pendingOidcChallenge.current, providerValue, stateValue);
    pendingOidcChallenge.current = null;
    if (!result.ok) {
      setAuthActionStatus(authProviderCallbackRejectedStatusMessage(result.reason));
      return;
    }
    await completeOidcLoginFromProviderToken(providerValue, idTokenValue, result.nonce, deviceFingerprintValue);
  }

  function updateApiBaseUrlDraft(value: string) {
    const nextValue = value.slice(0, maxBackendUrlLength);
    if (nextValue !== apiBaseUrl) {
      const display = backendUrlChangedDisplayMessages();
      clearMobileSessionState();
      setStatus(display.status);
      setAuthActionStatus(display.authStatus);
    }
    setApiBaseUrl(nextValue);
  }

  function handleHeaderAction() {
    if (isAnyRequestInFlight) {
      setStatus(busyActionStatusMessage());
      return;
    }
    if (currentScreen === "aiReview") {
      returnToTranscriptEdit();
      return;
    }
    if (headerBackTarget === "menu" && currentScreen !== "menu" && !currentChrome.actionLabel) {
      openMenu(currentScreen);
      return;
    }
    setCurrentScreen(headerBackTarget);
  }

  function openMenu(returnScreen: AppScreen = currentScreen) {
    setMenuReturnScreen(returnScreen === "menu" ? "today" : returnScreen);
    setCurrentScreen("menu");
  }

  async function startRecordingPreview() {
    if (recordingStartInFlight.current || recordingStopInFlight.current || audioRecordingRef.current) {
      setStatus(busyActionStatusMessage());
      return;
    }
    if (voiceQuota && voiceQuota.remaining_seconds_today <= 0) {
      setStatus(recordingQuotaExhaustedStatusMessage());
      return;
    }
    recordingStartInFlight.current = true;
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setStatus(recordingPermissionDeniedStatusMessage());
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      audioRecordingRef.current = recording;
      const now = Date.now();
      setIsRecordingPreview(true);
      setRecordingStartedAt(now);
      setRecordingElapsedSeconds(0);
      setPreview(null);
      setAudioPath("");
      setStatus(recordingStartedStatusMessage(Boolean(voiceQuota && voiceQuota.remaining_seconds_today <= 120)));
    } catch (error) {
      audioRecordingRef.current = null;
      setIsRecordingPreview(false);
      setRecordingStartedAt(null);
      setRecordingElapsedSeconds(0);
      setStatus(recordingStartFailureStatusMessage(error));
    } finally {
      recordingStartInFlight.current = false;
    }
  }

  function resetRecordingPreview() {
    audioRecordingRef.current = null;
    setIsRecordingPreview(false);
    setRecordingStartedAt(null);
    setRecordingElapsedSeconds(0);
    setStatus(recordingResetStatusMessage());
  }

  async function transcribeRecordingToReview(
    returnScreen: AppScreen,
    sourceAudioPath: string,
    voiceSeconds: number
  ) {
    const safeAudioPath = boundNativeDebugInput(sourceAudioPath.trim());
    const safeModelPath = boundNativeDebugInput(whisperModelPath.trim());
    if (!safeAudioPath) {
      setStatus(recordingTextFallbackStatusMessage());
      return false;
    }
    if (!safeModelPath) {
      setStatus(recordingWhisperMissingModelStatusMessage());
      return false;
    }
    setIsBusy(true);
    setStatus(recordingWhisperProgressStatusMessage());
    try {
      const text = await transcribeWithNativeWhisper({
        modelPath: safeModelPath,
        audioPath: safeAudioPath
      });
      const boundedText = text.slice(0, maxTranscriptTextLength);
      if (!boundedText.trim()) {
        setStatus(recordingWhisperEmptyStatusMessage());
        return false;
      }
      updateTranscriptDraft(boundedText, "voice", voiceSeconds);
      setIsRecordingPreview(false);
      setRecordingStartedAt(null);
      setRecordingElapsedSeconds(0);
      setPreview(null);
      setTranscriptReviewReturnScreen(returnScreen);
      setCurrentScreen("transcriptReview");
      setStatus(recordingWhisperSuccessStatusMessage());
      return true;
    } catch (error) {
      setStatus(recordingWhisperFailureStatusMessage(error));
      return false;
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRecordingResultPrimaryAction(returnScreen: AppScreen) {
    const boundedSeconds = clampNumber(recordingElapsedSeconds, 0, maxMobileCountValue);
    if (boundedSeconds <= 1) {
      resetRecordingPreview();
      return;
    }
    const transcribed = await transcribeRecordingToReview(returnScreen, audioPath, boundedSeconds);
    if (transcribed) {
      return;
    }
    setIsRecordingPreview(false);
    setRecordingStartedAt(null);
    setRecordingElapsedSeconds(0);
    setPreview(null);
    setTranscriptReviewReturnScreen(returnScreen);
    setCurrentScreen("record");
    setStatus(recordingTextFallbackStatusMessage());
  }

  function useTodayRecordingResultTextFallback() {
    void handleRecordingResultPrimaryAction("today");
  }

  function useRecordRecordingResultTextFallback() {
    void handleRecordingResultPrimaryAction("record");
  }

  async function finishRecordingPreview(reason: "release" | "limit" = "release") {
    if (!isRecordingPreview) {
      return;
    }
    if (recordingStopInFlight.current) {
      return;
    }
    recordingStopInFlight.current = true;
    const rawElapsedSeconds =
      recordingStartedAt === null ? recordingElapsedSeconds : Math.ceil((Date.now() - recordingStartedAt) / 1000);
    const elapsedSeconds = clampNumber(
      rawElapsedSeconds,
      0,
      recordingEffectiveLimitSeconds(voiceQuota)
    );
    const recording = audioRecordingRef.current;
    let capturedAudioPath = "";
    audioRecordingRef.current = null;
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        capturedAudioPath = uri ? boundNativeDebugInput(uri) : "";
        setAudioPath(capturedAudioPath);
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true
      });
      setStatus(
        reason === "limit"
          ? recordingLimitReachedStatusMessage(recordingEffectiveLimitSeconds(voiceQuota))
          : recordingFinishedStatusMessage(elapsedSeconds)
      );
    } catch (error) {
      setStatus(recordingStopFailureStatusMessage(error));
    } finally {
      setIsRecordingPreview(false);
      setRecordingStartedAt(null);
      setRecordingElapsedSeconds(elapsedSeconds);
      recordingStopInFlight.current = false;
    }
    if (currentScreen === "today" && elapsedSeconds > 1 && capturedAudioPath && whisperModelPath.trim()) {
      void transcribeRecordingToReview("today", capturedAudioPath, elapsedSeconds);
    }
  }

  function releaseRecordingPreview() {
    void finishRecordingPreview();
  }

  function openPreviewRecordEdit(index: number) {
    const record = preview?.records[index];
    if (!record) {
      return;
    }
    setPendingPreviewRemoveIndex(null);
    setSelectedPreviewIndex(index);
    setPreviewEditFields(recordPayloadToEditFields(record));
    const dateTime = localDateTimeInputs(record.occurred_at);
    setPreviewEditDate(dateTime.date);
    setPreviewEditTime(dateTime.time);
    setCurrentScreen("editPreviewRecord");
    setStatus(aiCandidateEditOpenStatusMessage());
  }

  function returnFromPreviewRecordEdit() {
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    const nowInputs = localDateTimeInputs(new Date());
    setPreviewEditDate(nowInputs.date);
    setPreviewEditTime(nowInputs.time);
    setCurrentScreen("aiReview");
    setStatus(aiCandidateEditCancelStatusMessage());
  }

  function openPreviewRecordRemoveConfirm(index: number) {
    const record = preview?.records[index];
    if (!record) {
      setCurrentScreen("aiReview");
      return;
    }
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(index);
    setCurrentScreen("aiRemoveConfirm");
    setStatus(aiCandidateRemoveConfirmStatusMessage());
  }

  function editAiCandidateRecord(index: number) {
    openPreviewRecordEdit(index);
  }

  function pressAiCandidateEditAction(item: ReturnType<typeof pendingRecordDisplayItem>) {
    editAiCandidateRecord(item.index);
  }

  function removeAiCandidateRecord(index: number) {
    openPreviewRecordRemoveConfirm(index);
  }

  function pressAiCandidateRemoveAction(item: ReturnType<typeof pendingRecordDisplayItem>) {
    removeAiCandidateRecord(item.index);
  }

  function returnFromPreviewRemoveConfirm() {
    setPendingPreviewRemoveIndex(null);
    setSelectedPreviewIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    setCurrentScreen("aiReview");
    setStatus(aiCandidateRemoveCancelStatusMessage());
  }

  function removePreviewRecord(index: number) {
    if (!preview) {
      return;
    }
    const nextRecords = preview.records.filter((_, recordIndex) => recordIndex !== index);
    setPreview(boundParsePreviewResponse({ ...preview, records: nextRecords }));
    setPendingPreviewRemoveIndex(null);
    setStatus(aiCandidateRemoveResultStatusMessage(nextRecords.length));
  }

  function confirmPreviewRecordRemove() {
    if (pendingPreviewRemoveIndex === null || !pendingPreviewRemoveRecord) {
      setPendingPreviewRemoveIndex(null);
      setCurrentScreen("aiReview");
      return;
    }
    removePreviewRecord(pendingPreviewRemoveIndex);
    setCurrentScreen("aiReview");
  }

  function updatePreviewEditField<K extends keyof RecordEditFields>(
    field: K,
    value: RecordEditFields[K]
  ) {
    setPreviewEditFields((current) => ({ ...current, [field]: boundRecordEditField(field, value) }));
  }

  function updatePreviewEditDateInput(value: string) {
    setPreviewEditDate(boundDateInputText(value));
  }

  function updatePreviewEditTimeInput(value: string) {
    setPreviewEditTime(boundTimeInputText(value));
  }

  function updatePreviewEditGlucoseValue(value: string) {
    updatePreviewEditField("glucoseValue", value);
  }

  function selectPreviewEditGlucoseUnit(value: string) {
    updatePreviewEditField("glucoseUnit", value);
  }

  function pressPreviewEditGlucoseUnitOption(option: ReturnType<typeof optionDisplayItem>) {
    selectPreviewEditGlucoseUnit(option.value);
  }

  function selectPreviewEditGlucoseTiming(value: string) {
    updatePreviewEditField("glucoseTiming", value);
  }

  function pressPreviewEditGlucoseTimingOption(option: ReturnType<typeof valueLabelDisplayItem>) {
    selectPreviewEditGlucoseTiming(option.value);
  }

  function selectPreviewEditMealType(value: string) {
    updatePreviewEditField("mealType", value);
  }

  function pressPreviewEditMealTypeOption(option: ReturnType<typeof valueLabelDisplayItem>) {
    selectPreviewEditMealType(option.value);
  }

  function updatePreviewEditFoodItems(value: string) {
    updatePreviewEditField("foodItems", value);
  }

  function updatePreviewEditExerciseActivity(value: string) {
    updatePreviewEditField("exerciseActivity", value);
  }

  function updatePreviewEditExerciseMinutes(value: string) {
    updatePreviewEditField("exerciseMinutes", value);
  }

  function updatePreviewEditMedicationName(value: string) {
    updatePreviewEditField("medicationName", value);
  }

  function updatePreviewEditMedicationDose(value: string) {
    updatePreviewEditField("medicationDose", value);
  }

  function updatePreviewEditNoteKind(value: string) {
    updatePreviewEditField("noteKind", value);
  }

  function updatePreviewEditNoteTags(value: string) {
    updatePreviewEditField("noteTags", value);
  }

  function updatePreviewEditFallbackJson(value: string) {
    updatePreviewEditField("fallbackJson", value);
  }

  function savePreviewRecordEdit() {
    if (!preview || selectedPreviewIndex === null || !selectedPreviewRecord) {
      setCurrentScreen("aiReview");
      return;
    }
    const validationError = validateRecordForm(
      selectedPreviewRecord.record_type,
      previewEditFields,
      previewEditDate,
      previewEditTime
    );
    if (validationError) {
      setStatus(validationError);
      return;
    }

    try {
      const payload = buildPayloadFromEditFields(selectedPreviewRecord.record_type, previewEditFields);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("payload_json must be an object");
      }
      const nextRecords = preview.records.map((record, index) =>
        index === selectedPreviewIndex
          ? {
              ...record,
              occurred_at: localDateTimeToIso(previewEditDate, previewEditTime),
              payload_json: payload
            }
          : record
      );
      setPreview(boundParsePreviewResponse({ ...preview, records: nextRecords }));
      setSelectedPreviewIndex(null);
      setPreviewEditFields(emptyRecordEditFields());
      setCurrentScreen("aiReview");
      setStatus(aiCandidateEditSuccessStatusMessage());
    } catch (error) {
      setStatus(aiCandidateEditFailureStatusMessage(error));
    }
  }

  function enterAiSaveConfirm() {
    if (!preview || preview.records.length === 0) {
      setCurrentScreen("aiReview");
      return;
    }
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    setLastSaveErrorSummary("");
    setCurrentScreen("aiSaveConfirm");
    setStatus(aiSaveConfirmReadyStatusMessage());
  }

  function returnFromAiSaveConfirm() {
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    setLastSaveErrorSummary("");
    setCurrentScreen("aiReview");
    setStatus(aiSaveConfirmReturnStatusMessage());
  }

  function processUnsavedPreviewRecords() {
    if (!preview || preview.records.length === 0) {
      setCurrentScreen("today");
      return;
    }
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    setLastSaveErrorSummary("");
    setCurrentScreen("aiReview");
    setStatus(saveSuccessProcessUnsavedStatusMessage());
  }

  function openSaveSuccessDestination(target: AppScreen) {
    if (target === "aiReview") {
      processUnsavedPreviewRecords();
      return;
    }
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    setLastSaveErrorSummary("");
    setCurrentScreen(target);
    setStatus(saveSuccessDestinationStatusMessage(target));
  }

  function openSaveSuccessDestinationCard(target: AppScreen) {
    openSaveSuccessDestination(target);
  }

  function pressSaveSuccessDestinationCard(item: ReturnType<typeof destinationCardDisplayItem>) {
    openSaveSuccessDestinationCard(item.target);
  }

  function openSaveSuccessManualContinue() {
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    setLastSaveErrorSummary("");
    openManualRecord(manualRecordReturnScreen);
    setStatus(saveSuccessManualContinueStatusMessage());
  }

  function openSaveSuccessRecordEntry() {
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    setLastSaveErrorSummary("");
    setCurrentScreen("record");
    setStatus(saveSuccessRecordEntryStatusMessage());
  }

  function openSaveSuccessRecordDetail() {
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    setLastSaveErrorSummary("");
    openSelectedRecordDetail("saveSuccess");
    setStatus(saveSuccessViewDetailStatusMessage());
  }

  function returnFromSaveSuccessToToday() {
    openSaveSuccessDestination("today");
  }

  function returnFromAiSaveFailureToAiReview() {
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    setLastSaveErrorSummary("");
    setCurrentScreen("aiReview");
    setStatus(aiSaveFailureBackAiReviewStatusMessage());
  }

  function returnFromAiSaveFailureToSaveConfirm() {
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    setLastSaveErrorSummary("");
    if (!preview || preview.records.length === 0) {
      setCurrentScreen("aiReview");
      setStatus(aiSaveFailureBackAiReviewStatusMessage());
      return;
    }
    setCurrentScreen("aiSaveConfirm");
    setStatus(aiSaveFailureReturnSaveConfirmStatusMessage());
  }

  function openAiSaveFailureManualFallback() {
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    openManualRecord("aiReview");
    setStatus(aiSaveFailureManualFallbackStatusMessage());
  }

  async function loadVoiceQuota(accountId: string, tokenOverride = accessToken) {
    const tokenForHeaders = tokenOverride.trim();
    if ((!protectedAuthReady && !tokenForHeaders) || accountId.trim().length === 0) {
      setVoiceQuota(null);
      setQuotaStatus(voiceQuotaUnavailableStatusMessage(protectedAccountBackendUnavailableMessage));
      setIsQuotaSyncing(false);
      return;
    }
    const quotaKey = `${normalizedApiBaseUrl}:${accountId}`;
    latestQuotaSyncKey.current = quotaKey;
    if (quotaSyncInFlightKeys.current.has(quotaKey)) {
      return;
    }
    quotaSyncInFlightKeys.current.add(quotaKey);
    setIsQuotaSyncing(true);
    try {
      const quota = await requestJson<VoiceQuota>(
        normalizedApiBaseUrl,
        "/subscriptions/voice-quota",
        { headers: protectedRequestHeaders(accountId, tokenForHeaders) }
      );
      if (latestQuotaSyncKey.current !== quotaKey) {
        return;
      }
      setVoiceQuota(boundVoiceQuota(quota));
      setQuotaStatus(voiceQuotaSyncSuccessStatusMessage());
    } catch {
      if (latestQuotaSyncKey.current === quotaKey) {
        setVoiceQuota(null);
        setQuotaStatus(voiceQuotaSyncFailureStatusMessage());
      }
    } finally {
      quotaSyncInFlightKeys.current.delete(quotaKey);
      if (
        latestQuotaSyncKey.current === quotaKey ||
        latestQuotaSyncKey.current === "" ||
        quotaSyncInFlightKeys.current.size === 0
      ) {
        setIsQuotaSyncing(false);
      }
    }
  }

  function openSettingsRow(row: SettingsRow) {
    if (row.id === "auth") {
      setCurrentScreen("accountSecurity");
      return;
    }
    if (row.id === "profile") {
      setCurrentScreen("profileSettings");
      return;
    }
    if (row.id === "reminders") {
      setCurrentScreen("reminderSettings");
      return;
    }
    if (row.id === "quota") {
      setCurrentScreen("recordingQuotaSettings");
      return;
    }
    if (row.id === "privacy") {
      setCurrentScreen("privacySettings");
      return;
    }
    if (row.id === "subscription") {
      setCurrentScreen("subscriptionManagement");
      return;
    }
    if (row.target === "subscription") {
      openSubscription("settings");
      return;
    }
    if (row.target === "tutorial") {
      openTutorial("settings");
      return;
    }
  }

  function pressSettingsRow(row: ReturnType<typeof settingsRowDisplayItem>) {
    openSettingsRow(row);
  }

  function clearLocalSessionFromSettings() {
    const display = localClearDisplayMessages();
    clearMobileSessionState();
    setAuthActionStatus(display.authStatus);
    setStatus(display.status);
  }

  function startAuthProviderChallenge(provider: string) {
    beginOidcProviderChallenge(provider);
  }

  function pressAuthProviderPreview(item: ReturnType<typeof authProviderPreviewDisplayItem>) {
    startAuthProviderChallenge(item.provider);
  }

  function refreshAuthSessionFromSecurity() {
    void refreshProductionAuthSession();
  }

  function loadAuthSessionsFromSecurity() {
    void loadProductionAuthSessions();
  }

  function logoutAuthSessionFromSecurity() {
    void logoutProductionAuthSession();
  }

  function logoutAllAuthSessionsFromSecurity() {
    void logoutAllProductionAuthSessions();
  }

  function showAuthSessionManagementStatus(actionStatus: string) {
    setAuthActionStatus(actionStatus);
  }

  function pressAuthSessionManagementPreview(item: ReturnType<typeof sessionManagementPreviewDisplayItem>) {
    showAuthSessionManagementStatus(item.actionStatus);
  }

  function showProfileEditIntegrationStatus() {
    setProfileActionStatus(profileEditIntegrationStatusMessage);
  }

  function syncRecordingQuotaSettings() {
    if (account && protectedAccountBackendReady) {
      setRecordingQuotaActionStatus(recordingQuotaSyncingStatusMessage);
      void loadVoiceQuota(account.id);
      return;
    }
    setRecordingQuotaActionStatus(recordingQuotaUnavailableStatusMessage);
  }

  function showReminderIntegrationStatus() {
    setReminderActionStatus(reminderIntegrationStatusMessage);
  }

  function showPrivacyIntegrationStatus() {
    setPrivacyActionStatus(privacyIntegrationStatusMessage);
  }

  function toggleAdvancedSettings() {
    setShowAdvancedSettings((value) => !value);
  }

  function reconnectBackendFromSettings() {
    void boot();
  }

  function selectActiveProfileFromSettings(profileId: string) {
    setActiveProfileId(profileId);
  }

  function selectLlmModelFromSettings(modelId: string) {
    setLlmModelId(modelId);
  }

  function selectSttModelFromSettings(modelId: string) {
    setSttModelId(modelId);
  }

  function selectNativeDownloadKind(kind: "whisper" | "llama") {
    setDownloadKind(kind);
  }

  function selectSettingsProfileChoice(profileId: string) {
    selectActiveProfileFromSettings(profileId);
  }

  function pressSettingsProfileChoice(profile: (typeof profileChoiceDisplayItems)[number]) {
    selectSettingsProfileChoice(profile.sourceId);
  }

  function selectSettingsLlmModelChoice(modelId: string) {
    selectLlmModelFromSettings(modelId);
  }

  function pressSettingsLlmModelChoice(model: (typeof llmModelChoiceDisplayItems)[number]) {
    selectSettingsLlmModelChoice(model.sourceId);
  }

  function selectSettingsSttModelChoice(modelId: string) {
    selectSttModelFromSettings(modelId);
  }

  function pressSettingsSttModelChoice(model: (typeof sttModelChoiceDisplayItems)[number]) {
    selectSettingsSttModelChoice(model.sourceId);
  }

  function selectRecordingWhisperModelChoice(item: (typeof downloadedWhisperModelChoiceItems)[number]) {
    setWhisperModelPath(item.sourceUri);
    setStatus(recordingModelSelectedStatusMessage(item.label));
  }

  function pressRecordingWhisperModelChoice(item: (typeof downloadedWhisperModelChoiceItems)[number]) {
    selectRecordingWhisperModelChoice(item);
  }

  function refreshRecordingModelsFromSettings() {
    void refreshDownloadedModels(true);
  }

  function selectWhisperNativeDownloadKind() {
    selectNativeDownloadKind("whisper");
  }

  function selectLlamaNativeDownloadKind() {
    selectNativeDownloadKind("llama");
  }

  function updateNativeModelUrlInput(value: string) {
    setModelUrl(boundNativeDebugInput(value));
  }

  function updateWhisperModelPathInput(value: string) {
    setWhisperModelPath(boundNativeDebugInput(value));
  }

  function updateNativeAudioPathInput(value: string) {
    setAudioPath(boundNativeDebugInput(value));
  }

  function updateLlamaModelPathInput(value: string) {
    setLlamaModelPath(boundNativeDebugInput(value));
  }

  function checkNativeModulesFromSettings() {
    void checkNativeModules();
  }

  function downloadNativeModelFromSettings() {
    void downloadSelectedModel();
  }

  function runNativeWhisperFromSettings() {
    void runNativeWhisper();
  }

  function runNativeLlamaFromSettings() {
    void runNativeLlama();
  }

  function runNativeBenchmarksFromSettings() {
    void runNativeBenchmarks();
  }

  function openSubscription(returnScreen: AppScreen = currentScreen) {
    setSubscriptionReturnScreen(returnScreen === "subscription" ? "menu" : returnScreen);
    setCurrentScreen("subscription");
  }

  function openPrimaryTab(target: AppScreen) {
    if (target === "menu") {
      openMenu(currentScreen);
      return;
    }
    setCurrentScreen(target);
  }

  function pressPrimaryTab(target: AppScreen) {
    openPrimaryTab(target);
  }

  function returnFromMenu() {
    setCurrentScreen(menuReturnScreen);
    setStatus(menuReturnStatusMessage(menuReturnScreen));
  }

  function openMenuDestination(target: AppScreen) {
    if (target === "community") {
      openCommunity("menu");
      return;
    }
    if (target === "ranking") {
      openRanking("menu");
      return;
    }
    if (target === "manualRecord") {
      openManualRecord("menu");
      return;
    }
    if (target === "subscription") {
      openSubscription("menu");
      return;
    }
    if (target === "tutorial") {
      openTutorial("menu");
      return;
    }
    if (target === "foodPhoto") {
      openFoodPhoto("menu");
      return;
    }
    if (target === "achievements") {
      openAchievements("menu");
      return;
    }
    if (target === "yearReview") {
      openYearReview("menu");
      return;
    }
    if (target === "store") {
      openStore("menu");
      return;
    }
    setCurrentScreen(target);
  }

  function pressMenuDestination(item: ReturnType<typeof menuScreenDisplayItem>) {
    openMenuDestination(item.target);
  }

  function syncSubscriptionQuota() {
    if (account && protectedAccountBackendReady) {
      void loadVoiceQuota(account.id);
      return;
    }
    setStatus(voiceQuotaUnavailableStatusMessage(protectedAccountBackendUnavailableMessage));
  }

  function showSubscriptionTrialIntegrationStatus() {
    setSubscriptionActionStatus(subscriptionTrialIntegrationStatusMessage);
  }

  function openSubscriptionManagementFromSubscription() {
    setCurrentScreen("subscriptionManagement");
    setStatus(subscriptionManagementOpenStatusMessage());
  }

  function openMembershipStatusFromSubscription() {
    setCurrentScreen("membershipStatus");
    setStatus(subscriptionMembershipStatusOpenStatusMessage());
  }

  function syncSubscriptionManagementStatus() {
    if (account && protectedAccountBackendReady) {
      setSubscriptionManagementActionStatus(subscriptionManagementSyncingStatusMessage);
      void loadVoiceQuota(account.id);
      return;
    }
    setSubscriptionManagementActionStatus(subscriptionManagementUnavailableStatusMessage);
  }

  function returnFromSubscriptionManagementToSettings() {
    setCurrentScreen("settings");
    setStatus(subscriptionManagementReturnSettingsStatusMessage());
  }

  function openAccountSecurityFromSettings() {
    setCurrentScreen("accountSecurity");
    setStatus(settingsAccountSecurityOpenStatusMessage());
  }

  function returnFromSettingsSubpage() {
    setCurrentScreen("settings");
    setStatus(settingsSubpageReturnStatusMessage());
  }

  function showSubscriptionManagementPaymentStatus() {
    setSubscriptionManagementActionStatus(subscriptionManagementPaymentStatusMessage);
  }

  function returnFromMembershipStatusToSubscription() {
    setCurrentScreen("subscription");
    setStatus(membershipStatusReturnSubscriptionStatusMessage());
  }

  function openMembershipRenewalManagement() {
    setSubscriptionActionStatus(subscriptionRenewalIntegrationStatusMessage);
    openSubscriptionManagementFromSubscription();
  }

  function openMembershipManagement() {
    openSubscriptionManagementFromSubscription();
  }

  function openTutorial(returnScreen: AppScreen = currentScreen) {
    setTutorialReturnScreen(returnScreen === "tutorial" ? "menu" : returnScreen);
    setCurrentScreen("tutorial");
  }

  function openFoodPhoto(returnScreen: AppScreen = currentScreen) {
    setFoodPhotoReturnScreen(returnScreen === "foodPhoto" ? "menu" : returnScreen);
    setCurrentScreen("foodPhoto");
  }

  function returnFromFoodPhoto() {
    setCurrentScreen(foodPhotoReturnScreen);
    setStatus(futurePreviewReturnStatusMessage(foodPhotoReturnScreen));
  }

  function openFutureModulesFromMenu() {
    setFutureModuleActionStatus(previewActionClearStatusMessage());
    setCurrentScreen("futureModules");
    setStatus(futureModulesOpenStatusMessage());
  }

  function returnFromFutureModulesToMenu() {
    setCurrentScreen("menu");
    setStatus(futureModulesReturnMenuStatusMessage());
  }

  function returnFromFutureModuleDetail() {
    setCurrentScreen("futureModules");
    setStatus(futureModuleDetailReturnStatusMessage());
  }

  function openDoctorShare(returnScreen: AppScreen = currentScreen) {
    setDoctorShareReturnScreen(returnScreen === "doctorShare" ? "futureModules" : returnScreen);
    setDoctorShareActionStatus(previewActionClearStatusMessage());
    setCurrentScreen("doctorShare");
  }

  function returnFromDoctorSharePreview() {
    setCurrentScreen(doctorShareReturnScreen);
    setStatus(futurePreviewReturnStatusMessage(doctorShareReturnScreen));
  }

  function showDoctorShareTokenStatus() {
    setDoctorShareActionStatus(doctorShareTokenStatusMessage);
  }

  function showDoctorShareReportBoundaryStatus() {
    setDoctorShareActionStatus(doctorShareReportBoundaryStatusMessage);
  }

  function openHealthIntegration(returnScreen: AppScreen = currentScreen) {
    setHealthIntegrationReturnScreen(returnScreen === "healthIntegration" ? "futureModules" : returnScreen);
    setHealthIntegrationActionStatus(previewActionClearStatusMessage());
    setCurrentScreen("healthIntegration");
  }

  function returnFromHealthIntegrationPreview() {
    setCurrentScreen(healthIntegrationReturnScreen);
    setStatus(futurePreviewReturnStatusMessage(healthIntegrationReturnScreen));
  }

  function showHealthIntegrationPermissionStatus() {
    setHealthIntegrationActionStatus(healthIntegrationPermissionStatusMessage);
  }

  function showHealthIntegrationMeterStatus() {
    setHealthIntegrationActionStatus(healthIntegrationMeterStatusMessage);
  }

  function openCommunity(returnScreen: AppScreen = currentScreen) {
    setCommunityReturnScreen(returnScreen === "community" ? "futureModules" : returnScreen);
    setCommunityActionStatus(previewActionClearStatusMessage());
    setCurrentScreen("community");
    void loadCommunityPublicSettings();
    void loadFoodCommunityCategories();
    void loadCommunityFoods();
  }

  function returnFromCommunityPreview() {
    setCurrentScreen(communityReturnScreen);
    setStatus(futurePreviewReturnStatusMessage(communityReturnScreen));
  }

  function showCommunityPostingStatus() {
    setCommunityActionStatus(communityPostingStatusMessage);
  }

  function showCommunityPrivacyStatus() {
    void saveCommunityPublicSettings(!(communityPublicSettings?.leaderboard_opt_in ?? false));
  }

  function saveCommunityPublicProfile() {
    void saveCommunityPublicSettings();
  }

  function updateFoodCommunitySearchInput(value: string) {
    setFoodCommunitySearchText(boundStoreSearchText(value));
  }

  function updateFoodCommunityFoodName(value: string) {
    setFoodCommunityShareFields((current) => ({
      ...current,
      foodName: boundDisplayText(value, maxDisplayTextLength)
    }));
  }

  function selectFoodCommunityCategory(category: FoodCommunityCategory) {
    setFoodCommunityCategory(category);
    const firstMatch = foodCommunityItemsForDisplay.find((item) => item.category === category);
    setSelectedFoodCommunityItemId(firstMatch?.id ?? "");
  }

  function pressFoodCommunityCategoryOption(category: ReturnType<typeof foodCommunityCategoryDisplayItem>) {
    selectFoodCommunityCategory(category.value);
  }

  function selectFoodCommunityItem(itemId: string) {
    const boundedItemId = boundIdentifier(itemId);
    setSelectedFoodCommunityItemId(boundedItemId);
    if (foodCommunityBackendItems.some((item) => item.id === boundedItemId)) {
      void loadFoodCommunityDetail(boundedItemId);
    }
  }

  function pressFoodCommunityItem(item: ReturnType<typeof foodCommunityItemDisplayItem>) {
    selectFoodCommunityItem(item.id);
  }

  function showFoodCommunityShareStatus() {
    void submitFoodCommunityShare();
  }

  function openRanking(returnScreen: AppScreen = currentScreen) {
    setRankingReturnScreen(returnScreen === "ranking" ? "futureModules" : returnScreen);
    setRankingActionStatus(previewActionClearStatusMessage());
    setCurrentScreen("ranking");
    void loadCommunityLeaderboards();
  }

  function returnFromRankingPreview() {
    setCurrentScreen(rankingReturnScreen);
    setStatus(futurePreviewReturnStatusMessage(rankingReturnScreen));
  }

  function showRankingPublicStatus() {
    void loadCommunityLeaderboards();
  }

  function showRankingOptInStatus() {
    void saveCommunityPublicSettings(!(communityPublicSettings?.leaderboard_opt_in ?? false));
  }

  function openAchievements(returnScreen: AppScreen = currentScreen) {
    setAchievementsReturnScreen(returnScreen === "achievements" ? "menu" : returnScreen);
    setCurrentScreen("achievements");
    void loadAchievementSummary();
  }

  function returnFromAchievements() {
    setCurrentScreen(achievementsReturnScreen);
    setStatus(futurePreviewReturnStatusMessage(achievementsReturnScreen));
  }

  function showAchievementIntegrationStatus() {
    void loadAchievementSummary(true);
  }

  function syncAchievementsAfterRecordSave() {
    void loadAchievementSummary(true);
  }

  function openYearReview(returnScreen: AppScreen = currentScreen) {
    setYearReviewReturnScreen(returnScreen === "yearReview" ? "menu" : returnScreen);
    setCurrentScreen("yearReview");
    void loadYearReview();
  }

  function returnFromYearReview() {
    setCurrentScreen(yearReviewReturnScreen);
    setStatus(futurePreviewReturnStatusMessage(yearReviewReturnScreen));
  }

  function showYearReviewShareStatus() {
    void loadYearReviewShareCard();
  }

  function revokeYearReviewShareStatus() {
    void revokeYearReviewSharePackage();
  }

  function openStore(returnScreen: AppScreen = currentScreen) {
    setStoreReturnScreen(returnScreen === "store" ? "menu" : returnScreen);
    setCurrentScreen("store");
    void loadStoreCatalogAndPoints();
  }

  function updateStoreSearchInput(value: string) {
    setStoreSearchText(boundStoreSearchText(value));
  }

  function selectStoreCategory(category: StoreCategory) {
    setStoreCategory(category);
  }

  function pressStoreCategoryOption(category: ReturnType<typeof storeCategoryDisplayItem>) {
    selectStoreCategory(category.value);
  }

  function showStoreProductStatus(actionStatus: string) {
    setStoreActionStatus(actionStatus);
  }

  function pressStoreProductStatus(product: ReturnType<typeof storeProductDisplayItem>) {
    void redeemStoreProduct(product);
  }

  function pressStoreRedemptionStatus(redemption: ReturnType<typeof storeRedemptionDisplayItem>) {
    void useStoreRedemption(redemption);
  }

  function openStoreCart() {
    setCurrentScreen("storeCart");
    setStatus(commercePreviewOpenCartStatusMessage());
  }

  function returnFromStore() {
    setCurrentScreen(storeReturnScreen);
    setStatus(futurePreviewReturnStatusMessage(storeReturnScreen));
  }

  function returnFromStoreCartToStore() {
    setCurrentScreen("store");
    setStatus(commercePreviewReturnStoreStatusMessage());
  }

  function showFoodPhotoUploadStatus() {
    setFoodPhotoActionStatus(foodPhotoUploadStatusMessage);
  }

  function showFoodPhotoIntegrationStatus() {
    setFoodPhotoActionStatus(foodPhotoIntegrationStatusMessage);
  }

  function showFoodPhotoRetakeStatus() {
    setFoodPhotoActionStatus(foodPhotoRetakeStatusMessage);
  }

  function openVisualSmokeRoute(target: AppScreen) {
    if (!enableDebugTools || !allowMobileDevAuth) {
      return;
    }
    activateVisualSmokePreview();
    if (target === "today" || target === "history" || target === "analysis") {
      setRecords(visualSmokeDemoRecords());
      setCurrentScreen(target);
      return;
    }
    if (target === "record") {
      setCurrentScreen("record");
      return;
    }
    if (target === "transcriptReview") {
      setTranscriptReviewReturnScreen("record");
      updateTranscriptDraft(sampleText, "sample");
      setCurrentScreen("transcriptReview");
      return;
    }
    if (target === "aiReview" || target === "aiSaveConfirm") {
      setPreview(visualSmokeDemoPreview());
      setCurrentScreen(target);
      return;
    }
    if (target === "aiSaveFailure") {
      setPreview(visualSmokeDemoPreview());
      setLastSaveErrorSummary("Visual smoke demo save failure.");
      setLastSaveEntryMethod("ai");
      setCurrentScreen("aiSaveFailure");
      return;
    }
    if (target === "editPreviewRecord") {
      const demoPreview = visualSmokeDemoPreview();
      setPreview(demoPreview);
      setPendingPreviewRemoveIndex(null);
      setSelectedPreviewIndex(0);
      setPreviewEditFields(recordPayloadToEditFields(demoPreview.records[0]));
      const dateTime = localDateTimeInputs(demoPreview.records[0].occurred_at);
      setPreviewEditDate(dateTime.date);
      setPreviewEditTime(dateTime.time);
      setCurrentScreen("editPreviewRecord");
      return;
    }
    if (target === "aiRemoveConfirm") {
      setPreview(visualSmokeDemoPreview());
      setSelectedPreviewIndex(null);
      setPendingPreviewRemoveIndex(0);
      setCurrentScreen("aiRemoveConfirm");
      return;
    }
    if (target === "saveSuccess") {
      const demoRecord = visualSmokeDemoRecord();
      setRecords(visualSmokeDemoRecords());
      setSelectedRecord(demoRecord);
      setLastSavedSummary("Visual smoke demo save result.");
      setLastSaveEntryMethod("ai");
      setCurrentScreen("saveSuccess");
      return;
    }
    if (target === "deleteSuccess") {
      setRecords(visualSmokeDemoRecords());
      setSelectedRecord(null);
      setLastDeletedSummary("Visual smoke demo delete result.");
      setRecordDetailReturnScreen("history");
      setCurrentScreen("deleteSuccess");
      return;
    }
    if (target === "updateSuccess") {
      const demoRecord = visualSmokeDemoRecord();
      setRecords(visualSmokeDemoRecords());
      setSelectedRecord(demoRecord);
      setRecordEditFields(recordPayloadToEditFields(demoRecord));
      setLastUpdatedSummary("Visual smoke demo update result.");
      setRecordDetailReturnScreen("history");
      setCurrentScreen("updateSuccess");
      return;
    }
    if (target === "recordDetail") {
      const demoRecord = visualSmokeDemoRecord();
      setRecords(visualSmokeDemoRecords());
      setSelectedRecord(demoRecord);
      setRecordDetailReturnScreen("history");
      setCurrentScreen("recordDetail");
      return;
    }
    if (target === "editRecord") {
      const demoRecord = visualSmokeDemoRecord();
      const dateTime = new Date(demoRecord.occurred_at);
      setRecords(visualSmokeDemoRecords());
      setSelectedRecord(demoRecord);
      setRecordEditFields(recordPayloadToEditFields(demoRecord));
      setRecordEditDate(formatLocalDateInput(dateTime));
      setRecordEditTime(formatLocalTimeInput(dateTime));
      setCurrentScreen("editRecord");
      return;
    }
    if (target === "deleteConfirm") {
      const demoRecord = visualSmokeDemoRecord();
      setRecords(visualSmokeDemoRecords());
      setSelectedRecord(demoRecord);
      setRecordDetailReturnScreen("history");
      setCurrentScreen("deleteConfirm");
      return;
    }
    if (target === "manualRecord") {
      openManualRecord("menu");
      return;
    }
    if (target === "manualRecordConfirm") {
      const demoRecord = visualSmokeDemoRecord();
      setManualRecordType("glucose");
      setManualRecordFields(recordPayloadToEditFields(demoRecord));
      const dateTime = localDateTimeInputs(demoRecord.occurred_at);
      setManualRecordDate(dateTime.date);
      setManualRecordTime(dateTime.time);
      setManualRecordReturnScreen("menu");
      setCurrentScreen("manualRecordConfirm");
      return;
    }
    if (target === "detailedReport") {
      setRecords(visualSmokeDemoRecords());
      setBasicReport(visualSmokeDemoReport());
      setReportStatus(visualSmokeRecordSyncStatusMessage());
      setCurrentScreen("detailedReport");
      return;
    }
    if (target === "subscription") {
      openSubscription("menu");
      return;
    }
    if (target === "subscriptionManagement") {
      setCurrentScreen("subscriptionManagement");
      return;
    }
    if (target === "membershipStatus") {
      setCurrentScreen("membershipStatus");
      return;
    }
    if (
      target === "settings" ||
      target === "accountSecurity" ||
      target === "profileSettings" ||
      target === "recordingQuotaSettings" ||
      target === "reminderSettings" ||
      target === "privacySettings" ||
      target === "menu"
    ) {
      setCurrentScreen(target);
      return;
    }
    if (target === "tutorial") {
      openTutorial("menu");
      return;
    }
    if (target === "futureModuleDetail") {
      setSelectedFutureModule(futureModuleCards[0] ?? null);
      setFutureModuleActionStatus(previewActionClearStatusMessage());
      setCurrentScreen("futureModuleDetail");
      return;
    }
    if (target === "doctorShare") {
      openDoctorShare("futureModules");
      return;
    }
    if (target === "healthIntegration") {
      openHealthIntegration("futureModules");
      return;
    }
    if (target === "community") {
      openCommunity("futureModules");
      return;
    }
    if (target === "ranking") {
      openRanking("futureModules");
      return;
    }
    if (target === "achievements") {
      openAchievements("menu");
      return;
    }
    if (target === "yearReview") {
      openYearReview("menu");
      return;
    }
    if (target === "store") {
      openStore("menu");
      return;
    }
    if (target === "storeCart") {
      setStoreReturnScreen("menu");
      openStoreCart();
      return;
    }
    if (target === "foodPhoto") {
      openFoodPhoto("menu");
      return;
    }
    setCurrentScreen(target);
  }

  function pressVisualSmokeRoute(item: ReturnType<typeof visualSmokeRouteJumpDisplayItem>) {
    openVisualSmokeRoute(item.target);
  }

  useEffect(() => {
    if (!enableDebugTools || !allowMobileDevAuth) {
      return undefined;
    }

    function openVisualSmokeRouteFromUrl(url: string) {
      const deepLinkRoute = visualSmokeRouteFromDeepLinkUrl(url);
      if (!deepLinkRoute) {
        return;
      }
      openVisualSmokeRoute(deepLinkRoute);
      setStatus(
        boundUiMessage(
          `Visual smoke deep link opened ${deepLinkRoute}; 本機路由預覽不呼叫 API 或寫入資料。`
        )
      );
    }

    const subscription = Linking.addEventListener("url", ({ url }) => {
      openVisualSmokeRouteFromUrl(url);
    });
    void Linking.getInitialURL()
      .then((url) => {
        if (url) {
          openVisualSmokeRouteFromUrl(url);
        }
      })
      .catch(() => undefined);

    return () => {
      subscription.remove();
    };
  }, []);

  function openFutureModuleDetail(module: FutureModuleCard) {
    setSelectedFutureModule(module);
    setFutureModuleActionStatus(previewActionClearStatusMessage());
    setCurrentScreen("futureModuleDetail");
  }

  function openFutureModuleDestination(target: AppScreen | undefined, module: FutureModuleCard) {
    setFutureModuleActionStatus(previewActionClearStatusMessage());
    if (!target) {
      openFutureModuleDetail(module);
      return;
    }
    if (target === "foodPhoto") {
      openFoodPhoto("futureModules");
      return;
    }
    if (target === "doctorShare") {
      openDoctorShare("futureModules");
      return;
    }
    if (target === "healthIntegration") {
      openHealthIntegration("futureModules");
      return;
    }
    if (target === "community") {
      openCommunity("futureModules");
      return;
    }
    if (target === "ranking") {
      openRanking("futureModules");
      return;
    }
    if (target === "achievements") {
      openAchievements("futureModules");
      return;
    }
    if (target === "yearReview") {
      openYearReview("futureModules");
      return;
    }
    if (target === "store") {
      openStore("futureModules");
      return;
    }
    setCurrentScreen(target);
  }

  function pressFutureModuleDestination(item: ReturnType<typeof futureModuleCardDisplayItem>) {
    openFutureModuleDestination(item.target, item.module);
  }

  async function loadBasicReportForCurrentRange(mode: "analysis" | "detailed") {
    if (!protectedBackendReady) {
      setBasicReport(null);
      setBasicReportKey("");
      setIsReportLoading(false);
      setReportStatus(detailedReportUnavailableStatusMessage(protectedBackendUnavailableMessage));
      return false;
    }
    if (!account || !activeProfile) {
      return false;
    }

    const startAt = analysisSelectedDateBounds.start.toISOString();
    const endAt = analysisSelectedDateBounds.end.toISOString();
    const reportKey = basicReportRequestKey(
      normalizedApiBaseUrl,
      account.id,
      activeProfile.id,
      analysisRange,
      analysisCustomStart,
      analysisCustomEnd,
      mobileReportQueryLimit
    );
    latestReportLoadKey.current = reportKey;
    if (reportLoadInFlightKeys.current.has(reportKey)) {
      setReportStatus(mode === "analysis" ? analysisReportInFlightStatusMessage() : detailedReportInFlightStatusMessage());
      return false;
    }
    reportLoadInFlightKeys.current.add(reportKey);
    setIsReportLoading(true);
    setReportStatus(mode === "analysis" ? analysisReportLoadingStatusMessage() : detailedReportLoadingStatusMessage());
    const query = new URLSearchParams({
      profile_id: activeProfile.id,
      start_at: startAt,
      end_at: endAt,
      limit: String(mobileReportQueryLimit)
    });

    try {
      const report = await requestJson<BasicReport>(
        normalizedApiBaseUrl,
        `/reports/basic?${query.toString()}`,
        { headers: protectedRequestHeaders(account.id, accessToken) }
      );
      if (latestReportLoadKey.current !== reportKey) {
        return false;
      }
      setBasicReport(boundBasicReport(report));
      setBasicReportKey(reportKey);
      setReportStatus(mode === "analysis" ? analysisReportSuccessStatusMessage() : detailedReportSuccessStatusMessage());
      return true;
    } catch {
      if (latestReportLoadKey.current === reportKey) {
        setBasicReport(null);
        setBasicReportKey("");
        setReportStatus(mode === "analysis" ? analysisReportFailureStatusMessage() : detailedReportFailureStatusMessage());
      }
      return false;
    } finally {
      reportLoadInFlightKeys.current.delete(reportKey);
      if (latestReportLoadKey.current === reportKey || reportLoadInFlightKeys.current.size === 0) {
        setIsReportLoading(false);
      }
    }
  }

  async function openDetailedReport() {
    setCurrentScreen("detailedReport");
    await loadBasicReportForCurrentRange("detailed");
  }

  async function loadCommunityFoods() {
    if (visualSmokePreviewActive.current) {
      return;
    }
    if (!protectedAccountBackendReady || !account) {
      setCommunityActionStatus(
        boundUiMessage(`${protectedAccountBackendUnavailableMessage || "backend account 尚未 ready"}；目前只顯示本機食物資料預覽。`)
      );
      return;
    }
    const searchQuery = foodCommunitySearchText.trim();
    const category = searchQuery ? "" : apiFoodCategoryFromMobile(foodCommunityCategory);
    const query = new URLSearchParams({
      limit: "50"
    });
    if (category) {
      query.set("category", category);
    }
    if (searchQuery) {
      query.set("query", searchQuery);
    }
    const communityKey = [
      normalizedApiBaseUrl,
      account.id,
      category || "all-categories",
      searchQuery
    ].join(":");
    latestCommunitySyncKey.current = communityKey;
    if (communitySyncInFlightKeys.current.has(communityKey)) {
      setCommunityActionStatus(boundUiMessage("正在同步食物社群資料庫，請稍候。"));
      return;
    }
    communitySyncInFlightKeys.current.add(communityKey);
    setCommunityActionStatus(boundUiMessage("正在同步 backend 食物社群資料庫。"));
    try {
      const foods = await requestJson<FoodCommunityApiItem[]>(
        normalizedApiBaseUrl,
        `/community/foods?${query.toString()}`,
        { headers: protectedRequestHeaders(account.id, accessToken) }
      );
      if (latestCommunitySyncKey.current !== communityKey) {
        return;
      }
      const nextItems = foods.slice(0, maxListItems * 4).map(foodCommunityItemFromApi);
      setFoodCommunityBackendItems(nextItems);
      setSelectedFoodCommunityItemId(nextItems[0]?.id ?? selectedFoodCommunityItemId);
      if (nextItems[0]?.id) {
        void loadFoodCommunityDetail(nextItems[0].id);
      }
      setCommunityActionStatus(
        boundUiMessage(`已同步 ${clampNumber(nextItems.length, 0, maxMobileCountValue)} 筆食物資料；分享仍需使用者主動送出。`)
      );
    } catch {
      if (latestCommunitySyncKey.current === communityKey) {
        setFoodCommunityBackendItems([]);
        setCommunityActionStatus(boundUiMessage("食物社群資料庫同步失敗；目前保留本機預覽資料。"));
      }
    } finally {
      communitySyncInFlightKeys.current.delete(communityKey);
    }
  }

  async function loadFoodCommunityCategories() {
    if (visualSmokePreviewActive.current) {
      return;
    }
    if (!protectedAccountBackendReady || !account) {
      return;
    }
    try {
      const categories = await requestJson<FoodCommunityApiCategoryRead[]>(
        normalizedApiBaseUrl,
        "/community/foods/categories",
        { headers: protectedRequestHeaders(account.id, accessToken) }
      );
      const mappedCategories = categories.slice(0, foodCommunityCategories.length).map((category) => ({
        id: mobileFoodCategoryFromApi(category.code),
        label: boundDisplayText(category.label || "分類", maxDisplayTextLength),
        foodCount: clampNumber(category.food_count ?? 0, 0, maxMobileCountValue),
        sampleFoods: (category.sample_foods ?? [])
          .slice(0, 3)
          .map((food) => boundDisplayText(food, 40))
          .filter(Boolean)
      }));
      setFoodCommunityBackendCategories(mappedCategories.length > 0 ? mappedCategories : []);
    } catch {
      setFoodCommunityBackendCategories([]);
    }
  }

  async function loadFoodCommunityDetail(itemId: string) {
    if (visualSmokePreviewActive.current) {
      return;
    }
    if (!protectedAccountBackendReady || !account) {
      return;
    }
    const boundedItemId = boundIdentifier(itemId);
    if (!boundedItemId) {
      return;
    }
    const detailKey = [normalizedApiBaseUrl, account.id, boundedItemId].join(":");
    latestFoodCommunityDetailKey.current = detailKey;
    if (foodCommunityDetailInFlightKeys.current.has(detailKey)) {
      setCommunityActionStatus(boundUiMessage("正在同步食物個別分享紀錄，請稍候。"));
      return;
    }
    foodCommunityDetailInFlightKeys.current.add(detailKey);
    setCommunityActionStatus(boundUiMessage("正在同步食物個別分享紀錄。"));
    try {
      const detail = await requestJson<FoodCommunityApiItem>(
        normalizedApiBaseUrl,
        `/community/foods/${boundedItemId}`,
        { headers: protectedRequestHeaders(account.id, accessToken) }
      );
      if (latestFoodCommunityDetailKey.current !== detailKey) {
        return;
      }
      const detailedItem = foodCommunityItemFromApi(detail);
      setFoodCommunityBackendItems((current) =>
        current.map((item) => (item.id === detailedItem.id ? detailedItem : item))
      );
      setSelectedFoodCommunityItemId(detailedItem.id);
      setCommunityActionStatus(
        boundUiMessage(
          `已同步 ${boundDisplayText(detailedItem.title, maxDisplayTextLength)} 的 ${clampNumber(detailedItem.examples.length, 0, maxMobileCountValue)} 筆個別分享紀錄。`
        )
      );
    } catch {
      if (latestFoodCommunityDetailKey.current === detailKey) {
        setCommunityActionStatus(boundUiMessage("食物個別分享紀錄同步失敗；目前保留已載入資料。"));
      }
    } finally {
      foodCommunityDetailInFlightKeys.current.delete(detailKey);
    }
  }

  async function loadCommunityPublicSettings() {
    if (visualSmokePreviewActive.current) {
      return;
    }
    if (!protectedAccountBackendReady || !account) {
      return;
    }
    try {
      const settings = await requestJson<CommunityPublicSettings>(
        normalizedApiBaseUrl,
        "/community/settings",
        { headers: protectedRequestHeaders(account.id, accessToken) }
      );
      const boundedSettings = boundCommunityPublicSettings(settings);
      setCommunityPublicSettings(boundedSettings);
      setCommunityPublicDisplayNameDraft(boundedSettings.display_name);
    } catch {
      setCommunityActionStatus(boundUiMessage("社群公開設定同步失敗；公開排名保持預設關閉。"));
    }
  }

  function updateCommunityPublicDisplayNameDraft(value: string) {
    setCommunityPublicDisplayNameDraft(boundDisplayText(value, maxDisplayTextLength));
  }

  async function saveCommunityPublicSettings(nextOptIn?: boolean) {
    if (visualSmokePreviewActive.current) {
      setCommunityActionStatus(boundUiMessage("Visual smoke 預覽不更新公開名稱或排行榜 opt-in。"));
      return;
    }
    if (!protectedAccountBackendReady || !account) {
      setCommunityActionStatus(
        boundUiMessage(`${protectedAccountBackendUnavailableMessage || "backend account 尚未 ready"}；目前不更新公開設定。`)
      );
      return;
    }
    const displayName = (communityPublicDisplayNameDraft || accountPublicDisplayNameDisplayText).trim();
    if (!displayName) {
      setCommunityActionStatus(boundUiMessage("請輸入公開顯示名稱後再更新社群公開設定。"));
      return;
    }
    try {
      const settings = await requestJson<CommunityPublicSettings>(
        normalizedApiBaseUrl,
        "/community/settings",
        {
          method: "PATCH",
          headers: protectedRequestHeaders(account.id, accessToken),
          body: JSON.stringify({
            display_name: displayName,
            leaderboard_opt_in: nextOptIn ?? communityPublicSettings?.leaderboard_opt_in ?? false
          })
        }
      );
      const boundedSettings = boundCommunityPublicSettings(settings);
      setCommunityPublicSettings(boundedSettings);
      setCommunityPublicDisplayNameDraft(boundedSettings.display_name);
      setCommunityActionStatus(
        boundUiMessage(
          boundedSettings.leaderboard_opt_in
            ? "已開啟排行榜 opt-in；公開榜單只顯示公開名稱與非敏感統計。"
            : "已關閉排行榜 opt-in；分享仍可得點，但不進公開榜單。"
        )
      );
      void loadCommunityLeaderboards();
    } catch {
      setCommunityActionStatus(boundUiMessage("社群公開設定更新失敗；未變更排行榜 opt-in。"));
    }
  }

  async function loadCommunityLeaderboards() {
    if (visualSmokePreviewActive.current) {
      return;
    }
    if (!protectedAccountBackendReady || !account) {
      setRankingActionStatus(
        boundUiMessage(`${protectedAccountBackendUnavailableMessage || "backend account 尚未 ready"}；目前只顯示本機連續記錄預覽。`)
      );
      return;
    }
    const rankingTypes: CommunityLeaderboardType[] = ["share_count", "contribution", "food_tester"];
    const rankingKey = [normalizedApiBaseUrl, account.id, communityPublicSettings?.leaderboard_opt_in ?? false].join(":");
    latestRankingSyncKey.current = rankingKey;
    if (rankingSyncInFlightKeys.current.has(rankingKey)) {
      setRankingActionStatus(boundUiMessage("正在同步公開排行榜，請稍候。"));
      return;
    }
    rankingSyncInFlightKeys.current.add(rankingKey);
    setRankingActionStatus(boundUiMessage("正在同步 backend 公開排行榜。"));
    try {
      const sections = await Promise.all(
        rankingTypes.map((leaderboardType) => {
          const query = new URLSearchParams({ leaderboard_type: leaderboardType, limit: "10" });
          return requestJson<CommunityLeaderboardApiResponse>(
            normalizedApiBaseUrl,
            `/community/leaderboards?${query.toString()}`,
            { headers: protectedRequestHeaders(account.id, accessToken) }
          );
        })
      );
      if (latestRankingSyncKey.current !== rankingKey) {
        return;
      }
      const displaySections = sections.map(communityLeaderboardDisplaySection);
      const entryCount = displaySections.reduce((total, section) => total + section.entries.length, 0);
      setRankingLeaderboardSections(displaySections);
      setRankingActionStatus(
        boundUiMessage(`已同步 ${clampNumber(displaySections.length, 0, maxMobileCountValue)} 個公開榜單，共 ${clampNumber(entryCount, 0, maxMobileCountValue)} 筆 opt-in 排名。`)
      );
    } catch {
      if (latestRankingSyncKey.current === rankingKey) {
        setRankingLeaderboardSections([]);
        setRankingActionStatus(boundUiMessage("公開排行榜同步失敗；目前保留本機連續記錄預覽。"));
      }
    } finally {
      rankingSyncInFlightKeys.current.delete(rankingKey);
    }
  }

  async function loadStoreCatalogAndPoints() {
    if (visualSmokePreviewActive.current) {
      return;
    }
    if (!protectedAccountBackendReady || !account) {
      setStoreActionStatus(
        boundUiMessage(`${protectedAccountBackendUnavailableMessage || "backend account 尚未 ready"}；目前只顯示本機商城預覽。`)
      );
      return;
    }
    const storeKey = [normalizedApiBaseUrl, account.id].join(":");
    latestStoreSyncKey.current = storeKey;
    if (storeSyncInFlightKeys.current.has(storeKey)) {
      setStoreActionStatus(boundUiMessage("正在同步商城點數與兌換目錄，請稍候。"));
      return;
    }
    storeSyncInFlightKeys.current.add(storeKey);
    setStoreActionStatus(boundUiMessage("正在同步 backend 商城目錄與社群點數。"));
    try {
      const [rewards, points, redemptions] = await Promise.all([
        requestJson<StoreApiReward[]>(normalizedApiBaseUrl, "/store/rewards", {
          headers: protectedRequestHeaders(account.id, accessToken)
        }),
        requestJson<StoreApiPointsBalance>(normalizedApiBaseUrl, "/store/points", {
          headers: protectedRequestHeaders(account.id, accessToken)
        }),
        requestJson<StoreApiRedemption[]>(normalizedApiBaseUrl, "/store/redemptions?limit=20", {
          headers: protectedRequestHeaders(account.id, accessToken)
        })
      ]);
      if (latestStoreSyncKey.current !== storeKey) {
        return;
      }
      setStoreBackendProducts(rewards.slice(0, maxListItems * 2).map(storeProductFromApi));
      setStorePointsBalance({
        balance: clampNumber(points.balance, 0, maxMobileCountValue),
        lifetime_earned: clampNumber(points.lifetime_earned, 0, maxMobileCountValue),
        lifetime_redeemed: clampNumber(points.lifetime_redeemed, 0, maxMobileCountValue)
      });
      setStoreRedemptions(redemptions.slice(0, maxListItems * 2));
      setStoreActionStatus(
        boundUiMessage(
          `已同步商城目錄、點數與 ${clampNumber(redemptions.length, 0, maxMobileCountValue)} 筆兌換券，餘額 ${clampNumber(points.balance, 0, maxMobileCountValue)} 點。`
        )
      );
    } catch {
      if (latestStoreSyncKey.current === storeKey) {
        setStoreBackendProducts([]);
        setStorePointsBalance(null);
        setStoreRedemptions([]);
        setStoreActionStatus(boundUiMessage("商城目錄、點數或兌換券同步失敗；目前保留本機預覽資料。"));
      }
    } finally {
      storeSyncInFlightKeys.current.delete(storeKey);
    }
  }

  async function loadAchievementSummary(syncUnlocks = false) {
    if (visualSmokePreviewActive.current) {
      return;
    }
    if (!protectedBackendReady || !account || !activeProfile) {
      setAchievementBackendItems([]);
      setAchievementNewlyUnlockedItems([]);
      setAchievementUnlockedItems([]);
      setAchievementActionStatus(
        boundUiMessage(`${protectedBackendUnavailableMessage || "backend 尚未 ready"}；目前只顯示本機成就推算。`)
      );
      return;
    }
    const achievementKey = [normalizedApiBaseUrl, account.id, activeProfile.id].join(":");
    latestAchievementSyncKey.current = achievementKey;
    if (achievementSyncInFlightKeys.current.has(achievementKey)) {
      setAchievementActionStatus(boundUiMessage("正在同步 backend 成就摘要，請稍候。"));
      return;
    }
    achievementSyncInFlightKeys.current.add(achievementKey);
    setAchievementActionStatus(
      boundUiMessage(syncUnlocks ? "正在同步 backend 徽章解鎖紀錄。" : "正在讀取 backend 成就摘要。")
    );
    try {
      const query = new URLSearchParams({ profile_id: activeProfile.id });
      const summary = await requestJson<AchievementApiSummary>(
        normalizedApiBaseUrl,
        syncUnlocks ? `/achievements/sync?${query.toString()}` : `/achievements/summary?${query.toString()}`,
        {
          method: syncUnlocks ? "POST" : "GET",
          headers: protectedRequestHeaders(account.id, accessToken)
        }
      );
      if (latestAchievementSyncKey.current !== achievementKey) {
        return;
      }
      const mappedSummaryItems = summary.items.slice(0, maxListItems * 6).map(achievementItemFromApi);
      setAchievementBackendItems(mappedSummaryItems);
      setAchievementNewlyUnlockedItems(syncUnlocks ? mappedSummaryItems.filter((item) => item.newlyUnlocked) : []);
      let unlockHistoryCopy = "已讀取解鎖紀錄";
      try {
        const unlocks = await requestJson<AchievementApiUnlock[]>(
          normalizedApiBaseUrl,
          `/achievements/unlocks?${query.toString()}`,
          { headers: protectedRequestHeaders(account.id, accessToken) }
        );
        setAchievementUnlockedItems(unlocks.slice(0, maxListItems).map(achievementItemFromApi));
      } catch {
        setAchievementUnlockedItems([]);
        unlockHistoryCopy = "解鎖紀錄讀取失敗";
      }
      const persistedUnlockCount = clampNumber(summary.persisted_unlocked_count, 0, maxMobileCountValue);
      const newlyUnlockedCount = clampNumber(summary.newly_unlocked_count, 0, maxMobileCountValue);
      setAchievementActionStatus(
        boundUiMessage(
          syncUnlocks
            ? `已同步 backend 徽章解鎖：${newlyUnlockedCount} 項新解鎖，${persistedUnlockCount} 項已保存，${unlockHistoryCopy}；下一枚還差 ${clampNumber(summary.next_remaining, 0, maxMobileCountValue)}。`
            : `已讀取 backend 成就摘要：${clampNumber(summary.unlocked_count, 0, maxMobileCountValue)} 項已完成，${persistedUnlockCount} 項已保存，${unlockHistoryCopy}；下一枚還差 ${clampNumber(summary.next_remaining, 0, maxMobileCountValue)}。`
        )
      );
    } catch {
      if (latestAchievementSyncKey.current === achievementKey) {
        setAchievementBackendItems([]);
        setAchievementNewlyUnlockedItems([]);
        setAchievementUnlockedItems([]);
        setAchievementActionStatus(boundUiMessage("成就摘要同步失敗；目前保留本機已載入紀錄推算。"));
      }
    } finally {
      achievementSyncInFlightKeys.current.delete(achievementKey);
    }
  }

  async function loadYearReview() {
    if (visualSmokePreviewActive.current) {
      return;
    }
    if (!protectedBackendReady || !account || !activeProfile) {
      setYearReviewActionStatus(
        boundUiMessage(`${protectedBackendUnavailableMessage || "backend 尚未 ready"}；目前只顯示本機年度回顧預覽。`)
      );
      return;
    }
    const targetYear = String(yearReviewTargetYear(new Date()));
    const yearReviewKey = [normalizedApiBaseUrl, account.id, activeProfile.id, targetYear].join(":");
    latestYearReviewSyncKey.current = yearReviewKey;
    if (yearReviewSyncInFlightKeys.current.has(yearReviewKey)) {
      setYearReviewActionStatus(boundUiMessage("正在同步 backend 年度回顧，請稍候。"));
      return;
    }
    yearReviewSyncInFlightKeys.current.add(yearReviewKey);
    setYearReviewActionStatus(boundUiMessage("正在同步 backend 年度回顧。"));
    try {
      const query = new URLSearchParams({ profile_id: activeProfile.id });
      const summary = await requestJson<YearReviewApiResponse>(
        normalizedApiBaseUrl,
        `/year-reviews/${targetYear}?${query.toString()}`,
        { headers: protectedRequestHeaders(account.id, accessToken) }
      );
      if (latestYearReviewSyncKey.current !== yearReviewKey) {
        return;
      }
      setYearReviewBackendSummary(summary);
      const snapshotCopy = summary.snapshot_id
        ? `已保存 snapshot ${boundIdentifier(summary.snapshot_id).slice(0, 8)}`
        : "已產生即時摘要";
      setYearReviewActionStatus(boundUiMessage(`已同步 ${summary.year} 年 backend 年度回顧，${snapshotCopy}。`));
    } catch {
      if (latestYearReviewSyncKey.current === yearReviewKey) {
        setYearReviewBackendSummary(null);
        setYearReviewActionStatus(boundUiMessage("年度回顧同步失敗；目前保留本機已載入紀錄預覽。"));
      }
    } finally {
      yearReviewSyncInFlightKeys.current.delete(yearReviewKey);
    }
  }

  async function loadYearReviewShareCard() {
    if (visualSmokePreviewActive.current) {
      setYearReviewActionStatus(yearReviewShareStatusMessage);
      return;
    }
    if (!protectedBackendReady || !account || !activeProfile) {
      setYearReviewActionStatus(
        boundUiMessage(`${protectedBackendUnavailableMessage || "backend 尚未 ready"}；目前不產生分享卡。`)
      );
      return;
    }
    const targetYear = String(yearReviewTargetYear(new Date()));
    setYearReviewActionStatus(boundUiMessage("正在準備隱私遮罩後的年度分享卡。"));
    try {
      const query = new URLSearchParams({ profile_id: activeProfile.id });
      const shareAsset = await requestJson<YearReviewApiShareAsset>(
        normalizedApiBaseUrl,
        `/year-reviews/${targetYear}/share-card/asset?${query.toString()}`,
        { headers: protectedRequestHeaders(account.id, accessToken) }
      );
      const sharePackage = await requestJson<YearReviewApiSharePackage>(
        normalizedApiBaseUrl,
        `/year-reviews/${targetYear}/share-card/confirm?${query.toString()}`,
        {
          method: "POST",
          headers: protectedRequestHeaders(account.id, accessToken),
          body: JSON.stringify({ privacy_acknowledged: true })
        }
      );
      const shareFilename = boundDisplayText(shareAsset.filename, maxDisplayTextLength);
      const checksumShort = boundIdentifier(sharePackage.asset.checksum_sha256).slice(0, 8);
      const confirmedSharePackageId = boundIdentifier(sharePackage.share_package_id);
      if (!confirmedSharePackageId) {
        throw new Error("invalid_year_review_share_package_id");
      }
      const privacyCopy = sharePackage.privacy_mask_applied ? "已確認隱私遮罩" : "尚未確認隱私遮罩";
      const packageCopy = sharePackage.external_share_enabled ? "分享 package 已確認" : "分享 package 尚未啟用";
      const shareResult = await Share.share({
        title: shareFilename,
        message: boundDisplayText(sharePackage.share_text, maxDisplayDetailTextLength)
      });
      const shareResultKind = shareResult.action === Share.sharedAction ? "opened" : "dismissed";
      const shareResultCopy =
        shareResult.action === Share.sharedAction ? "已開啟原生分享面板" : "已取消原生分享";
      let resultReportCopy = "分享狀態已回報 backend";
      try {
        const reportedPackage = await requestJson<YearReviewApiSharePackage>(
          normalizedApiBaseUrl,
          `/year-reviews/share-packages/${confirmedSharePackageId}/result`,
          {
            method: "POST",
            headers: protectedRequestHeaders(account.id, accessToken),
            body: JSON.stringify({ share_result: shareResultKind })
          }
        );
        setYearReviewSharePackageId(boundIdentifier(reportedPackage.share_package_id) || confirmedSharePackageId);
      } catch {
        setYearReviewSharePackageId(confirmedSharePackageId);
        resultReportCopy = "分享狀態回報 backend 失敗";
      }
      setYearReviewActionStatus(
        boundUiMessage(
          `${shareFilename} SVG 分享素材已準備，${privacyCopy}，${packageCopy}，checksum ${checksumShort}；${shareResultCopy}，${resultReportCopy}。`
        )
      );
    } catch {
      setYearReviewActionStatus(boundUiMessage("分享卡準備或原生分享失敗；未送出外部分享。"));
    }
  }

  async function revokeYearReviewSharePackage() {
    if (visualSmokePreviewActive.current) {
      setYearReviewActionStatus(boundUiMessage("visual smoke 預覽不撤回年度分享 package。"));
      return;
    }
    if (!yearReviewSharePackageId) {
      setYearReviewActionStatus(boundUiMessage("目前沒有可撤回的年度分享 package。"));
      return;
    }
    if (!protectedBackendReady || !account) {
      setYearReviewActionStatus(
        boundUiMessage(`${protectedBackendUnavailableMessage || "backend 尚未 ready"}；目前無法撤回年度分享。`)
      );
      return;
    }
    const targetSharePackageId = boundIdentifier(yearReviewSharePackageId);
    if (!targetSharePackageId) {
      setYearReviewSharePackageId("");
      setYearReviewActionStatus(boundUiMessage("年度分享 package 識別無效；已清除本機撤回狀態。"));
      return;
    }
    setYearReviewActionStatus(boundUiMessage("正在撤回年度分享 package。"));
    try {
      const revokedPackage = await requestJson<YearReviewApiSharePackage>(
        normalizedApiBaseUrl,
        `/year-reviews/share-packages/${targetSharePackageId}/revoke`,
        {
          method: "POST",
          headers: protectedRequestHeaders(account.id, accessToken)
        }
      );
      setYearReviewSharePackageId("");
      const revokedCopy = revokedPackage.revoked_at ? "已保存撤回時間" : "已標記撤回";
      setYearReviewActionStatus(
        boundUiMessage(`年度分享 package ${boundIdentifier(targetSharePackageId).slice(0, 8)} 已撤回，${revokedCopy}。`)
      );
    } catch {
      setYearReviewActionStatus(boundUiMessage("年度分享撤回失敗；請稍後重試。"));
    }
  }

  function updateFoodCommunityBeforeGlucose(value: string) {
    setFoodCommunityShareFields((current) => ({
      ...current,
      beforeGlucose: value.replace(/[^0-9]/g, "").slice(0, 3)
    }));
  }

  function updateFoodCommunityAfterGlucose(value: string) {
    setFoodCommunityShareFields((current) => ({
      ...current,
      afterGlucose: value.replace(/[^0-9]/g, "").slice(0, 3)
    }));
  }

  function updateFoodCommunityNote(value: string) {
    setFoodCommunityShareFields((current) => ({
      ...current,
      note: boundDisplayText(value, maxDisplayDetailTextLength)
    }));
  }

  async function submitFoodCommunityShare() {
    if (visualSmokePreviewActive.current) {
      setCommunityActionStatus(boundUiMessage("Visual smoke 預覽不送出食物分享，也不寫入點數或排行榜。"));
      return;
    }
    if (!protectedAccountBackendReady || !account || !selectedFoodCommunityItem) {
      setCommunityActionStatus(
        boundUiMessage(`${protectedAccountBackendUnavailableMessage || "請先選擇食物"}；目前不送出食物分享。`)
      );
      return;
    }
    if (foodShareInFlight.current) {
      setCommunityActionStatus(boundUiMessage("食物分享送出中，請稍候。"));
      return;
    }
    const beforeGlucose = Number(foodCommunityShareFields.beforeGlucose);
    const afterGlucose = Number(foodCommunityShareFields.afterGlucose);
    const foodName = boundDisplayText(
      foodCommunityShareFields.foodName || selectedFoodCommunityItem.title,
      maxDisplayTextLength
    ).trim();
    if (!foodName) {
      setCommunityActionStatus(boundUiMessage("請輸入食物名稱後再送出分享。"));
      return;
    }
    if (
      !Number.isFinite(beforeGlucose) ||
      !Number.isFinite(afterGlucose) ||
      beforeGlucose < 20 ||
      beforeGlucose > maxMobileGlucoseValue ||
      afterGlucose < 20 ||
      afterGlucose > maxMobileGlucoseValue
    ) {
      setCommunityActionStatus(boundUiMessage("請輸入 20-600 mg/dL 之間的食用前與食用後血糖。"));
      return;
    }
    foodShareInFlight.current = true;
    setIsBusy(true);
    setCommunityActionStatus(boundUiMessage("正在送出食物分享並建立社群點數。"));
    try {
      const response = await requestJson<FoodCommunityApiShareResponse>(
        normalizedApiBaseUrl,
        "/community/foods/shares",
        {
          method: "POST",
          headers: protectedRequestHeaders(account.id, accessToken),
          body: JSON.stringify({
            food_name: foodName,
            category: apiFoodCategoryFromMobile(selectedFoodCommunityItem.category),
            eaten_at: new Date().toISOString(),
            before_glucose: beforeGlucose,
            after_glucose: afterGlucose,
            public_note: foodCommunityShareFields.note || undefined
          })
        }
      );
      const updatedFood = foodCommunityItemFromApi(response.food);
      setFoodCommunityBackendItems((current) => [
        updatedFood,
        ...current.filter((item) => item.id !== updatedFood.id)
      ].slice(0, maxListItems * 4));
      setSelectedFoodCommunityItemId(updatedFood.id);
      setFoodCommunityShareFields(emptyFoodCommunityShareFields());
      setCommunityActionStatus(
        boundUiMessage(`已分享食物升糖資料，獲得 ${clampNumber(response.awarded_points, 0, maxMobileCountValue)} 點。`)
      );
      void loadStoreCatalogAndPoints();
      void loadCommunityLeaderboards();
    } catch {
      setCommunityActionStatus(boundUiMessage("食物分享送出失敗；沒有建立點數、排行榜或商城兌換。"));
    } finally {
      foodShareInFlight.current = false;
      setIsBusy(false);
    }
  }

  async function redeemStoreProduct(product: ReturnType<typeof storeProductDisplayItem>) {
    if (visualSmokePreviewActive.current) {
      setStoreActionStatus(boundUiMessage("Visual smoke 預覽不送出商城兌換，也不扣點。"));
      return;
    }
    if (!protectedAccountBackendReady || !account) {
      setStoreActionStatus(
        boundUiMessage(`${protectedAccountBackendUnavailableMessage || "backend account 尚未 ready"}；目前不送出兌換。`)
      );
      return;
    }
    if (product.rewardStatus !== "redeemable") {
      setStoreActionStatus(product.actionStatus);
      return;
    }
    if (!product.id) {
      setStoreActionStatus(boundUiMessage("商城兌換項目識別無效；目前不送出兌換。"));
      return;
    }
    if (storeRedemptionInFlight.current) {
      setStoreActionStatus(boundUiMessage("商城兌換送出中，請稍候。"));
      return;
    }
    storeRedemptionInFlight.current = true;
    setIsBusy(true);
    setStoreActionStatus(boundUiMessage(`正在兌換 ${product.title}。`));
    try {
      const redemption = await requestJson<StoreApiRedemption>(
        normalizedApiBaseUrl,
        "/store/redemptions",
        {
          method: "POST",
          headers: protectedRequestHeaders(account.id, accessToken),
          body: JSON.stringify({ reward_code: product.id })
        }
      );
      const fulfillmentCopy =
        redemption.status === "issued" && redemption.fulfillment_code
          ? `已發出 ${redemption.fulfillment_type === "discount_code" ? "折扣碼" : "優惠券"}：${boundIdentifier(redemption.fulfillment_code)}`
          : `已建立兌換 reservation：${boundIdentifier(redemption.reward_code)}`;
      setStoreActionStatus(
        boundUiMessage(`${fulfillmentCopy}，扣除 ${clampNumber(redemption.points_cost, 0, maxMobileCountValue)} 點。`)
      );
      void loadStoreCatalogAndPoints();
    } catch {
      setStoreActionStatus(boundUiMessage("兌換失敗；可能點數不足或該商品仍未開放 fulfillment。"));
    } finally {
      storeRedemptionInFlight.current = false;
      setIsBusy(false);
    }
  }

  async function useStoreRedemption(redemption: ReturnType<typeof storeRedemptionDisplayItem>) {
    if (visualSmokePreviewActive.current) {
      setStoreActionStatus(boundUiMessage("Visual smoke 預覽不標記兌換券使用，也不更新 backend 狀態。"));
      return;
    }
    if (!protectedAccountBackendReady || !account) {
      setStoreActionStatus(
        boundUiMessage(`${protectedAccountBackendUnavailableMessage || "backend account 尚未 ready"}；目前不更新兌換券狀態。`)
      );
      return;
    }
    if (!redemption.isUsable) {
      setStoreActionStatus(boundUiMessage(`${redemption.title} 目前狀態為 ${redemption.statusLabel}。`));
      return;
    }
    if (!redemption.id) {
      setStoreActionStatus(boundUiMessage("兌換券識別無效；目前不更新兌換券狀態。"));
      return;
    }
    if (storeRedemptionInFlight.current) {
      setStoreActionStatus(boundUiMessage("商城兌換狀態更新中，請稍候。"));
      return;
    }
    storeRedemptionInFlight.current = true;
    setIsBusy(true);
    setStoreActionStatus(boundUiMessage(`正在標記 ${redemption.title} 已使用。`));
    try {
      const usedRedemption = await requestJson<StoreApiRedemption>(
        normalizedApiBaseUrl,
        `/store/redemptions/${redemption.id}/use`,
        {
          method: "POST",
          headers: protectedRequestHeaders(account.id, accessToken)
        }
      );
      setStoreActionStatus(
        boundUiMessage(
          `已標記 ${boundIdentifier(usedRedemption.fulfillment_code || usedRedemption.reward_code)} 為已使用。`
        )
      );
      void loadStoreCatalogAndPoints();
    } catch {
      setStoreActionStatus(boundUiMessage("兌換券狀態更新失敗；可能已使用、已失效或不屬於目前帳號。"));
    } finally {
      storeRedemptionInFlight.current = false;
      setIsBusy(false);
    }
  }

  async function boot() {
    if (visualSmokePreviewActive.current) {
      setStatus(boundUiMessage("Visual smoke 本機路由預覽；已跳過 backend boot，不會呼叫 API 或寫入資料。"));
      setAuthActionStatus(boundUiMessage("Visual smoke demo state only; no dev-login, token, backend, AI, STT, Vision, payment, or database writes."));
      return;
    }
    const bootKey = normalizeApiBaseUrl(apiBaseUrl);
    latestBootKey.current = bootKey;
    if (isBusy || bootInFlight.current) {
      return;
    }
    if (!allowMobileDevAuth) {
      const display = devLoginDisabledDisplayMessages();
      clearMobileSessionState({ clearAuthTokens: false });
      setStatus(display.status);
      setAuthActionStatus(display.authStatus);
      return;
    }
    bootInFlight.current = true;
    setIsBusy(true);
    setStatus(backendReconnectProgressStatusMessage());
    setPreview(null);
    try {
      const login = await requestJson<Account>(bootKey, "/auth/dev-login", {
        method: "POST",
        body: JSON.stringify({
          email: "mobile-dev@example.com",
          display_name: "Mobile Dev"
        })
      });
      if (latestBootKey.current !== bootKey) {
        return;
      }
      const boundedLogin = boundAccount(login);
      setAccount(boundedLogin);
      await loadVoiceQuota(boundedLogin.id);

      if (latestBootKey.current !== bootKey) {
        return;
      }
      const modelOptionsResponse = await requestJson<AiModelOptions>(bootKey, "/ai/models");
      if (latestBootKey.current !== bootKey) {
        return;
      }
      const modelOptions = boundAiModelOptions(modelOptionsResponse);
      setModels(modelOptions);
      const defaultStt = modelOptions.stt_models.find((model) => model.available) ?? modelOptions.stt_models[0];
      if (defaultStt) {
        setSttModelId(defaultStt.id);
      }
      const preferredLlm =
        modelOptions.llm_models.find((model) => model.id === "deepseek-chat" && model.available) ??
        modelOptions.llm_models.find((model) => model.id === "ollama-qwen2.5-1.5b" && model.available) ??
        modelOptions.llm_models.find((model) => model.available) ??
        modelOptions.llm_models[0];
      if (preferredLlm) {
        setLlmModelId(preferredLlm.id);
      }

      const profileHeaders = protectedRequestHeaders(boundedLogin.id, accessToken);
      let nextProfiles = await requestJson<Profile[]>(bootKey, "/profiles", {
        headers: profileHeaders
      });
      if (latestBootKey.current !== bootKey) {
        return;
      }
      if (nextProfiles.length === 0) {
        const created = await requestJson<Profile>(bootKey, "/profiles", {
          method: "POST",
          headers: profileHeaders,
          body: JSON.stringify({ display_name: "自己", relationship: "self" })
        });
        if (latestBootKey.current !== bootKey) {
          return;
        }
        nextProfiles = [created];
      }
      const boundedProfiles = boundProfiles(nextProfiles);
      setProfiles(boundedProfiles);
      setActiveProfileId(boundedProfiles[0]?.id ?? "");
      setStatus(backendReconnectSuccessStatusMessage());
    } catch (error) {
      if (latestBootKey.current === bootKey) {
        if (visualSmokePreviewActive.current) {
          setStatus(boundUiMessage("Visual smoke 本機路由預覽；backend boot 結果已忽略，不清除本機 demo records。"));
          setAuthActionStatus(boundUiMessage("Visual smoke demo state only; no dev-login, token, backend, AI, STT, Vision, payment, or database writes."));
          return;
        }
        const failureDisplay = backendReconnectFailureDisplayMessages(error);
        clearMobileSessionState();
        setStatus(failureDisplay.status);
        setAuthActionStatus(failureDisplay.authStatus);
      }
    } finally {
      if (latestBootKey.current === bootKey) {
        bootInFlight.current = false;
      }
      if (latestBootKey.current === bootKey || latestBootKey.current === "") {
        setIsBusy(false);
      }
    }
  }

  async function resetDevelopmentData() {
    if (!allowMobileDevAuth) {
      setDevResetStatus(devResetUnavailableStatusMessage());
      return;
    }
    if (isAnyRequestInFlight) {
      setDevResetStatus(devResetBusyStatusMessage());
      return;
    }
    setIsBusy(true);
    setDevResetStatus(devResetProgressStatusMessage());
    try {
      const response = boundDevResetResponse(await requestJson<DevResetResponse>(normalizedApiBaseUrl, "/dev/reset-data", {
        method: "POST",
        headers: {
          "X-Dev-Reset-Confirm": "reset-all-data"
        }
      }));
      const deletedRecords = response.deleted_counts.records ?? 0;
      const successDisplay = devResetSuccessDisplayMessages(deletedRecords);
      clearMobileSessionState();
      setDevResetStatus(successDisplay.devResetStatus);
      setStatus(successDisplay.status);
    } catch (error) {
      const failureDisplay = devResetFailureMessages(error);
      clearMobileSessionState();
      setDevResetStatus(failureDisplay.devResetStatus);
      setStatus(failureDisplay.status);
    } finally {
      setIsBusy(false);
    }
  }

  function resetDevelopmentDataFromMenu() {
    void resetDevelopmentData();
  }

  function submitTranscriptParse() {
    void parseTranscript();
  }

  function submitAiSaveConfirm() {
    void savePreviewRecords();
  }

  function submitManualRecordCreate() {
    void createManualRecord();
  }

  function submitRecordUpdate() {
    void updateSelectedRecord();
  }

  function submitRecordDelete() {
    void deleteSelectedRecord();
  }

  async function parseTranscript() {
    if (isBusy || parsePreviewInFlight.current) {
      return;
    }
    if (!protectedBackendReady) {
      const boundedMessage = parserBackendUnavailableStatusMessage(protectedBackendUnavailableMessage);
      setParserRecoveryMessage(boundedMessage);
      setStatus(boundedMessage);
      setCurrentScreen("transcriptReview");
      return;
    }
    if (!account || !activeProfile) {
      return;
    }
    if (!parserModelReady) {
      const boundedMessage = parserModelUnavailableStatusMessage(parserModelUnavailableMessage);
      setParserRecoveryMessage(boundedMessage);
      setStatus(boundedMessage);
      setCurrentScreen("transcriptReview");
      return;
    }
    if (transcriptValidationError) {
      setStatus(transcriptValidationError);
      return;
    }
    if (isTranscriptSample) {
      const message = parserSampleBlockedStatusMessage();
      setParserRecoveryMessage(message);
      setStatus(message);
      return;
    }

    parsePreviewInFlight.current = true;
    setIsBusy(true);
    setPreview(null);
    setParserRecoveryMessage("");
    setStatus(parserProgressStatusMessage());
    const parserVoiceSeconds = clampNumber(transcriptVoiceSeconds, 0, maxMobileCountValue);
    try {
      const response = await requestJson<ParsePreviewResponse>(
        normalizedApiBaseUrl,
        "/ai/parse-preview",
        {
          method: "POST",
          headers: protectedRequestHeaders(account.id, accessToken),
          body: JSON.stringify({
            profile_id: activeProfile.id,
            transcript,
            stt_model_id: sttModelId,
            llm_model_id: llmModelId,
            occurred_at: new Date().toISOString(),
            voice_seconds: parserVoiceSeconds
          })
        }
      );
      const boundedPreview = boundParsePreviewResponse(response);
      setPreview(boundedPreview);
      setTranscriptVoiceSeconds(0);
      setCurrentScreen("aiReview");
      setStatus(
        parserVoiceSeconds > 0
          ? parserVoiceQuotaSyncedStatusMessage(boundedPreview.records.length, parserVoiceSeconds)
          : parserSuccessStatusMessage(boundedPreview.records.length)
      );
      if (parserVoiceSeconds > 0 && account) {
        void loadVoiceQuota(account.id);
      }
    } catch (error) {
      const message = parserFailureStatusMessage(error);
      setParserRecoveryMessage(parserFailureRecoveryMessage(message));
      setStatus(message);
    } finally {
      parsePreviewInFlight.current = false;
      setIsBusy(false);
    }
  }

  async function savePreviewRecords() {
    if (isBusy || previewSaveInFlight.current) {
      return;
    }
    if (!preview || preview.records.length === 0) {
      return;
    }
    if (!protectedBackendReady) {
      setStatus(aiSaveUnavailableStatusMessage(protectedBackendUnavailableMessage));
      setCurrentScreen("aiSaveConfirm");
      return;
    }
    if (!account) {
      return;
    }

    previewSaveInFlight.current = true;
    setIsBusy(true);
    setStatus(aiSaveProgressStatusMessage());
    const clientSaveBatchId = createClientSaveBatchId();
    const recordsToSave = preview.records.map((record, index) => {
      const sanitizedRecord = pendingRecordForSave(record);
      return {
        ...sanitizedRecord,
        metadata_json: {
          ...(sanitizedRecord.metadata_json ?? {}),
          client_save_batch_id: clientSaveBatchId,
          client_save_sequence: index + 1,
          client_save_batch_size: preview.records.length,
          entry_method: "ai_confirmation"
        }
      };
    });
    const createdRecords: RecordItem[] = [];
    try {
      for (const record of recordsToSave) {
        const createdRecord = await requestJson<RecordItem>(normalizedApiBaseUrl, "/records", {
          method: "POST",
          headers: protectedRequestHeaders(account.id, accessToken),
          body: JSON.stringify(record)
        });
        createdRecords.push(boundRecordItem(createdRecord));
      }
      const savedCount = recordsToSave.length;
      setPreview(null);
      setTranscript("");
      setTranscriptVoiceSeconds(0);
      setIsTranscriptSample(false);
      setRecords((current) => boundRecordsList([...createdRecords, ...current]));
      setRecordsStatus(aiSaveRecordsStatusMessage(createdRecords.length));
      if (createdRecords[0]) {
        setSelectedRecord(createdRecords[0]);
        setRecordEditFields(recordPayloadToEditFields(createdRecords[0]));
      }
      setLastSavedSummary(aiSaveSuccessSummaryMessage(savedCount));
      setLastSaveErrorSummary("");
      setLastSaveEntryMethod("ai");
      setSaveSuccessReturnScreen("today");
      setCurrentScreen("saveSuccess");
      setStatus(aiSaveSuccessStatusMessage());
      syncAchievementsAfterRecordSave();
    } catch (error) {
      const message = aiSaveFailureStatusMessage(error);
      if (createdRecords.length > 0) {
        const unsavedCount = recordsToSave.length - createdRecords.length;
        setRecords((current) => boundRecordsList([...createdRecords, ...current]));
        setRecordsStatus(aiPartialSaveRecordsStatusMessage(createdRecords.length, unsavedCount));
        setPreview((current) =>
          current
            ? boundParsePreviewResponse({
                ...current,
                records: current.records.slice(createdRecords.length)
              })
            : current
        );
        if (createdRecords[0]) {
          setSelectedRecord(createdRecords[0]);
          setRecordEditFields(recordPayloadToEditFields(createdRecords[0]));
        }
        setLastSavedSummary(aiPartialSaveSummaryMessage(createdRecords.length, unsavedCount));
        setLastSaveErrorSummary(message);
        setLastSaveEntryMethod("ai");
        setSaveSuccessReturnScreen("aiReview");
        setCurrentScreen("saveSuccess");
        setStatus(aiPartialSaveFailureStatusMessage(message));
        syncAchievementsAfterRecordSave();
      } else {
        setLastSaveErrorSummary(message);
        setLastSaveEntryMethod("ai");
        setCurrentScreen("aiSaveFailure");
        setStatus(message);
      }
    } finally {
      previewSaveInFlight.current = false;
      setIsBusy(false);
    }
  }

  async function loadRecords() {
    if (visualSmokePreviewActive.current) {
      setRecordsStatus(visualSmokeRecordSyncStatusMessage());
      return;
    }
    if (!protectedBackendReady) {
      setRecordsStatus(recordSyncUnavailableStatusMessage(protectedBackendUnavailableMessage));
      return;
    }
    if (!account || !activeProfileId) {
      return;
    }
    const syncKey = `${normalizedApiBaseUrl}:${account.id}:${activeProfileId}`;
    latestRecordSyncKey.current = syncKey;
    if (recordSyncInFlightKeys.current.has(syncKey)) {
      return;
    }
    recordSyncInFlightKeys.current.add(syncKey);
    setRecordsStatus(recordSyncLoadingStatusMessage());
    try {
      const query = new URLSearchParams({
        profile_id: activeProfileId,
        limit: String(mobileRecordSyncLimit)
      });
      const response = await requestJson<RecordItem[]>(
        normalizedApiBaseUrl,
        `/records?${query.toString()}`,
        { headers: protectedRequestHeaders(account.id, accessToken) }
      );
      if (latestRecordSyncKey.current !== syncKey) {
        return;
      }
      const boundedResponse = boundRecordsList(response, mobileRecordSyncLimit);
      setRecords(boundedResponse);
      setRecordsHasMore(response.length >= mobileRecordSyncLimit);
      setRecordsStatus(
        recordSyncSuccessStatusMessage(
          boundedResponse.length,
          mobileRecordSyncDisplayLimit,
          maxMobileRecordCacheLimit,
          response.length >= mobileRecordSyncLimit
        )
      );
    } catch {
      if (latestRecordSyncKey.current === syncKey) {
        setRecordsStatus(recordSyncFailureStatusMessage());
        setRecordsHasMore(false);
      }
    } finally {
      recordSyncInFlightKeys.current.delete(syncKey);
    }
  }

  async function loadMoreRecords() {
    if (visualSmokePreviewActive.current) {
      setRecordsStatus(visualSmokeRecordSyncStatusMessage());
      return;
    }
    if (!protectedBackendReady) {
      setRecordsStatus(recordSyncUnavailableStatusMessage(protectedBackendUnavailableMessage));
      return;
    }
    if (!account || !activeProfileId || recordsForDisplay.length === 0 || recordsForDisplay.length >= maxMobileRecordCacheLimit) {
      return;
    }
    const cursorRecord = recordsForDisplay[recordsForDisplay.length - 1];
    if (!cursorRecord?.occurred_at || !cursorRecord.created_at) {
      setRecordsStatus(recordSyncFailureStatusMessage());
      setRecordsHasMore(false);
      return;
    }
    const syncKey = `${normalizedApiBaseUrl}:${account.id}:${activeProfileId}:before:${cursorRecord.occurred_at}:${cursorRecord.created_at}`;
    if (recordSyncInFlightKeys.current.has(syncKey)) {
      return;
    }
    recordSyncInFlightKeys.current.add(syncKey);
    setRecordsStatus(recordSyncPageLoadingStatusMessage());
    try {
      const query = new URLSearchParams({
        profile_id: activeProfileId,
        limit: String(mobileRecordSyncLimit),
        before: cursorRecord.occurred_at,
        before_created_at: cursorRecord.created_at
      });
      const response = await requestJson<RecordItem[]>(
        normalizedApiBaseUrl,
        `/records?${query.toString()}`,
        { headers: protectedRequestHeaders(account.id, accessToken) }
      );
      const boundedPage = boundRecordsList(response, mobileRecordSyncLimit);
      setRecords((current) => mergeRecordsByCursorOrder(current, boundedPage));
      const hasMoreAfterPage = response.length >= mobileRecordSyncLimit;
      setRecordsHasMore(hasMoreAfterPage);
      const nextCount = Math.min(
        mergeRecordsByCursorOrder(recordsForDisplay, boundedPage).length,
        maxMobileRecordCacheLimit
      );
      setRecordsStatus(
        recordSyncPageSuccessStatusMessage(
          nextCount,
          boundedPage.length,
          maxMobileRecordCacheLimit,
          hasMoreAfterPage && nextCount < maxMobileRecordCacheLimit
        )
      );
    } catch {
      setRecordsStatus(recordSyncFailureStatusMessage());
    } finally {
      recordSyncInFlightKeys.current.delete(syncKey);
    }
  }

  function openRecordDetail(record: RecordItem, returnScreen: AppScreen = "today") {
    setSelectedRecord(record);
    setRecordDetailReturnScreen(returnScreen);
    setRecordEditFields(recordPayloadToEditFields(record));
    const dateTime = localDateTimeInputs(record.occurred_at);
    setRecordEditDate(dateTime.date);
    setRecordEditTime(dateTime.time);
    setCurrentScreen("recordDetail");
  }

  function openSelectedRecordDetail(returnScreen: AppScreen) {
    if (!selectedRecord) {
      return;
    }
    setRecordDetailReturnScreen(returnScreen);
    setRecordEditFields(recordPayloadToEditFields(selectedRecord));
    const dateTime = localDateTimeInputs(selectedRecord.occurred_at);
    setRecordEditDate(dateTime.date);
    setRecordEditTime(dateTime.time);
    setCurrentScreen("recordDetail");
  }

  function openDeleteConfirm() {
    if (!selectedRecord) {
      setCurrentScreen("recordDetail");
      return;
    }
    setCurrentScreen("deleteConfirm");
    setStatus(deleteConfirmReadyStatusMessage());
  }

  function returnFromDeleteConfirm() {
    setCurrentScreen("recordDetail");
    setStatus(deleteConfirmReturnStatusMessage());
  }

  function openRecordEdit() {
    if (!selectedRecord) {
      setCurrentScreen("recordDetail");
      return;
    }
    setRecordEditFields(recordPayloadToEditFields(selectedRecord));
    const dateTime = localDateTimeInputs(selectedRecord.occurred_at);
    setRecordEditDate(dateTime.date);
    setRecordEditTime(dateTime.time);
    setCurrentScreen("editRecord");
    setStatus(recordEditOpenStatusMessage());
  }

  function returnFromRecordEdit() {
    if (selectedRecord) {
      setRecordEditFields(recordPayloadToEditFields(selectedRecord));
      const dateTime = localDateTimeInputs(selectedRecord.occurred_at);
      setRecordEditDate(dateTime.date);
      setRecordEditTime(dateTime.time);
    } else {
      setRecordEditFields(emptyRecordEditFields());
      const nowInputs = localDateTimeInputs(new Date());
      setRecordEditDate(nowInputs.date);
      setRecordEditTime(nowInputs.time);
    }
    setCurrentScreen("recordDetail");
    setStatus(recordEditCancelStatusMessage());
  }

  function openDeleteSuccessDestination(target: AppScreen) {
    setCurrentScreen(target);
    setStatus(recordResultDestinationStatusMessage("delete", target));
  }

  function openDeleteSuccessDestinationCard(target: AppScreen) {
    openDeleteSuccessDestination(target);
  }

  function pressDeleteSuccessDestinationCard(item: ReturnType<typeof destinationCardDisplayItem>) {
    openDeleteSuccessDestinationCard(item.target);
  }

  function openDeleteSuccessHistoryDestination() {
    openDeleteSuccessDestination("history");
  }

  function openUpdateSuccessDestination(target: AppScreen) {
    if (target === "recordDetail") {
      openSelectedRecordDetail("updateSuccess");
      setStatus(recordResultDestinationStatusMessage("update", target));
      return;
    }
    setCurrentScreen(target);
    setStatus(recordResultDestinationStatusMessage("update", target));
  }

  function openUpdateSuccessDestinationCard(target: AppScreen) {
    openUpdateSuccessDestination(target);
  }

  function pressUpdateSuccessDestinationCard(item: ReturnType<typeof destinationCardDisplayItem>) {
    openUpdateSuccessDestinationCard(item.target);
  }

  function openUpdatedRecordDetail() {
    openUpdateSuccessDestination("recordDetail");
  }

  function returnFromDeleteSuccess() {
    openDeleteSuccessDestination(recordDetailReturnScreen);
  }

  function returnFromUpdateSuccess() {
    openUpdateSuccessDestination(recordDetailReturnScreen);
  }

  async function updateSelectedRecord() {
    if (isBusy || recordUpdateInFlight.current) {
      return;
    }
    if (!selectedRecord) {
      return;
    }
    if (!protectedBackendReady) {
      setStatus(recordUpdateUnavailableStatusMessage(protectedBackendUnavailableMessage));
      setCurrentScreen("editRecord");
      return;
    }
    if (!account) {
      return;
    }
    const validationError = validateRecordForm(
      selectedRecord.record_type,
      recordEditFields,
      recordEditDate,
      recordEditTime
    );
    if (validationError) {
      setStatus(validationError);
      return;
    }

    recordUpdateInFlight.current = true;
    setIsBusy(true);
    setStatus(recordUpdateProgressStatusMessage());
    try {
      const payload = buildPayloadFromEditFields(selectedRecord.record_type, recordEditFields);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("payload_json must be an object");
      }
      const updatedResponse = await requestJson<RecordItem>(
        normalizedApiBaseUrl,
        `/records/${selectedRecord.id}`,
        {
          method: "PATCH",
          headers: protectedRequestHeaders(account.id, accessToken),
          body: JSON.stringify({
            occurred_at: localDateTimeToIso(recordEditDate, recordEditTime),
            payload_json: payload
          })
        }
      );
      const updated = boundRecordItem(updatedResponse);
      setRecords((current) => boundRecordsList(current.map((record) => (record.id === updated.id ? updated : record))));
      setSelectedRecord(updated);
      setRecordEditFields(recordPayloadToEditFields(updated));
      setLastUpdatedSummary(recordUpdateSummaryMessage(1));
      setCurrentScreen("updateSuccess");
      setStatus(recordUpdateSuccessStatusMessage());
    } catch (error) {
      setStatus(recordUpdateFailureStatusMessage(error));
    } finally {
      recordUpdateInFlight.current = false;
      setIsBusy(false);
    }
  }

  async function deleteSelectedRecord() {
    if (isBusy || recordDeleteInFlight.current) {
      return;
    }
    if (!selectedRecord) {
      return;
    }
    if (!protectedBackendReady) {
      setStatus(recordDeleteUnavailableStatusMessage(protectedBackendUnavailableMessage));
      setCurrentScreen("deleteConfirm");
      return;
    }
    if (!account) {
      return;
    }

    recordDeleteInFlight.current = true;
    setIsBusy(true);
    setStatus(recordDeleteProgressStatusMessage());
    try {
      await requestNoContent(normalizedApiBaseUrl, `/records/${selectedRecord.id}`, {
        method: "DELETE",
        headers: protectedRequestHeaders(account.id, accessToken)
      });
      setRecords((current) => current.filter((record) => record.id !== selectedRecord.id));
      setSelectedRecord(null);
      setRecordEditFields(emptyRecordEditFields());
      setRecordEditDate(formatLocalDateInput(new Date()));
      setRecordEditTime(formatLocalTimeInput(new Date()));
      setLastDeletedSummary(recordDeleteSummaryMessage(1));
      setCurrentScreen("deleteSuccess");
      setStatus(recordDeleteSuccessStatusMessage());
    } catch (error) {
      setStatus(recordDeleteFailureStatusMessage(error));
    } finally {
      recordDeleteInFlight.current = false;
      setIsBusy(false);
    }
  }

  async function createManualRecord() {
    if (isBusy || manualCreateInFlight.current) {
      return;
    }
    if (!protectedBackendReady) {
      setStatus(manualRecordCreateUnavailableStatusMessage(protectedBackendUnavailableMessage));
      setCurrentScreen("manualRecordConfirm");
      return;
    }
    if (!account || !activeProfile) {
      return;
    }
    const validationError = validateRecordForm(
      manualRecordType,
      manualRecordFields,
      manualRecordDate,
      manualRecordTime
    );
    if (validationError) {
      setStatus(validationError);
      return;
    }

    manualCreateInFlight.current = true;
    setIsBusy(true);
    setStatus(manualRecordCreateProgressStatusMessage());
    try {
      const payload = buildPayloadFromEditFields(manualRecordType, manualRecordFields);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("payload_json must be an object");
      }
      const createdResponse = await requestJson<RecordItem>(normalizedApiBaseUrl, "/records", {
        method: "POST",
        headers: protectedRequestHeaders(account.id, accessToken),
        body: JSON.stringify({
          profile_id: activeProfile.id,
          record_type: manualRecordType,
          occurred_at: localDateTimeToIso(manualRecordDate, manualRecordTime),
          payload_json: payload,
          metadata_json: {
            client_save_batch_id: createClientSaveBatchId(),
            client_save_sequence: 1,
            client_save_batch_size: 1,
            entry_method: "manual_form"
          },
          source: "manual"
        })
      });
      const created = boundRecordItem(createdResponse);
      setRecords((current) => boundRecordsList([created, ...current]));
      setSelectedRecord(created);
      setRecordEditFields(recordPayloadToEditFields(created));
      setManualRecordFields(emptyRecordEditFields());
      const nowInputs = localDateTimeInputs(new Date());
      setManualRecordDate(nowInputs.date);
      setManualRecordTime(nowInputs.time);
      setLastSavedSummary(manualRecordCreateSummaryMessage(1));
      setLastSaveEntryMethod("manual");
      setSaveSuccessReturnScreen(manualRecordReturnScreen);
      setCurrentScreen("saveSuccess");
      setStatus(manualRecordCreateSuccessStatusMessage());
      syncAchievementsAfterRecordSave();
    } catch (error) {
      setStatus(manualRecordCreateFailureStatusMessage(error));
    } finally {
      manualCreateInFlight.current = false;
      setIsBusy(false);
    }
  }

  async function refreshDownloadedModels(showStatus = false) {
    try {
      const nextModels = boundDownloadedModels(await listDownloadedModels());
      setDownloadedModels(nextModels);
      const whisperModels = nextModels.filter((model) => model.kind === "whisper" && model.exists);
      if (!whisperModelPath.trim() && whisperModels[0]?.uri) {
        setWhisperModelPath(boundNativeDebugInput(whisperModels[0].uri));
      }
      if (showStatus) {
        setStatus(recordingModelRefreshStatusMessage(whisperModels.length));
      }
    } catch (error) {
      setNativeStatus(nativeDownloadedModelsFailureStatusMessage(error));
      if (showStatus) {
        setStatus(recordingModelRefreshFailureStatusMessage(error));
      }
    }
  }

  async function downloadSelectedModel() {
    if (isBusy) {
      return;
    }
    if (!enableDebugTools) {
      setNativeStatus(nativeDebugDisabledStatusMessage());
      return;
    }
    setIsBusy(true);
    setDownloadProgress(0);
    setNativeStatus(nativeModelDownloadProgressStatusMessage());
    try {
      const uri = await downloadModel({
        url: modelUrl,
        kind: downloadKind,
        onProgress: setDownloadProgress
      });
      if (downloadKind === "llama") {
        setLlamaModelPath(boundNativeDebugInput(uri));
      } else {
        setWhisperModelPath(boundNativeDebugInput(uri));
      }
      await refreshDownloadedModels();
      setNativeStatus(nativeModelDownloadSuccessStatusMessage());
    } catch (error) {
      setNativeStatus(nativeModelDownloadFailureStatusMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function checkNativeModules() {
    if (isBusy) {
      return;
    }
    if (!enableDebugTools) {
      setNativeStatus(nativeDebugDisabledStatusMessage());
      return;
    }
    setIsBusy(true);
    setNativeStatus(nativeModuleCheckProgressStatusMessage());
    try {
      const result = await checkNativeLocalModules();
      setNativeStatus(nativeModuleCheckResultStatusMessage(result.message));
    } catch (error) {
      setNativeStatus(nativeModuleCheckFailureStatusMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function runNativeWhisper() {
    if (isBusy) {
      return;
    }
    if (!enableDebugTools) {
      setNativeStatus(nativeDebugDisabledStatusMessage());
      return;
    }
    if (!whisperModelPath.trim() || !audioPath.trim()) {
      setNativeStatus(nativeWhisperMissingInputStatusMessage());
      return;
    }
    setIsBusy(true);
    setNativeStatus(nativeWhisperProgressStatusMessage());
    try {
      const text = await transcribeWithNativeWhisper({
        modelPath: whisperModelPath.trim(),
        audioPath: audioPath.trim()
      });
      updateTranscriptDraft(text);
      setNativeStatus(nativeWhisperSuccessStatusMessage());
    } catch (error) {
      setNativeStatus(nativeWhisperFailureStatusMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function runNativeLlama() {
    if (isBusy) {
      return;
    }
    if (!enableDebugTools) {
      setNativeStatus(nativeDebugDisabledStatusMessage());
      return;
    }
    if (!llamaModelPath.trim() || !transcript.trim()) {
      setNativeStatus(nativeLlamaMissingInputStatusMessage());
      return;
    }
    setIsBusy(true);
    setNativeStatus(nativeLlamaProgressStatusMessage());
    try {
      const output = await parseWithNativeLlama({
        modelPath: llamaModelPath.trim(),
        transcript: transcript.trim()
      });
      setLlamaDebugOutput(nativeLlamaOutputSummaryMessage(output.length));
      setNativeStatus(nativeLlamaSuccessStatusMessage());
    } catch (error) {
      setNativeStatus(nativeLlamaFailureStatusMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function runNativeBenchmarks() {
    if (isBusy) {
      return;
    }
    if (!enableDebugTools) {
      setNativeStatus(nativeDebugDisabledStatusMessage());
      return;
    }
    setIsBusy(true);
    setNativeStatus(nativeBenchmarkProgressStatusMessage());
    try {
      const results = [];
      if (whisperModelPath.trim() && audioPath.trim()) {
        results.push(
          await benchmarkNativeWhisper({
            modelPath: whisperModelPath.trim(),
            audioPath: audioPath.trim()
          })
        );
      }
      if (llamaModelPath.trim() && transcript.trim()) {
        results.push(
          await benchmarkNativeLlama({
            modelPath: llamaModelPath.trim(),
            transcript: transcript.trim()
          })
        );
      }
      if (results.length === 0) {
        setNativeStatus(nativeBenchmarkMissingInputStatusMessage());
        return;
      }
      setNativeStatus(nativeBenchmarkResultStatusMessage(results));
    } finally {
      setIsBusy(false);
    }
  }

  function updateRecordEditField<K extends keyof RecordEditFields>(
    field: K,
    value: RecordEditFields[K]
  ) {
    setRecordEditFields((current) => ({ ...current, [field]: boundRecordEditField(field, value) }));
  }

  function updateRecordEditDateInput(value: string) {
    setRecordEditDate(boundDateInputText(value));
  }

  function updateRecordEditTimeInput(value: string) {
    setRecordEditTime(boundTimeInputText(value));
  }

  function updateRecordEditGlucoseValue(value: string) {
    updateRecordEditField("glucoseValue", value);
  }

  function selectRecordEditGlucoseUnit(value: string) {
    updateRecordEditField("glucoseUnit", value);
  }

  function pressRecordEditGlucoseUnitOption(option: ReturnType<typeof optionDisplayItem>) {
    selectRecordEditGlucoseUnit(option.value);
  }

  function selectRecordEditGlucoseTiming(value: string) {
    updateRecordEditField("glucoseTiming", value);
  }

  function pressRecordEditGlucoseTimingOption(option: ReturnType<typeof valueLabelDisplayItem>) {
    selectRecordEditGlucoseTiming(option.value);
  }

  function selectRecordEditMealType(value: string) {
    updateRecordEditField("mealType", value);
  }

  function pressRecordEditMealTypeOption(option: ReturnType<typeof valueLabelDisplayItem>) {
    selectRecordEditMealType(option.value);
  }

  function updateRecordEditFoodItems(value: string) {
    updateRecordEditField("foodItems", value);
  }

  function updateRecordEditExerciseActivity(value: string) {
    updateRecordEditField("exerciseActivity", value);
  }

  function updateRecordEditExerciseMinutes(value: string) {
    updateRecordEditField("exerciseMinutes", value);
  }

  function updateRecordEditMedicationName(value: string) {
    updateRecordEditField("medicationName", value);
  }

  function updateRecordEditMedicationDose(value: string) {
    updateRecordEditField("medicationDose", value);
  }

  function updateRecordEditNoteKind(value: string) {
    updateRecordEditField("noteKind", value);
  }

  function updateRecordEditNoteTags(value: string) {
    updateRecordEditField("noteTags", value);
  }

  function updateRecordEditFallbackJson(value: string) {
    updateRecordEditField("fallbackJson", value);
  }

  function updateManualRecordField<K extends keyof RecordEditFields>(
    field: K,
    value: RecordEditFields[K]
  ) {
    setManualRecordFields((current) => ({ ...current, [field]: boundRecordEditField(field, value) }));
  }

  function updateManualRecordDateInput(value: string) {
    setManualRecordDate(boundDateInputText(value));
  }

  function updateManualRecordTimeInput(value: string) {
    setManualRecordTime(boundTimeInputText(value));
  }

  function updateManualRecordGlucoseValue(value: string) {
    updateManualRecordField("glucoseValue", value);
  }

  function selectManualRecordGlucoseUnit(value: string) {
    updateManualRecordField("glucoseUnit", value);
  }

  function pressManualRecordGlucoseUnitOption(option: ReturnType<typeof optionDisplayItem>) {
    selectManualRecordGlucoseUnit(option.value);
  }

  function selectManualRecordGlucoseTiming(value: string) {
    updateManualRecordField("glucoseTiming", value);
  }

  function pressManualRecordGlucoseTimingOption(option: ReturnType<typeof valueLabelDisplayItem>) {
    selectManualRecordGlucoseTiming(option.value);
  }

  function selectManualRecordMealType(value: string) {
    updateManualRecordField("mealType", value);
  }

  function pressManualRecordMealTypeOption(option: ReturnType<typeof valueLabelDisplayItem>) {
    selectManualRecordMealType(option.value);
  }

  function updateManualRecordFoodItems(value: string) {
    updateManualRecordField("foodItems", value);
  }

  function updateManualRecordExerciseActivity(value: string) {
    updateManualRecordField("exerciseActivity", value);
  }

  function updateManualRecordExerciseMinutes(value: string) {
    updateManualRecordField("exerciseMinutes", value);
  }

  function updateManualRecordMedicationName(value: string) {
    updateManualRecordField("medicationName", value);
  }

  function updateManualRecordMedicationDose(value: string) {
    updateManualRecordField("medicationDose", value);
  }

  function updateManualRecordNoteKind(value: string) {
    updateManualRecordField("noteKind", value);
  }

  function updateManualRecordNoteTags(value: string) {
    updateManualRecordField("noteTags", value);
  }

  useEffect(() => {
    if (initialVisualSmokeScreen) {
      return;
    }
    let cancelled = false;
    void readStoredAuthSession().then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setAccessToken("");
        setRefreshToken("");
        setTokenStorageStatus(
          result.reason === "secure_store_unavailable"
            ? "SecureStore 不可用；正式 token storage fail closed。"
            : "安全 token storage 讀取失敗；已拒用本機 token。"
        );
        return;
      }
      if (!result.session) {
        setTokenStorageStatus("SecureStore 無已保存 session。");
        return;
      }
      setAccessToken(result.session.accessToken);
      setRefreshToken(result.session.refreshToken);
      setTokenStorageStatus("SecureStore 已載入短效 access token；refresh token 未顯示。");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (initialVisualSmokeScreen) {
      activateVisualSmokePreview();
      setStatus(boundUiMessage("Visual smoke 本機路由預覽；已跳過 backend boot，不會呼叫 API 或寫入資料。"));
      setAuthActionStatus(boundUiMessage("Visual smoke demo state only; no dev-login, token, backend, AI, STT, Vision, payment, or database writes."));
      return;
    }
    void boot();
    void refreshDownloadedModels();
  }, []);

  useEffect(() => {
    if (!isRecordingPreview || recordingStartedAt === null) {
      return;
    }
    const timer = setInterval(() => {
      const nextElapsedSeconds = Math.ceil((Date.now() - recordingStartedAt) / 1000);
      const limitSeconds = recordingEffectiveLimitSeconds(voiceQuota);
      setRecordingElapsedSeconds(clampNumber(nextElapsedSeconds, 0, limitSeconds));
      if (nextElapsedSeconds >= limitSeconds) {
        void finishRecordingPreview("limit");
      }
    }, 500);
    return () => clearInterval(timer);
  }, [isRecordingPreview, recordingStartedAt, voiceQuota?.remaining_seconds_today]);

  useEffect(() => {
    void loadRecords();
  }, [account?.id, activeProfileId]);

  useEffect(() => {
    if (currentScreen === "analysis") {
      void loadBasicReportForCurrentRange("analysis");
    }
  }, [
    currentScreen,
    account?.id,
    activeProfileId,
    protectedBackendReady,
    analysisRange,
    analysisCustomStart,
    analysisCustomEnd,
  ]);

  useEffect(() => {
    if (currentScreen === "community") {
      void loadCommunityPublicSettings();
      void loadFoodCommunityCategories();
      void loadCommunityFoods();
      void loadStoreCatalogAndPoints();
    }
  }, [currentScreen, foodCommunityCategory, foodCommunitySearchText, account?.id, protectedAccountBackendReady]);

  useEffect(() => {
    if (currentScreen === "ranking") {
      void loadCommunityLeaderboards();
    }
  }, [currentScreen, account?.id, protectedAccountBackendReady, communityPublicSettings?.leaderboard_opt_in]);

  useEffect(() => {
    if (currentScreen === "store") {
      void loadStoreCatalogAndPoints();
    }
  }, [currentScreen, account?.id, protectedAccountBackendReady]);

  useEffect(() => {
    if (currentScreen === "achievements") {
      void loadAchievementSummary();
    }
  }, [currentScreen, account?.id, activeProfileId, protectedBackendReady]);

  useEffect(() => {
    if (currentScreen === "yearReview") {
      void loadYearReview();
    }
  }, [currentScreen, account?.id, activeProfileId, protectedBackendReady]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingRoot}
      >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>糖錄錄</Text>
            {currentChrome.subtitle ? <Text style={styles.subtitle}>{currentChrome.subtitle}</Text> : null}
          </View>
          <Pressable
            accessibilityLabel={headerActionDisplayAccessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: isAnyRequestInFlight }}
            disabled={isAnyRequestInFlight}
            style={[styles.menuButton, isAnyRequestInFlight ? styles.menuButtonDisabled : null]}
            onPress={handleHeaderAction}
          >
            <Text style={styles.menuButtonText}>{currentChrome.actionLabel ?? "☰"}</Text>
          </Pressable>
        </View>

        {showPrimaryTabs ? (
          <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} style={styles.topTabs}>
            {primaryScreens.map((screen) => {
              const isCurrentPrimaryTab = currentScreen === screen.id;
              const isPrimaryTabLocked = isAnyRequestInFlight && !isCurrentPrimaryTab;
              const primaryTabAccessibility = primaryTabAccessibilityLabel(screen.label);

              return (
                <Pressable
                  key={screen.id}
                  accessibilityLabel={primaryTabAccessibility}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isPrimaryTabLocked, selected: isCurrentPrimaryTab }}
                  disabled={isPrimaryTabLocked}
                  style={[
                    styles.tabPill,
                    isCurrentPrimaryTab ? styles.tabPillActive : null,
                    isPrimaryTabLocked ? styles.tabPillDisabled : null
                  ]}
                  onPress={() => pressPrimaryTab(screen.id)}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      isCurrentPrimaryTab ? styles.tabPillTextActive : null,
                      isPrimaryTabLocked ? styles.tabPillTextDisabled : null
                    ]}
                  >
                    {screen.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {currentScreen !== "today" ? (
          <View style={styles.statusRow}>
            {isBusy ? <ActivityIndicator /> : null}
            <Text style={styles.status}>{status}</Text>
          </View>
        ) : null}

        {showMvpFlowStepper ? (
          <View style={styles.flowStepperCard}>
            {mvpFlowSteps.map((step, index) => {
              const isActive = index === mvpFlowStepIndex;
              const isDone = index < mvpFlowStepIndex;
              return (
                <View key={step.id} style={styles.flowStepItem}>
                  <View
                    style={[
                      styles.flowStepDot,
                      isActive ? styles.flowStepDotActive : null,
                      isDone ? styles.flowStepDotDone : null
                    ]}
                  >
                    <Text
                      style={[
                        styles.flowStepDotText,
                        isActive || isDone ? styles.flowStepDotTextActive : null
                      ]}
                    >
                      {isDone ? "✓" : String(index + 1)}
                    </Text>
                  </View>
                  <Text style={[styles.flowStepLabel, isActive ? styles.flowStepLabelActive : null]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {currentScreen === "today" ? (
          <View style={styles.homeMinimalSection}>
            <Pressable
              accessibilityLabel={recordingButtonDisplayAccessibilityLabel}
              accessibilityRole="button"
              style={[
                styles.homeMicButton,
                isRecordingPreview ? styles.homeMicButtonActive : null
              ]}
              onPressIn={startRecordingPreview}
              onPressOut={releaseRecordingPreview}
            >
              <Text style={styles.homeMicIcon}>🎙</Text>
            </Pressable>
            <Text style={styles.homeHint}>按住開始說話記錄</Text>
            <Text style={styles.homeHintSecondary}>{homeRecordingSecondaryHintDisplayText}</Text>
            {isRecordingPreview ? (
              <Text style={styles.homeRecordingTimer}>{recordingElapsedSecondsDisplayText}</Text>
            ) : null}
          </View>
        ) : null}

        {currentScreen === "record" ? (
          <>
            <View style={styles.pageSection}>
              <Text style={styles.sectionTitle}>快速記錄</Text>
              <Text style={styles.evidence}>先確認文字，再讓 AI 整理成候選紀錄；確認後才會儲存。</Text>
              <View style={styles.quickEntryRail}>
                {quickEntryModeDisplayItemsForRender.map((item) => (
                  <Pressable
                    key={`record-${item.key}`}
	                    accessibilityLabel={item.accessibilityLabel}
	                    accessibilityRole="button"
	                    accessibilityState={{ disabled: isBusy }}
	                    style={[styles.quickEntryItem, isBusy ? styles.buttonDisabled : null]}
                    disabled={isBusy}
                    onPress={() => pressRecordQuickEntryItem(item)}
                  >
                    <Text style={styles.quickEntryIcon}>{item.icon}</Text>
                    <Text style={styles.quickEntryLabel}>{item.label}</Text>
                    <Text style={styles.quickEntryCopy}>{item.copy}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{coreFlowDisplayLabels.parseSettings}</Text>
                <Text style={styles.evidence}>
                  LLM：{selectedLlmModel?.label ?? llmModelId} · {modelRuntimeLabel(selectedLlmModel?.runtime)}
                </Text>
                <Text style={styles.evidence}>
                  STT：{selectedSttModel?.label ?? sttModelId} · {modelRuntimeLabel(selectedSttModel?.runtime)}
                </Text>
                {recordEntrySettingsChecklistItems.map((item) => (
                  <View key={item} style={styles.highlightRow}>
                    <Text style={styles.recordType}>•</Text>
                    <Text style={styles.evidence}>{item}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.voiceCaptureCard}>
                <Pressable
                  accessibilityLabel={recordingButtonDisplayAccessibilityLabel}
                  accessibilityRole="button"
                  style={[
                    styles.recordHoldButton,
                    isRecordingPreview ? styles.recordHoldButtonActive : null
                  ]}
                  onPressIn={startRecordingPreview}
                  onPressOut={releaseRecordingPreview}
                >
                  <Text style={styles.recordHoldIcon}>🎙</Text>
                  <Text style={styles.recordHoldText}>
                    {isRecordingPreview ? "錄音中" : "按住錄音"}
                  </Text>
                </Pressable>
                <View style={styles.timelineContent}>
                  <Text style={styles.recordContent}>
                    {recordingPreviewDisplayText}
                  </Text>
                  <Text style={isVoiceQuotaLow(voiceQuota) ? styles.warningText : styles.evidence}>
                    {captureVoiceQuotaCopy(voiceQuota)}
                  </Text>
                  <Text style={styles.evidence}>{recordingLimitDisplayText}</Text>
                  <Text style={styles.evidence}>{recordPageRecordingPreviewBoundaryDisplayText}</Text>
                </View>
              </View>
              {!isRecordingPreview && recordingElapsedSeconds > 0 ? (
                <View style={styles.recordingResultCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.label}>{coreFlowDisplayLabels.recordingEnded}</Text>
                    <Text style={styles.confidence}>{recordingElapsedSecondsDisplayText}</Text>
                  </View>
                    <Text style={styles.evidence}>{recordingResultBodyDisplayText}</Text>
                    <View style={styles.actionRow}>
                      <Pressable
                        accessibilityLabel={coreFlowDisplayLabels.rerecordAccessibility}
                        accessibilityRole="button"
                        style={styles.secondaryButton}
                        onPress={resetRecordingPreview}
                      >
                        <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.rerecord}</Text>
                      </Pressable>
                      <Pressable
                        accessibilityLabel={coreFlowDisplayLabels.useRecordingTextAccessibility}
                        accessibilityRole="button"
                        style={styles.primaryButton}
                        onPress={useRecordRecordingResultTextFallback}
                      >
                        <Text style={styles.primaryButtonText}>
                          {recordingResultPrimaryActionDisplayText}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
              <TextInput
                accessibilityLabel={auxiliaryDisplayLabels.transcriptInputAccessibility}
                value={transcript}
                onChangeText={updateTranscriptDraft}
                maxLength={maxTranscriptTextLength}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.transcriptInput]}
                placeholder="例如：昨天晚餐後兩小時血糖 168，晚餐吃火鍋，飯後走路 20 分鐘。"
                />
                <View style={styles.actionRow}>
                  <Pressable
                    accessibilityLabel={coreFlowDisplayLabels.fillSampleAccessibility}
                    accessibilityRole="button"
                    style={styles.secondaryButton}
                    onPress={fillTranscriptSampleDraft}
                  >
                    <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.fillSample}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={coreFlowDisplayLabels.manualAddAccessibility}
                    accessibilityRole="button"
                    style={styles.secondaryButton}
                    onPress={openRecordManualRecord}
                  >
                    <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.manualAdd}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={coreFlowDisplayLabels.nextOrganizeAccessibility}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: Boolean(transcriptValidationError) || isBusy }}
                    style={[
                      styles.primaryButton,
                      transcriptValidationError || isBusy ? styles.buttonDisabled : null
                    ]}
                  disabled={Boolean(transcriptValidationError) || isBusy}
                  onPress={openTranscriptReview}
                >
                  <Text style={styles.primaryButtonText}>{coreFlowDisplayLabels.nextOrganize}</Text>
                </Pressable>
              </View>
              {transcriptValidationError ? (
                <Text style={transcript.trim() ? styles.warningText : styles.evidence}>
                  {transcriptValidationDisplayText}
                </Text>
              ) : null}
            </View>

          </>
        ) : null}

        {currentScreen === "aiReview" && preview ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>AI 整理確認</Text>
                <Text style={styles.evidence}>{aiReviewIntroDisplayText}</Text>
              </View>
              <Text style={styles.countText}>{unsavedPreviewRecordDisplayCount} 筆</Text>
            </View>
            <View style={styles.aiReviewList}>
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.previewModeBadge}>{auxiliaryDisplayLabels.costBoundaryBadge}</Text>
                {aiReviewCostBoundaryChecklistItems.map((item) => (
                  <View key={item} style={styles.highlightRow}>
                    <Text style={styles.recordType}>•</Text>
                    <Text style={styles.evidence}>{item}</Text>
                  </View>
                ))}
              </View>
              {preview.records.length > 0 ? (
                <View style={styles.aiReviewCard}>
                  <View style={styles.iconCircleSmall}>
                    <Text>📅</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.confidence}>{auxiliaryDisplayLabels.candidateDateTime}</Text>
                    <Text style={styles.recordContent}>{aiReviewDateDisplayLabel}</Text>
                  </View>
                  <Text style={styles.confidence}>{auxiliaryDisplayLabels.confirmStatus}</Text>
                </View>
              ) : null}
              {previewRecordDisplayItems.length > 0 ? (
                previewRecordDisplayItems.map((item) => (
                  <View key={item.key} style={styles.aiReviewCardStack}>
                    <View style={styles.recordHeader}>
                      <View style={styles.historyItemTitle}>
                        <View style={styles.iconCircleSmall}>
                          <Text>{item.icon}</Text>
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={styles.confidence}>{item.typeLabel}</Text>
                          <Text style={styles.recordContent}>{item.payloadSummary}</Text>
                        </View>
                      </View>
                      <View style={styles.confidencePill}>
                        <Text style={styles.confidence}>
                          {item.confidencePercent}%
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.evidence}>{item.sourceText}</Text>
                    {item.lowConfidence ? (
                      <Text style={styles.warningText}>{aiReviewLowConfidenceDisplayText}</Text>
                    ) : null}
                    {item.decisionTraceDisplayText ? (
                      <Text style={styles.evidence}>{item.decisionTraceDisplayText}</Text>
                    ) : null}
                    <View style={styles.actionRow}>
                      <Pressable
                        accessibilityLabel={item.editAccessibilityLabel}
                        accessibilityRole="button"
                        style={styles.secondaryButton}
                        onPress={() => pressAiCandidateEditAction(item)}
                      >
                        <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.edit}</Text>
                      </Pressable>
                      <Pressable
                        accessibilityLabel={item.removeAccessibilityLabel}
                        accessibilityRole="button"
                        style={styles.dangerButton}
                        onPress={() => pressAiCandidateRemoveAction(item)}
                      >
                        <Text style={styles.dangerButtonText}>移除</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              ) : (
                  <View style={styles.emptyStateCard}>
                    <View style={styles.iconCircleMuted}>
                      <Text style={styles.recordType}>{auxiliaryDisplayLabels.dangerBang}</Text>
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.recordType}>{aiReviewNoCandidateTitleDisplayText}</Text>
                      <Text style={styles.recordContent}>{aiReviewNoCandidateBodyDisplayText}</Text>
                      <Text style={styles.evidence}>{aiReviewNoCandidateBoundaryDisplayText}</Text>
                    </View>
                  </View>
                )}
            </View>
                {rejectedPreviewDisplayItems.length > 0 ? (
                  <View style={styles.rejectedBox}>
                    <Text style={styles.label}>{coreFlowDisplayLabels.noRecordCreated}</Text>
                    <Text style={styles.evidence}>{aiReviewRejectedEventsDisplayText}</Text>
                    {rejectedPreviewDisplayItems.map((event) => (
                      <View key={event.id} style={styles.rejectedEventCard}>
                        <Text style={styles.rejectedText}>{event.sourceText}</Text>
                        <Text style={styles.evidence}>{event.reasonDisplayText}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <View style={styles.actionRow}>
                  <Pressable
                    accessibilityLabel={coreFlowDisplayLabels.returnEditAccessibility}
                    accessibilityRole="button"
                    style={styles.secondaryButton}
                    onPress={returnToTranscriptEdit}
                  >
                    <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.returnEdit}</Text>
                  </Pressable>
                  {preview.records.length === 0 ? (
                    <Pressable
                      accessibilityLabel={coreFlowDisplayLabels.manualAddAccessibility}
                      accessibilityRole="button"
                      style={styles.secondaryButton}
                      onPress={openAiReviewManualRecord}
                    >
                      <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.manualAdd}</Text>
                    </Pressable>
                  ) : null}
                  {preview.records.length > 0 ? (
                    <Pressable
                      accessibilityLabel={coreFlowDisplayLabels.enterSaveConfirmAccessibility}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isBusy || !account }}
                      style={[styles.primaryButton, isBusy || !account ? styles.buttonDisabled : null]}
                      disabled={isBusy || !account}
                      onPress={enterAiSaveConfirm}
                    >
                      <Text style={styles.primaryButtonText}>{coreFlowDisplayLabels.enterSaveConfirm}</Text>
                    </Pressable>
                  ) : null}
                </View>
                {preview.records.length > 0 && !account ? (
                  <Text style={styles.warningText}>{aiReviewBackendRequiredDisplayText}</Text>
                ) : null}
              </View>
        ) : null}

        {currentScreen === "aiReview" && !preview ? (
          <View style={styles.pageSection}>
            <View style={styles.emptyStateCard}>
              <View style={styles.iconCircleMuted}>
                <Text style={styles.recordType}>{auxiliaryDisplayLabels.aiBadge}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.recordContent}>{aiReviewNoPreviewTitleDisplayText}</Text>
                <Text style={styles.evidence}>{aiReviewNoPreviewBodyDisplayText}</Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel={coreFlowDisplayLabels.returnTextConfirmAccessibility}
              accessibilityRole="button"
              style={styles.primaryButtonFull}
              onPress={returnToTranscriptEdit}
            >
              <Text style={styles.primaryButtonText}>{coreFlowDisplayLabels.returnTextConfirm}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "aiSaveConfirm" && preview ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>確認儲存</Text>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.returnConfirmAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromAiSaveConfirm}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.returnConfirm}</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{auxiliaryDisplayLabels.preSaveConfirmBadge}</Text>
              <Text style={styles.evidence}>{aiSaveConfirmIntroDisplayText}</Text>
            </View>
            <View style={styles.reportBoundaryGrid}>
              {aiSaveConfirmBoundaryRows.map((row) => (
                <View key={row.label} style={styles.reportBoundaryCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.recordType}>{row.value}</Text>
                </View>
              ))}
            </View>
            {lowConfidencePreviewRecordCount > 0 ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{coreFlowDisplayLabels.lowConfidenceWarning}</Text>
                <Text style={styles.warningText}>{lowConfidenceWarningDisplayText}</Text>
              </View>
            ) : null}
            {rejectedPreviewEventCount > 0 ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{coreFlowDisplayLabels.rejectedEventWarning}</Text>
                <Text style={styles.warningText}>{rejectedPreviewWarningDisplayText}</Text>
              </View>
            ) : null}
            {isAiSaveConfirmBlockedByBackend ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{coreFlowDisplayLabels.saveConnectionStatus}</Text>
                <Text style={styles.warningText}>{aiSaveBackendBlockedDisplayText}</Text>
              </View>
            ) : null}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.preSubmitCheck}</Text>
              {aiSaveConfirmChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.aiReviewList}>
              {previewSaveConfirmDisplayItems.map((item) => (
                <View key={item.key} style={styles.aiReviewCard}>
                  <View style={styles.iconCircleSmall}>
                    <Text>{item.icon}</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.confidence}>{item.typeLabel}</Text>
                    <Text style={styles.recordContent}>{item.payloadSummary}</Text>
                  </View>
                  <Text style={item.lowConfidence ? styles.warningText : styles.confidence}>
                    {item.confidencePercent}%
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.returnConfirmAccessibility}
                accessibilityRole="button"
                accessibilityState={{ disabled: isBusy }}
                style={[styles.secondaryButton, isBusy ? styles.buttonDisabled : null]}
                disabled={isBusy}
                onPress={returnFromAiSaveConfirm}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.returnConfirm}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.submitAiSaveAccessibility}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: isBusy || isAiSaveConfirmBlockedByBackend || preview.records.length === 0
                }}
                style={[
                  styles.primaryButton,
                  isBusy || isAiSaveConfirmBlockedByBackend || preview.records.length === 0
                    ? styles.buttonDisabled
                    : null
                ]}
                disabled={isBusy || isAiSaveConfirmBlockedByBackend || preview.records.length === 0}
                onPress={submitAiSaveConfirm}
              >
                <Text style={styles.primaryButtonText}>{aiSaveConfirmSubmitDisplayLabel}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {currentScreen === "aiRemoveConfirm" && pendingPreviewRemoveRecord && pendingPreviewRemoveDisplayItem ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>移除候選紀錄</Text>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.returnConfirmAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromPreviewRemoveConfirm}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.returnConfirm}</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{aiRemoveConfirmBoundaryDisplayLabel}</Text>
              <Text style={styles.evidence}>{aiRemoveConfirmBoundaryDisplayText}</Text>
            </View>
            <View style={styles.aiReviewCard}>
              <View style={styles.iconCircleSmall}>
                <Text>{pendingPreviewRemoveDisplayItem.icon}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.confidence}>{pendingPreviewRemoveDisplayItem.typeLabel}</Text>
                <Text style={styles.recordContent}>{pendingPreviewRemoveDisplayItem.payloadSummary}</Text>
                <Text style={styles.evidence}>{aiRemoveConfirmSourceDisplayText}</Text>
              </View>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.removeScope}</Text>
              {aiCandidateRemoveChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.cancelAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromPreviewRemoveConfirm}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.cancel}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.confirmRemoveAccessibility}
                accessibilityRole="button"
                style={styles.dangerButton}
                onPress={confirmPreviewRecordRemove}
              >
                <Text style={styles.dangerButtonText}>確認移除</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {currentScreen === "aiSaveFailure" ? (
          <View style={styles.pageSection}>
            <View style={styles.successHero}>
              <View style={styles.dangerIconCircle}>
                <Text style={styles.successIconText}>!</Text>
              </View>
              <Text style={styles.sectionTitle}>儲存未完成</Text>
              <Text style={styles.evidence}>
                {lastSaveErrorSummaryDisplayText}
              </Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.failureBoundary}</Text>
              {aiSaveFailureChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.backAiConfirmAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromAiSaveFailureToAiReview}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.backAiConfirm}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.manualAddAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={openAiSaveFailureManualFallback}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.manualAdd}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.returnSaveConfirmAccessibility}
                accessibilityRole="button"
                accessibilityState={{ disabled: !preview || preview.records.length === 0 }}
                style={[
                  styles.primaryButton,
                  !preview || preview.records.length === 0 ? styles.buttonDisabled : null
                ]}
                disabled={!preview || preview.records.length === 0}
                onPress={returnFromAiSaveFailureToSaveConfirm}
              >
                <Text style={styles.primaryButtonText}>{coreFlowDisplayLabels.returnSaveConfirm}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {currentScreen === "transcriptReview" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>確認文字內容</Text>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.backAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromTranscriptReview}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.back}</Text>
              </Pressable>
            </View>
            <Text style={styles.evidence}>{transcriptReviewIntroDisplayText}</Text>
            <TextInput
              accessibilityLabel={auxiliaryDisplayLabels.transcriptInputAccessibility}
              value={transcript}
              onChangeText={updateTranscriptDraft}
              maxLength={maxTranscriptTextLength}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.transcriptReviewInput]}
              placeholder="輸入或貼上血糖、飲食、運動或用藥紀錄..."
            />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.preOrganizeHint}</Text>
              <Text style={styles.evidence}>{transcriptReviewPreParseGuidanceDisplayText}</Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.costBoundary}</Text>
              {transcriptReviewCostBoundaryChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.retryInputAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={retryTranscriptInput}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.retryInput}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.submitTranscriptParseAccessibility}
                accessibilityRole="button"
                accessibilityState={{
                  disabled:
                    Boolean(transcriptValidationError) ||
                    isTranscriptSample ||
                    isBusy ||
                    !protectedBackendReady ||
                    !parserModelReady
                }}
                style={[
                  styles.primaryButton,
                  transcriptValidationError || isTranscriptSample || isBusy || !protectedBackendReady || !parserModelReady
                    ? styles.buttonDisabled
                    : null
                ]}
                disabled={
                  Boolean(transcriptValidationError) ||
                  isTranscriptSample ||
                  isBusy ||
                  !protectedBackendReady ||
                  !parserModelReady
                }
                onPress={submitTranscriptParse}
              >
                <Text style={styles.primaryButtonText}>{coreFlowDisplayLabels.nextOrganize}</Text>
              </Pressable>
            </View>
            {transcriptValidationError ? (
              <Text style={transcript.trim() ? styles.warningText : styles.evidence}>
                {transcriptReviewValidationDisplayText}
              </Text>
            ) : isTranscriptSample ? (
              <Text style={styles.warningText}>{transcriptReviewSampleWarningDisplayText}</Text>
            ) : protectedBackendUnavailableMessage ? (
              <Text style={styles.warningText}>{transcriptBackendUnavailableDisplayText}</Text>
            ) : parserModelUnavailableMessage ? (
              <Text style={styles.warningText}>{transcriptModelUnavailableDisplayText}</Text>
            ) : (
              <Text style={styles.evidence}>{transcriptReviewPreflightPassedDisplayText}</Text>
            )}
            {parserRecoveryMessage ? (
              <View style={styles.infoBanner}>
                <Text style={styles.warningText}>{parserRecoveryDisplayText}</Text>
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.switchManualAddAccessibility}
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  onPress={openTranscriptReviewManualRecord}
                >
                  <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.switchManualAdd}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {currentScreen === "editPreviewRecord" && selectedPreviewRecord ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>修改整理結果</Text>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.previewEditReturnAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromPreviewRecordEdit}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.back}</Text>
              </Pressable>
            </View>
            <Text style={styles.evidence}>{previewRecordEditBoundaryDisplayText}</Text>
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeField}>
                {renderFieldLabel("📅", "日期")}
                <TextInput
                  accessibilityLabel={auxiliaryDisplayLabels.dateInputAccessibility}
                  value={previewEditDate}
                  onChangeText={updatePreviewEditDateInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={maxDateInputLength}
                  style={styles.input}
                  placeholder="2026-04-29"
                />
              </View>
              <View style={styles.dateTimeField}>
                {renderFieldLabel("🕒", "時間")}
                <TextInput
                  accessibilityLabel={auxiliaryDisplayLabels.timeInputAccessibility}
                  value={previewEditTime}
                  onChangeText={updatePreviewEditTimeInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={maxTimeInputLength}
                  style={styles.input}
                  placeholder="08:10"
                />
              </View>
            </View>
            <View style={styles.detailRow}>
              {renderFieldLabel("🏷", "類型")}
              <Text style={styles.recordContent}>{selectedPreviewRecordDisplayItem?.typeLabel ?? "紀錄"}</Text>
            </View>
            {selectedPreviewRecord.record_type === "glucose" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("💧", "血糖數值")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.glucoseValueInputAccessibility}
                    value={previewEditFields.glucoseValue}
                    onChangeText={updatePreviewEditGlucoseValue}
                    keyboardType="numeric"
                    maxLength={recordEditFieldMaxLength("glucoseValue")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="138"
                  />
                </View>
                <View style={styles.segmentRow}>
                  {glucoseUnitDisplayOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      accessibilityLabel={option.accessibilityLabel}
                      accessibilityRole="button"
                      accessibilityState={{ selected: previewEditFields.glucoseUnit === option.value }}
                      style={[
                        styles.segmentPill,
                        previewEditFields.glucoseUnit === option.value ? styles.segmentActive : null
                      ]}
                      onPress={() => pressPreviewEditGlucoseUnitOption(option)}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          previewEditFields.glucoseUnit === option.value ? styles.segmentTextActive : null
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("◌", "情境")}
                  <View style={styles.segmentRow}>
                    {glucoseTimingDisplayOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        accessibilityLabel={option.accessibilityLabel}
                        accessibilityRole="button"
                        accessibilityState={{ selected: previewEditFields.glucoseTiming === option.value }}
                        style={[
                          styles.segmentPill,
                          previewEditFields.glucoseTiming === option.value ? styles.segmentActive : null
                        ]}
                        onPress={() => pressPreviewEditGlucoseTimingOption(option)}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            previewEditFields.glucoseTiming === option.value ? styles.segmentTextActive : null
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            ) : null}
            {selectedPreviewRecord.record_type === "meal" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("🥣", "餐別")}
                  <View style={styles.segmentRow}>
                    {mealTypeDisplayOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        accessibilityLabel={option.accessibilityLabel}
                        accessibilityRole="button"
                        accessibilityState={{ selected: previewEditFields.mealType === option.value }}
                        style={[
                          styles.segmentPill,
                          previewEditFields.mealType === option.value ? styles.segmentActive : null
                        ]}
                        onPress={() => pressPreviewEditMealTypeOption(option)}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            previewEditFields.mealType === option.value ? styles.segmentTextActive : null
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("🍽", "飲食內容")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.foodItemsInputAccessibility}
                    value={previewEditFields.foodItems}
                    onChangeText={updatePreviewEditFoodItems}
                    maxLength={recordEditFieldMaxLength("foodItems")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                    textAlignVertical="top"
                    style={[styles.input, styles.multilineField]}
                    placeholder="水煮蛋、熱狗"
                  />
                </View>
              </>
            ) : null}
            {selectedPreviewRecord.record_type === "exercise" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("🚶", "運動")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.exerciseActivityInputAccessibility}
                    value={previewEditFields.exerciseActivity}
                    onChangeText={updatePreviewEditExerciseActivity}
                    maxLength={recordEditFieldMaxLength("exerciseActivity")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="走路"
                  />
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("⏱", "時長（分鐘）")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.exerciseMinutesInputAccessibility}
                    value={previewEditFields.exerciseMinutes}
                    onChangeText={updatePreviewEditExerciseMinutes}
                    keyboardType="numeric"
                    maxLength={recordEditFieldMaxLength("exerciseMinutes")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="20"
                  />
                </View>
              </>
            ) : null}
            {selectedPreviewRecord.record_type === "medication" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("💊", "用藥")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.medicationNameInputAccessibility}
                    value={previewEditFields.medicationName}
                    onChangeText={updatePreviewEditMedicationName}
                    maxLength={recordEditFieldMaxLength("medicationName")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="藥名或胰島素描述"
                  />
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("▣", "劑量")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.medicationDoseInputAccessibility}
                    value={previewEditFields.medicationDose}
                    onChangeText={updatePreviewEditMedicationDose}
                    maxLength={recordEditFieldMaxLength("medicationDose")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="例如：1 顆、8u"
                  />
                </View>
              </>
            ) : null}
            {selectedPreviewRecord.record_type === "note" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("📝", "備註類型")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.noteKindInputAccessibility}
                    value={previewEditFields.noteKind}
                    onChangeText={updatePreviewEditNoteKind}
                    maxLength={recordEditFieldMaxLength("noteKind")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="symptom"
                  />
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("#", "標籤")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.noteTagsInputAccessibility}
                    value={previewEditFields.noteTags}
                    onChangeText={updatePreviewEditNoteTags}
                    maxLength={recordEditFieldMaxLength("noteTags")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                    textAlignVertical="top"
                    style={[styles.input, styles.multilineField]}
                    placeholder="頭暈、疲倦"
                  />
                </View>
              </>
            ) : null}
            {!["glucose", "meal", "exercise", "medication", "note"].includes(
              selectedPreviewRecord.record_type
            ) ? (
              <>
                {renderFieldLabel("{}", "payload_json")}
                <TextInput
                  accessibilityLabel={auxiliaryDisplayLabels.fallbackJsonInputAccessibility}
                  value={previewEditFields.fallbackJson}
                  onChangeText={updatePreviewEditFallbackJson}
                  maxLength={recordEditFieldMaxLength("fallbackJson")}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                  textAlignVertical="top"
                  style={[styles.input, styles.jsonInput]}
                />
              </>
            ) : null}
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.previewEditReturnAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromPreviewRecordEdit}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.cancel}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.previewEditApplyAccessibility}
                accessibilityRole="button"
                accessibilityState={{ disabled: Boolean(previewRecordEditValidationError) }}
                style={[
                  styles.primaryButton,
                  previewRecordEditValidationError ? styles.buttonDisabled : null
                ]}
                disabled={Boolean(previewRecordEditValidationError)}
                onPress={savePreviewRecordEdit}
              >
                <Text style={styles.primaryButtonText}>{coreFlowDisplayLabels.applyChanges}</Text>
              </Pressable>
            </View>
            {previewRecordEditValidationError ? (
              <Text style={styles.warningText}>{previewRecordEditValidationDisplayText}</Text>
            ) : null}
          </View>
        ) : null}

        {currentScreen === "saveSuccess" ? (
          <View style={styles.pageSection}>
            <View style={styles.successHero}>
              <View style={styles.successIconCircle}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.sectionTitle}>
                {hasPartialAiSave
                  ? "部分儲存完成"
                  : lastSaveEntryMethod === "manual"
                    ? "手動儲存完成"
                    : "儲存完成"}
              </Text>
              <Text style={styles.evidence}>
                {lastSavedSummaryDisplayText}
              </Text>
            </View>
            {saveSuccessNewlyUnlockedDisplayItems.length > 0 ? (
              <View style={styles.openSection}>
                <Text style={styles.label}>新解鎖成就</Text>
                {saveSuccessNewlyUnlockedDisplayItems.map((displayItem) => (
                  <View key={`save-success-new-unlock-${displayItem.id}`} style={styles.timelineCard}>
                    <View
                      style={[
                        styles.achievementBadge,
                        displayItem.kind === "streak" ? styles.achievementBadgeStreak : null,
                        { backgroundColor: displayItem.badgeColor }
                      ]}
                    >
                      <Text style={styles.achievementBadgeIcon}>{displayItem.icon}</Text>
                      <Text style={styles.achievementBadgeLevel}>{displayItem.level}</Text>
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.recordContent}>{displayItem.title}</Text>
                      <Text style={styles.evidence}>
                        {displayItem.kindLabel} · {achievementUnlockDisplayDate(displayItem.unlockedAt)}
                      </Text>
                    </View>
                    <Text style={styles.previewModeBadge}>新解鎖</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.saveResult}</Text>
              <Text style={styles.evidence}>
              {lastSaveEntryMethod === "manual"
                  ? hasManualFallbackWithAiCandidates
                    ? `這筆資料由手動表單直接建立，沒有呼叫 parser 或 LLM；仍有 ${unsavedPreviewRecordDisplayCount} 筆 AI 候選保留在確認流程。`
                    : "這筆資料由手動表單直接建立，沒有呼叫 parser 或 LLM；你可以回到今日紀錄查看，也可以繼續新增下一筆。"
                  : hasUnsavedPreviewRecords
                    ? `已有部分紀錄儲存成功，仍有 ${unsavedPreviewRecordDisplayCount} 筆候選紀錄尚未儲存；不會自動重試或再次呼叫 AI。`
                    : "你可以回到今日紀錄查看，也可以繼續新增下一筆。AI 原始文字只用於確認流程；儲存後已清空目前輸入。"}
              </Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.postSaveBoundary}</Text>
              {saveSuccessBoundaryChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.postSaveGrid}>
              {saveSuccessDestinationItems.map((item) => (
                <Pressable
                  key={`${item.target}-${item.label}`}
                  accessibilityLabel={item.accessibilityLabel}
                  accessibilityRole="button"
                  style={styles.postSaveCard}
                  onPress={() => pressSaveSuccessDestinationCard(item)}
                >
                  <View style={styles.historyItemTitle}>
                    <View style={styles.iconCircleSmall}>
                      <Text>{item.icon}</Text>
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.recordType}>{item.label}</Text>
                      <Text style={styles.evidence}>{item.helper}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
            <View style={styles.actionRow}>
              {lastSaveEntryMethod === "manual" && !hasUnsavedPreviewRecords ? (
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.saveSuccessManualContinueAccessibility}
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  onPress={openSaveSuccessManualContinue}
                >
                  <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.continueManualAdd}</Text>
                </Pressable>
              ) : !hasUnsavedPreviewRecords ? (
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.saveSuccessRecordEntryAccessibility}
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  onPress={openSaveSuccessRecordEntry}
                >
                  <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.continueRecord}</Text>
                </Pressable>
              ) : null}
              {lastSaveEntryMethod === "manual" && !hasUnsavedPreviewRecords ? (
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.saveSuccessRecordEntryAccessibility}
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  onPress={openSaveSuccessRecordEntry}
                >
                  <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.voiceText}</Text>
                </Pressable>
              ) : hasUnsavedPreviewRecords ? (
                <Text style={styles.evidence}>請先處理未儲存 AI 候選；新增入口會在候選處理後恢復。</Text>
              ) : null}
              {selectedRecord ? (
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.saveSuccessDetailAccessibility}
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  onPress={openSaveSuccessRecordDetail}
                >
                  <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.viewDetail}</Text>
                </Pressable>
              ) : null}
              {hasUnsavedPreviewRecords ? (
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.saveSuccessProcessUnsavedAccessibility}
                  accessibilityRole="button"
                  style={styles.primaryButton}
                  onPress={processUnsavedPreviewRecords}
                >
                  <Text style={styles.primaryButtonText}>{coreFlowDisplayLabels.processUnsavedCandidates}</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.saveSuccessReturnTodayAccessibility}
                  accessibilityRole="button"
                  style={styles.primaryButton}
                  onPress={returnFromSaveSuccessToToday}
                >
                  <Text style={styles.primaryButtonText}>{coreFlowDisplayLabels.backToday}</Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : null}

        {currentScreen === "deleteSuccess" ? (
          <View style={styles.pageSection}>
            <View style={styles.successHero}>
              <View style={styles.dangerIconCircle}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.sectionTitle}>刪除完成</Text>
              <Text style={styles.evidence}>
                {lastDeletedSummary || "紀錄已從目前清單移除。"}
              </Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.deleteResult}</Text>
              <Text style={styles.evidence}>
                若其他裝置或 backend 狀態需要確認，請回到設定重新連線或稍後同步；目前不會保留本機 undo 副本。
              </Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.postDeleteBoundary}</Text>
              {deleteSuccessBoundaryChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.postSaveGrid}>
              {deleteSuccessDestinationItems.map((item) => (
                <Pressable
                  key={`${item.target}-${item.label}`}
                  accessibilityLabel={item.accessibilityLabel}
                  accessibilityRole="button"
                  style={styles.postSaveCard}
                  onPress={() => pressDeleteSuccessDestinationCard(item)}
                >
                  <View style={styles.historyItemTitle}>
                    <View style={styles.iconCircleSmall}>
                      <Text>{item.icon}</Text>
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.recordType}>{item.label}</Text>
                      <Text style={styles.evidence}>{item.helper}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.deleteSuccessHistoryAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={openDeleteSuccessHistoryDestination}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.viewHistory}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.recordResultReturnAccessibility}
                accessibilityRole="button"
                style={styles.primaryButton}
                onPress={returnFromDeleteSuccess}
              >
                <Text style={styles.primaryButtonText}>
                  {recordDetailReturnScreen === "history" ? "回歷史紀錄" : "回今日紀錄"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {currentScreen === "updateSuccess" ? (
          <View style={styles.pageSection}>
            <View style={styles.successHero}>
              <View style={styles.successIconCircle}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.sectionTitle}>更新完成</Text>
              <Text style={styles.evidence}>
                {lastUpdatedSummary || "紀錄已更新。"}
              </Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.updateResult}</Text>
              <Text style={styles.evidence}>
                已更新目前本機清單中的紀錄；若需要確認其他裝置狀態，可稍後重新同步。
              </Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.postUpdateBoundary}</Text>
              {updateSuccessBoundaryChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.postSaveGrid}>
              {updateSuccessDestinationItems.map((item) => (
                  <Pressable
                    key={`${item.target}-${item.label}`}
                    accessibilityLabel={item.accessibilityLabel}
                    accessibilityRole="button"
                    style={styles.postSaveCard}
                    onPress={() => pressUpdateSuccessDestinationCard(item)}
                  >
                    <View style={styles.historyItemTitle}>
                      <View style={styles.iconCircleSmall}>
                        <Text>{item.icon}</Text>
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.recordType}>{item.label}</Text>
                        <Text style={styles.evidence}>{item.helper}</Text>
                      </View>
                    </View>
                  </Pressable>
              ))}
            </View>
            <View style={styles.actionRow}>
              {selectedRecord ? (
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.updatedRecordDetailAccessibility}
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  onPress={openUpdatedRecordDetail}
                >
                  <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.viewDetail}</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.recordResultReturnAccessibility}
                accessibilityRole="button"
                style={styles.primaryButton}
                onPress={returnFromUpdateSuccess}
              >
                <Text style={styles.primaryButtonText}>
                  {recordDetailReturnScreen === "history" ? "回歷史紀錄" : "回今日紀錄"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {currentScreen === "manualRecord" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>手動新增紀錄</Text>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.manualReturnAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromManualRecord}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.back}</Text>
              </Pressable>
            </View>
            <Text style={styles.evidence}>
              不經 AI parser，直接建立結構化紀錄；可節省 LLM token，仍走後端驗證與權限檢查。
            </Text>
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeField}>
                {renderFieldLabel("📅", "日期")}
                <TextInput
                  accessibilityLabel={auxiliaryDisplayLabels.dateInputAccessibility}
                  value={manualRecordDate}
                  onChangeText={updateManualRecordDateInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={maxDateInputLength}
                  style={styles.input}
                  placeholder="2026-04-29"
                />
              </View>
              <View style={styles.dateTimeField}>
                {renderFieldLabel("🕒", "時間")}
                <TextInput
                  accessibilityLabel={auxiliaryDisplayLabels.timeInputAccessibility}
                  value={manualRecordTime}
                  onChangeText={updateManualRecordTimeInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={maxTimeInputLength}
                  style={styles.input}
                  placeholder="08:10"
                />
              </View>
            </View>
            <View style={styles.segmentRow}>
              {manualRecordTypeDisplayOptions.map((type) => (
                <Pressable
                  key={type.value}
                  accessibilityLabel={type.accessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={{ selected: manualRecordType === type.value }}
                  style={[
                    styles.segmentPill,
                    manualRecordType === type.value ? styles.segmentActive : null
                  ]}
                  onPress={() => pressManualRecordTypeOption(type)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      manualRecordType === type.value ? styles.segmentTextActive : null
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {manualRecordType === "glucose" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("💧", "血糖數值")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.glucoseValueInputAccessibility}
                    value={manualRecordFields.glucoseValue}
                    onChangeText={updateManualRecordGlucoseValue}
                    keyboardType="numeric"
                    maxLength={recordEditFieldMaxLength("glucoseValue")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="138"
                  />
                </View>
                <View style={styles.segmentRow}>
                  {glucoseUnitDisplayOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      accessibilityLabel={option.accessibilityLabel}
                      accessibilityRole="button"
                      accessibilityState={{ selected: manualRecordFields.glucoseUnit === option.value }}
                      style={[
                        styles.segmentPill,
                        manualRecordFields.glucoseUnit === option.value ? styles.segmentActive : null
                      ]}
                      onPress={() => pressManualRecordGlucoseUnitOption(option)}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          manualRecordFields.glucoseUnit === option.value ? styles.segmentTextActive : null
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("◌", "情境")}
                  <View style={styles.segmentRow}>
                    {glucoseTimingDisplayOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        accessibilityLabel={option.accessibilityLabel}
                        accessibilityRole="button"
                        accessibilityState={{ selected: manualRecordFields.glucoseTiming === option.value }}
                        style={[
                          styles.segmentPill,
                          manualRecordFields.glucoseTiming === option.value ? styles.segmentActive : null
                        ]}
                        onPress={() => pressManualRecordGlucoseTimingOption(option)}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            manualRecordFields.glucoseTiming === option.value ? styles.segmentTextActive : null
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            ) : null}

            {manualRecordType === "meal" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("🥣", "餐別")}
                  <View style={styles.segmentRow}>
                    {mealTypeDisplayOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        accessibilityLabel={option.accessibilityLabel}
                        accessibilityRole="button"
                        accessibilityState={{ selected: manualRecordFields.mealType === option.value }}
                        style={[
                          styles.segmentPill,
                          manualRecordFields.mealType === option.value ? styles.segmentActive : null
                        ]}
                        onPress={() => pressManualRecordMealTypeOption(option)}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            manualRecordFields.mealType === option.value ? styles.segmentTextActive : null
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("🍽", "飲食內容")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.foodItemsInputAccessibility}
                    value={manualRecordFields.foodItems}
                    onChangeText={updateManualRecordFoodItems}
                    maxLength={recordEditFieldMaxLength("foodItems")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                    textAlignVertical="top"
                    style={[styles.input, styles.multilineField]}
                    placeholder="水煮蛋、熱狗"
                  />
                </View>
              </>
            ) : null}

            {manualRecordType === "exercise" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("🚶", "運動")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.exerciseActivityInputAccessibility}
                    value={manualRecordFields.exerciseActivity}
                    onChangeText={updateManualRecordExerciseActivity}
                    maxLength={recordEditFieldMaxLength("exerciseActivity")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="走路"
                  />
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("⏱", "時長（分鐘）")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.exerciseMinutesInputAccessibility}
                    value={manualRecordFields.exerciseMinutes}
                    onChangeText={updateManualRecordExerciseMinutes}
                    keyboardType="numeric"
                    maxLength={recordEditFieldMaxLength("exerciseMinutes")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="20"
                  />
                </View>
              </>
            ) : null}

            {manualRecordType === "medication" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("💊", "用藥")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.medicationNameInputAccessibility}
                    value={manualRecordFields.medicationName}
                    onChangeText={updateManualRecordMedicationName}
                    maxLength={recordEditFieldMaxLength("medicationName")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="藥名或胰島素描述"
                  />
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("▣", "劑量")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.medicationDoseInputAccessibility}
                    value={manualRecordFields.medicationDose}
                    onChangeText={updateManualRecordMedicationDose}
                    maxLength={recordEditFieldMaxLength("medicationDose")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="例如：1 顆、8u"
                  />
                </View>
              </>
            ) : null}

            {manualRecordType === "note" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("📝", "備註類型")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.noteKindInputAccessibility}
                    value={manualRecordFields.noteKind}
                    onChangeText={updateManualRecordNoteKind}
                    maxLength={recordEditFieldMaxLength("noteKind")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="symptom"
                  />
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("#", "標籤")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.noteTagsInputAccessibility}
                    value={manualRecordFields.noteTags}
                    onChangeText={updateManualRecordNoteTags}
                    maxLength={recordEditFieldMaxLength("noteTags")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                    textAlignVertical="top"
                    style={[styles.input, styles.multilineField]}
                    placeholder="頭暈、疲倦"
                  />
                </View>
              </>
            ) : null}

            <Pressable
              accessibilityLabel={coreFlowDisplayLabels.manualCreatePreviewAccessibility}
              accessibilityRole="button"
              accessibilityState={{
                disabled: Boolean(manualRecordValidationError) || isBusy || !protectedBackendReady
              }}
              style={[
                styles.primaryButtonFull,
                manualRecordValidationError || isBusy || !protectedBackendReady ? styles.buttonDisabled : null
              ]}
              disabled={Boolean(manualRecordValidationError) || isBusy || !protectedBackendReady}
              onPress={enterManualRecordConfirm}
            >
              <Text style={styles.primaryButtonText}>{coreFlowDisplayLabels.createRecord}</Text>
            </Pressable>
            {manualRecordValidationError ? (
              <Text style={styles.warningText}>{manualRecordValidationDisplayText}</Text>
            ) : protectedBackendUnavailableMessage ? (
              <Text style={styles.warningText}>{manualRecordBackendUnavailableDisplayText}</Text>
            ) : null}
          </View>
        ) : null}

        {currentScreen === "manualRecordConfirm" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>確認手動紀錄</Text>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.manualConfirmReturnAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromManualRecordConfirm}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.returnEdit}</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{auxiliaryDisplayLabels.preSaveConfirmBadge}</Text>
              <Text style={styles.evidence}>{manualRecordConfirmIntroDisplayText}</Text>
            </View>
            <View style={styles.emptyStateCard}>
              <View style={styles.iconCircleSmall}>
                <Text>{manualRecordConfirmDisplay.icon}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.recordType}>{manualRecordConfirmDisplay.typeLabel}</Text>
                <Text style={styles.recordContent}>{manualRecordConfirmDisplay.payloadSummary}</Text>
                <Text style={styles.evidence}>{manualRecordConfirmDisplay.sourceLine}</Text>
              </View>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.preSubmitCheck}</Text>
              {manualSubmitChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.manualConfirmReturnAccessibility}
                accessibilityRole="button"
                accessibilityState={{ disabled: isBusy }}
                style={[styles.secondaryButton, isBusy ? styles.buttonDisabled : null]}
                disabled={isBusy}
                onPress={returnFromManualRecordConfirm}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.returnEdit}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.manualCreateSubmitAccessibility}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: Boolean(manualRecordValidationError) || isBusy || !protectedBackendReady
                }}
                style={[
                  styles.primaryButton,
                  manualRecordValidationError || isBusy || !protectedBackendReady ? styles.buttonDisabled : null
                ]}
                disabled={Boolean(manualRecordValidationError) || isBusy || !protectedBackendReady}
                onPress={submitManualRecordCreate}
              >
                <Text style={styles.primaryButtonText}>{manualRecordConfirmSubmitDisplayLabel}</Text>
              </Pressable>
            </View>
            {manualRecordValidationError ? (
              <Text style={styles.warningText}>{manualRecordValidationDisplayText}</Text>
            ) : protectedBackendUnavailableMessage ? (
              <Text style={styles.warningText}>{manualRecordBackendUnavailableDisplayText}</Text>
            ) : null}
          </View>
        ) : null}

        {currentScreen === "history" ? (
          <View style={styles.pageSection}>
            <Text style={styles.sectionTitle}>歷史紀錄</Text>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.recordSyncStatus}</Text>
              <Text style={styles.evidence}>{recordsStatusDisplayText}</Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.historyDataBoundary}</Text>
              {historyBoundaryChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.historyCalendarHeader}>
              <View>
                <Text style={styles.recordContent}>{historyCalendarTitle}</Text>
                <Text style={styles.confidence}>亮燈日期有紀錄</Text>
              </View>
              <View style={styles.historyMonthActionRow}>
                <Pressable
                  accessibilityLabel={historyPreviousMonthAccessibilityLabel}
                  accessibilityRole="button"
                  style={styles.historyMonthButton}
                  onPress={openPreviousHistoryMonth}
                >
                  <Text style={styles.secondaryButtonText}>{historyPreviousMonthButtonLabel}</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={historyNextMonthAccessibilityLabel}
                  accessibilityRole="button"
                  style={styles.historyMonthButton}
                  onPress={openNextHistoryMonth}
                >
                  <Text style={styles.secondaryButtonText}>{historyNextMonthButtonLabel}</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.historyCalendarGrid}>
              {historyCalendarDisplayItems.map((item) => (
                <Pressable
                  key={item.key}
                  accessibilityLabel={item.accessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item.isSelected }}
                  style={[
                    styles.historyCalendarDay,
                    item.hasRecords ? styles.historyCalendarDayHasRecords : styles.historyCalendarDayMuted,
                    item.isSelected ? styles.historyCalendarDaySelected : null
                  ]}
                  onPress={() => pressHistoryCalendarDay(item)}
                >
                  <Text
                    style={[
                      styles.historyCalendarDayText,
                      item.hasRecords ? styles.historyCalendarDayTextActive : null,
                      item.isSelected ? styles.historyCalendarDayTextSelected : null
                    ]}
                  >
                    {item.dayLabel}
                  </Text>
                  {item.hasRecords ? <View style={styles.historyCalendarDot} /> : null}
                </Pressable>
              ))}
            </View>
            {recordsForDisplay.length === 0 ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{coreFlowDisplayLabels.historyDataStatus}</Text>
                <Text style={styles.evidence}>{historyNoRealRecordHealthValueDisplayText}</Text>
              </View>
            ) : null}
            {recordsForDisplay.length >= mobileRecordSyncLimit ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{coreFlowDisplayLabels.historySyncBoundary}</Text>
                <Text style={styles.evidence}>{historySyncBoundaryDisplayText}</Text>
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.historyLoadMoreAccessibility}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canLoadMoreRecords }}
                  style={[styles.secondaryButton, !canLoadMoreRecords ? styles.buttonDisabled : null]}
                  disabled={!canLoadMoreRecords}
                  onPress={loadMoreRecords}
                >
                  <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.historyLoadMore}</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.historySelectedDatePanel}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.label}>{selectedHistoryDateDisplayText}</Text>
                  <Text style={styles.evidence}>{selectedHistoryRecordDisplayCount} 筆紀錄</Text>
                </View>
              </View>
              <View style={styles.segmentRow}>
                {historyDetailModeDisplayOptions.map((item) => (
                  <Pressable
                    key={item.value}
                    accessibilityLabel={item.accessibilityLabel}
                    accessibilityRole="button"
                    accessibilityState={{ selected: historyDetailMode === item.value }}
                    style={[
                      styles.segmentPill,
                      historyDetailMode === item.value ? styles.segmentActive : null
                    ]}
                    onPress={() => pressHistoryDetailModeOption(item)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        historyDetailMode === item.value ? styles.segmentTextActive : null
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {selectedHistoryRecordDisplayCount === 0 ? (
                <View style={styles.emptyStateCard}>
                  <View style={styles.iconCircle}>
                    <Text>📅</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.recordContent}>{historyNoRangeRecordsTitleDisplayText}</Text>
                    <Text style={styles.evidence}>{historyNoRangeRecordsBodyDisplayText}</Text>
                  </View>
                </View>
              ) : historyDetailMode === "structured" ? (
                selectedHistoryRecordDisplayItems.map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityLabel={item.accessibilityLabel}
                    accessibilityRole="button"
                    style={styles.historyItemButton}
                    onPress={() => pressHistoryRecordDetailCard(item)}
                  >
                    <View style={styles.historyItemHeader}>
                      <View style={styles.historyItemTitle}>
                        <View style={styles.iconCircleSmall}>
                          <Text>{item.icon}</Text>
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={styles.historyItemText}>{item.typeLabel}</Text>
                          <Text style={styles.recordContent}>{item.payloadSummary}</Text>
                        </View>
                      </View>
                      <Text style={styles.confidence}>{item.timeLabel}</Text>
                    </View>
                  </Pressable>
                ))
              ) : (
                selectedHistoryRawDisplayItems.map((item) => (
                  <View key={item.key} style={styles.historyRawCard}>
                    <View style={styles.historyItemHeader}>
                      <Text style={styles.recordType}>{item.typeLabel}</Text>
                      <View style={styles.timelineContent}>
                        <Text style={styles.confidence}>{item.timeLabel}</Text>
                        <Text style={styles.previewModeBadge}>{item.sourceStatusLabel}</Text>
                      </View>
                    </View>
                    <Text style={styles.evidence}>{item.rawText}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : null}

        {currentScreen === "recordDetail" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>記錄詳情</Text>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.recordDetailReturnAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromRecordDetail}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.back}</Text>
              </Pressable>
            </View>
            <View style={styles.detailHero}>
              <Text style={styles.confidence}>
                {selectedRecordDisplayItem?.dateTimeLabel ?? "尚未選擇紀錄"}
              </Text>
              <Text style={styles.detailValue}>
                {selectedRecordDisplayItem?.payloadSummary ?? "沒有資料"}
              </Text>
              <Text style={styles.evidence}>
                {selectedRecordDisplayItem?.typeLabel ?? "請從今日或歷史紀錄選擇一筆真實紀錄。"}
              </Text>
            </View>
            <View style={styles.detailRows}>
              <Text style={styles.label}>{coreFlowDisplayLabels.mainInfo}</Text>
              <View style={styles.detailRow}>
                {renderFieldLabel("📅", "日期")}
                <Text style={styles.recordContent}>{selectedRecordDisplayItem?.dateLabel ?? "尚無"}</Text>
              </View>
              <View style={styles.detailRow}>
                {renderFieldLabel("🕒", "時間")}
                <Text style={styles.recordContent}>{selectedRecordDisplayItem?.timeLabel ?? "尚無"}</Text>
              </View>
              <View style={styles.detailRow}>
                {renderFieldLabel("🏷", "類型")}
                <Text style={styles.recordContent}>{selectedRecordDisplayItem?.typeLabel ?? "尚無"}</Text>
              </View>
              {selectedRecordDetailRows.map((row) => (
                <View key={row.label} style={styles.detailRow}>
                  <Text style={styles.label}>{row.label}</Text>
                  <Text style={styles.recordContent}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.detailRows}>
              <Text style={styles.label}>{coreFlowDisplayLabels.supplementalInfo}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.label}>{coreFlowDisplayLabels.source}</Text>
                <Text style={styles.recordContent}>{selectedRecordDisplayItem?.sourceLabel ?? "尚無"}</Text>
              </View>
              <View style={styles.detailRow}>
                {renderFieldLabel("🚶", "運動")}
                <Text style={styles.recordContent}>{selectedRecordDisplayItem?.exerciseSummary ?? "無"}</Text>
              </View>
              <View style={styles.detailRow}>
                {renderFieldLabel("💊", "用藥")}
                <Text style={styles.recordContent}>{selectedRecordDisplayItem?.medicationSummary ?? "無"}</Text>
              </View>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.detailBoundary}</Text>
              {recordDetailBoundaryChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            {selectedRecord ? (
              <View style={styles.actionRow}>
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.recordEditOpenAccessibility}
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  onPress={openRecordEdit}
                >
                  <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.edit}</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.recordDeleteOpenAccessibility}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isBusy }}
                  style={[styles.dangerButton, isBusy ? styles.buttonDisabled : null]}
                  disabled={isBusy}
                  onPress={openDeleteConfirm}
                >
                  <Text style={styles.dangerButtonText}>刪除</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.evidence}>請從今日或歷史頁選擇真實紀錄；未選擇時不可編輯或刪除。</Text>
            )}
          </View>
        ) : null}

        {currentScreen === "deleteConfirm" && selectedRecord && selectedRecordDisplayItem ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>刪除確認</Text>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.recordDeleteReturnAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromDeleteConfirm}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.back}</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{auxiliaryDisplayLabels.dangerOperation}</Text>
              <Text style={styles.evidence}>{deleteConfirmIntroDisplayText}</Text>
            </View>
            <View style={styles.emptyStateCard}>
              <View style={styles.dangerIconCircle}>
                <Text style={styles.successIconText}>!</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.recordType}>{selectedRecordDisplayItem.typeLabel}</Text>
                <Text style={styles.recordContent}>{selectedRecordDisplayItem.payloadSummary}</Text>
                <Text style={styles.evidence}>{deleteConfirmRecordMetaDisplayText}</Text>
              </View>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.deletePreConfirm}</Text>
              {deleteConfirmChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.recordDeleteCancelAccessibility}
                accessibilityRole="button"
                accessibilityState={{ disabled: isBusy }}
                style={[styles.secondaryButton, isBusy ? styles.buttonDisabled : null]}
                disabled={isBusy}
                onPress={returnFromDeleteConfirm}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.cancel}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.recordDeleteSubmitAccessibility}
                accessibilityRole="button"
                accessibilityState={{ disabled: isBusy }}
                style={[styles.dangerButton, isBusy ? styles.buttonDisabled : null]}
                disabled={isBusy}
                onPress={submitRecordDelete}
              >
                <Text style={styles.dangerButtonText}>{deleteConfirmSubmitDisplayLabel}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {currentScreen === "editRecord" && selectedRecord ? (
          <View style={styles.pageSection}>
            <Text style={styles.sectionTitle}>編輯記錄</Text>
            <Text style={styles.evidence}>{recordEditIntroDisplayText}</Text>
            <View style={styles.detailRows}>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeField}>
                  {renderFieldLabel("📅", "日期")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.dateInputAccessibility}
                    value={recordEditDate}
                    onChangeText={updateRecordEditDateInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={maxDateInputLength}
                    style={styles.input}
                    placeholder="2026-04-29"
                  />
                </View>
                <View style={styles.dateTimeField}>
                  {renderFieldLabel("🕒", "時間")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.timeInputAccessibility}
                    value={recordEditTime}
                    onChangeText={updateRecordEditTimeInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={maxTimeInputLength}
                    style={styles.input}
                    placeholder="08:10"
                  />
                </View>
              </View>
              <View style={styles.detailRow}>
                {renderFieldLabel("🏷", "類型")}
                <Text style={styles.recordContent}>{selectedRecordDisplayItem?.typeLabel ?? "紀錄"}</Text>
              </View>
            </View>
            {selectedRecord.record_type === "glucose" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("💧", "血糖數值")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.glucoseValueInputAccessibility}
                    value={recordEditFields.glucoseValue}
                    onChangeText={updateRecordEditGlucoseValue}
                    keyboardType="numeric"
                    maxLength={recordEditFieldMaxLength("glucoseValue")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="138"
                  />
                </View>
                <View style={styles.segmentRow}>
                  {glucoseUnitDisplayOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      accessibilityLabel={option.accessibilityLabel}
                      accessibilityRole="button"
                      accessibilityState={{ selected: recordEditFields.glucoseUnit === option.value }}
                      style={[
                        styles.segmentPill,
                        recordEditFields.glucoseUnit === option.value ? styles.segmentActive : null
                      ]}
                      onPress={() => pressRecordEditGlucoseUnitOption(option)}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          recordEditFields.glucoseUnit === option.value ? styles.segmentTextActive : null
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("◌", "情境")}
                  <View style={styles.segmentRow}>
                    {glucoseTimingDisplayOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        accessibilityLabel={option.accessibilityLabel}
                        accessibilityRole="button"
                        accessibilityState={{ selected: recordEditFields.glucoseTiming === option.value }}
                        style={[
                          styles.segmentPill,
                          recordEditFields.glucoseTiming === option.value ? styles.segmentActive : null
                        ]}
                        onPress={() => pressRecordEditGlucoseTimingOption(option)}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            recordEditFields.glucoseTiming === option.value ? styles.segmentTextActive : null
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            ) : null}

            {selectedRecord.record_type === "meal" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("🥣", "餐別")}
                  <View style={styles.segmentRow}>
                    {mealTypeDisplayOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        accessibilityLabel={option.accessibilityLabel}
                        accessibilityRole="button"
                        accessibilityState={{ selected: recordEditFields.mealType === option.value }}
                        style={[
                          styles.segmentPill,
                          recordEditFields.mealType === option.value ? styles.segmentActive : null
                        ]}
                        onPress={() => pressRecordEditMealTypeOption(option)}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            recordEditFields.mealType === option.value ? styles.segmentTextActive : null
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("🍽", "飲食內容")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.foodItemsInputAccessibility}
                    value={recordEditFields.foodItems}
                    onChangeText={updateRecordEditFoodItems}
                    maxLength={recordEditFieldMaxLength("foodItems")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                    textAlignVertical="top"
                    style={[styles.input, styles.multilineField]}
                    placeholder="水煮蛋、熱狗"
                  />
                </View>
              </>
            ) : null}

            {selectedRecord.record_type === "exercise" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("🚶", "運動")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.exerciseActivityInputAccessibility}
                    value={recordEditFields.exerciseActivity}
                    onChangeText={updateRecordEditExerciseActivity}
                    maxLength={recordEditFieldMaxLength("exerciseActivity")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="走路"
                  />
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("⏱", "時長（分鐘）")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.exerciseMinutesInputAccessibility}
                    value={recordEditFields.exerciseMinutes}
                    onChangeText={updateRecordEditExerciseMinutes}
                    keyboardType="numeric"
                    maxLength={recordEditFieldMaxLength("exerciseMinutes")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="20"
                  />
                </View>
              </>
            ) : null}

            {selectedRecord.record_type === "medication" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("💊", "用藥")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.medicationNameInputAccessibility}
                    value={recordEditFields.medicationName}
                    onChangeText={updateRecordEditMedicationName}
                    maxLength={recordEditFieldMaxLength("medicationName")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="藥名或胰島素描述"
                  />
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("▣", "劑量")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.medicationDoseInputAccessibility}
                    value={recordEditFields.medicationDose}
                    onChangeText={updateRecordEditMedicationDose}
                    maxLength={recordEditFieldMaxLength("medicationDose")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="例如：1 顆、8u"
                  />
                </View>
              </>
            ) : null}

            {selectedRecord.record_type === "note" ? (
              <>
                <View style={styles.formField}>
                  {renderFieldLabel("📝", "備註類型")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.noteKindInputAccessibility}
                    value={recordEditFields.noteKind}
                    onChangeText={updateRecordEditNoteKind}
                    maxLength={recordEditFieldMaxLength("noteKind")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="symptom"
                  />
                </View>
                <View style={styles.formField}>
                  {renderFieldLabel("#", "標籤")}
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.noteTagsInputAccessibility}
                    value={recordEditFields.noteTags}
                    onChangeText={updateRecordEditNoteTags}
                    maxLength={recordEditFieldMaxLength("noteTags")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                    textAlignVertical="top"
                    style={[styles.input, styles.multilineField]}
                    placeholder="頭暈、疲倦"
                  />
                </View>
              </>
            ) : null}

            {!["glucose", "meal", "exercise", "medication", "note"].includes(
              selectedRecord.record_type
            ) ? (
              <>
                {renderFieldLabel("{}", "payload_json")}
                <TextInput
                  accessibilityLabel={auxiliaryDisplayLabels.fallbackJsonInputAccessibility}
                  value={recordEditFields.fallbackJson}
                  onChangeText={updateRecordEditFallbackJson}
                  maxLength={recordEditFieldMaxLength("fallbackJson")}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                  textAlignVertical="top"
                  style={[styles.input, styles.jsonInput]}
                />
              </>
            ) : null}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.updatePreCheck}</Text>
              {recordUpdateChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.recordEditReturnAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromRecordEdit}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.cancel}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.recordUpdateSubmitAccessibility}
                accessibilityRole="button"
                accessibilityState={{ disabled: Boolean(selectedRecordEditValidationError) || isBusy }}
                style={[
                  styles.primaryButton,
                  selectedRecordEditValidationError || isBusy ? styles.buttonDisabled : null
                ]}
                disabled={Boolean(selectedRecordEditValidationError) || isBusy}
                onPress={submitRecordUpdate}
              >
                <Text style={styles.primaryButtonText}>{coreFlowDisplayLabels.saveChanges}</Text>
              </Pressable>
            </View>
            {selectedRecordEditValidationError ? (
              <Text style={styles.warningText}>{selectedRecordEditValidationDisplayText}</Text>
            ) : null}
          </View>
        ) : null}

        {currentScreen === "analysis" ? (
          <View style={styles.pageSection}>
            <Text style={styles.sectionTitle}>基本分析</Text>
            <Text style={styles.evidence}>{analysisSafetyIntroDisplayText}</Text>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.recordSyncStatus}</Text>
              <Text style={styles.evidence}>{recordsStatusDisplayText}</Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.analysisReportStatus}</Text>
              <Text style={styles.evidence}>{reportStatusDisplayText}</Text>
            </View>
            <View style={styles.segmentRow}>
              {analysisRangeDisplayOptions.map((item) => (
                <Pressable
                  key={item.value}
                  accessibilityLabel={item.accessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={{ selected: analysisRange === item.value }}
                  style={[
                    styles.segmentPill,
                    analysisRange === item.value ? styles.segmentActive : null
                  ]}
                  onPress={() => pressAnalysisRangeOption(item)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      analysisRange === item.value ? styles.segmentTextActive : null
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {analysisRange === "custom" ? (
              <>
                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeField}>
                    {renderFieldLabel("📅", "開始日期")}
                    <TextInput
                      accessibilityLabel={auxiliaryDisplayLabels.analysisStartDateInputAccessibility}
                      value={analysisCustomStart}
                      onChangeText={updateAnalysisCustomStartInput}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={maxDateInputLength}
                      style={styles.input}
                      placeholder="2026-04-01"
                    />
                  </View>
                  <View style={styles.dateTimeField}>
                    {renderFieldLabel("📅", "結束日期")}
                    <TextInput
                      accessibilityLabel={auxiliaryDisplayLabels.analysisEndDateInputAccessibility}
                      value={analysisCustomEnd}
                      onChangeText={updateAnalysisCustomEndInput}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={maxDateInputLength}
                      style={styles.input}
                      placeholder="2026-04-30"
                    />
                  </View>
                </View>
                <Text style={styles.evidence}>{analysisCustomRangeStatusDisplayText}</Text>
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.analysisApplyCustomRangeAccessibility}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isReportLoading }}
                  style={[styles.secondaryButton, isReportLoading ? styles.buttonDisabled : null]}
                  disabled={isReportLoading}
                  onPress={applyAnalysisCustomRange}
                >
                  <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.analysisApplyCustomRange}</Text>
                </Pressable>
              </>
            ) : null}
            {analysisPreviewMode ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.previewModeBadge}>{analysisNoDataStatusDisplayLabel}</Text>
                <Text style={styles.evidence}>{analysisNoDataDisplayCopy}</Text>
              </View>
            ) : null}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View>
                  <Text style={styles.label}>血糖趨勢（{analysisRangeDisplayLabel}）</Text>
                  <Text style={styles.evidence}>單位：mg/dL · 僅使用已載入紀錄</Text>
                </View>
                {selectedAnalysisPoint ? (
                  <View style={styles.chartTooltip}>
                    <Text style={styles.chartTooltipValue}>{selectedAnalysisPoint.value}</Text>
                    <Text style={styles.chartTooltipLabel}>{selectedAnalysisPoint.label}</Text>
                  </View>
                ) : null}
              </View>
              {analysisChartPoints.length > 0 ? (
                <>
                  <View style={styles.lineChartCanvas}>
                    <View style={styles.chartGridLineTop} />
                    <View style={styles.chartGridLineMiddle} />
                    <View style={styles.chartGridLineBottom} />
                    <View style={styles.lineChartRow}>
                      {analysisChartPoints.map((point, index) => {
                        const normalized = (point.value - chartMinimum) / chartRange;
                        const pointOffset = Math.round((1 - normalized) * 104);
                        const isSelected = selectedAnalysisPointIndex === index;
                        const pointAccessibilityLabel = boundDisplayText(
                          `查看分析圖表點：${point.label}，血糖 ${point.value}`,
                          maxDisplayDetailTextLength
                        );
                        return (
                          <Pressable
                            key={point.id}
                            accessibilityLabel={pointAccessibilityLabel}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            style={styles.lineChartPointColumn}
                            onPress={() => pressAnalysisChartPoint(index)}
                          >
                            <View style={{ height: pointOffset }} />
                            <View style={[styles.lineChartStem, isSelected ? styles.lineChartStemSelected : null]} />
                            <View style={[styles.lineChartPoint, isSelected ? styles.lineChartPointSelected : null]} />
                            {index > 0 ? <View style={styles.lineChartConnector} /> : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                  <View style={styles.chartXAxisRow}>
                    {analysisChartPoints.map((point, index) => (
                      <Text key={point.id} style={styles.chartAxisLabel}>
                        {index === 0 || index === analysisChartPoints.length - 1 || index % 3 === 0
                          ? point.label
                          : ""}
                      </Text>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.emptyText}>{analysisChartEmptyDisplayText}</Text>
              )}
            </View>
            <View style={styles.metricGrid}>
              {analysisMetricRows.map((row) => (
                <View key={row.label} style={styles.metricCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.metricValue}>{row.value}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.evidence}>{analysisRangeSummaryDisplayText}</Text>
            {analysisGlucoseRecords.length === 0 ? (
              <View style={styles.actionRow}>
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.analysisManualAccessibility}
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  onPress={openAnalysisManualRecord}
                >
                  <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.manualAdd}</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.analysisReturnTodayAccessibility}
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  onPress={returnFromAnalysisToToday}
                >
                  <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.backTodayAlt}</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.analysisDataBoundary}</Text>
              {analysisBoundaryChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            {recordsForDisplay.length >= mobileRecordSyncLimit ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{coreFlowDisplayLabels.analysisSyncBoundary}</Text>
                <Text style={styles.evidence}>{analysisSyncBoundaryDisplayText}</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={coreFlowDisplayLabels.analysisDetailedReportAccessibility}
              accessibilityRole="button"
              accessibilityState={{ disabled: isReportLoading }}
              style={[styles.primaryButtonFull, isReportLoading ? styles.buttonDisabled : null]}
              disabled={isReportLoading}
              onPress={openAnalysisDetailedReport}
            >
              <Text style={styles.primaryButtonText}>{analysisReportButtonDisplayLabel}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "detailedReport" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>詳細報告</Text>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.reportReturnAnalysisAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromDetailedReportToAnalysis}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.back}</Text>
              </Pressable>
            </View>
            <Text style={styles.evidence}>{reportStatusDisplayText}</Text>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{reportSourceDisplayLabel}</Text>
              <Text style={styles.evidence}>{reportSourceDisplayCopy}</Text>
            </View>
            <View style={styles.heroCardFeature}>
              <View style={styles.heroIconBubble}>
                <Text style={styles.heroIconText}>報</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.evidence}>目前分析範圍</Text>
                <Text style={styles.heroNumber}>{reportRecordDisplayCount} 筆紀錄</Text>
                <Text style={styles.evidence}>{reportGeneratedAtDisplayText}</Text>
              </View>
            </View>
            <View style={styles.reportBoundaryGrid}>
              {detailedReportBoundaryRows.map((row) => (
                <View key={row.label} style={styles.reportBoundaryCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.recordType}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.metricGrid}>
              {detailedReportMetricRows.map((row) => (
                <View key={row.label} style={styles.metricCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.metricValue}>{row.value}</Text>
                </View>
              ))}
            </View>
            {reportRecordCount === 0 ? (
              <View style={styles.actionRow}>
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.reportManualAccessibility}
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  onPress={openDetailedReportManualRecord}
                >
                  <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.manualAdd}</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={coreFlowDisplayLabels.reportReturnTodayAccessibility}
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  onPress={returnFromDetailedReportToToday}
                >
                  <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.backTodayAlt}</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.reportNotes}</Text>
              {detailedReportNoteDisplayItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {currentScreen === "subscription" ? (
          <View style={styles.pageSection}>
            <Text style={styles.sectionTitle}>會員方案</Text>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.trialPaymentBoundary}</Text>
              <Text style={styles.evidence}>{subscriptionTrialBoundaryDisplayText}</Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{settingsSubscriptionDisplayLabels.paymentUnwired}</Text>
              <Text style={styles.evidence}>{subscriptionPaymentUnwiredDisplayText}</Text>
            </View>
            <View style={styles.subscriptionStatusCard}>
              <View>
                <Text style={styles.confidence}>{settingsSubscriptionDisplayLabels.currentStatus}</Text>
                <Text style={styles.priceText}>{subscriptionPlanDisplayText}</Text>
                <Text style={styles.evidence}>{subscriptionStatusDisplayText}</Text>
              </View>
              <Pressable
	                accessibilityLabel={settingsSubscriptionDisplayLabels.syncQuotaAccessibility}
	                accessibilityRole="button"
	                accessibilityState={{ disabled: isQuotaSyncing }}
	                style={[styles.secondaryButton, isQuotaSyncing ? styles.buttonDisabled : null]}
                disabled={isQuotaSyncing}
                onPress={syncSubscriptionQuota}
              >
                <Text style={styles.secondaryButtonText}>{subscriptionSyncButtonDisplayLabel}</Text>
              </Pressable>
            </View>
            <View style={styles.quotaCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.label}>{settingsSubscriptionDisplayLabels.todayRecordingQuota}</Text>
                <Text style={styles.countText}>{quotaStatusDisplayText}</Text>
              </View>
              <View style={styles.quotaBarTrack}>
                <View style={[styles.quotaBarFill, { width: `${quotaUsageDisplayPercent}%` }]} />
              </View>
              <View style={styles.quotaStatsRow}>
                <Text style={styles.evidence}>{quotaUsedDisplayText}</Text>
                <Text style={quotaRemainingLow ? styles.warningText : styles.evidence}>{quotaRemainingDisplayText}</Text>
              </View>
              <Text style={styles.evidence}>{subscriptionQuotaDailyLimitDisplayText}</Text>
            </View>
            <View style={styles.planGrid}>
              <View style={styles.planCard}>
                <View style={styles.planCardHeader}>
                  <View style={styles.iconCircleSmall}>
                    <Text>葉</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.label}>{settingsSubscriptionDisplayLabels.trialPlan}</Text>
                    <Text style={styles.evidence}>先熟悉語音與 AI 整理流程</Text>
                  </View>
                </View>
                <Text style={styles.planPriceText}>NT$0 / 7 天</Text>
                <Text style={styles.evidence}>每日錄音上限 5 分鐘，試用結束規則需等正式付款串接後啟用。</Text>
              </View>
              <View style={[styles.planCard, styles.planCardRecommended]}>
                <View style={styles.planCardHeader}>
                  <View style={styles.iconCircleSmall}>
                    <Text>★</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.label}>{settingsSubscriptionDisplayLabels.annualPlan}</Text>
                    <Text style={styles.productBadge}>推薦</Text>
                  </View>
                </View>
                <Text style={styles.planPriceText}>NT$1,490 / 年</Text>
                <Text style={styles.evidence}>每日錄音上限 10 分鐘，持續訂閱保有優惠價。</Text>
              </View>
            </View>
            <View style={styles.pricingCard}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.featureComparison}</Text>
              {subscriptionComparisonDisplayRows.map((row) => (
                <View key={row.feature} style={styles.comparisonRow}>
                  <Text style={styles.comparisonFeature}>{row.feature}</Text>
                  <Text style={styles.comparisonCell}>{row.trial}</Text>
                  <Text style={styles.comparisonCellStrong}>{row.annual}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.formalReadiness}</Text>
              {subscriptionReadinessChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
              <Text style={styles.warningText}>{subscriptionCtaBoundaryDisplayText}</Text>
            </View>
            <Pressable
              accessibilityLabel={settingsSubscriptionDisplayLabels.trialIntegrationAccessibility}
              accessibilityRole="button"
              style={styles.primaryButtonFull}
              onPress={showSubscriptionTrialIntegrationStatus}
            >
              <Text style={styles.primaryButtonText}>{settingsSubscriptionDisplayLabels.trialIntegrationButton}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={settingsSubscriptionDisplayLabels.manageSubscribedPlanAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={openSubscriptionManagementFromSubscription}
            >
              <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.manageSubscribedPlan}</Text>
            </Pressable>
            {subscriptionActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{settingsSubscriptionDisplayLabels.trialIntegrationStatus}</Text>
                <Text style={styles.evidence}>{subscriptionActionStatusDisplayText}</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={settingsSubscriptionDisplayLabels.memberStatusAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={openMembershipStatusFromSubscription}
            >
              <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.memberStatusButton}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "subscriptionManagement" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>訂閱管理</Text>
                <Text style={styles.evidence}>{subscriptionManagementIntroDisplayText}</Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromSubscriptionManagementToSettings}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.subscriptionStatusCard}>
              <View>
                <Text style={styles.confidence}>{settingsSubscriptionDisplayLabels.currentMemberStatus}</Text>
                <Text style={styles.priceText}>{subscriptionManagementPlanDisplayText}</Text>
                <Text style={styles.evidence}>{subscriptionManagementStatusDisplayText}</Text>
              </View>
              <Pressable
	                accessibilityLabel={settingsSubscriptionDisplayLabels.syncQuotaAccessibility}
	                accessibilityRole="button"
	                accessibilityState={{ disabled: isQuotaSyncing }}
	                style={[styles.secondaryButton, isQuotaSyncing ? styles.buttonDisabled : null]}
                disabled={isQuotaSyncing}
                onPress={syncSubscriptionManagementStatus}
              >
                <Text style={styles.secondaryButtonText}>{subscriptionManagementSyncButtonDisplayLabel}</Text>
              </Pressable>
            </View>
            <View style={styles.aiReviewList}>
              {subscriptionManagementDisplayRows.map((row) => (
                <View key={row.title} style={styles.aiReviewCard}>
                  <View style={styles.iconCircleSmall}>
                    <Text>{row.icon}</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.recordContent}>{row.title}</Text>
                    <Text style={styles.evidence}>{row.copy}</Text>
                  </View>
                  <Text style={styles.previewModeBadge}>{row.statusLabel}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.formalReadiness}</Text>
              {subscriptionManagementReadinessChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.noAction}</Text>
              <Text style={styles.evidence}>{subscriptionManagementNoActionDisplayText}</Text>
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={settingsSubscriptionDisplayLabels.returnSettingsAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromSubscriptionManagementToSettings}
              >
                <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.returnSettings}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={settingsSubscriptionDisplayLabels.paymentIntegrationAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={showSubscriptionManagementPaymentStatus}
              >
                <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.paymentIntegrationButton}</Text>
              </Pressable>
            </View>
            {subscriptionManagementActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{settingsSubscriptionDisplayLabels.paymentIntegrationStatus}</Text>
                <Text style={styles.evidence}>{subscriptionManagementActionStatusDisplayText}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {currentScreen === "membershipStatus" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>會員方案狀態</Text>
                <Text style={styles.evidence}>試用與續訂狀態只依目前已同步的會員資料顯示。</Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromMembershipStatusToSubscription}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.heroCard}>
              <Text style={styles.evidence}>{membershipTrialHeroLabelDisplayText}</Text>
              <Text style={styles.heroNumber}>{membershipTrialDaysDisplayText}</Text>
              <Text style={styles.evidence}>{membershipPlanStatusDisplayText}</Text>
            </View>
            <View style={styles.pricingCard}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.memberFeatures}</Text>
              {membershipFeatureRows.map((row) => (
                <View key={row.label} style={styles.detailRow}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.recordContent}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.planCard}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.founderAnnualPrice}</Text>
              <Text style={styles.planPriceText}>NT$1,490</Text>
              <Text style={styles.evidence}>持續訂閱可保有優惠價；正式收款前不會改變會員狀態。</Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{settingsSubscriptionDisplayLabels.renewalUnwired}</Text>
              <Text style={styles.evidence}>
                此頁只呈現會員狀態；正式續訂需要商店付款、receipt validation 與 entitlement webhook。
              </Text>
            </View>
            <Pressable
              accessibilityLabel={settingsSubscriptionDisplayLabels.renewalIntegrationAccessibility}
              accessibilityRole="button"
              style={styles.primaryButtonFull}
              onPress={openMembershipRenewalManagement}
            >
              <Text style={styles.primaryButtonText}>{settingsSubscriptionDisplayLabels.renewalIntegrationButton}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={settingsSubscriptionDisplayLabels.managePlanAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={openMembershipManagement}
            >
              <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.managePlan}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "menu" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>功能選單</Text>
                <Text style={styles.evidence}>快速前往你需要的功能。</Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromMenu}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.menuGrid}>
              {menuDisplayItems.map((item) => (
                <Pressable
                  key={item.target}
                  accessibilityLabel={item.accessibilityLabel}
                  accessibilityRole="button"
                  style={styles.menuCard}
                  onPress={() => pressMenuDestination(item)}
                >
                  <View style={styles.menuIconCenter}>
                    <Text style={styles.menuIconText}>{item.icon}</Text>
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityLabel={auxiliaryDisplayLabels.showMoreFeaturesAccessibility}
              accessibilityRole="button"
              style={styles.moreButton}
              onPress={openFutureModulesFromMenu}
            >
              <View style={styles.moreActionIcon}>
                <Text style={styles.menuIconText}>＋</Text>
              </View>
              <Text style={styles.secondaryButtonText}>{auxiliaryDisplayLabels.showMoreFeatures}</Text>
            </Pressable>
            {allowMobileDevAuth ? (
              <View style={styles.devResetInline}>
                <Text style={styles.previewModeBadge}>{auxiliaryDisplayLabels.devOnly}</Text>
                <Text style={styles.evidence}>
                  測試用重置按鈕會呼叫 backend `/dev/reset-data` 清空本機開發資料；正式版必須刪除這個入口。
                </Text>
                <Pressable
	                  accessibilityLabel={auxiliaryDisplayLabels.devResetAccessibility}
	                  accessibilityRole="button"
	                  accessibilityState={{ disabled: isAnyRequestInFlight }}
	                  style={[styles.dangerButton, isAnyRequestInFlight ? styles.buttonDisabled : null]}
                  disabled={isAnyRequestInFlight}
                  onPress={resetDevelopmentDataFromMenu}
                >
                  <Text style={styles.dangerButtonText}>
                    {isBusy ? "(dev) 重置中..." : "(dev) 重置所有資料"}
                  </Text>
                </Pressable>
                {devResetStatus ? <Text style={styles.evidence}>{devResetStatusDisplayText}</Text> : null}
              </View>
            ) : null}
            {allowMobileDevAuth && enableDebugTools ? (
              <View style={styles.devResetInline}>
                <Text style={styles.previewModeBadge}>{auxiliaryDisplayLabels.devOnly}</Text>
                <Text style={styles.label}>{auxiliaryDisplayLabels.visualSmokeRoutes}</Text>
                <Text style={styles.evidence}>{auxiliaryDisplayLabels.visualSmokeRouteCopy}</Text>
                <View style={styles.visualSmokeRouteGrid}>
                  {visualSmokeRouteJumpDisplayItems.map((item) => (
                    <Pressable
                      key={item.target}
                      accessibilityLabel={item.accessibilityLabel}
                      accessibilityRole="button"
                      style={styles.visualSmokeRouteChip}
                      onPress={() => pressVisualSmokeRoute(item)}
                    >
                      <Text style={styles.visualSmokeRouteChipText}>{item.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {currentScreen === "futureModules" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>未來擴充</Text>
                <Text style={styles.evidence}>這些入口先保留架構位置，正式啟用前不會寫入資料或呼叫 AI。</Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromFutureModulesToMenu}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            {futureModuleDisplayCards.map((item) => (
                <Pressable
                  key={item.key}
                  accessibilityLabel={item.accessibilityLabel}
                  accessibilityRole="button"
                  style={styles.recordCard}
                  onPress={() => pressFutureModuleDestination(item)}
                >
                  <View style={styles.recordHeader}>
                    <View style={styles.iconCircleSmall}>
                      <Text>{item.icon}</Text>
                    </View>
                    <Text style={styles.recordType}>{item.title}</Text>
                  </View>
                  <Text style={styles.recordContent}>{item.description}</Text>
                  <Text style={styles.evidence}>{item.readiness}</Text>
                  <View style={styles.inlineInfoBlock}>
                    <Text style={styles.label}>{futurePreviewDisplayLabels.readiness}</Text>
                    {item.requirements.map((requirement) => (
                      <View key={requirement.key} style={styles.highlightRow}>
                        <Text style={styles.recordType}>•</Text>
                        <Text style={styles.evidence}>{requirement.text}</Text>
                      </View>
                    ))}
                    <Text style={styles.warningText}>{item.safety}</Text>
                  </View>
                  {item.target ? <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.viewPreview}</Text> : null}
                  {!item.target ? <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.viewIntegration}</Text> : null}
                </Pressable>
              ))}
            {futureModuleActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{futurePreviewDisplayLabels.integrationStatus}</Text>
                <Text style={styles.evidence}>{futureModuleActionStatusDisplayText}</Text>
              </View>
            ) : null}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{futurePreviewDisplayLabels.mvpScope}</Text>
              <Text style={styles.evidence}>
                MVP 仍以記錄、確認、儲存、歷史與基本分析為主；未來模組會等資料邊界、成本與權限完成後再接 backend。
              </Text>
            </View>
          </View>
        ) : null}

        {currentScreen === "futureModuleDetail" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {selectedFutureModuleDisplay.title}
                </Text>
                <Text style={styles.evidence}>
                  {selectedFutureModuleDisplay.description}
                </Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromFutureModuleDetail}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{auxiliaryDisplayLabels.reservedArchitecture}</Text>
              <Text style={styles.evidence}>{futureModuleDetailBoundaryDisplayText}</Text>
            </View>
            <View style={styles.emptyStateCard}>
              <View style={styles.iconCircleMuted}>
                <Text>{selectedFutureModuleDisplay.icon}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.recordType}>{futurePreviewDisplayLabels.currentStatus}</Text>
                <Text style={styles.recordContent}>{selectedFutureModuleDisplay.readiness}</Text>
                <Text style={styles.evidence}>{selectedFutureModuleDisplay.safety}</Text>
              </View>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{futurePreviewDisplayLabels.readiness}</Text>
              {selectedFutureModuleDisplay.requirements.map((requirement) => (
                <View key={requirement.key} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{requirement.text}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{futurePreviewDisplayLabels.implementationOrder}</Text>
              <Text style={styles.evidence}>{futureModuleImplementationOrderDisplayText}</Text>
            </View>
            <Pressable
              accessibilityLabel={futurePreviewDisplayLabels.returnFutureModulesAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={returnFromFutureModuleDetail}
            >
              <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.returnFutureModules}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "doctorShare" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>醫師 / 醫院合作</Text>
                <Text style={styles.evidence}>授權碼、回診摘要與醫療端唯讀查看的 future module 預覽。</Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromDoctorSharePreview}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{doctorSharePreviewBoundaryDisplay.badge}</Text>
              <Text style={styles.evidence}>{doctorSharePreviewBoundaryDisplay.copy}</Text>
            </View>
            <View style={styles.heroCardFeature}>
              <View style={styles.heroIconBubble}>
                <Text style={styles.heroIconText}>醫</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.evidence}>目前紀錄對象</Text>
                <Text style={styles.heroNumber}>{activeProfileLabel}</Text>
                <Text style={styles.evidence}>{doctorShareAccountBoundaryDisplayText}</Text>
              </View>
            </View>
            <View style={styles.reportBoundaryGrid}>
              {doctorShareBoundaryRows.map((row) => (
                <View key={row.label} style={styles.reportBoundaryCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.recordType}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{futurePreviewDisplayLabels.formalReadiness}</Text>
              {doctorShareReadinessChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{futurePreviewDisplayLabels.backendFoundation}</Text>
              <Text style={styles.evidence}>{doctorShareBackendBoundaryDisplayText}</Text>
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={futurePreviewDisplayLabels.doctorTokenAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={showDoctorShareTokenStatus}
              >
                <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.doctorTokenButton}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={futurePreviewDisplayLabels.doctorReportAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={showDoctorShareReportBoundaryStatus}
              >
                <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.doctorReportButton}</Text>
              </Pressable>
            </View>
            {doctorShareActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{futurePreviewDisplayLabels.doctorStatus}</Text>
                <Text style={styles.evidence}>{doctorShareActionStatusDisplayText}</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={futurePreviewDisplayLabels.returnFutureModulesAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={returnFromDoctorSharePreview}
            >
              <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.returnFutureModules}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "healthIntegration" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>HealthKit / Health Connect / 血糖機</Text>
                <Text style={styles.evidence}>外部健康平台、血糖機匯入與 BLE 同步的 future module 預覽。</Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromHealthIntegrationPreview}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{healthIntegrationPreviewBoundaryDisplay.badge}</Text>
              <Text style={styles.evidence}>{healthIntegrationPreviewBoundaryDisplay.copy}</Text>
            </View>
            <View style={styles.reportBoundaryGrid}>
              {healthIntegrationBoundaryRows.map((row) => (
                <View key={row.label} style={styles.reportBoundaryCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.recordType}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{futurePreviewDisplayLabels.formalReadiness}</Text>
              {healthIntegrationReadinessChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{futurePreviewDisplayLabels.externalDataBoundary}</Text>
              <Text style={styles.evidence}>{healthIntegrationExternalDataBoundaryDisplayText}</Text>
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={futurePreviewDisplayLabels.healthPermissionAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={showHealthIntegrationPermissionStatus}
              >
                <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.healthPermissionButton}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={futurePreviewDisplayLabels.healthMeterAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={showHealthIntegrationMeterStatus}
              >
                <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.healthMeterButton}</Text>
              </Pressable>
            </View>
            {healthIntegrationActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{futurePreviewDisplayLabels.healthStatus}</Text>
                <Text style={styles.evidence}>{healthIntegrationActionStatusDisplayText}</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={futurePreviewDisplayLabels.returnFutureModulesAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={returnFromHealthIntegrationPreview}
            >
              <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.returnFutureModules}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "community" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>社群</Text>
                <Text style={styles.evidence}>糖友交流、留言討論與小型互動的 future module 預覽。</Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromCommunityPreview}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{communityPreviewBoundaryDisplay.badge}</Text>
              <Text style={styles.evidence}>{communityPreviewBoundaryDisplay.copy}</Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>食物血糖資料庫</Text>
              <Text style={styles.evidence}>以使用者實際食用前後血糖分享建立資料庫；backend ready 時同步真實分享，visual smoke 或 backend unavailable 時才顯示本機預覽。</Text>
            </View>
            <TextInput
              accessibilityLabel={auxiliaryDisplayLabels.foodCommunitySearchInputAccessibility}
              value={foodCommunitySearchText}
              onChangeText={updateFoodCommunitySearchInput}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={maxStoreSearchTextLength}
              style={styles.input}
              placeholder="搜尋食物名稱"
            />
            <View style={styles.segmentRow}>
              {foodCommunityCategoryDisplayOptions.map((category) => (
                <Pressable
                  key={category.value}
                  accessibilityLabel={category.accessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={{ selected: foodCommunityCategory === category.value }}
                  style={[
                    styles.segmentPill,
                    foodCommunityCategory === category.value ? styles.segmentActive : null
                  ]}
                  onPress={() => pressFoodCommunityCategoryOption(category)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      foodCommunityCategory === category.value ? styles.segmentTextActive : null
                    ]}
                  >
                    {category.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {selectedFoodCommunityCategoryDisplay ? (
              <Text style={styles.evidence}>{selectedFoodCommunityCategoryDisplay.summary}</Text>
            ) : null}
            <View style={styles.openSection}>
              {visibleFoodCommunityItems.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityLabel={item.accessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedFoodCommunityItem?.id === item.id }}
                  style={[
                    styles.recordCard,
                    selectedFoodCommunityItem?.id === item.id ? styles.recordCardSelected : null
                  ]}
                  onPress={() => pressFoodCommunityItem(item)}
                >
                  <View style={styles.timelineContent}>
                    <Text style={styles.recordContent}>{item.title}</Text>
                    <Text style={styles.evidence}>{item.metricSummary}</Text>
                  </View>
                  <Text style={styles.recordType}>›</Text>
                </Pressable>
              ))}
              {visibleFoodCommunityItems.length === 0 ? (
                <View style={styles.inlineInfoBlock}>
                  <Text style={styles.label}>沒有符合的食物</Text>
                  <Text style={styles.evidence}>可清除搜尋文字或切換分類；backend ready 時會依搜尋同步，未連線時只篩選本機預覽。</Text>
                </View>
              ) : null}
            </View>
            {selectedFoodCommunityItem ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{selectedFoodCommunityItem.title} 資料頁</Text>
                <View style={styles.reportBoundaryGrid}>
                  <View style={styles.reportBoundaryCard}>
                    <Text style={styles.confidence}>分享總人數</Text>
                    <Text style={styles.recordType}>{selectedFoodCommunityItem.shareCount}</Text>
                  </View>
                  <View style={styles.reportBoundaryCard}>
                    <Text style={styles.confidence}>平均上升血糖</Text>
                    <Text style={styles.recordType}>{selectedFoodCommunityItem.averageRise} mg/dL</Text>
                  </View>
                  <View style={styles.reportBoundaryCard}>
                    <Text style={styles.confidence}>最高上升血糖</Text>
                    <Text style={styles.recordType}>{selectedFoodCommunityItem.maximumRise} mg/dL</Text>
                  </View>
                  <View style={styles.reportBoundaryCard}>
                    <Text style={styles.confidence}>最低上升血糖</Text>
                    <Text style={styles.recordType}>{selectedFoodCommunityItem.minimumRise} mg/dL</Text>
                  </View>
                </View>
                <Text style={styles.label}>個別分享紀錄</Text>
                {selectedFoodCommunityItem.individualShareDisplayItems.length > 0 ? (
                  selectedFoodCommunityItem.individualShareDisplayItems.map((share) => (
                    <View key={share.id} style={styles.visionResultCard}>
                      <View style={styles.timelineContent}>
                        <Text style={styles.recordContent}>{share.summary}</Text>
                        <Text style={styles.evidence}>{share.note}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.inlineInfoBlock}>
                    <Text style={styles.evidence}>尚未有可顯示的個別分享紀錄。</Text>
                  </View>
                )}
              </View>
            ) : null}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>食物分享紀錄</Text>
              <TextInput
                accessibilityLabel="輸入食物名稱"
                value={foodCommunityShareFields.foodName}
                onChangeText={updateFoodCommunityFoodName}
                maxLength={maxDisplayTextLength}
                style={styles.input}
                placeholder="食物名稱"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                accessibilityLabel="輸入食用前血糖"
                value={foodCommunityShareFields.beforeGlucose}
                onChangeText={updateFoodCommunityBeforeGlucose}
                keyboardType="numeric"
                maxLength={3}
                style={styles.input}
                placeholder="食用前血糖"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                accessibilityLabel="輸入食用後血糖"
                value={foodCommunityShareFields.afterGlucose}
                onChangeText={updateFoodCommunityAfterGlucose}
                keyboardType="numeric"
                maxLength={3}
                style={styles.input}
                placeholder="食用後血糖"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                accessibilityLabel="輸入食物分享備註心得"
                value={foodCommunityShareFields.note}
                onChangeText={updateFoodCommunityNote}
                maxLength={maxDisplayDetailTextLength}
                style={[styles.input, styles.multilineField]}
                placeholder="備註心得"
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {foodCommunityShareFieldRows.map((row) => (
                <View key={row.label} style={styles.highlightRow}>
                  <Text style={styles.recordType}>{row.label}</Text>
                  <Text style={styles.evidence}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.reportBoundaryGrid}>
              {foodCommunityPointRows.map((row) => (
                <View key={row.label} style={styles.reportBoundaryCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.recordType}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>社群排行榜</Text>
              {foodCommunityRankingRows.map((row) => (
                <View key={row.label} style={styles.highlightRow}>
                  <Text style={styles.recordType}>{row.label}</Text>
                  <Text style={styles.evidence}>{row.value}</Text>
                </View>
              ))}
              <Text style={styles.evidence}>點數未來可串接商城兌換優惠券、商品折扣、特殊徽章與會員福利。</Text>
            </View>
            <View style={styles.heroCardFeature}>
              <View style={styles.heroIconBubble}>
                <Text style={styles.heroIconText}>群</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.evidence}>公開顯示名稱預覽</Text>
                <Text style={styles.heroNumber}>{accountPublicDisplayNameDisplayText}</Text>
                <Text style={styles.evidence}>{communityPublicNameBoundaryDisplayText}</Text>
                <TextInput
                  accessibilityLabel="輸入社群公開顯示名稱"
                  value={communityPublicDisplayNameDraft}
                  onChangeText={updateCommunityPublicDisplayNameDraft}
                  maxLength={maxDisplayTextLength}
                  style={styles.input}
                  placeholder="社群公開顯示名稱"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  accessibilityLabel="儲存社群公開顯示名稱，不公開健康數值"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isBusy || !protectedAccountBackendReady }}
                  style={[styles.secondaryButton, isBusy || !protectedAccountBackendReady ? styles.buttonDisabled : null]}
                  disabled={isBusy || !protectedAccountBackendReady}
                  onPress={saveCommunityPublicProfile}
                >
                  <Text style={styles.secondaryButtonText}>儲存公開名稱</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.reportBoundaryGrid}>
              {communityBoundaryRows.map((row) => (
                <View key={row.label} style={styles.reportBoundaryCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.recordType}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{futurePreviewDisplayLabels.formalReadiness}</Text>
              {communityReadinessChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={foodCommunityShareAccessibilityDisplayLabel}
                accessibilityRole="button"
                accessibilityState={{ disabled: isBusy || !protectedAccountBackendReady }}
                style={[styles.secondaryButton, isBusy || !protectedAccountBackendReady ? styles.buttonDisabled : null]}
                disabled={isBusy || !protectedAccountBackendReady}
                onPress={showFoodCommunityShareStatus}
              >
                <Text style={styles.secondaryButtonText}>{foodCommunityShareButtonDisplayLabel}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={futurePreviewDisplayLabels.communityPostAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={showCommunityPostingStatus}
              >
                <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.communityPostButton}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={futurePreviewDisplayLabels.communityPrivacyAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={showCommunityPrivacyStatus}
              >
                <Text style={styles.secondaryButtonText}>
                  {communityPublicSettings?.leaderboard_opt_in ? "關閉排行榜 opt-in" : "開啟排行榜 opt-in"}
                </Text>
              </Pressable>
            </View>
            {communityActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{futurePreviewDisplayLabels.communityStatus}</Text>
                <Text style={styles.evidence}>{communityActionStatusDisplayText}</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={futurePreviewDisplayLabels.returnFutureModulesAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={returnFromCommunityPreview}
            >
              <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.returnFutureModules}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "ranking" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>排行榜</Text>
                <Text style={styles.evidence}>連續記錄排行榜、社群競賽與公開排名 opt-in 的 future module 預覽。</Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromRankingPreview}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{rankingPreviewBoundaryDisplay.badge}</Text>
              <Text style={styles.evidence}>{rankingPreviewBoundaryDisplay.copy}</Text>
            </View>
            <View style={styles.heroCardFeature}>
              <View style={styles.heroIconBubble}>
                <Text style={styles.heroIconText}>榜</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.evidence}>本機連續記錄預覽</Text>
                <Text style={styles.heroNumber}>{rankingStreakDisplayDays} 天</Text>
                <Text style={styles.evidence}>{rankingLocalPreviewBoundaryDisplayText}</Text>
              </View>
            </View>
            <View style={styles.reportBoundaryGrid}>
              {rankingBoundaryRows.map((row) => (
                <View key={row.label} style={styles.reportBoundaryCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.recordType}>{row.value}</Text>
                </View>
              ))}
            </View>
            {rankingLeaderboardSections.map((section) => (
              <View key={section.type} style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{section.label}</Text>
                {section.entries.length > 0 ? (
                  section.entries.map((entry) => (
                    <View key={entry.id} style={styles.highlightRow}>
                      <Text style={styles.recordType}>{entry.rankLabel}</Text>
                      <View style={styles.timelineContent}>
                        <Text style={styles.recordContent}>{entry.displayName}</Text>
                        <Text style={styles.evidence}>{entry.scoreLabel}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.evidence}>{section.emptyCopy}</Text>
                )}
              </View>
            ))}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{futurePreviewDisplayLabels.formalReadiness}</Text>
              {rankingReadinessChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={futurePreviewDisplayLabels.rankingPublicAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={showRankingPublicStatus}
              >
                <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.rankingPublicButton}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={rankingOptInAccessibilityDisplayLabel}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={showRankingOptInStatus}
              >
                <Text style={styles.secondaryButtonText}>{rankingOptInButtonDisplayLabel}</Text>
              </Pressable>
            </View>
            {rankingActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{futurePreviewDisplayLabels.rankingStatus}</Text>
                <Text style={styles.evidence}>{rankingActionStatusDisplayText}</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={futurePreviewDisplayLabels.returnFutureModulesAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={returnFromRankingPreview}
            >
              <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.returnFutureModules}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "settings" ? (
          <View style={styles.pageSection}>
            <Text style={styles.sectionTitle}>設定</Text>
            <Text style={styles.evidence}>管理帳號、提醒與使用偏好。</Text>
            <Pressable
              accessibilityLabel={accountSecurityCardAccessibilityLabel}
              accessibilityRole="button"
              style={styles.accountCard}
              onPress={openAccountSecurityFromSettings}
            >
              <View style={styles.iconCircle}>
                <Text>人</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.recordContent}>{accountDisplayName}</Text>
                <Text style={styles.evidence}>
                  {accountLoginDisplayText}
                </Text>
                <Text style={styles.evidence}>{activeProfileInlineDisplayText}</Text>
                <Text style={styles.previewModeBadge}>{authModeDisplayLabel}</Text>
                <Text style={styles.evidence}>{authModeDisplayCopy}</Text>
              </View>
              <Text style={styles.settingsChevron}>›</Text>
            </Pressable>
            <View style={styles.settingsList}>
              {settingsDisplayRows.map((row) => (
                <Pressable
                  key={row.id}
                  accessibilityLabel={row.accessibilityLabel}
                  accessibilityRole="button"
                  style={styles.settingsRow}
                  onPress={() => pressSettingsRow(row)}
                >
                  <View style={styles.iconCircleSmall}>
                    <Text>{row.icon}</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.recordContent}>{row.label}</Text>
                    {row.id === "quota" ? (
                      <Text style={styles.evidence}>{settingsQuotaHelperDisplayText}</Text>
                    ) : (
                      <Text style={styles.evidence}>{row.helper}</Text>
                    )}
                  </View>
                  <Text style={styles.settingsChevron}>›</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityLabel={settingsSubscriptionDisplayLabels.localClearAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={clearLocalSessionFromSettings}
            >
              <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.localClearButton}</Text>
            </Pressable>
            {authActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{settingsSubscriptionDisplayLabels.localStateResult}</Text>
                <Text style={styles.evidence}>{authActionStatusDisplayText}</Text>
              </View>
            ) : null}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>進階設定</Text>
              <Text style={styles.evidence}>
                Backend、模型與 Dev Client 工具預設收合，避免一般使用者誤觸成本或環境設定。
              </Text>
              <Pressable
                accessibilityLabel={settingsSubscriptionDisplayLabels.advancedSettingsToggleAccessibility}
                accessibilityRole="button"
                accessibilityState={{ expanded: showAdvancedSettings }}
                style={styles.secondaryButton}
                onPress={toggleAdvancedSettings}
              >
                <Text style={styles.secondaryButtonText}>
                  {advancedSettingsToggleDisplayLabel}
                </Text>
              </Pressable>
            </View>
            {showAdvancedSettings ? (
              <>
                <View style={styles.developerSettingsBox}>
                  <Text style={styles.label}>{auxiliaryDisplayLabels.developerSettings}</Text>
                  <Text style={styles.evidence}>
                    {allowMobileDevAuth
                      ? "本區只供本機開發使用；正式 auth 完成後應隱藏或移到 debug build。"
                      : "dev login 未啟用；本機預覽請複製 mobile/.env.example 到 .env，正式版需接 JWT/OIDC login。"}
                  </Text>
                  <Text style={styles.label}>{auxiliaryDisplayLabels.backendUrl}</Text>
                  <TextInput
                    accessibilityLabel={auxiliaryDisplayLabels.backendUrlInputAccessibility}
                    value={apiBaseUrl}
                    onChangeText={updateApiBaseUrlDraft}
                    maxLength={maxBackendUrlLength}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isAnyRequestInFlight}
                    accessibilityState={{ disabled: isAnyRequestInFlight }}
                    style={[styles.input, isAnyRequestInFlight ? styles.inputDisabled : null]}
                    placeholder="http://192.168.1.50:8000"
                  />
                  <Pressable
                    accessibilityLabel={settingsSubscriptionDisplayLabels.backendReconnectAccessibility}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isAnyRequestInFlight }}
                    style={[
                      styles.secondaryButton,
                      isAnyRequestInFlight ? styles.buttonDisabled : null
                    ]}
                    disabled={isAnyRequestInFlight}
                    onPress={reconnectBackendFromSettings}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {backendReconnectDisplayLabel}
                    </Text>
                  </Pressable>
                  <Text style={styles.label}>{auxiliaryDisplayLabels.careProfile}</Text>
                  <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}>
                    {profileChoiceDisplayItems.map((profile) => (
                      <Pressable
                        key={profile.id}
                        accessibilityLabel={profile.accessibilityLabel}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: isAnyRequestInFlight, selected: profile.sourceId === activeProfileId }}
                        style={[
                          styles.chip,
                          profile.sourceId === activeProfileId ? styles.chipSelected : null,
                          isAnyRequestInFlight ? styles.chipDisabled : null
                        ]}
                        disabled={isAnyRequestInFlight}
                        onPress={() => pressSettingsProfileChoice(profile)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            profile.sourceId === activeProfileId ? styles.chipTextSelected : null
                          ]}
                        >
                          {profile.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
                <Text style={styles.evidence}>
                  處理中會暫停切換照護對象與模型，避免 parser、同步或儲存使用到不一致設定。
                </Text>
                <Text style={styles.label}>{auxiliaryDisplayLabels.llmModel}</Text>
                <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}>
                  {llmModelChoiceDisplayItems.map((model) => {
                    const modelDisabled = !model.available || isAnyRequestInFlight;
                    return (
                      <Pressable
                        key={model.id}
                        accessibilityLabel={model.accessibilityLabel}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: modelDisabled, selected: model.sourceId === llmModelId }}
                        style={[
                          styles.chip,
                          model.sourceId === llmModelId ? styles.chipSelected : null,
                          modelDisabled ? styles.chipDisabled : null
                        ]}
                        disabled={modelDisabled}
                        onPress={() => pressSettingsLlmModelChoice(model)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            model.sourceId === llmModelId ? styles.chipTextSelected : null,
                            !model.available ? styles.chipTextDisabled : null
                          ]}
                        >
                          {model.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Text style={styles.evidence}>{modelSelectionBoundaryDisplayText}</Text>
                <Text style={styles.label}>{auxiliaryDisplayLabels.sttModel}</Text>
                <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}>
                  {sttModelChoiceDisplayItems.map((model) => {
                    const modelDisabled = !model.available || isAnyRequestInFlight;
                    return (
                      <Pressable
                        key={model.id}
                        accessibilityLabel={model.accessibilityLabel}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: modelDisabled, selected: model.sourceId === sttModelId }}
                        style={[
                          styles.chip,
                          model.sourceId === sttModelId ? styles.chipSelected : null,
                          modelDisabled ? styles.chipDisabled : null
                        ]}
                        disabled={modelDisabled}
                        onPress={() => pressSettingsSttModelChoice(model)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            model.sourceId === sttModelId ? styles.chipTextSelected : null,
                            !model.available ? styles.chipTextDisabled : null
                          ]}
                        >
                          {model.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}
            <View style={styles.rejectedBox}>
              <Text style={styles.label}>本機 Whisper 模型</Text>
              <Text style={styles.evidence}>
                選擇已下載的本機 Whisper 模型，供首頁與記錄頁錄音轉文字使用；不呼叫雲端、不上傳音檔。
              </Text>
              {downloadedWhisperModelChoiceItems.length > 0 ? (
                <View style={styles.actionRow}>
                  {downloadedWhisperModelChoiceItems.map((model) => {
                    const modelSelected = model.sourceUri === whisperModelPath;
                    return (
                      <Pressable
                        key={model.sourceUri}
                        accessibilityLabel={model.accessibilityLabel}
                        accessibilityRole="button"
                        accessibilityState={{ selected: modelSelected }}
                        style={[
                          styles.chip,
                          modelSelected ? styles.chipSelected : null
                        ]}
                        onPress={() => pressRecordingWhisperModelChoice(model)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            modelSelected ? styles.chipTextSelected : null
                          ]}
                        >
                          {model.label}
                        </Text>
                        {modelSelected ? <Text style={styles.previewModeBadge}>{model.selectedLabel}</Text> : null}
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.evidence}>尚未找到本機 Whisper 模型；可在 Dev Client 工具下載後回來選擇。</Text>
              )}
              <Pressable
                accessibilityLabel={recordingModelRefreshAccessibilityDisplayLabel}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={refreshRecordingModelsFromSettings}
              >
                <Text style={styles.secondaryButtonText}>{recordingModelRefreshDisplayLabel}</Text>
              </Pressable>
            </View>
            {showAdvancedSettings && enableDebugTools ? (
              <View style={styles.rejectedBox}>
                <Text style={styles.label}>{auxiliaryDisplayLabels.nativeDevClient}</Text>
                <Text style={styles.evidence}>{nativeStatusDisplayText}</Text>
                <TextInput
                  accessibilityLabel={auxiliaryDisplayLabels.modelUrlInputAccessibility}
                  value={modelUrl}
                  onChangeText={updateNativeModelUrlInput}
                  maxLength={maxNativeDebugInputLength}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isBusy}
                  accessibilityState={{ disabled: isBusy }}
                  style={[styles.input, isBusy ? styles.inputDisabled : null]}
                  placeholder="https://.../model.gguf"
                />
                  <View style={styles.actionRow}>
                    <Pressable
                      accessibilityLabel={nativeWhisperDownloadKindAccessibilityDisplayLabel}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isBusy, selected: downloadKind === "whisper" }}
                      style={[
                        styles.chip,
                        downloadKind === "whisper" ? styles.chipSelected : null,
                        isBusy ? styles.chipDisabled : null
                      ]}
                      disabled={isBusy}
                      onPress={selectWhisperNativeDownloadKind}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          downloadKind === "whisper" ? styles.chipTextSelected : null
                        ]}
                      >
                        Whisper
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={nativeLlamaDownloadKindAccessibilityDisplayLabel}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isBusy, selected: downloadKind === "llama" }}
                      style={[
                        styles.chip,
                        downloadKind === "llama" ? styles.chipSelected : null,
                        isBusy ? styles.chipDisabled : null
                      ]}
                      disabled={isBusy}
                      onPress={selectLlamaNativeDownloadKind}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          downloadKind === "llama" ? styles.chipTextSelected : null
                        ]}
                      >
                        Llama
                      </Text>
                    </Pressable>
                  </View>
                  <Pressable
                    accessibilityLabel={nativeModuleCheckAccessibilityDisplayLabel}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isBusy }}
                    style={[styles.secondaryButton, isBusy ? styles.buttonDisabled : null]}
                    disabled={isBusy}
                    onPress={checkNativeModulesFromSettings}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {nativeModuleCheckDisplayLabel}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={nativeModelDownloadAccessibilityDisplayLabel}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isBusy }}
                    style={[styles.secondaryButton, isBusy ? styles.buttonDisabled : null]}
                    disabled={isBusy}
                    onPress={downloadNativeModelFromSettings}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {nativeModelDownloadDisplayLabel}
                    </Text>
                  </Pressable>
                {downloadedModels.map((model) => (
                  <Text key={model.uri} style={styles.rejectedText}>
                    {downloadedModelDisplayLabel(model)}
                  </Text>
                ))}
                <TextInput
                  accessibilityLabel={auxiliaryDisplayLabels.whisperModelPathInputAccessibility}
                  value={whisperModelPath}
                  onChangeText={updateWhisperModelPathInput}
                  maxLength={maxNativeDebugInputLength}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isBusy}
                  accessibilityState={{ disabled: isBusy }}
                  style={[styles.input, isBusy ? styles.inputDisabled : null]}
                  placeholder="Whisper model path"
                />
                <TextInput
                  accessibilityLabel={auxiliaryDisplayLabels.audioPathInputAccessibility}
                  value={audioPath}
                  onChangeText={updateNativeAudioPathInput}
                  maxLength={maxNativeDebugInputLength}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isBusy}
                  accessibilityState={{ disabled: isBusy }}
                  style={[styles.input, isBusy ? styles.inputDisabled : null]}
                  placeholder="Audio file path"
                />
                <TextInput
                  accessibilityLabel={auxiliaryDisplayLabels.llamaModelPathInputAccessibility}
                  value={llamaModelPath}
                  onChangeText={updateLlamaModelPathInput}
                  maxLength={maxNativeDebugInputLength}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isBusy}
                  accessibilityState={{ disabled: isBusy }}
                  style={[styles.input, isBusy ? styles.inputDisabled : null]}
                  placeholder="Llama GGUF model path"
                />
                  <View style={styles.actionRow}>
                    <Pressable
                      accessibilityLabel={nativeWhisperRunAccessibilityDisplayLabel}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isBusy }}
                      style={[styles.secondaryButton, isBusy ? styles.buttonDisabled : null]}
                      disabled={isBusy}
                      onPress={runNativeWhisperFromSettings}
                    >
                      <Text style={styles.secondaryButtonText}>{auxiliaryDisplayLabels.whisper}</Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={nativeLlamaRunAccessibilityDisplayLabel}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isBusy }}
                      style={[styles.secondaryButton, isBusy ? styles.buttonDisabled : null]}
                      disabled={isBusy}
                      onPress={runNativeLlamaFromSettings}
                    >
                      <Text style={styles.secondaryButtonText}>{auxiliaryDisplayLabels.llama}</Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={nativeBenchmarkAccessibilityDisplayLabel}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isBusy }}
                      style={[styles.secondaryButton, isBusy ? styles.buttonDisabled : null]}
                      disabled={isBusy}
                      onPress={runNativeBenchmarksFromSettings}
                    >
                      <Text style={styles.secondaryButtonText}>{auxiliaryDisplayLabels.benchmark}</Text>
                    </Pressable>
                  </View>
                {llamaDebugOutput ? <Text style={styles.debugOutput}>{llamaDebugOutput}</Text> : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {currentScreen === "accountSecurity" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>帳號與登入安全</Text>
                <Text style={styles.evidence}>把 dev auth、正式登入與 session 邊界分清楚。</Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromSettingsSubpage}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.accountCard}>
              <View style={styles.iconCircle}>
                <Text>鑰</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.recordContent}>{accountDisplayName}</Text>
                <Text style={styles.evidence}>{accountEmailDisplayText}</Text>
                <Text style={styles.previewModeBadge}>{authModeDisplayLabel}</Text>
                <Text style={styles.evidence}>{authModeDisplayCopy}</Text>
              </View>
            </View>
            <View style={styles.reportBoundaryGrid}>
              {accountSecurityBoundaryRows.map((row) => (
                <View key={row.label} style={styles.reportBoundaryCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.recordType}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.authProviderPreview}</Text>
              <Text style={styles.evidence}>{accountSecurityProviderBoundaryDisplayText}</Text>
            </View>
            <View style={styles.aiReviewList}>
              {authProviderDisplayItems.map((item) => (
                <Pressable
                  key={item.title}
	                  accessibilityLabel={item.accessibilityLabel}
	                  accessibilityRole="button"
	                  accessibilityState={{ disabled: isAuthOperationInFlight }}
	                  style={[styles.aiReviewCard, isAuthOperationInFlight ? styles.buttonDisabled : null]}
                  disabled={isAuthOperationInFlight}
                  onPress={() => pressAuthProviderPreview(item)}
                >
                  <View style={styles.iconCircleSmall}>
                    <Text>{item.icon}</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.recordContent}>{item.title} 登入</Text>
                    <Text style={styles.evidence}>{item.copy}</Text>
                  </View>
                  <Text style={styles.previewModeBadge}>{item.statusLabel}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.sessionPreview}</Text>
              <Text style={styles.evidence}>{accountSecuritySessionBoundaryDisplayText}</Text>
            </View>
            <View style={styles.actionGrid}>
              <Pressable
	                accessibilityLabel={settingsSubscriptionDisplayLabels.refreshSessionAccessibility}
	                accessibilityRole="button"
	                accessibilityState={{ disabled: isAuthOperationInFlight }}
	                style={[styles.secondaryButton, isAuthOperationInFlight ? styles.buttonDisabled : null]}
                disabled={isAuthOperationInFlight}
                onPress={refreshAuthSessionFromSecurity}
              >
                <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.refreshSession}</Text>
              </Pressable>
              <Pressable
	                accessibilityLabel={settingsSubscriptionDisplayLabels.loadSessionsAccessibility}
	                accessibilityRole="button"
	                accessibilityState={{ disabled: isAuthOperationInFlight }}
	                style={[styles.secondaryButton, isAuthOperationInFlight ? styles.buttonDisabled : null]}
                disabled={isAuthOperationInFlight}
                onPress={loadAuthSessionsFromSecurity}
              >
                <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.loadSessions}</Text>
              </Pressable>
              <Pressable
	                accessibilityLabel={settingsSubscriptionDisplayLabels.logoutLocalAccessibility}
	                accessibilityRole="button"
	                accessibilityState={{ disabled: isAuthOperationInFlight }}
	                style={[styles.secondaryButton, isAuthOperationInFlight ? styles.buttonDisabled : null]}
                disabled={isAuthOperationInFlight}
                onPress={logoutAuthSessionFromSecurity}
              >
                <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.logoutLocal}</Text>
              </Pressable>
              <Pressable
	                accessibilityLabel={settingsSubscriptionDisplayLabels.logoutAllAccessibility}
	                accessibilityRole="button"
	                accessibilityState={{ disabled: isAuthOperationInFlight }}
	                style={[styles.dangerButton, isAuthOperationInFlight ? styles.buttonDisabled : null]}
                disabled={isAuthOperationInFlight}
                onPress={logoutAllAuthSessionsFromSecurity}
              >
                <Text style={styles.dangerButtonText}>{settingsSubscriptionDisplayLabels.logoutAll}</Text>
              </Pressable>
            </View>
            {authSessionDisplayItems.length > 0 ? (
              <View style={styles.aiReviewList}>
                {authSessionDisplayItems.map((item) => (
                  <View key={item.key} style={styles.aiReviewCard}>
                    <View style={styles.iconCircleSmall}>
                      <Text>裝</Text>
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.recordContent}>{item.title}</Text>
                      <Text style={styles.evidence}>{item.copy}</Text>
                      <Text style={styles.evidence}>{item.lastUsed}</Text>
                    </View>
                    <Text style={styles.previewModeBadge}>{item.statusLabel}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.aiReviewList}>
              {sessionManagementDisplayItems.map((item) => (
                <Pressable
                  key={item.title}
                  accessibilityLabel={item.accessibilityLabel}
                  accessibilityRole="button"
                  style={styles.aiReviewCard}
                  onPress={() => pressAuthSessionManagementPreview(item)}
                >
                  <View style={styles.iconCircleSmall}>
                    <Text>裝</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.recordContent}>{item.title}</Text>
                    <Text style={styles.evidence}>{item.copy}</Text>
                  </View>
                  <Text style={styles.previewModeBadge}>{item.statusLabel}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.authReadiness}</Text>
              <Text style={styles.evidence}>{accountSecurityReadinessBoundaryDisplayText}</Text>
              <Text style={styles.evidence}>{boundUiMessage(tokenStorageStatus)}</Text>
              {productionAuthReadinessDisplayRows.map((item) => (
                <View key={item.title} style={styles.highlightRow}>
                  <Text style={styles.previewModeBadge}>{item.statusLabel}</Text>
                  <View style={styles.timelineContent}>
                    <Text style={styles.recordContent}>{item.title}</Text>
                    <Text style={styles.evidence}>{item.copy}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.authBoundary}</Text>
              {authBoundaryChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.noAction}</Text>
              <Text style={styles.evidence}>{accountSecurityNoActionBoundaryDisplayText}</Text>
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={settingsSubscriptionDisplayLabels.returnSettingsAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromSettingsSubpage}
              >
                <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.returnSettings}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={settingsSubscriptionDisplayLabels.localClearAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={clearLocalSessionFromSettings}
              >
                <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.localClearButton}</Text>
              </Pressable>
            </View>
            {authActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{settingsSubscriptionDisplayLabels.localStateResult}</Text>
                <Text style={styles.evidence}>{authActionStatusDisplayText}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {currentScreen === "profileSettings" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>個人資料</Text>
                <Text style={styles.evidence}>只顯示已同步帳號與照護對象，不在本機假造個資。</Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromSettingsSubpage}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.accountCard}>
              <View style={styles.iconCircle}>
                <Text>人</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.recordContent}>{accountDisplayName}</Text>
                <Text style={styles.evidence}>{accountEmailDisplayText}</Text>
                <Text style={styles.evidence}>登入模式：{authModeDisplayLabel}</Text>
              </View>
            </View>
            <View style={styles.reportBoundaryGrid}>
              {profileSettingsBoundaryRows.map((row) => (
                <View key={row.label} style={styles.reportBoundaryCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.recordType}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.profileEditReadiness}</Text>
              {profileReadinessChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.noAction}</Text>
              <Text style={styles.evidence}>{profileNoActionBoundaryDisplayText}</Text>
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={settingsSubscriptionDisplayLabels.returnSettingsAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromSettingsSubpage}
              >
                <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.returnSettings}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={settingsSubscriptionDisplayLabels.editIntegrationAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={showProfileEditIntegrationStatus}
              >
                <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.editIntegrationButton}</Text>
              </Pressable>
            </View>
            {profileActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{settingsSubscriptionDisplayLabels.editIntegrationStatus}</Text>
                <Text style={styles.evidence}>{profileActionStatusDisplayText}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {currentScreen === "recordingQuotaSettings" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>錄音額度</Text>
                <Text style={styles.evidence}>{recordingQuotaIntroDisplayText}</Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromSettingsSubpage}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{auxiliaryDisplayLabels.quotaControl}</Text>
              <Text style={styles.evidence}>{recordingQuotaControlDisplayText}</Text>
            </View>
            <View style={styles.quotaCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.label}>{settingsSubscriptionDisplayLabels.voiceUsageStatus}</Text>
                <Text style={styles.countText}>{quotaStatusDisplayText}</Text>
              </View>
              <View style={styles.quotaBarTrack}>
                <View style={[styles.quotaBarFill, { width: `${quotaUsageDisplayPercent}%` }]} />
              </View>
              <View style={styles.quotaStatsRow}>
                <Text style={styles.evidence}>{quotaUsedDisplayText}</Text>
                <Text style={quotaRemainingLow ? styles.warningText : styles.evidence}>{quotaRemainingDisplayText}</Text>
              </View>
              <Text style={styles.evidence}>{quotaDailyLimitDisplayText}</Text>
            </View>
            <View style={styles.reportBoundaryGrid}>
              {recordingQuotaBoundaryRows.map((row) => (
                <View key={row.label} style={styles.reportBoundaryCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.recordType}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.formalReadiness}</Text>
              {quotaReadinessChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.dataCostBoundary}</Text>
              <Text style={styles.evidence}>{recordingQuotaDataBoundaryDisplayText}</Text>
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={settingsSubscriptionDisplayLabels.returnSettingsAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromSettingsSubpage}
              >
                <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.returnSettings}</Text>
              </Pressable>
              <Pressable
	                accessibilityLabel={recordingQuotaSyncAccessibilityDisplayLabel}
	                accessibilityRole="button"
	                accessibilityState={{ disabled: isQuotaSyncing }}
	                style={[styles.secondaryButton, isQuotaSyncing ? styles.buttonDisabled : null]}
                disabled={isQuotaSyncing}
                onPress={syncRecordingQuotaSettings}
              >
                <Text style={styles.secondaryButtonText}>{recordingQuotaSyncButtonDisplayLabel}</Text>
              </Pressable>
            </View>
            {recordingQuotaActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{settingsSubscriptionDisplayLabels.quotaSyncStatus}</Text>
                <Text style={styles.evidence}>{recordingQuotaActionStatusDisplayText}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {currentScreen === "reminderSettings" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>提醒設定</Text>
                <Text style={styles.evidence}>{reminderSettingsIntroDisplayText}</Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromSettingsSubpage}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{reminderPreviewBoundaryDisplay.badge}</Text>
              <Text style={styles.evidence}>{reminderPreviewBoundaryDisplay.copy}</Text>
            </View>
            <View style={styles.aiReviewList}>
              {reminderPreviewDisplayItems.map((item) => (
                <View key={item.title} style={styles.aiReviewCard}>
                  <View style={styles.iconCircleSmall}>
                    <Text>鈴</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.recordContent}>{item.title}</Text>
                    <Text style={styles.confidence}>{item.time}</Text>
                    <Text style={styles.evidence}>{item.copy}</Text>
                  </View>
                  <Text style={styles.previewModeBadge}>{item.statusLabel}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.formalReadiness}</Text>
              {reminderReadinessChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={settingsSubscriptionDisplayLabels.returnSettingsAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromSettingsSubpage}
              >
                <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.returnSettings}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={reminderIntegrationAccessibilityDisplayLabel}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={showReminderIntegrationStatus}
              >
                <Text style={styles.secondaryButtonText}>{reminderIntegrationButtonDisplayLabel}</Text>
              </Pressable>
            </View>
            {reminderActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{settingsSubscriptionDisplayLabels.notificationStatus}</Text>
                <Text style={styles.evidence}>{reminderActionStatusDisplayText}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {currentScreen === "privacySettings" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>通知與隱私</Text>
                <Text style={styles.evidence}>{privacySettingsIntroDisplayText}</Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromSettingsSubpage}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{privacyPreviewBoundaryDisplay.badge}</Text>
              <Text style={styles.evidence}>{privacyPreviewBoundaryDisplay.copy}</Text>
            </View>
            <View style={styles.reportBoundaryGrid}>
              {privacyBoundaryRows.map((row) => (
                <View key={row.label} style={styles.reportBoundaryCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.recordType}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.formalReadiness}</Text>
              {privacyReadinessChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.aiReviewList}>
              {privacyControlDisplayRows.map((row) => (
                <View key={row.title} style={styles.aiReviewCard}>
                  <View style={styles.iconCircleSmall}>
                    <Text>{row.icon}</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.recordContent}>{row.title}</Text>
                    <Text style={styles.evidence}>{row.copy}</Text>
                  </View>
                  <Text style={styles.previewModeBadge}>{row.statusLabel}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={settingsSubscriptionDisplayLabels.returnSettingsAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={returnFromSettingsSubpage}
              >
                <Text style={styles.secondaryButtonText}>{settingsSubscriptionDisplayLabels.returnSettings}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={privacyIntegrationAccessibilityDisplayLabel}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={showPrivacyIntegrationStatus}
              >
                <Text style={styles.secondaryButtonText}>{privacyIntegrationButtonDisplayLabel}</Text>
              </Pressable>
            </View>
            {privacyActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{settingsSubscriptionDisplayLabels.privacyStatus}</Text>
                <Text style={styles.evidence}>{privacyActionStatusDisplayText}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {currentScreen === "tutorial" ? (
          <View style={styles.pageSection}>
            <Text style={styles.sectionTitle}>使用教學</Text>
            {tutorialDisplaySteps.map((step) => (
              <View key={step.title} style={styles.timelineCard}>
                <View style={styles.iconCircle}>
                  <Text>{step.icon}</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.recordType}>{step.title}</Text>
                  <Text style={styles.evidence}>{step.description}</Text>
                </View>
              </View>
            ))}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{auxiliaryDisplayLabels.tutorialSafety}</Text>
              {tutorialSafetyChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <Pressable
              accessibilityLabel={auxiliaryDisplayLabels.tutorialStartAccessibility}
              accessibilityRole="button"
              style={styles.primaryButtonFull}
              onPress={openTutorialRecordEntry}
            >
              <Text style={styles.primaryButtonText}>{auxiliaryDisplayLabels.startUse}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={auxiliaryDisplayLabels.tutorialManualAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={openTutorialManualRecord}
            >
              <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.switchManualAdd}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "achievements" ? (
          <View style={styles.pageSection}>
            <Text style={styles.sectionTitle}>成就榜</Text>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{auxiliaryDisplayLabels.localPreview}</Text>
              <Text style={styles.evidence}>{achievementPreviewBoundaryDisplayText}</Text>
            </View>
            <View style={styles.heroCardFeature}>
              <View style={styles.heroIconBubble}>
                <Text style={styles.heroIconText}>🏆</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.evidence}>{auxiliaryDisplayLabels.unlocked}</Text>
                <Text style={styles.heroNumber}>{unlockedAchievementDisplayCount} 項成就</Text>
                <Text style={styles.evidence}>{achievementNextBadgeDisplayText}</Text>
              </View>
            </View>
            {achievementNewlyUnlockedDisplayItems.length > 0 ? (
              <View style={styles.openSection}>
                <Text style={styles.label}>本次新解鎖</Text>
                {achievementNewlyUnlockedDisplayItems.map((displayItem) => (
                  <View key={`new-unlock-${displayItem.id}`} style={styles.timelineCard}>
                    <View
                      style={[
                        styles.achievementBadge,
                        displayItem.kind === "streak" ? styles.achievementBadgeStreak : null,
                        { backgroundColor: displayItem.badgeColor }
                      ]}
                    >
                      <Text style={styles.achievementBadgeIcon}>{displayItem.icon}</Text>
                      <Text style={styles.achievementBadgeLevel}>{displayItem.level}</Text>
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.recordContent}>{displayItem.title}</Text>
                      <Text style={styles.evidence}>
                        {displayItem.kindLabel} · {achievementUnlockDisplayDate(displayItem.unlockedAt)}
                      </Text>
                    </View>
                    <Text style={styles.previewModeBadge}>新解鎖</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {achievementUnlockedDisplayItems.length > 0 ? (
              <View style={styles.openSection}>
                <Text style={styles.label}>已解鎖徽章</Text>
                {achievementUnlockedDisplayItems.map((displayItem) => (
                  <View key={`unlock-${displayItem.id}`} style={styles.timelineCard}>
                    <View
                      style={[
                        styles.achievementBadge,
                        displayItem.kind === "streak" ? styles.achievementBadgeStreak : null,
                        { backgroundColor: displayItem.badgeColor }
                      ]}
                    >
                      <Text style={styles.achievementBadgeIcon}>{displayItem.icon}</Text>
                      <Text style={styles.achievementBadgeLevel}>{displayItem.level}</Text>
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.recordContent}>{displayItem.title}</Text>
                      <Text style={styles.evidence}>
                        {displayItem.kindLabel} · {achievementUnlockDisplayDate(displayItem.unlockedAt)}
                      </Text>
                    </View>
                    <Text style={styles.previewModeBadge}>已保存</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {achievementCategoryDisplaySections.map((section) => (
              <View key={section.key} style={styles.openSection}>
                <Text style={styles.label}>{section.label}</Text>
                {section.items.map((displayItem) => {
                  const isUnlocked = displayItem.progress >= displayItem.target;
                  const progressRatio = Math.min(1, displayItem.progress / displayItem.target);
                  return (
                    <View
                      key={displayItem.id}
                      accessibilityLabel={displayItem.accessibilityLabel}
                      style={[styles.achievementCard, isUnlocked ? styles.achievementUnlocked : null]}
                    >
                      <View
                        style={[
                          styles.achievementBadge,
                          displayItem.kind === "streak" ? styles.achievementBadgeStreak : null,
                          { backgroundColor: displayItem.badgeColor }
                        ]}
                      >
                        <Text style={styles.achievementBadgeIcon}>{displayItem.icon}</Text>
                        <Text style={styles.achievementBadgeLevel}>{displayItem.level}</Text>
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.recordContent}>{displayItem.title}</Text>
                          <Text style={isUnlocked ? styles.recordType : styles.confidence}>
                            {isUnlocked ? "完成" : displayItem.progressLabel}
                          </Text>
                        </View>
                        <Text style={styles.evidence}>{displayItem.kindLabel} · {displayItem.description}</Text>
                        <View style={styles.achievementProgressTrack}>
                          <View
                            style={[
                              styles.achievementProgressFill,
                              displayItem.kind === "streak" ? styles.achievementProgressFillStreak : null,
                              { width: `${Math.round(progressRatio * 100)}%` }
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
            <Text style={styles.evidence}>{achievementLocalComputationDisplayText}</Text>
            <Pressable
              accessibilityLabel={achievementIntegrationAccessibilityDisplayLabel}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={showAchievementIntegrationStatus}
            >
              <Text style={styles.secondaryButtonText}>{achievementIntegrationButtonDisplayLabel}</Text>
            </Pressable>
            {achievementActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{auxiliaryDisplayLabels.achievementStatus}</Text>
                <Text style={styles.evidence}>{achievementActionStatusDisplayText}</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={auxiliaryDisplayLabels.achievementsReturnAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={returnFromAchievements}
            >
              <Text style={styles.secondaryButtonText}>{achievementsReturnButtonDisplayLabel}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "yearReview" ? (
          <View style={styles.pageSection}>
            <Text style={styles.sectionTitle}>年度回顧</Text>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{auxiliaryDisplayLabels.yearPreview}</Text>
              <Text style={styles.evidence}>{yearReviewPreviewBoundaryDisplayText}</Text>
            </View>
            <View style={styles.heroCardFeature}>
              <View style={styles.heroIconBubble}>
                <Text style={styles.heroIconText}>✦</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.evidence}>{yearReviewTargetDisplayYear} 年回顧</Text>
                <Text style={styles.heroNumber}>{yearReviewHeroRecordCountDisplayText}</Text>
                <Text style={styles.evidence}>{yearReviewLiveCalculationDisplayText}</Text>
              </View>
            </View>
            <View style={styles.metricGrid}>
              {yearlyReviewMetricRows.map((row) => (
                <View key={row.label} style={styles.metricCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.metricValue}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.metricGrid}>
              {yearlyHealthOutcomeRows.map((row) => (
                <View key={row.label} style={styles.metricCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.metricValue}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.highlightCard}>
              <Text style={styles.label}>{auxiliaryDisplayLabels.yearHighlights}</Text>
              {yearlyHighlightDisplayTexts.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
              {yearlyGlucoseAverageDisplayText ? (
                <View style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{yearlyGlucoseAverageDisplayText}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>AI 年度重要觀察</Text>
              <Text style={styles.evidence}>{yearlyAiObservationDisplayText}</Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>AI 年度總結與鼓勵</Text>
              <Text style={styles.evidence}>{yearlyAiEncouragementDisplayText}</Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{auxiliaryDisplayLabels.yearReviewSource}</Text>
              <Text style={styles.evidence}>{yearReviewSourceDisplayText}</Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{auxiliaryDisplayLabels.yearReviewBoundary}</Text>
              <Text style={styles.evidence}>{yearReviewBoundaryDisplayText}</Text>
            </View>
            <View style={styles.highlightCard}>
              <View style={styles.yearBadgeRow}>
                <View style={styles.heroIconBubble}>
                  <Text style={styles.heroIconText}>✓</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.label}>{auxiliaryDisplayLabels.yearEncouragementBadge}</Text>
                  <Text style={styles.recordContent}>恭喜你持續記錄、照顧自己！</Text>
                  <Text style={styles.evidence}>{yearReviewBadgeMaterialDisplayText}</Text>
                </View>
              </View>
            </View>
            <Pressable
              accessibilityLabel={yearReviewShareAccessibilityDisplayLabel}
              accessibilityRole="button"
              style={styles.primaryButtonFull}
              onPress={showYearReviewShareStatus}
            >
              <Text style={styles.primaryButtonText}>{yearReviewShareButtonDisplayLabel}</Text>
            </Pressable>
            {yearReviewActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{auxiliaryDisplayLabels.shareStatus}</Text>
                <Text style={styles.evidence}>{yearReviewActionStatusDisplayText}</Text>
              </View>
            ) : null}
            {yearReviewSharePackageId ? (
              <Pressable
                accessibilityLabel={yearReviewRevokeShareAccessibilityDisplayLabel}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={revokeYearReviewShareStatus}
              >
                <Text style={styles.secondaryButtonText}>{yearReviewRevokeShareButtonDisplayLabel}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityLabel={auxiliaryDisplayLabels.yearReviewReturnAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={returnFromYearReview}
            >
              <Text style={styles.secondaryButtonText}>{yearReviewReturnButtonDisplayLabel}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "store" ? (
          <View style={styles.pageSection}>
            <Text style={styles.sectionTitle}>商城</Text>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{auxiliaryDisplayLabels.storePreview}</Text>
              <Text style={styles.evidence}>{storePreviewBoundaryDisplayText}</Text>
            </View>
            <View style={styles.reportBoundaryGrid}>
              {storeRedemptionBoundaryRows.map((row) => (
                <View key={row.label} style={styles.reportBoundaryCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.recordType}>{row.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.searchField}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                accessibilityLabel={auxiliaryDisplayLabels.storeSearchInputAccessibility}
                style={styles.searchInput}
                placeholder="搜尋商品"
                value={storeSearchText}
                onChangeText={updateStoreSearchInput}
                maxLength={maxStoreSearchTextLength}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.segmentRow}>
              {storeCategoryDisplayOptions.map((category) => (
                <Pressable
                  key={category.value}
                  accessibilityLabel={category.accessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={{ selected: storeCategory === category.value }}
                  style={[
                    styles.segmentPill,
                    storeCategory === category.value ? styles.segmentActive : null
                  ]}
                  onPress={() => pressStoreCategoryOption(category)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      storeCategory === category.value ? styles.segmentTextActive : null
                    ]}
                  >
                    {category.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {visibleStoreProducts.length > 0 ? visibleStoreProducts.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productImage}>
                  <Text style={styles.productImageText}>{product.icon}</Text>
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.recordContent}>{product.title}</Text>
                    {product.badge ? <Text style={styles.productBadge}>{product.badge}</Text> : null}
                  </View>
                  <Text style={styles.evidence}>{product.description}</Text>
                  <Text style={styles.planPriceText}>{product.pointsCost}</Text>
                </View>
                <Pressable
                  accessibilityLabel={product.actionAccessibilityLabel}
                  accessibilityRole="button"
                  style={styles.roundActionButton}
                  onPress={() => pressStoreProductStatus(product)}
                >
                  <Text style={styles.secondaryButtonText}>{product.rewardStatus === "redeemable" ? "兌" : auxiliaryDisplayLabels.productOpenArrow}</Text>
                </Pressable>
              </View>
            )) : (
              <View style={styles.emptyStateCard}>
                <View style={styles.iconCircleMuted}>
                  <Text>搜</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.recordType}>{storeEmptySearchDisplay.title}</Text>
                  <Text style={styles.recordContent}>{storeEmptySearchDisplay.copy}</Text>
                  <Text style={styles.evidence}>{storeEmptySearchDisplay.evidence}</Text>
                </View>
              </View>
            )}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>我的兌換券</Text>
              {storeRedemptionDisplayItems.length > 0 ? (
                storeRedemptionDisplayItems.map((product) => (
                  <View key={product.id} style={styles.productCard}>
                    <View style={styles.productImage}>
                      <Text style={styles.productImageText}>券</Text>
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.recordContent}>{product.title}</Text>
                        <Text style={styles.productBadge}>{product.statusLabel}</Text>
                      </View>
                      <Text style={styles.evidence}>{product.subtitle}</Text>
                    </View>
                    <Pressable
                      accessibilityLabel={product.actionAccessibilityLabel}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !product.isUsable }}
                      style={[
                        styles.roundActionButton,
                        !product.isUsable ? styles.buttonDisabled : null
                      ]}
                      disabled={!product.isUsable}
                      onPress={() => pressStoreRedemptionStatus(product)}
                    >
                      <Text style={styles.secondaryButtonText}>{product.actionLabel}</Text>
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={styles.evidence}>尚未同步兌換券；完成食物分享取得點數後可兌換優惠券或折扣碼。</Text>
              )}
            </View>
            {storeActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{auxiliaryDisplayLabels.storeProductStatus}</Text>
                <Text style={styles.evidence}>{storeActionStatusDisplayText}</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={storeCartButtonAccessibilityDisplayLabel}
              accessibilityRole="button"
              style={styles.primaryButtonFull}
              onPress={openStoreCart}
            >
              <Text style={styles.primaryButtonText}>{storeCartButtonDisplayLabel}</Text>
            </Pressable>
            <Text style={styles.evidence}>{storeLocalBoundaryDisplayText}</Text>
            <Pressable
              accessibilityLabel={auxiliaryDisplayLabels.storeReturnAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={returnFromStore}
            >
              <Text style={styles.secondaryButtonText}>{storeReturnButtonDisplayLabel}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "storeCart" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>購物車</Text>
                <Text style={styles.evidence}>{storeCartIntroDisplayText}</Text>
              </View>
              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromStoreCartToStore}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.emptyStateCard}>
              <View style={styles.iconCircleMuted}>
                <Text>袋</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.recordType}>{storeCartUnavailableDisplay.title}</Text>
                <Text style={styles.recordContent}>{storeCartUnavailableDisplay.copy}</Text>
                <Text style={styles.evidence}>{storeCartUnavailableDisplay.evidence}</Text>
              </View>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{storeCheckoutReadinessTitleDisplayText}</Text>
              {storeCheckoutReadinessChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
              <Text style={styles.warningText}>{storeCartUnavailableDisplay.legalWarning}</Text>
            </View>
            <Pressable
              accessibilityLabel={auxiliaryDisplayLabels.storeCartCheckoutAccessibility}
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              style={[styles.primaryButtonFull, styles.buttonDisabled]}
              disabled
            >
              <Text style={styles.primaryButtonText}>{storeCartUnavailableDisplay.checkoutLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={auxiliaryDisplayLabels.storeCartReturnAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={returnFromStoreCartToStore}
            >
              <Text style={styles.secondaryButtonText}>{storeCartReturnButtonDisplayLabel}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "foodPhoto" ? (
          <View style={styles.pageSection}>
            <Text style={styles.sectionTitle}>食物拍照分析</Text>
            <Text style={styles.evidence}>{foodPhotoIntroDisplayText}</Text>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{foodPhotoVisionBoundaryDisplay.badge}</Text>
              <Text style={styles.evidence}>{foodPhotoVisionBoundaryDisplay.copy}</Text>
            </View>
            <Pressable
              accessibilityLabel={auxiliaryDisplayLabels.foodPhotoUploadAccessibility}
              accessibilityRole="button"
              style={styles.uploadBox}
              onPress={showFoodPhotoUploadStatus}
            >
              <Text style={styles.heroNumber}>📷</Text>
              <Text style={styles.recordContent}>{foodPhotoUploadBoxDisplayLabel}</Text>
              <Text style={styles.evidence}>{foodPhotoVisionBoundaryDisplay.uploadUnavailable}</Text>
            </Pressable>
            <View style={styles.inlineInfoBlock}>
              <View style={styles.sectionHeader}>
                <Text style={styles.label}>{foodPhotoResultDisplayTitle}</Text>
                <Text style={styles.previewModeBadge}>{foodPhotoVisionBoundaryDisplay.resultPending}</Text>
              </View>
              {foodPhotoEmptyResultChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={foodPhotoIntegrationAccessibilityDisplayLabel}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={showFoodPhotoIntegrationStatus}
              >
                <Text style={styles.secondaryButtonText}>{foodPhotoIntegrationButtonDisplayLabel}</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{foodPhotoReadinessTitleDisplayText}</Text>
              {foodPhotoReadinessChecklistItems.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <Text style={styles.recordType}>•</Text>
                  <Text style={styles.evidence}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={foodPhotoRetakeAccessibilityDisplayLabel}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={showFoodPhotoRetakeStatus}
              >
                <Text style={styles.secondaryButtonText}>{foodPhotoRetakeButtonDisplayLabel}</Text>
              </Pressable>
            </View>
            {foodPhotoActionStatus ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{auxiliaryDisplayLabels.foodPhotoStatus}</Text>
                <Text style={styles.evidence}>{foodPhotoActionStatusDisplayText}</Text>
              </View>
            ) : null}
            <Text style={styles.evidence}>
              {foodPhotoVisionBoundaryDisplay.futureBoundary}
            </Text>
            <Pressable
              accessibilityLabel={auxiliaryDisplayLabels.foodPhotoReturnAccessibility}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={returnFromFoodPhoto}
            >
              <Text style={styles.secondaryButtonText}>{foodPhotoReturnButtonDisplayLabel}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAF8"
  },
  keyboardAvoidingRoot: {
    flex: 1
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 16
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 8
  },
  title: {
    color: "#0F3F37",
    fontSize: 40,
    fontWeight: "800"
  },
  subtitle: {
    color: "#5F666A",
    fontSize: 16,
    marginTop: 6
  },
  menuButton: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  menuButtonText: {
    color: "#0F3F37",
    fontSize: 22,
    fontWeight: "900"
  },
  menuButtonDisabled: {
    opacity: 0.45
  },
  topTabs: {
    marginHorizontal: -4
  },
  tabPill: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 999,
    borderWidth: 1,
    marginHorizontal: 4,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  tabPillActive: {
    backgroundColor: "#3FA67F",
    borderColor: "#3FA67F"
  },
  tabPillDisabled: {
    backgroundColor: "#F7FCFA",
    opacity: 0.55
  },
  tabPillText: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  },
  tabPillTextActive: {
    color: "#FFFFFF"
  },
  tabPillTextDisabled: {
    color: "#9AA3A0"
  },
  summaryPill: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  summaryPillText: {
    color: "#0F3F37",
    fontSize: 15,
    fontWeight: "800"
  },
  recordList: {
    gap: 12
  },
  emptyStateCard: {
    alignItems: "flex-start",
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    padding: 16
  },
  timelineCard: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    minHeight: 72,
    padding: 16,
    shadowColor: "#0F3F37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 1
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  iconCircleMuted: {
    alignItems: "center",
    backgroundColor: "#F1F3F2",
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  iconCircleSmall: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  timelineContent: {
    flex: 1,
    gap: 3
  },
  accountCard: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    minHeight: 80,
    padding: 16
  },
  settingsList: {
    gap: 10
  },
  settingsRow: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    minHeight: 64,
    padding: 14
  },
  settingsChevron: {
    color: "#3FA67F",
    fontSize: 28,
    fontWeight: "600"
  },
  developerSettingsBox: {
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  pageSection: {
    gap: 14
  },
  label: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  },
  fieldLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  fieldLabelIcon: {
    color: "#3FA67F",
    fontSize: 15,
    fontWeight: "900",
    minWidth: 20,
    textAlign: "center"
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    color: "#1E1E1E",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  inputDisabled: {
    opacity: 0.55
  },
  searchField: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  searchIcon: {
    color: "#3FA67F",
    fontSize: 18,
    fontWeight: "900"
  },
  searchInput: {
    color: "#1E1E1E",
    flex: 1,
    fontSize: 16,
    padding: 0
  },
  transcriptInput: {
    minHeight: 180,
    lineHeight: 24
  },
  homeTranscriptInput: {
    minHeight: 104,
    lineHeight: 24
  },
  homeMinimalSection: {
    alignItems: "center",
    flex: 1,
    gap: 14,
    justifyContent: "center",
    minHeight: 620,
    paddingBottom: 72,
    paddingTop: 96
  },
  homeMicButton: {
    alignItems: "center",
    backgroundColor: "#3FA67F",
    borderColor: "#D6EEE4",
    borderRadius: 999,
    borderWidth: 8,
    height: 220,
    justifyContent: "center",
    shadowColor: "#0F3F37",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    width: 220
  },
  homeMicButtonActive: {
    backgroundColor: "#0F3F37",
    transform: [{ scale: 0.98 }]
  },
  homeMicIcon: {
    color: "#FFFFFF",
    fontSize: 72,
    lineHeight: 84
  },
  homeHint: {
    color: "#8A9690",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
    marginTop: 8,
    textAlign: "center"
  },
  homeHintSecondary: {
    color: "#8A9690",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center"
  },
  homeRecordingTimer: {
    color: "#0F3F37",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 28,
    minHeight: 28,
    textAlign: "center"
  },
  quickEntryRail: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  quickEntryItem: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    flexGrow: 1,
    gap: 4,
    minHeight: 72,
    minWidth: "30%",
    padding: 12
  },
  quickEntryIcon: {
    color: "#3FA67F",
    fontSize: 18,
    fontWeight: "900"
  },
  quickEntryLabel: {
    color: "#0F3F37",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18
  },
  quickEntryCopy: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16
  },
  voiceCaptureCard: {
    alignItems: "center",
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    padding: 16
  },
  recordHoldButton: {
    alignItems: "center",
    backgroundColor: "#3FA67F",
    borderRadius: 999,
    height: 108,
    justifyContent: "center",
    padding: 12,
    width: 108
  },
  recordHoldButtonActive: {
    backgroundColor: "#0F3F37"
  },
  recordHoldIcon: {
    color: "#FFFFFF",
    fontSize: 26
  },
  recordHoldText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 6
  },
  recordingResultCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  transcriptReviewInput: {
    minHeight: 320,
    lineHeight: 26,
    fontSize: 18
  },
  jsonInput: {
    minHeight: 220,
    lineHeight: 22,
    fontSize: 14
  },
  multilineField: {
    minHeight: 96,
    lineHeight: 22
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 24
  },
  status: {
    color: "#5F666A",
    flex: 1,
    fontSize: 13
  },
  flowStepperCard: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#D6EEE4",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    padding: 12
  },
  flowStepItem: {
    alignItems: "center",
    flex: 1,
    gap: 6,
    minWidth: 0
  },
  flowStepDot: {
    alignItems: "center",
    backgroundColor: "#F1F3F2",
    borderColor: "#E3E8E5",
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  flowStepDotActive: {
    backgroundColor: "#3FA67F",
    borderColor: "#3FA67F"
  },
  flowStepDotDone: {
    backgroundColor: "#0F3F37",
    borderColor: "#0F3F37"
  },
  flowStepDotText: {
    color: "#5F666A",
    fontSize: 12,
    fontWeight: "900"
  },
  flowStepDotTextActive: {
    color: "#FFFFFF"
  },
  flowStepLabel: {
    color: "#5F666A",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center"
  },
  flowStepLabelActive: {
    color: "#0F3F37"
  },
  chip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  chipSelected: {
    backgroundColor: "#3FA67F",
    borderColor: "#3FA67F"
  },
  chipDisabled: {
    backgroundColor: "#F1F3F2",
    opacity: 0.55
  },
  chipText: {
    color: "#0F3F37",
    fontSize: 13,
    fontWeight: "800"
  },
  chipTextSelected: {
    color: "#ffffff"
  },
  chipTextDisabled: {
    color: "#5F666A"
  },
  actionRow: {
    flexWrap: "wrap",
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end"
  },
  actionGrid: {
    flexWrap: "wrap",
    flexDirection: "row",
    gap: 10
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#3FA67F",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 96,
    paddingHorizontal: 20,
    paddingVertical: 14
  },
  buttonDisabled: {
    opacity: 0.45
  },
  primaryButtonFull: {
    alignItems: "center",
    backgroundColor: "#3FA67F",
    borderRadius: 24,
    minHeight: 58,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  secondaryButtonText: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: "#FCEEEE",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  dangerButtonText: {
    color: "#C85D5D",
    fontSize: 14,
    fontWeight: "900"
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: "#0F3F37",
    fontSize: 20,
    fontWeight: "800"
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  segmentPill: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  segmentActive: {
    backgroundColor: "#3FA67F",
    borderColor: "#3FA67F"
  },
  segmentText: {
    color: "#0F3F37",
    fontSize: 13,
    fontWeight: "800"
  },
  segmentTextActive: {
    color: "#FFFFFF"
  },
  dateRangeCard: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderColor: "#D6EEE4",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  dateRangeEditor: {
    gap: 10,
    paddingTop: 2
  },
  historySection: {
    gap: 8
  },
  historyCalendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  historyMonthActionRow: {
    flexDirection: "row",
    flexShrink: 0,
    gap: 8
  },
  historyMonthButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#3FA67F",
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 68,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  historyCalendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  historyCalendarDay: {
    alignItems: "center",
    borderRadius: 14,
    height: 46,
    justifyContent: "center",
    position: "relative",
    width: 46
  },
  historyCalendarDayMuted: {
    backgroundColor: "#F1F4F2"
  },
  historyCalendarDayHasRecords: {
    backgroundColor: "#EAF6F1",
    borderColor: "#3FA67F",
    borderWidth: 1
  },
  historyCalendarDaySelected: {
    backgroundColor: "#0F3F37",
    borderColor: "#0F3F37"
  },
  historyCalendarDayText: {
    color: "#8A9690",
    fontSize: 14,
    fontWeight: "800"
  },
  historyCalendarDayTextActive: {
    color: "#0F3F37"
  },
  historyCalendarDayTextSelected: {
    color: "#FFFFFF"
  },
  historyCalendarDot: {
    backgroundColor: "#3FA67F",
    borderRadius: 999,
    bottom: 6,
    height: 5,
    position: "absolute",
    width: 5
  },
  historySelectedDatePanel: {
    gap: 12
  },
  historyRawCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  historyItem: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    color: "#1E1E1E",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    padding: 14
  },
  historyItemButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    minHeight: 72,
    padding: 14
  },
  historyItemHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  historyItemTitle: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10
  },
  historyItemText: {
    color: "#1E1E1E",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21
  },
  detailHero: {
    backgroundColor: "#EAF6F1",
    borderRadius: 24,
    gap: 6,
    padding: 20
  },
  detailValue: {
    color: "#3FA67F",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38
  },
  detailRows: {
    gap: 8,
    paddingVertical: 2
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 10
  },
  dateTimeField: {
    flex: 1,
    gap: 8
  },
  detailRow: {
    alignItems: "flex-start",
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    padding: 14
  },
  formField: {
    gap: 8
  },
  chartCard: {
    gap: 14,
    minHeight: 226,
    paddingVertical: 2
  },
  chartHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  chartTooltip: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderColor: "#D6EEE4",
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  chartTooltipValue: {
    color: "#0F3F37",
    fontSize: 20,
    fontWeight: "900"
  },
  chartTooltipLabel: {
    color: "#5F666A",
    fontSize: 12,
    fontWeight: "800"
  },
  lineChartCanvas: {
    backgroundColor: "#F7FCFA",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    height: 148,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingTop: 14
  },
  chartGridLineTop: {
    backgroundColor: "#E3E8E5",
    height: 1,
    left: 10,
    position: "absolute",
    right: 10,
    top: 22
  },
  chartGridLineMiddle: {
    backgroundColor: "#E3E8E5",
    height: 1,
    left: 10,
    opacity: 0.8,
    position: "absolute",
    right: 10,
    top: 74
  },
  chartGridLineBottom: {
    backgroundColor: "#E3E8E5",
    bottom: 20,
    height: 1,
    left: 10,
    opacity: 0.8,
    position: "absolute",
    right: 10
  },
  lineChartRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    height: 126,
    justifyContent: "space-between"
  },
  lineChartPointColumn: {
    alignItems: "center",
    height: 126,
    minWidth: 44,
    position: "relative"
  },
  lineChartStem: {
    backgroundColor: "rgba(63, 166, 127, 0.14)",
    borderRadius: 999,
    flex: 1,
    marginTop: 4,
    width: 4
  },
  lineChartStemSelected: {
    backgroundColor: "rgba(63, 166, 127, 0.28)"
  },
  lineChartPoint: {
    backgroundColor: "#FFFFFF",
    borderColor: "#3FA67F",
    borderRadius: 999,
    borderWidth: 3,
    height: 16,
    marginTop: -4,
    width: 16
  },
  lineChartPointSelected: {
    backgroundColor: "#3FA67F",
    borderColor: "#0F3F37",
    height: 20,
    width: 20
  },
  lineChartConnector: {
    backgroundColor: "#3FA67F",
    borderRadius: 999,
    height: 3,
    left: -28,
    opacity: 0.55,
    position: "absolute",
    top: 64,
    width: 34
  },
  chartXAxisRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  chartAxisLabel: {
    color: "#5F666A",
    flex: 1,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center"
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 20,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: "46%",
    padding: 14
  },
  metricValue: {
    color: "#3FA67F",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4
  },
  previewModeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF6F1",
    borderColor: "#D6EEE4",
    borderRadius: 999,
    borderWidth: 1,
    color: "#0F3F37",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  reportBoundaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  reportBoundaryCard: {
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 18,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: "46%",
    padding: 12
  },
  infoBanner: {
    backgroundColor: "#EAF6F1",
    borderRadius: 18,
    padding: 12
  },
  successHero: {
    alignItems: "center",
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 22
  },
  successIconCircle: {
    alignItems: "center",
    backgroundColor: "#3FA67F",
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  dangerIconCircle: {
    alignItems: "center",
    backgroundColor: "#C85D5D",
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  successIconText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900"
  },
  pricingCard: {
    gap: 10,
    paddingVertical: 2
  },
  priceText: {
    color: "#0F3F37",
    fontSize: 30,
    fontWeight: "900"
  },
  subscriptionStatusCard: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    padding: 16
  },
  quotaCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 16
  },
  quotaBarTrack: {
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 12,
    overflow: "hidden"
  },
  quotaBarFill: {
    backgroundColor: "#3FA67F",
    borderRadius: 999,
    height: 12
  },
  quotaStatsRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12
  },
  warningText: {
    color: "#C85D5D",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19
  },
  planGrid: {
    gap: 10
  },
  planCardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  planCardRecommended: {
    backgroundColor: "#F7FCFA",
    borderColor: "#3FA67F"
  },
  planPriceText: {
    color: "#0F3F37",
    fontSize: 24,
    fontWeight: "900"
  },
  comparisonRow: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 12
  },
  comparisonFeature: {
    color: "#0F3F37",
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "900",
    minWidth: 86
  },
  comparisonCell: {
    color: "#5F666A",
    flex: 1,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    minWidth: 74,
    textAlign: "center"
  },
  comparisonCellStrong: {
    color: "#3FA67F",
    flex: 1,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 17,
    minWidth: 74,
    textAlign: "center"
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  closeButtonText: {
    color: "#0F3F37",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 30
  },
  menuCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    justifyContent: "center",
    minHeight: 118,
    padding: 16,
    width: "47%"
  },
  menuIconCenter: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  menuIconText: {
    fontSize: 26
  },
  menuLabel: {
    color: "#0F3F37",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center"
  },
  moreButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 10
  },
  moreActionIcon: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  visualSmokeRouteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center"
  },
  visualSmokeRouteChip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  visualSmokeRouteChipText: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20
  },
  devResetInline: {
    alignItems: "center",
    borderColor: "#F3C9BA",
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 16
  },
  heroCard: {
    backgroundColor: "#EAF6F1",
    borderRadius: 24,
    gap: 6,
    padding: 20
  },
  heroCardFeature: {
    alignItems: "flex-start",
    backgroundColor: "#EAF6F1",
    borderColor: "#D6EEE4",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    padding: 20
  },
  heroIconBubble: {
    alignItems: "center",
    backgroundColor: "#3FA67F",
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  heroIconText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900"
  },
  heroNumber: {
    color: "#0F3F37",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36
  },
  achievementCard: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    padding: 16
  },
  achievementUnlocked: {
    borderColor: "#9EDBC4",
    backgroundColor: "#F7FCFA"
  },
  openSection: {
    gap: 10
  },
  achievementBadge: {
    alignItems: "center",
    borderRadius: 10,
    height: 58,
    justifyContent: "center",
    minWidth: 58,
    paddingHorizontal: 8
  },
  achievementBadgeStreak: {
    borderRadius: 999,
    transform: [{ rotate: "-3deg" }]
  },
  achievementBadgeIcon: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 18
  },
  achievementBadgeLevel: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 20
  },
  achievementProgressTrack: {
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 8,
    marginTop: 8,
    overflow: "hidden"
  },
  achievementProgressFill: {
    backgroundColor: "#3FA67F",
    borderRadius: 999,
    height: 8
  },
  achievementProgressFillStreak: {
    backgroundColor: achievementStreakBadgeColor
  },
  yearBadgeRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  highlightCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 16
  },
  inlineInfoBlock: {
    gap: 8,
    paddingVertical: 2
  },
  highlightRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10
  },
  productCard: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    padding: 14
  },
  productImage: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 18,
    height: 72,
    justifyContent: "center",
    width: 72
  },
  productImageText: {
    color: "#0F3F37",
    fontSize: 24,
    fontWeight: "900"
  },
  productBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    color: "#3FA67F",
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  visionResultCard: {
    alignItems: "center",
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    padding: 14
  },
  foodMetricValue: {
    color: "#0F3F37",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4
  },
  roundActionButton: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  uploadBox: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderColor: "#9EDBC4",
    borderRadius: 24,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: 8,
    minHeight: 180,
    justifyContent: "center",
    padding: 24
  },
  countText: {
    color: "#5F666A",
    fontSize: 13,
    fontWeight: "700"
  },
  aiReviewList: {
    gap: 10
  },
  aiReviewCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#D6EEE4",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    padding: 14
  },
  aiReviewCardStack: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D6EEE4",
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  confidencePill: {
    alignItems: "center",
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  editGlyph: {
    color: "#3FA67F",
    fontSize: 18,
    fontWeight: "900"
  },
  postSaveGrid: {
    gap: 10
  },
  postSaveCard: {
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    minHeight: 72,
    padding: 14
  },
  recordCard: {
    backgroundColor: "#ffffff",
    borderColor: "#E3E8E5",
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 72,
    padding: 14,
    gap: 8
  },
  recordCardSelected: {
    backgroundColor: "#F7FCFA",
    borderColor: "#3FA67F"
  },
  recordHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  recordType: {
    color: "#3FA67F",
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  confidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  recordContent: {
    color: "#1E1E1E",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  evidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  rejectedBox: {
    gap: 8,
    paddingVertical: 2
  },
  rejectedText: {
    color: "#9a3412",
    fontSize: 13
  },
  rejectedEventCard: {
    backgroundColor: "#FFF8ED",
    borderColor: "#EFD6B8",
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: 10
  },
  emptyText: {
    color: "#5F666A",
    fontSize: 14
  },
  debugOutput: {
    backgroundColor: "#0F3F37",
    borderRadius: 18,
    color: "#EAF6F1",
    fontSize: 12,
    lineHeight: 18,
    padding: 10
  }
});
