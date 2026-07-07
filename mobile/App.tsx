import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
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
import * as FileSystem from "expo-file-system";
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
  type AuthProviderChallenge
} from "./authProviderChallenge";
import {
  buildDailyRecordSectionDisplayItems,
  dailyRecordEntryDisplayItem,
  displayPayload,
  displayTextValue,
  manualRecordConfirmDisplayItem,
  pendingRecordDisplayItem,
  rejectedReasonLabel,
  recordDateTimeDisplay,
  recordDetailDisplayItem,
  recordListDisplayItem,
  recordTypeIcon,
  recordTypeLabel
} from "./recordDisplay";
import {
  boundRecordEditField,
  buildPayloadFromEditFields,
  emptyRecordEditFields,
  recordEditFieldMaxLength,
  recordPayloadToEditFields,
  validateRecordForm,
  type RecordEditFields
} from "./recordEditTransforms";
import {
  boundMetadata,
  boundParsePreviewResponse,
  boundRecordItem,
  boundRecordsList,
  mergeRecordsByCursorOrder,
  type ParsePreviewResponse,
  type PendingRecord,
  type RecordItem
} from "./recordBounds";
import {
  menuScreens,
  mvpFlowSteps,
  primaryScreens,
  screenChrome,
  visualSmokeRouteJumps,
  type AppScreen
} from "./navigationConfig";
import {
  boundaryMetricDisplayItem,
  comparisonDisplayItem,
  destinationCardDisplayItem,
  detailPairDisplayItem,
  manualRecordTypeDisplayItem,
  menuScreenDisplayItem,
  metricDisplayItem,
  optionDisplayItem,
  previewTupleDisplayItem,
  reminderPreviewDisplayItem,
  resultChecklistItem,
  sessionManagementPreviewDisplayItem,
  tutorialStepDisplayItem,
  valueLabelDisplayItem,
  visualSmokeRouteJumpDisplayItem
} from "./sharedDisplayItems";
import {
  accountDisplayNameDisplayText,
  accountEmailDisplayValue,
  accountLoginDisplayValue,
  accountPublicDisplayNameText,
  doctorShareAccountBoundaryText
} from "./accountCopy";
import {
  homeRecordingModelStatusCopy,
  homeRecordingPreviewBoundaryCopy,
  homeRecordingSecondaryHint,
  recordPageRecordingPreviewBoundaryCopy,
  recordingActivePreviewCopy,
  recordingElapsedSecondsCopy,
  recordingFinishedStatusMessage,
  recordingIdlePreviewCopy,
  recordingLimitCopy,
  recordingLimitReachedStatusMessage,
  recordingPermissionDeniedStatusMessage,
  recordingQuotaExhaustedStatusMessage,
  recordingResetStatusMessage,
  recordingResultBodyCopy,
  recordingResultPrimaryActionLabel,
  recordingSimulatedResultCopy,
  recordingStartedStatusMessage,
  recordingStartFailureStatusMessage,
  recordingStopFailureStatusMessage,
  recordingTextFallbackStatusMessage,
  recordingWhisperEmptyStatusMessage,
  recordingWhisperFailureStatusMessage,
  recordingWhisperMissingModelStatusMessage,
  recordingWhisperProgressStatusMessage,
  recordingWhisperSuccessStatusMessage,
  transcriptClearedStatusMessage,
  transcriptReturnEditStatusMessage,
  transcriptReviewBackStatusMessage,
  transcriptReviewIntroCopy,
  transcriptReviewPreflightPassedCopy,
  transcriptReviewPreParseGuidanceCopy,
  transcriptReviewSampleWarningCopy,
  transcriptReviewReadyStatusMessage
} from "./recordingCopy";
import {
  aiCandidateEditCancelStatusMessage,
  aiCandidateEditFailureStatusMessage,
  aiCandidateEditOpenStatusMessage,
  aiCandidateEditSuccessStatusMessage,
  aiCandidateRemoveCancelStatusMessage,
  aiCandidateRemoveConfirmStatusMessage,
  aiCandidateRemoveResultStatusMessage,
  aiPartialSaveFailureStatusMessage,
  aiPartialSaveRecordsStatusMessage,
  aiPartialSaveSummaryMessage,
  aiReviewBackendRequiredCopy,
  aiReviewIntroCopy,
  aiReviewLowConfidenceCopy,
  aiReviewNoCandidateBodyCopy,
  aiReviewNoCandidateBoundaryCopy,
  aiReviewNoCandidateTitleCopy,
  aiReviewNoPreviewBodyCopy,
  aiReviewNoPreviewTitleCopy,
  aiReviewRejectedEventsCopy,
  aiReviewRejectedReasonCopy,
  aiRemoveConfirmBoundaryCopy,
  aiRemoveConfirmBoundaryLabel,
  aiRemoveConfirmSourceCopy,
  aiSaveConfirmIntroCopy,
  aiSaveConfirmReadyStatusMessage,
  aiSaveConfirmReturnStatusMessage,
  aiSaveConfirmSubmitLabel,
  aiSaveFailureStatusMessage,
  aiSaveProgressStatusMessage,
  aiSaveRecordsStatusMessage,
  aiSaveSuccessStatusMessage,
  aiSaveSuccessSummaryMessage,
  aiSaveUnavailableStatusMessage,
  dailyRecordLeaveGuardBodyCopy,
  dailyRecordLeaveGuardCancelStatusMessage,
  dailyRecordLeaveGuardConfirmStatusMessage,
  dailyRecordLeaveGuardPromptStatusMessage,
  dailyRecordLeaveGuardQuestionCopy,
  dailyRecordLeaveGuardTitleCopy,
  manualRecordConfirmIntroCopy,
  manualRecordConfirmReadyStatusMessage,
  manualRecordConfirmReturnStatusMessage,
  manualRecordConfirmSubmitLabel,
  manualRecordReturnStatusMessage,
  parserBackendUnavailableStatusMessage,
  parserFailureRecoveryMessage,
  parserFailureStatusMessage,
  parserModelUnavailableStatusMessage,
  parserProgressStatusMessage,
  parserSampleBlockedStatusMessage,
  parserSuccessStatusMessage,
  parserVoiceQuotaSyncedStatusMessage,
  previewRecordEditBoundaryCopy,
  recordDetailReturnStatusMessage,
  tutorialManualEntryStatusMessage,
  tutorialRecordEntryStatusMessage
} from "./recordWorkflowCopy";
import {
  deleteConfirmIntroCopy,
  deleteConfirmReadyStatusMessage,
  deleteConfirmRecordMetaCopy,
  deleteConfirmReturnStatusMessage,
  deleteConfirmSubmitLabel,
  manualRecordCreateFailureStatusMessage,
  manualRecordCreateProgressStatusMessage,
  manualRecordCreateSuccessStatusMessage,
  manualRecordCreateSummaryMessage,
  manualRecordCreateUnavailableStatusMessage,
  recordDeleteFailureStatusMessage,
  recordDeleteProgressStatusMessage,
  recordDeleteSuccessStatusMessage,
  recordDeleteSummaryMessage,
  recordDeleteUnavailableStatusMessage,
  recordEditCancelStatusMessage,
  recordEditIntroCopy,
  recordEditOpenStatusMessage,
  recordResultDestinationStatusMessage,
  recordSyncFailureStatusMessage,
  recordSyncInitialStatusMessage,
  recordSyncLoadingStatusMessage,
  recordSyncPageLoadingStatusMessage,
  recordSyncPageSuccessStatusMessage,
  recordSyncSuccessStatusMessage,
  recordSyncUnavailableStatusMessage,
  recordUpdateFailureStatusMessage,
  recordUpdateProgressStatusMessage,
  recordUpdateSuccessStatusMessage,
  recordUpdateSummaryMessage,
  recordUpdateUnavailableStatusMessage,
  visualSmokeRecordSyncStatusMessage
} from "./recordStatusCopy";
import {
  authLogoutAllProgressStatusMessage,
  authLogoutAllSuccessStatusMessage,
  authLogoutFailureStatusMessage,
  authLogoutProgressStatusMessage,
  authLogoutSuccessStatusMessage,
  authOperationBusyStatusMessage,
  authProviderCallbackRejectedStatusMessage,
  authProviderChallengeCreatedStatusMessage,
  authProviderChallengeFailureStatusMessage,
  authRefreshFailureStatusMessage,
  authRefreshProgressStatusMessage,
  authRefreshStorageFailureStatusMessage,
  authRefreshSuccessStatusMessage,
  authRefreshUnavailableStatusMessage,
  authSessionsFailureStatusMessage,
  authSessionsProgressStatusMessage,
  authSessionsSuccessStatusMessage,
  authSessionsUnavailableStatusMessage,
  backendReconnectFailureDisplayMessages,
  backendReconnectProgressStatusMessage,
  backendReconnectSuccessStatusMessage,
  backendUrlChangedDisplayMessages,
  bootFailureDisplayMessages,
  devLoginDisabledDisplayMessages,
  devResetBusyStatusMessage,
  devResetFailureMessages,
  devResetProgressStatusMessage,
  devResetSuccessDisplayMessages,
  devResetUnavailableStatusMessage,
  localClearDisplayMessages,
  mainInitialStatusMessage,
  oidcExchangeFailureStatusMessage,
  oidcExchangeProgressStatusMessage,
  oidcExchangeStorageFailureStatusMessage,
  oidcExchangeSuccessStatusMessage,
  oidcExchangeUnavailableStatusMessage
} from "./authStatusCopy";
import {
  nativeBenchmarkMissingInputStatusMessage,
  nativeBenchmarkProgressStatusMessage,
  nativeBenchmarkResultStatusMessage,
  nativeDebugDefaultStatusMessage,
  nativeDebugDisabledStatusMessage,
  nativeDownloadedModelsFailureStatusMessage,
  nativeLlamaFailureStatusMessage,
  nativeLlamaMissingInputStatusMessage,
  nativeLlamaOutputSummaryMessage,
  nativeLlamaProgressStatusMessage,
  nativeLlamaSuccessStatusMessage,
  nativeBenchmarkAccessibilityLabel,
  nativeDownloadKindAccessibilityLabel,
  nativeLlamaRunAccessibilityLabel,
  nativeModelDownloadAccessibilityLabel,
  nativeModelDownloadButtonLabel,
  nativeModelDownloadFailureStatusMessage,
  nativeModelDownloadProgressStatusMessage,
  nativeModelDownloadSuccessStatusMessage,
  nativeModuleCheckAccessibilityLabel,
  nativeModuleCheckButtonLabel,
  nativeModuleCheckFailureStatusMessage,
  nativeModuleCheckProgressStatusMessage,
  nativeModuleCheckResultStatusMessage,
  nativeWhisperFailureStatusMessage,
  nativeWhisperMissingInputStatusMessage,
  nativeWhisperProgressStatusMessage,
  nativeWhisperRunAccessibilityLabel,
  nativeWhisperSuccessStatusMessage,
  recordingModelRefreshAccessibilityLabel,
  recordingModelRefreshButtonLabel,
  recordingModelRefreshFailureStatusMessage,
  recordingModelRefreshStatusMessage,
  recordingModelSelectedStatusMessage
} from "./nativeStatusCopy";
import {
  analysisReportFailureStatusMessage,
  analysisReportInFlightStatusMessage,
  analysisReportLoadingStatusMessage,
  analysisReportSuccessStatusMessage,
  detailedReportFailureStatusMessage,
  detailedReportInFlightStatusMessage,
  detailedReportLoadingStatusMessage,
  detailedReportNotLoadedStatusMessage,
  detailedReportResetStatusMessage,
  detailedReportSuccessStatusMessage,
  detailedReportUnavailableStatusMessage,
  reportSourceDisplayItem,
  voiceQuotaInitialStatusMessage,
  voiceQuotaSyncFailureStatusMessage,
  voiceQuotaSyncSuccessStatusMessage,
  voiceQuotaUnavailableStatusMessage
} from "./reportStatusCopy";
import {
  aiSaveFailureBackAiReviewStatusMessage,
  aiSaveFailureManualFallbackStatusMessage,
  aiSaveFailureReturnSaveConfirmStatusMessage,
  aiReviewManualEntryStatusMessage,
  busyActionStatusMessage,
  coreFlowSectionLabels,
  headerActionAccessibilityLabel,
  previewActionClearStatusMessage,
  primaryTabAccessibilityLabel,
  quickEntryModeDisplayItems,
  quickEntryTextModeStatusMessage,
  quickEntryVoicePromptStatusMessage,
  quickRecordIntroCopy,
  recordingButtonAccessibilityLabel,
  recordManualEntryStatusMessage,
  returnDestinationButtonLabel,
  saveSuccessDestinationStatusMessage,
  saveSuccessManualContinueStatusMessage,
  saveSuccessProcessUnsavedStatusMessage,
  saveSuccessRecordEntryStatusMessage,
  saveSuccessViewDetailStatusMessage,
  todayAnalysisStatusMessage,
  todayManualEntryStatusMessage,
  todayRecordDetailStatusMessage,
  todayRecordEntryStatusMessage,
  todayRecordSummaryText,
  transcriptReviewManualEntryStatusMessage,
  type QuickEntryMode
} from "./firstVersionFlowCopy";
import {
  historyManualEntryStatusMessage,
  historyNoRangeRecordsBodyCopy,
  historyNoRangeRecordsTitleCopy,
  historyNoRecordsBodyCopy,
  historyNoRecordsTitleCopy,
  historyRecordDetailStatusMessage,
  historyReturnTodayStatusMessage,
  loadedRecordActionCopy,
  noRealRecordHealthValueCopy
} from "./historyCopy";
import {
  buildHistoryDailyRecordSectionDisplayItems,
  historyCalendarDayDisplayItem,
  historyDailySummaryDisplayItem,
  historyDetailModeDisplayItem,
  historyDetailModes,
  historyRawRecordDisplayItem,
  type HistoryDetailMode
} from "./historyScreenData";
import {
  analysisBoundaryDataCopy,
  analysisChartEmptyCopy,
  analysisCustomApplyStatusMessage,
  analysisCustomRangeStatusCopy,
  analysisDetailedReportStatusMessage,
  analysisManualEntryStatusMessage,
  analysisNoDataCopy,
  analysisNoDataStatusLabel,
  analysisRangeSummaryCopy,
  analysisReportButtonLabel,
  analysisReturnTodayStatusMessage,
  analysisSafetyIntroCopy,
  detailedReportManualEntryStatusMessage,
  detailedReportReturnAnalysisStatusMessage,
  detailedReportReturnTodayStatusMessage,
  type AnalysisRange
} from "./analysisCopy";
import {
  analysisRangeDisplayItem,
  analysisRanges
} from "./analysisScreenData";
import {
  afterMealGlucoseCount as countAfterMealGlucose,
  analysisChartPoints as buildAnalysisChartPoints,
  analysisChartRange,
  analysisGlucoseRecords as buildAnalysisGlucoseRecords,
  analysisGlucoseValues as buildAnalysisGlucoseValues,
  averageNumber,
  beforeMealGlucoseCount as countBeforeMealGlucose,
  highestNumber,
  lowestNumber,
  selectedAnalysisChartPoint
} from "./analysisDataTransforms";
import {
  analysisMetricRows as buildAnalysisMetricRows,
  detailedReportMetricRows as buildDetailedReportMetricRows
} from "./analysisMetricTransforms";
import {
  aiReviewDateLabel,
  boundDailyTranscriptEntries,
  buildDailyRecordSaveRequest,
  createDailyTranscriptEntry,
  dailyRecordDateLabel,
  dailyRecordKeyFromRecords,
  dailyRecordReorganizationDisplayText,
  dailyRecordReorganizationStatusMessage,
  dailyRecordSummaryText,
  dailyTranscriptDisplayItems,
  mergeSameDayParsePreviewDraft,
  type DailyRecordReorganizationReason,
  type DailyTranscriptEntry
} from "./dailyTranscriptTransforms";
import {
  activeProfileInlineText,
  activeProfileLabelText,
  activeProfileRelationshipText,
  advancedSettingsToggleLabel,
  backendReconnectButtonLabel,
  captureVoiceQuotaCopy,
  formatVoiceMinutes,
  isVoiceQuotaLow,
  membershipStatusReturnSubscriptionStatusMessage,
  menuReturnStatusMessage,
  modelRuntimeLabel,
  modelSelectionBoundaryCopy,
  privacyIntegrationAccessibilityLabel,
  privacyIntegrationButtonLabel,
  privacySettingsIntroCopy,
  quotaRemainingDisplayValue,
  quotaUsedDisplayValue,
  recordingQuotaControlCopy,
  recordingQuotaDataBoundaryCopy,
  recordingQuotaIntroCopy,
  recordingQuotaSyncAccessibilityLabel,
  recordingQuotaSyncButtonLabel,
  reminderIntegrationAccessibilityLabel,
  reminderIntegrationButtonLabel,
  reminderSettingsIntroCopy,
  settingsAccountSecurityOpenStatusMessage,
  settingsQuotaHelperText,
  settingsSubpageReturnStatusMessage
} from "./settingsCopy";
import {
  settingsRowDisplayItem,
  settingsRows,
  type SettingsRow
} from "./settingsScreenData";
import {
  downloadedModelDisplayLabel,
  downloadedWhisperModelDisplayItem,
  settingsModelChoiceDisplayItem,
  settingsProfileChoiceDisplayItem
} from "./settingsChoiceDisplay";
import {
  accountSecurityNoActionBoundaryCopy,
  accountSecurityProviderBoundaryCopy,
  accountSecurityReadinessBoundaryCopy,
  accountSecuritySessionBoundaryCopy,
  membershipTrialDaysText,
  planDisplayName,
  profileNoActionBoundaryCopy,
  quotaPlanDisplayText,
  settingsSubscriptionSectionLabels,
  subscriptionCtaBoundaryCopy,
  subscriptionManagementIntroCopy,
  subscriptionManagementNoActionCopy,
  subscriptionManagementOpenStatusMessage,
  subscriptionManagementReturnSettingsStatusMessage,
  subscriptionManagementSyncButtonLabel,
  subscriptionMembershipStatusOpenStatusMessage,
  subscriptionPaymentUnwiredCopy,
  subscriptionStatusLabel,
  subscriptionStatusSummaryText,
  subscriptionSyncButtonLabel,
  subscriptionTrialBoundaryCopy
} from "./subscriptionCopy";
import {
  analysisDateBounds,
  boundDateInputText,
  boundTimeInputText,
  daysAgo,
  formatLocalDateInput,
  formatLocalTimeInput,
  isSameLocalDay,
  localDateKey,
  localDateTimeInputs,
  localDateTimeToIso,
  startOfCurrentMonth
} from "./dateTimeTransforms";

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

type DailyRecordSaveResponse = {
  daily_record: {
    id: string;
    profile_id: string;
    record_date: string;
    summary_text: string;
    record_ids: string[];
    preview_records_json: Record<string, unknown>[];
    transcript_entries_json: DailyTranscriptEntry[];
    source: string;
    created_at: string;
    updated_at: string;
  };
  records: RecordItem[];
};
type DevResetResponse = {
  status: string;
  deleted_counts: Record<string, number>;
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

const defaultApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const enableDebugTools = process.env.EXPO_PUBLIC_ENABLE_DEBUG_TOOLS === "true";
const allowMobileDevAuth = process.env.EXPO_PUBLIC_ALLOW_DEV_AUTH === "true";
const visualSmokeInitialRoute = process.env.EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE ?? "";

const sampleText =
  "今天早上空腹血糖 138，早餐吃蛋餅跟無糖豆漿，下午散步 30 分鐘。";

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

type ManualRecordType = "glucose" | "meal" | "exercise" | "medication" | "note";
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
  eatenDate: string;
  eatenTime: string;
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

type SaveEntryMethod = "ai" | "manual" | null;

const manualRecordTypes: Array<{ id: ManualRecordType; label: string }> = [
  { id: "glucose", label: "血糖" },
  { id: "meal", label: "飲食" },
  { id: "exercise", label: "運動" },
  { id: "medication", label: "用藥" },
  { id: "note", label: "備註" }
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

const maxDateInputLength = 10;
const maxTimeInputLength = 5;
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

const tutorialSteps = [
  ["🎙", "按住說話", "按住首頁或記錄頁的大按鈕開始錄音預覽。"],
  ["✋", "放開結束", "若已選擇本機 Whisper 模型，會先轉成文字並進入確認。"],
  ["✅", "確認內容", "檢查文字與 AI 候選紀錄，確認前不會儲存。"],
  ["💾", "儲存完成", "確認後送出，即可加入今日紀錄。"]
];

function normalizeApiBaseUrl(value: string) {
  return value.trim().replace(/\/$/, "");
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
  return boundDisplayText(`每年 1 月 1 日自動產生前一年度回顧；下一次為 ${nextYear} 年 1 月 1 日`, maxDisplayDetailTextLength);
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
    evidence: boundDisplayText("需等購物車、庫存、出貨、付款與退款規則完成後再接 backend order flow。", maxDisplayDetailTextLength),
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
  return boundDisplayText("查看購物車整合狀態", maxDisplayTextLength);
}

function storeCartButtonAccessibilityLabel() {
  return boundDisplayText("查看購物車、出貨訂單與付款整合狀態；不建立訂單或付款", maxDisplayDetailTextLength);
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
    "食物社群",
    "backend ready 時可同步食物資料庫、送出食物分享、建立點數並刷新排行榜；貼文、留言與內容治理仍未開放。"
  );
}

function communityPublicNameBoundaryCopy() {
  return boundDisplayText(
    "公開名稱與排行榜 opt-in 已可同步 backend；健康紀錄仍預設私密，貼文與留言需另行 opt-in。",
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
  return boundUiMessage("已返回商城；購物車整合狀態不建立訂單、不保存購物車，也不處理付款。");
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

function safeYearReviewShareAssetFileName(value: string) {
  const fallback = "year-review-share-card.svg";
  const bounded = boundDisplayText(value || fallback, maxDisplayTextLength);
  const sanitized = bounded.replace(/[^a-zA-Z0-9._-]/g, "_");
  return sanitized.endsWith(".svg") ? sanitized : `${sanitized || "year-review-share-card"}.svg`;
}

async function writeYearReviewShareAssetFile(asset: YearReviewApiShareAsset) {
  if (!FileSystem.cacheDirectory) {
    throw new Error("year_review_share_cache_unavailable");
  }
  const filename = safeYearReviewShareAssetFileName(asset.filename);
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, asset.svg_text, {
    encoding: FileSystem.EncodingType.UTF8
  });
  return uri;
}

function yearReviewHeroRecordCountCopy(count: number) {
  const boundedCount = clampNumber(count, 0, maxMobileCountValue);
  return boundDisplayText(`前一年度共記錄 ${boundedCount} 次`, maxDisplayTextLength);
}

function yearReviewHeroTitleCopy(targetYear: number) {
  return boundDisplayText(`前一年度 ${targetYear} 年回顧`, maxDisplayTextLength);
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

const homeGuidanceDirections = [
  [
    { icon: "🕒", label: "時間" },
    { icon: "🩸", label: "血糖" },
    { icon: "🍽️", label: "飲食" }
  ],
  [
    { icon: "🏃", label: "運動" },
    { icon: "💊", label: "用藥紀錄" },
    { icon: "😊", label: "身體狀況" }
  ]
].map((row, rowIndex) =>
  row.map((item, itemIndex) => ({
    key: `home-guidance-${rowIndex}-${itemIndex}`,
    icon: boundDisplayText(item.icon, 8),
    label: boundDisplayText(item.label, 20)
  }))
);

const homeSpeechExamples = [
  "今天6月28號，早上起床空腹血糖105，早餐吃兩顆水煮蛋跟無糖豆漿，中午吃雞腿便當沒吃飯，下午騎腳踏車40分鐘，晚上體重77.5公斤。",
  "6月28日。空腹血糖105。早餐兩顆蛋。無糖豆漿一杯。騎腳踏車30分鐘。體重77.5公斤。",
  "今天血糖105，早餐吃蛋跟豆漿。對了，中午沒吃飯只有吃菜。下午有騎車，大概40分鐘吧。晚上量體重77.5公斤。",
  "今天精神不錯，起床先量血糖105。早餐吃得很簡單，兩顆蛋配無糖豆漿。下午去騎腳踏車流了一些汗，希望血糖能慢慢降下來。"
].map((example, index) => ({
  key: `home-example-${index + 1}`,
  label: boundDisplayText(`範例 ${index + 1}`, 20),
  text: boundDisplayText(example, maxDisplayDetailTextLength)
}));

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
  const [previewActionReturnScreen, setPreviewActionReturnScreen] = useState<AppScreen>(
    initialVisualSmokeScreen === "aiSaveConfirm" ? "aiSaveConfirm" : "aiReview"
  );
  const [dailyRecordMenuIndex, setDailyRecordMenuIndex] = useState<number | null>(null);
  const [dailyRecordLeaveGuardVisible, setDailyRecordLeaveGuardVisible] = useState(false);
  const [dailyRecordOrganizationRevision, setDailyRecordOrganizationRevision] = useState(0);
  const [dailyRecordOrganizationReason, setDailyRecordOrganizationReason] =
    useState<DailyRecordReorganizationReason | null>(null);
  const [dailyTranscriptEntries, setDailyTranscriptEntries] = useState<DailyTranscriptEntry[]>([]);
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
  const [homeExampleIndex, setHomeExampleIndex] = useState(0);
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
  const historyDailySummaryDisplayItems = useMemo(
    () =>
      Array.from(historyRecordsByDate.entries())
        .sort(([left], [right]) => right.localeCompare(left))
        .map(([dateKey, dateRecords]) =>
          historyDailySummaryDisplayItem(dateKey, dateRecords, isVisualSmokePreviewMode)
        ),
    [historyRecordsByDate, isVisualSmokePreviewMode]
  );
  const selectedHistoryDailySummary = useMemo(
    () => historyDailySummaryDisplayItem(selectedHistoryDate, selectedHistoryRecords, isVisualSmokePreviewMode),
    [isVisualSmokePreviewMode, selectedHistoryDate, selectedHistoryRecords]
  );
  const selectedHistoryDailySectionItems = useMemo(
    () => buildHistoryDailyRecordSectionDisplayItems(selectedHistoryRecords),
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
    () => buildAnalysisGlucoseRecords(analysisRecords),
    [analysisRecords]
  );
  const analysisGlucoseValues = buildAnalysisGlucoseValues(analysisGlucoseRecords);
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
  const analysisChartPoints = useMemo(
    () => buildAnalysisChartPoints(analysisGlucoseRecords),
    [analysisGlucoseRecords]
  );
  const { minimum: chartMinimum, range: chartRange } = analysisChartRange(analysisChartPoints);
  const selectedAnalysisPoint = selectedAnalysisChartPoint(analysisChartPoints, selectedAnalysisPointIndex);
  const averageGlucose = averageNumber(analysisGlucoseValues);
  const highestGlucose = highestNumber(analysisGlucoseValues);
  const lowestGlucose = lowestNumber(analysisGlucoseValues);
  const beforeMealGlucoseCount = countBeforeMealGlucose(analysisGlucoseRecords);
  const afterMealGlucoseCount = countAfterMealGlucose(analysisGlucoseRecords);
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
  const dailyRecordDateDisplayText = preview ? dailyRecordDateLabel(preview.records) : "";
  const dailyRecordSummaryDisplayText = preview ? dailyRecordSummaryText(preview.records) : "";
  const dailyRecordReorganizationDisplay = dailyRecordReorganizationDisplayText(
    dailyRecordOrganizationReason,
    dailyRecordOrganizationRevision
  );
  const dailyRecordSectionItems = preview ? buildDailyRecordSectionDisplayItems(preview.records) : [];
  const todayTranscriptDisplayItems = dailyTranscriptDisplayItems(preview, dailyTranscriptEntries);
  const todayTranscriptCountDisplayText = boundDisplayText(
    `${clampNumber(todayTranscriptDisplayItems.length, 0, maxListItems)} 段`,
    20
  );
  const todayTranscriptAccessibilityLabel = boundDisplayText(
    `查看今日錄音文字，共 ${todayTranscriptCountDisplayText}`,
    maxDisplayDetailTextLength
  );
  const aiSaveConfirmSubmitDisplayLabel = aiSaveConfirmSubmitLabel(
    isBusy,
    isAiSaveConfirmBlockedByBackend,
    hasAiSaveConfirmWarnings
  );
  const isDailyRecordFixedSaveVisible = currentScreen === "aiSaveConfirm" && Boolean(preview);
  const mainScrollContainerStyle = isDailyRecordFixedSaveVisible
    ? [styles.container, styles.containerWithFixedSaveBar]
    : styles.container;
  const hasUnsavedPreviewRecords = unsavedPreviewRecordCount > 0;
  const hasUnsavedDailyRecordDraft = currentScreen === "aiSaveConfirm" && hasUnsavedPreviewRecords;
  const dailyRecordLeaveGuardTitleDisplayText = dailyRecordLeaveGuardTitleCopy();
  const dailyRecordLeaveGuardBodyDisplayText = dailyRecordLeaveGuardBodyCopy();
  const dailyRecordLeaveGuardQuestionDisplayText = dailyRecordLeaveGuardQuestionCopy();
  const dailyRecordLeaveGuardCancelAccessibilityLabel = boundDisplayText(
    "取消離開，保留每日紀錄草稿",
    maxDisplayDetailTextLength
  );
  const dailyRecordLeaveGuardConfirmAccessibilityLabel = boundDisplayText(
    "離開每日紀錄頁，今天未儲存修改不會保留",
    maxDisplayDetailTextLength
  );
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
  const homeRecordingModelStatusDisplayText = homeRecordingModelStatusCopy(Boolean(whisperModelPath.trim()));
  const homeCurrentSpeechExample = homeSpeechExamples[
    clampNumber(homeExampleIndex, 0, Math.max(homeSpeechExamples.length - 1, 0))
  ];
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
    ["食用時間", `${foodCommunityShareFields.eatenDate} ${foodCommunityShareFields.eatenTime}`],
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
    ["仍待完成", "庫存、出貨訂單、付款與 rollback"],
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
    "社群貼文、留言、封鎖、檢舉與審核流程",
    "健康資料不可自動公開，分享需明確 opt-in",
    "公開分享刪除、撤回與 audit-friendly event stream"
  ].map(resultChecklistItem);
  const rankingReadinessChecklistItems = [
    "封鎖、檢舉與審核流程",
    "榜單爭議處理與公開名稱違規處置",
    "退出排名後的歷史資料撤回與 audit event"
  ].map(resultChecklistItem);
  const storeCheckoutReadinessChecklistItems = [
    "商品目錄、庫存與價格來源",
    "購物車持久化、庫存 reservation 與 rollback 規則",
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
  const reportGlucoseMinimum = activeAnalysisReport?.glucose.minimum ?? lowestGlucose;
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
  const analysisGlucoseMetricCount = clampNumber(activeAnalysisReport?.glucose.count ?? analysisGlucoseRecords.length, 0, maxMobileCountValue);
  const analysisMetricRows = buildAnalysisMetricRows({
    average: activeAnalysisReport?.glucose.average ?? averageGlucose,
    highest: activeAnalysisReport?.glucose.maximum ?? highestGlucose,
    lowest: activeAnalysisReport?.glucose.minimum ?? lowestGlucose,
    glucoseCount: analysisGlucoseMetricCount,
    beforeMealCount: activeAnalysisReport?.glucose.before_meal_count ?? beforeMealGlucoseCount,
    afterMealCount: activeAnalysisReport?.glucose.after_meal_count ?? afterMealGlucoseCount
  });
  const reportRecordDisplayCount = clampNumber(reportRecordCount, 0, maxMobileCountValue);
  const detailedReportMetricRows = buildDetailedReportMetricRows({
    average: reportGlucoseAverage,
    minimum: reportGlucoseMinimum,
    maximum: reportGlucoseMaximum,
    beforeMealCount: reportBeforeMealGlucoseCount,
    afterMealCount: reportAfterMealGlucoseCount,
    mealCount: reportMealCount,
    exerciseCount: reportExerciseCount,
    medicationCount: reportMedicationCount
  });
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
  const isDailyRecordRemoveConfirm = previewActionReturnScreen === "aiSaveConfirm";
  const aiRemoveConfirmTitleDisplayText = boundDisplayText(
    isDailyRecordRemoveConfirm ? "刪除此筆紀錄" : "移除候選紀錄",
    maxDisplayTextLength
  );
  const aiRemoveConfirmSubmitDisplayText = boundDisplayText(
    isDailyRecordRemoveConfirm ? "刪除" : "確認移除",
    maxDisplayTextLength
  );
  const aiRemoveConfirmBoundaryDisplayLabel = aiRemoveConfirmBoundaryLabel(isDailyRecordRemoveConfirm);
  const aiRemoveConfirmBoundaryDisplayText = aiRemoveConfirmBoundaryCopy(isDailyRecordRemoveConfirm);
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
  const yearReviewHeroTitleDisplayText = yearReviewHeroTitleCopy(yearReviewTargetDisplayYear);
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

  function pressHistoryDailyEntry(
    item: ReturnType<typeof buildHistoryDailyRecordSectionDisplayItems>[number]["entries"][number]
  ) {
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

  function pressManualRecordTypeOption(type: (typeof manualRecordTypeDisplayOptions)[number]) {
    selectManualRecordType(type.value);
  }

  function selectHistoryCalendarDate(dateKey: string) {
    setSelectedHistoryDate(boundDateInputText(dateKey));
    setHistoryDetailMode("structured");
  }

  function pressHistoryCalendarDay(item: ReturnType<typeof historyCalendarDayDisplayItem>) {
    selectHistoryCalendarDate(item.value);
  }

  function pressHistoryDailySummary(item: ReturnType<typeof historyDailySummaryDisplayItem>) {
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
    setDailyTranscriptEntries([]);
    setDailyRecordOrganizationRevision(0);
    setDailyRecordOrganizationReason(null);
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
    if (hasUnsavedDailyRecordDraft) {
      requestDailyRecordLeaveGuard();
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

  function requestDailyRecordLeaveGuard() {
    setDailyRecordLeaveGuardVisible(true);
    setStatus(dailyRecordLeaveGuardPromptStatusMessage());
  }

  function cancelDailyRecordLeaveGuard() {
    setDailyRecordLeaveGuardVisible(false);
    setStatus(dailyRecordLeaveGuardCancelStatusMessage());
  }

  function confirmDailyRecordLeaveGuard() {
    setDailyRecordLeaveGuardVisible(false);
    returnFromAiSaveConfirm();
    setStatus(dailyRecordLeaveGuardConfirmStatusMessage());
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
    if (currentScreen === "today" && elapsedSeconds > 1) {
      if (capturedAudioPath && whisperModelPath.trim()) {
        void transcribeRecordingToReview("today", capturedAudioPath, elapsedSeconds);
        return;
      }
      setPreview(null);
      setTranscriptReviewReturnScreen("today");
      setCurrentScreen("transcriptReview");
      setStatus(recordingTextFallbackStatusMessage());
    }
  }

  function releaseRecordingPreview() {
    void finishRecordingPreview();
  }

  function openPreviewRecordEdit(index: number, returnScreen: AppScreen = "aiReview") {
    const record = preview?.records[index];
    if (!record) {
      return;
    }
    setPreviewActionReturnScreen(returnScreen);
    setDailyRecordMenuIndex(null);
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
    setDailyRecordMenuIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    const nowInputs = localDateTimeInputs(new Date());
    setPreviewEditDate(nowInputs.date);
    setPreviewEditTime(nowInputs.time);
    setCurrentScreen(previewActionReturnScreen);
    setStatus(aiCandidateEditCancelStatusMessage());
  }

  function openPreviewRecordRemoveConfirm(index: number, returnScreen: AppScreen = "aiReview") {
    const record = preview?.records[index];
    if (!record) {
      setCurrentScreen(returnScreen);
      return;
    }
    setPreviewActionReturnScreen(returnScreen);
    setDailyRecordMenuIndex(null);
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
    setDailyRecordMenuIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
    setCurrentScreen(previewActionReturnScreen);
    setStatus(aiCandidateRemoveCancelStatusMessage());
  }

  function reorganizeDailyRecordDraftAfterChange(
    nextPreview: ParsePreviewResponse,
    reason: DailyRecordReorganizationReason,
    statusOverride?: string
  ) {
    const reorganizedPreview = boundParsePreviewResponse(nextPreview);
    const nextRevision = clampNumber(dailyRecordOrganizationRevision + 1, 0, maxMobileCountValue);
    setPreview(reorganizedPreview);
    setDailyRecordOrganizationRevision(nextRevision);
    setDailyRecordOrganizationReason(reason);
    setStatus(
      statusOverride ??
        dailyRecordReorganizationStatusMessage(reason, reorganizedPreview.records.length, nextRevision)
    );
  }

  function removePreviewRecord(index: number) {
    if (!preview) {
      return;
    }
    const nextRecords = preview.records.filter((_, recordIndex) => recordIndex !== index);
    if (previewActionReturnScreen === "aiSaveConfirm") {
      reorganizeDailyRecordDraftAfterChange({ ...preview, records: nextRecords }, "delete");
    } else {
      setPreview(boundParsePreviewResponse({ ...preview, records: nextRecords }));
      setStatus(aiCandidateRemoveResultStatusMessage(nextRecords.length));
    }
    setPendingPreviewRemoveIndex(null);
    setDailyRecordMenuIndex(null);
  }

  function confirmPreviewRecordRemove() {
    if (pendingPreviewRemoveIndex === null || !pendingPreviewRemoveRecord) {
      setPendingPreviewRemoveIndex(null);
      setCurrentScreen(previewActionReturnScreen);
      return;
    }
    removePreviewRecord(pendingPreviewRemoveIndex);
    setCurrentScreen(previewActionReturnScreen);
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
      if (previewActionReturnScreen === "aiSaveConfirm") {
        reorganizeDailyRecordDraftAfterChange({ ...preview, records: nextRecords }, "edit");
      } else {
        setPreview(boundParsePreviewResponse({ ...preview, records: nextRecords }));
        setStatus(aiCandidateEditSuccessStatusMessage());
      }
      setSelectedPreviewIndex(null);
      setPreviewEditFields(emptyRecordEditFields());
      setDailyRecordMenuIndex(null);
      setCurrentScreen(previewActionReturnScreen);
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

  function openTodayTranscriptText() {
    setStatus(boundUiMessage("今日錄音文字已在下方展開；不重新呼叫 STT、AI 或 backend。"));
  }

  function openDailyRecordEntryMenu(item: ReturnType<typeof dailyRecordEntryDisplayItem>) {
    setDailyRecordMenuIndex((current) => (current === item.index ? null : item.index));
    setStatus(
      boundUiMessage(
        `已開啟${item.typeLabel}單筆管理；可選擇編輯或刪除，尚未寫入 backend。`
      )
    );
  }

  function pressDailyRecordEntryMenu(item: ReturnType<typeof dailyRecordEntryDisplayItem>) {
    openDailyRecordEntryMenu(item);
  }

  function editDailyRecordEntry(item: ReturnType<typeof dailyRecordEntryDisplayItem>) {
    openPreviewRecordEdit(item.index, "aiSaveConfirm");
  }

  function pressDailyRecordEntryEdit(item: ReturnType<typeof dailyRecordEntryDisplayItem>) {
    editDailyRecordEntry(item);
  }

  function deleteDailyRecordEntry(item: ReturnType<typeof dailyRecordEntryDisplayItem>) {
    openPreviewRecordRemoveConfirm(item.index, "aiSaveConfirm");
  }

  function pressDailyRecordEntryDelete(item: ReturnType<typeof dailyRecordEntryDisplayItem>) {
    deleteDailyRecordEntry(item);
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

  function updateFoodCommunityEatenDate(value: string) {
    setFoodCommunityShareFields((current) => ({
      ...current,
      eatenDate: boundDateInputText(value)
    }));
  }

  function updateFoodCommunityEatenTime(value: string) {
    setFoodCommunityShareFields((current) => ({
      ...current,
      eatenTime: boundTimeInputText(value)
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
        boundUiMessage(`${protectedAccountBackendUnavailableMessage || "backend account 尚未 ready"}；目前只顯示本機商城目錄。`)
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
      const shareAssetUri = await writeYearReviewShareAssetFile(shareAsset);
      const shareResult = await Share.share({
        title: shareFilename,
        message: boundDisplayText(sharePackage.share_text, maxDisplayDetailTextLength),
        url: shareAssetUri
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
    let eatenAt = "";
    try {
      eatenAt = localDateTimeToIso(foodCommunityShareFields.eatenDate, foodCommunityShareFields.eatenTime);
    } catch (error) {
      setCommunityActionStatus(boundUiMessage(error instanceof Error ? error.message : "食用時間格式不正確。"));
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
            eaten_at: eatenAt,
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
    const existingDailyPreview = preview;
    setPreview(null);
    setParserRecoveryMessage("");
    setStatus(parserProgressStatusMessage());
    const parserVoiceSeconds = clampNumber(transcriptVoiceSeconds, 0, maxMobileCountValue);
    const parseOccurredAt = new Date().toISOString();
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
            occurred_at: parseOccurredAt,
            voice_seconds: parserVoiceSeconds
          })
        }
      );
      const boundedPreview = boundParsePreviewResponse(response);
      const mergedDailyPreview = mergeSameDayParsePreviewDraft(existingDailyPreview, boundedPreview);
      const transcriptEntry = createDailyTranscriptEntry(
        parseOccurredAt,
        transcript,
        parserVoiceSeconds > 0 ? "voice" : "text"
      );
      if (transcriptEntry) {
        setDailyTranscriptEntries((current) => boundDailyTranscriptEntries([...current, transcriptEntry]));
      }
      setTranscriptVoiceSeconds(0);
      setCurrentScreen("aiReview");
      reorganizeDailyRecordDraftAfterChange(
        mergedDailyPreview,
        "add",
        parserVoiceSeconds > 0
          ? parserVoiceQuotaSyncedStatusMessage(mergedDailyPreview.records.length, parserVoiceSeconds)
          : parserSuccessStatusMessage(mergedDailyPreview.records.length)
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
    try {
      const saveResponse = await requestJson<DailyRecordSaveResponse>(
        normalizedApiBaseUrl,
        "/daily-records/save",
        {
          method: "POST",
          headers: protectedRequestHeaders(account.id, accessToken),
          body: JSON.stringify(buildDailyRecordSaveRequest(preview, recordsToSave, dailyTranscriptEntries))
        }
      );
      const createdRecords = boundRecordsList(saveResponse.records, maxMobilePreviewRecords);
      const savedCount = recordsToSave.length;
      setPreview(null);
      setTranscript("");
      setTranscriptVoiceSeconds(0);
      setIsTranscriptSample(false);
      setDailyTranscriptEntries([]);
      setDailyRecordOrganizationRevision(0);
      setDailyRecordOrganizationReason(null);
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
      setLastSaveErrorSummary(message);
      setLastSaveEntryMethod("ai");
      setCurrentScreen("aiSaveFailure");
      setStatus(message);
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
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (hasUnsavedDailyRecordDraft) {
        requestDailyRecordLeaveGuard();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [hasUnsavedDailyRecordDraft]);

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
    if (currentScreen !== "today" || homeSpeechExamples.length <= 1) {
      return;
    }
    const timer = setInterval(() => {
      setHomeExampleIndex((value) => (value + 1) % homeSpeechExamples.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [currentScreen]);

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
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={mainScrollContainerStyle}
        keyboardShouldPersistTaps="handled"
      >
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
            <View style={styles.homeGuidanceSection}>
              <View style={styles.homeTaglineRow}>
                <Text style={styles.homeTaglineCue}>✦</Text>
                <Text style={styles.homeTagline}>想說什麼就說什麼</Text>
                <Text style={styles.homeTaglineCue}>✦</Text>
              </View>
              <View style={styles.homeGuidancePanel}>
                {homeGuidanceDirections.map((row, rowIndex) => (
                  <View key={`home-guidance-row-${rowIndex}`} style={styles.homeGuidanceRow}>
                    {row.map((item) => (
                      <View key={item.key} style={styles.homeGuidanceItem}>
                        <Text style={styles.homeGuidanceIcon}>{item.icon}</Text>
                        <Text style={styles.homeGuidanceLabel}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
              <View style={styles.homeGuidanceInfoRow}>
                <View style={styles.homeGuidanceInfoIcon}>
                  <Text style={styles.homeGuidanceInfoIconText}>i</Text>
                </View>
                <Text style={styles.homeGuidanceCopy}>
                  上面這排不是按鈕喔{"\n"}
                  如果不知道從哪開始，可以參考這些記錄方向；想說什麼就說什麼，不用照固定格式。
                </Text>
              </View>
            </View>
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
            <Text style={styles.homeModelStatus}>{homeRecordingModelStatusDisplayText}</Text>
            <View style={styles.homeExamplePanel}>
              <Text style={styles.homeExampleTitle}>範例（怎麼說都可以）</Text>
              <View style={styles.homeExampleMetaRow}>
                <Text style={styles.homeExampleIndex}>{homeCurrentSpeechExample.label}</Text>
                <View style={styles.homeExamplePagination} accessibilityLabel={`目前第 ${homeExampleIndex + 1} 個範例，共 ${homeSpeechExamples.length} 個`}>
                  {homeSpeechExamples.map((example, index) => (
                    <View
                      key={`${example.key}-dot`}
                      style={[
                        styles.homeExampleDot,
                        index === homeExampleIndex ? styles.homeExampleDotActive : null
                      ]}
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.homeExampleText}>{homeCurrentSpeechExample.text}</Text>
            </View>
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
              <View style={styles.timelineContent}>
                <Text style={styles.sectionTitle}>每日紀錄</Text>
                <Text style={styles.evidence}>{aiSaveConfirmIntroDisplayText}</Text>
              </View>
              <Pressable
                accessibilityLabel={coreFlowDisplayLabels.returnConfirmAccessibility}
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={requestDailyRecordLeaveGuard}
              >
                <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.returnConfirm}</Text>
              </Pressable>
            </View>
            {dailyRecordLeaveGuardVisible ? (
              <View style={styles.dailyLeaveGuardCard}>
                <Text style={styles.label}>{dailyRecordLeaveGuardTitleDisplayText}</Text>
                <Text style={styles.warningText}>{dailyRecordLeaveGuardBodyDisplayText}</Text>
                <Text style={styles.evidence}>{dailyRecordLeaveGuardQuestionDisplayText}</Text>
                <View style={styles.actionRow}>
                  <Pressable
                    accessibilityLabel={dailyRecordLeaveGuardCancelAccessibilityLabel}
                    accessibilityRole="button"
                    style={styles.secondaryButton}
                    onPress={cancelDailyRecordLeaveGuard}
                  >
                    <Text style={styles.secondaryButtonText}>取消</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={dailyRecordLeaveGuardConfirmAccessibilityLabel}
                    accessibilityRole="button"
                    style={styles.dangerButton}
                    onPress={confirmDailyRecordLeaveGuard}
                  >
                    <Text style={styles.dangerButtonText}>離開</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <View style={styles.dailyRecordDateCard}>
              <Text style={styles.confidence}>記錄日期</Text>
              <Text style={styles.dailyRecordDateText}>{dailyRecordDateDisplayText}</Text>
            </View>
            <View style={styles.dailySummaryCard}>
              <Text style={styles.previewModeBadge}>AI今日摘要</Text>
              <Text style={styles.recordContent}>{dailyRecordSummaryDisplayText}</Text>
              <Text style={styles.evidence}>{dailyRecordReorganizationDisplay}</Text>
            </View>
            <Pressable
              accessibilityLabel={todayTranscriptAccessibilityLabel}
              accessibilityRole="button"
              style={styles.todayTranscriptButton}
              onPress={openTodayTranscriptText}
            >
              <View style={styles.timelineContent}>
                <Text style={styles.label}>今日錄音文字</Text>
                <Text style={styles.evidence}>保留今天所有文字片段；目前先顯示本次整理內容。</Text>
              </View>
              <Text style={styles.countText}>{todayTranscriptCountDisplayText}</Text>
            </Pressable>
            {todayTranscriptDisplayItems.length > 0 ? (
              <View style={styles.dailyTranscriptList}>
                {todayTranscriptDisplayItems.map((item) => (
                  <View key={item.key} style={styles.dailyTranscriptItem}>
                    <Text style={styles.confidence}>{item.timeLabel}</Text>
                    <Text style={styles.evidence}>{item.sourceText}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.dailyRecordSectionList}>
              {dailyRecordSectionItems.map((section) => (
                <View key={section.id} style={styles.dailyRecordSectionCard}>
                  <View style={styles.recordHeader}>
                    <View style={styles.historyItemTitle}>
                      <View style={styles.iconCircleSmall}>
                        <Text>{section.icon}</Text>
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.label}>{section.title}</Text>
                        <Text style={styles.evidence}>欄位依分類顯示；沒有提到的欄位保持空白。</Text>
                      </View>
                    </View>
                    <Text style={styles.countText}>{section.countLabel}</Text>
                  </View>
                  {section.entries.length > 0 ? (
                    section.entries.map((item) => (
                      <View key={item.key} style={styles.dailyRecordEntryCard}>
                        <View style={styles.recordHeader}>
                          <View style={styles.timelineContent}>
                            <Text style={styles.confidence}>{item.timeLabel}</Text>
                            <Text style={styles.recordContent}>{item.payloadSummary}</Text>
                          </View>
                          <Pressable
                            accessibilityLabel={item.accessibilityLabel}
                            accessibilityRole="button"
                            style={styles.roundActionButton}
                            onPress={() => pressDailyRecordEntryMenu(item)}
                          >
                            <Text style={styles.editGlyph}>{item.manageLabel}</Text>
                          </Pressable>
                        </View>
                        <View style={styles.detailRows}>
                          {item.detailRows.map((row) => (
                            <View key={`${item.key}-${row.label}`} style={styles.detailRow}>
                              <Text style={styles.confidence}>{row.label}</Text>
                              <Text style={styles.evidence}>{row.value}</Text>
                            </View>
                          ))}
                        </View>
                        {dailyRecordMenuIndex === item.index ? (
                          <View style={styles.actionRow}>
                            <Pressable
                              accessibilityLabel={item.editAccessibilityLabel}
                              accessibilityRole="button"
                              style={styles.secondaryButton}
                              onPress={() => pressDailyRecordEntryEdit(item)}
                            >
                              <Text style={styles.secondaryButtonText}>編輯</Text>
                            </Pressable>
                            <Pressable
                              accessibilityLabel={item.removeAccessibilityLabel}
                              accessibilityRole="button"
                              style={styles.dangerButton}
                              onPress={() => pressDailyRecordEntryDelete(item)}
                            >
                              <Text style={styles.dangerButtonText}>刪除</Text>
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    ))
                  ) : (
                    <Text style={styles.evidence}>{section.emptyCopy}</Text>
                  )}
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
            <View style={styles.reportBoundaryGrid}>
              {aiSaveConfirmBoundaryRows.map((row) => (
                <View key={row.label} style={styles.reportBoundaryCard}>
                  <Text style={styles.confidence}>{row.label}</Text>
                  <Text style={styles.recordType}>{row.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {currentScreen === "aiRemoveConfirm" && pendingPreviewRemoveRecord && pendingPreviewRemoveDisplayItem ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{aiRemoveConfirmTitleDisplayText}</Text>
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
                <Text style={styles.dangerButtonText}>{aiRemoveConfirmSubmitDisplayText}</Text>
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
            <View style={styles.historyDailySummaryTable}>
              <View style={styles.sectionHeader}>
                <View style={styles.timelineContent}>
                  <Text style={styles.label}>每日摘要表</Text>
                  <Text style={styles.evidence}>點日期查看完整每日紀錄、同步狀態與各分類內容。</Text>
                </View>
              </View>
              {historyDailySummaryDisplayItems.length > 0 ? (
                historyDailySummaryDisplayItems.map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityLabel={item.accessibilityLabel}
                    accessibilityRole="button"
                    accessibilityState={{ selected: item.value === selectedHistoryDate }}
                    style={[
                      styles.historyDailySummaryCard,
                      item.value === selectedHistoryDate ? styles.historyDailySummaryCardSelected : null
                    ]}
                    onPress={() => pressHistoryDailySummary(item)}
                  >
                    <View style={styles.historyDailySummaryHeader}>
                      <View style={styles.timelineContent}>
                        <Text style={styles.historyItemText}>{item.dateLabel}</Text>
                        <Text style={styles.evidence}>{item.countLabel}</Text>
                      </View>
                      <View style={styles.historyStatusPillRow}>
                        <Text style={styles.historyStatusPill}>{item.syncLabel}</Text>
                        <Text style={styles.historyStatusPillMuted}>{item.sourceLabel}</Text>
                      </View>
                    </View>
                    <Text style={styles.recordContent}>{item.summaryText}</Text>
                    <Text style={styles.confidence}>{item.storageLabel}</Text>
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyStateCard}>
                  <View style={styles.iconCircle}>
                    <Text>📅</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.recordContent}>{historyNoRangeRecordsTitleDisplayText}</Text>
                    <Text style={styles.evidence}>{historyNoRangeRecordsBodyDisplayText}</Text>
                  </View>
                </View>
              )}
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
                  <Text style={styles.evidence}>{selectedHistoryDailySummary.storageLabel}</Text>
                </View>
              </View>
              <View style={styles.dailySummaryCard}>
                <View style={styles.historyDailySummaryHeader}>
                  <View style={styles.timelineContent}>
                    <Text style={styles.previewModeBadge}>AI今日摘要</Text>
                    <Text style={styles.recordContent}>{selectedHistoryDailySummary.summaryText}</Text>
                  </View>
                  <View style={styles.historyStatusPillRow}>
                    <Text style={styles.historyStatusPill}>{selectedHistoryDailySummary.syncLabel}</Text>
                    <Text style={styles.historyStatusPillMuted}>{selectedHistoryDailySummary.sourceLabel}</Text>
                  </View>
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
                <View style={styles.dailyRecordSectionList}>
                  {selectedHistoryDailySectionItems.map((section) => (
                    <View key={`history-${section.id}`} style={styles.dailyRecordSectionCard}>
                      <View style={styles.recordHeader}>
                        <View style={styles.historyItemTitle}>
                          <View style={styles.iconCircleSmall}>
                            <Text>{section.icon}</Text>
                          </View>
                          <View style={styles.timelineContent}>
                            <Text style={styles.label}>{section.title}</Text>
                            <Text style={styles.evidence}>可新增多筆；每筆可點進詳情修改。</Text>
                          </View>
                        </View>
                        <Text style={styles.countText}>{section.countLabel}</Text>
                      </View>
                      {section.entries.length > 0 ? (
                        section.entries.map((item) => (
                          <Pressable
                            key={item.key}
                            accessibilityLabel={item.accessibilityLabel}
                            accessibilityRole="button"
                            style={styles.dailyRecordEntryCard}
                            onPress={() => pressHistoryDailyEntry(item)}
                          >
                            <View style={styles.recordHeader}>
                              <View style={styles.timelineContent}>
                                <Text style={styles.confidence}>{item.timeLabel}</Text>
                                <Text style={styles.recordContent}>{item.payloadSummary}</Text>
                              </View>
                              <Text style={styles.countText}>看詳情</Text>
                            </View>
                            <View style={styles.detailRows}>
                              {item.detailRows.map((row) => (
                                <View key={`${item.key}-${row.label}`} style={styles.detailRow}>
                                  <Text style={styles.confidence}>{row.label}</Text>
                                  <Text style={styles.evidence}>{row.value}</Text>
                                </View>
                              ))}
                            </View>
                          </Pressable>
                        ))
                      ) : (
                        <Text style={styles.evidence}>{section.emptyCopy}</Text>
                      )}
                    </View>
                  ))}
                </View>
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
            {enableDebugTools ? (
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
            ) : null}
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
                <Text style={styles.sectionTitle}>食物社群</Text>
                <Text style={styles.evidence}>同步真實食物升糖分享、點數與公開排行榜；貼文留言治理仍待正式開放。</Text>
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
              <Text style={styles.evidence}>建立華人使用者真實食物升糖資料庫，以實際食用前後血糖分享取代理論與網路傳言；backend ready 時同步真實分享，visual smoke 或 backend unavailable 時才顯示本機預覽。</Text>
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
                    <Text style={styles.confidence}>實際升糖參考值（平均）</Text>
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
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeField}>
                  {renderFieldLabel("📅", "食用日期")}
                  <TextInput
                    accessibilityLabel="輸入食物分享食用日期"
                    value={foodCommunityShareFields.eatenDate}
                    onChangeText={updateFoodCommunityEatenDate}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={maxDateInputLength}
                    style={styles.input}
                    placeholder="2026-04-29"
                  />
                </View>
                <View style={styles.dateTimeField}>
                  {renderFieldLabel("🕒", "食用時間")}
                  <TextInput
                    accessibilityLabel="輸入食物分享食用時間"
                    value={foodCommunityShareFields.eatenTime}
                    onChangeText={updateFoodCommunityEatenTime}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={maxTimeInputLength}
                    style={styles.input}
                    placeholder="08:10"
                  />
                </View>
              </View>
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
              <Text style={styles.evidence}>點數已串接商城，可兌換優惠券、商品折扣、特殊徽章與會員福利；出貨、付款與治理流程仍待正式開放。</Text>
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
                <Text style={styles.sectionTitle}>社群排行</Text>
                <Text style={styles.evidence}>同步分享次數、貢獻度與食物測試達人公開榜單；只顯示 opt-in 使用者的非敏感分數。</Text>
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
                <Text style={styles.evidence}>{yearReviewHeroTitleDisplayText}</Text>
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
                <Text style={styles.evidence}>尚未同步兌換紀錄；完成食物分享取得點數後可兌換優惠券、折扣碼、特殊徽章或會員福利。</Text>
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
      {isDailyRecordFixedSaveVisible && preview ? (
        <View style={styles.fixedSaveBarDock}>
          <View style={styles.fixedSaveBar}>
            <Pressable
              accessibilityLabel={coreFlowDisplayLabels.returnConfirmAccessibility}
              accessibilityRole="button"
              accessibilityState={{ disabled: isBusy }}
              style={[styles.secondaryButton, isBusy ? styles.buttonDisabled : null]}
              disabled={isBusy}
              onPress={requestDailyRecordLeaveGuard}
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
  mainScroll: {
    flex: 1
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 16
  },
  containerWithFixedSaveBar: {
    paddingBottom: 148
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
    gap: 12,
    justifyContent: "flex-start",
    minHeight: 620,
    paddingBottom: 42,
    paddingTop: 14
  },
  homeGuidanceSection: {
    alignItems: "center",
    gap: 8,
    maxWidth: 360,
    width: "100%"
  },
  homeTagline: {
    color: "#0F3F37",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 32,
    textAlign: "center"
  },
  homeTaglineCue: {
    color: "#3FA67F",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20
  },
  homeTaglineRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center"
  },
  homeGuidancePanel: {
    backgroundColor: "#EFF8F4",
    borderColor: "#DCEFE7",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%"
  },
  homeGuidanceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center"
  },
  homeGuidanceItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    minHeight: 28,
    minWidth: 88,
    justifyContent: "center"
  },
  homeGuidanceIcon: {
    fontSize: 17,
    lineHeight: 22
  },
  homeGuidanceLabel: {
    color: "#2F5F52",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20
  },
  homeGuidanceCopy: {
    flex: 1,
    color: "#5F666A",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    maxWidth: 300,
    textAlign: "left"
  },
  homeGuidanceInfoIcon: {
    alignItems: "center",
    backgroundColor: "#DCEFE7",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    marginTop: 1,
    width: 24
  },
  homeGuidanceInfoIconText: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18
  },
  homeGuidanceInfoRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 9,
    maxWidth: 350,
    width: "100%"
  },
  homeMicButton: {
    alignItems: "center",
    backgroundColor: "#3FA67F",
    borderColor: "#D6EEE4",
    borderRadius: 999,
    borderWidth: 8,
    height: 220,
    justifyContent: "center",
    marginTop: 24,
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
    minHeight: 22,
    textAlign: "center"
  },
  homeModelStatus: {
    color: "#9AA5A0",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    minHeight: 17,
    textAlign: "center"
  },
  homeExamplePanel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    marginTop: 8,
    maxWidth: 360,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: "100%"
  },
  homeExampleTitle: {
    color: "#0F3F37",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 22,
    textAlign: "left"
  },
  homeExampleIndex: {
    color: "#3FA67F",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 18,
    textAlign: "left"
  },
  homeExampleMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 20
  },
  homeExamplePagination: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "flex-end",
    minWidth: 54
  },
  homeExampleDot: {
    backgroundColor: "#D7E0DC",
    borderRadius: 999,
    height: 6,
    width: 6
  },
  homeExampleDotActive: {
    backgroundColor: "#3FA67F",
    width: 16
  },
  homeExampleText: {
    color: "#3D4642",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    textAlign: "left"
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
  historyDailySummaryTable: {
    gap: 10
  },
  historyDailySummaryCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  historyDailySummaryCardSelected: {
    backgroundColor: "#EAF6F1",
    borderColor: "#3FA67F"
  },
  historyDailySummaryHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
  },
  historyStatusPillRow: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end"
  },
  historyStatusPill: {
    backgroundColor: "#DCEFE7",
    borderRadius: 999,
    color: "#0F3F37",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  historyStatusPillMuted: {
    backgroundColor: "#F1F4F2",
    borderRadius: 999,
    color: "#5F666A",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    paddingHorizontal: 9,
    paddingVertical: 5
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
  dailyRecordDateCard: {
    backgroundColor: "#EAF6F1",
    borderColor: "#D6EEE4",
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    padding: 14
  },
  dailyRecordDateText: {
    color: "#0F3F37",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28
  },
  dailySummaryCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D6EEE4",
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 16
  },
  todayTranscriptButton: {
    alignItems: "center",
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 68,
    padding: 14
  },
  dailyTranscriptList: {
    gap: 8
  },
  dailyTranscriptItem: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 12
  },
  dailyRecordSectionList: {
    gap: 12
  },
  dailyRecordSectionCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D6EEE4",
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  dailyRecordEntryCard: {
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  dailyLeaveGuardCard: {
    backgroundColor: "#FFF7F1",
    borderColor: "#F3C9BA",
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  fixedSaveBar: {
    backgroundColor: "#FAFAF8",
    borderColor: "#E3E8E5",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end",
    padding: 12
  },
  fixedSaveBarDock: {
    backgroundColor: "#FAFAF8",
    borderTopColor: "#E3E8E5",
    borderTopWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 24,
    paddingTop: 10
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
