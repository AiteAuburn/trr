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
  clearStoredAuthSession,
  readStoredAuthSession,
  writeStoredAuthSession
} from "./authTokenStorage";
import { requestJson, requestNoContent } from "./apiClient";
import {
  allowMobileDevAuth,
  defaultApiBaseUrl,
  enableDebugTools,
  initialVisualSmokeScreen,
  maxMobileRecordCacheLimit,
  mobileRecordSyncLimit,
  mobileReportQueryLimit,
  sampleText
} from "./appRuntimeConfig";
import {
  boundDisplayText,
  boundIdentifier,
  boundNativeDebugInput,
  boundStoreSearchText,
  boundUiMessage,
  clampNullableNumber,
  clampNumber,
  maxBackendUrlLength,
  maxDateInputLength,
  maxDisplayDetailTextLength,
  maxDisplayTextLength,
  maxListItems,
  maxMobileCountValue,
  maxMobileGlucoseValue,
  maxMobilePreviewRecords,
  maxMobileRejectedEvents,
  maxNativeDebugInputLength,
  maxStoreSearchTextLength,
  maxTimeInputLength,
  maxTranscriptTextLength,
  normalizeApiBaseUrl
} from "./mobileBounds";
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
  groupedRecordListDisplaySections,
  manualRecordConfirmDisplayItem,
  pendingRecordDisplayItem,
  pendingRecordDisplayItems,
  rejectedPreviewDisplayItems as buildRejectedPreviewDisplayItems,
  recordDetailDisplayItem,
  recordListDisplayItem,
  recordListDisplayItems,
  recordTypeIcon
} from "./recordDisplay";
import {
  boundRecordEditField,
  buildPayloadFromEditFields,
  emptyRecordEditFields,
  glucoseTimingOptions,
  glucoseUnitOptions,
  manualRecordTypes,
  mealTypeOptions,
  recordEditFieldMaxLength,
  recordPayloadToEditFields,
  validateRecordForm,
  type ManualRecordType,
  type RecordEditFields
} from "./recordEditTransforms";
import {
  boundParsePreviewResponse,
  boundRecordItem,
  boundRecordsList,
  mergeRecordsByCursorOrder,
  type ParsePreviewResponse,
  type PendingRecord,
  type RecordItem
} from "./recordBounds";
import {
  createClientSaveBatchId,
  pendingRecordForSave
} from "./recordSaveTransforms";
import {
  headerBackTargetForScreen,
  isSettingsSubpageScreen,
  isVisualSmokeAiPreviewScreen,
  isVisualSmokeRecordListScreen,
  isVisualSmokeSettingsMenuScreen,
  isVisualSmokeSubscriptionStatusScreen,
  menuScreens,
  mvpFlowSteps,
  mvpFlowStepperState,
  primaryScreens,
  primaryTabNavigationState,
  screenChrome,
  transcriptReviewReturnTargetForScreen,
  visualSmokeBootIgnoredDisplayMessages,
  visualSmokeBootSkippedDisplayMessages,
  visualSmokeDeepLinkStatusMessage,
  visualSmokeRouteFromDeepLinkUrl,
  visualSmokeRouteJumps,
  type AppScreen
} from "./navigationConfig";
import {
  achievementBadgeSummary,
  achievementDisplayItems as buildAchievementDisplayItems,
  achievementIntegrationButtonAccessibilityLabel,
  achievementIntegrationButtonLabel,
  achievementItemFromApi,
  achievementLocalComputationCopy,
  achievementNextBadgeCopy,
  achievementPreviewBoundaryCopy,
  achievementStreakBadgeColor,
  achievementSyncStatusMessages,
  achievementUnlockDisplayDate,
  backendYearReviewHealthOutcomeDisplayRows,
  backendYearReviewMetricDisplayRows,
  buildAchievementCategoryDisplaySections,
  communityPublicNameBoundaryCopy,
  communityPreviewBoundaryDisplayItem,
  doctorShareBackendBoundaryCopy,
  doctorSharePreviewBoundaryDisplayItem,
  foodPhotoEmptyResultChecklistDisplayItems,
  foodPhotoIntegrationButtonAccessibilityLabel,
  foodPhotoIntegrationButtonLabel,
  foodPhotoIntroCopy,
  foodPhotoReadinessTitle,
  foodPhotoReadinessChecklistDisplayItems,
  foodPhotoResultTitle,
  foodPhotoRetakeButtonAccessibilityLabel,
  foodPhotoRetakeButtonLabel,
  foodPhotoStatusDisplayTexts,
  foodPhotoUploadBoxLabel,
  foodPhotoVisionBoundaryDisplayItem,
  apiFoodCategoryFromMobile,
  boundCommunityPublicSettings,
  commercePreviewOpenCartStatusMessage,
  commercePreviewReturnStoreStatusMessage,
  communityBoundaryDisplayRows,
  communityActionDisplayTexts,
  communityLeaderboardSyncStatusMessages,
  communityLeaderboardDisplaySection,
  communityPublicSettingsStatusMessages,
  emptyFoodCommunityShareFields,
  communityReadinessChecklistDisplayItems,
  foodCommunityCategories,
  foodCommunityCategoryDisplayItem,
  foodCommunityDetailStatusMessages,
  foodCommunityDisplayBundle,
  foodCommunityItemDisplayItem,
  foodCommunityItemFromApi,
  foodCommunityItems,
  foodCommunityShareStatusMessages,
  foodCommunitySyncStatusMessages,
  futureModuleCards,
  futureModuleCardDisplayItem,
  futureModuleCardDisplayItems,
  futureModuleDetailBoundaryCopy,
  futureModuleDetailReturnStatusMessage,
  futureModuleImplementationOrderCopy,
  futureModulesOpenStatusMessage,
  futureModulesReturnMenuStatusMessage,
  futurePreviewReturnStatusMessage,
  futurePreviewSectionLabels,
  futurePreviewStatusDisplayTexts,
  healthIntegrationBoundaryDisplayRows,
  healthIntegrationExternalDataBoundaryCopy,
  healthIntegrationPreviewBoundaryDisplayItem,
  healthIntegrationReadinessChecklistDisplayItems,
  achievementYearReviewStatusDisplayTexts,
  limitedAchievementDisplayItems,
  localAchievementItemsForRecords,
  mobileFoodCategoryFromApi,
  privacyPreviewBoundaryDisplayItem,
  rankingBoundaryDisplayRows,
  rankingLocalPreviewBoundaryCopy,
  rankingPreviewBoundaryDisplayItem,
  rankingReadinessChecklistDisplayItems,
  reminderPreviewBoundaryDisplayItem,
  selectedFutureModuleDisplayItem,
  localYearlyHealthOutcomeDisplayRows,
  localYearlyHighlightDisplayItems,
  localYearlyReviewMetricDisplayRows,
  saveSuccessNewlyUnlockedAchievementDisplayItems,
  storeCategories,
  storeCategoryDisplayItem,
  storeCartUnavailableDisplayItem,
  storeCheckoutReadinessChecklistDisplayItems,
  storeEmptySearchDisplayItem,
  storeCatalogSyncStatusMessages,
  storePreviewDisplayTexts,
  storeRedeemStatusMessages,
  storeRedemptionUseStatusMessages,
  storeDisplayBundle,
  storeProductFromApi,
  storeProductDisplayItem,
  storeProducts,
  storeRedemptionDisplayItem,
  yearReviewBoundaryDisplayCopy,
  yearReviewHeaderDisplayTexts,
  yearReviewInsightDisplayTexts,
  yearReviewShareCardStatusMessages,
  yearReviewShareUnavailableStatusMessage,
  yearReviewRevokeStatusMessages,
  yearReviewSyncStatusMessages,
  yearReviewTargetYear,
  nextYearReviewGenerationLabel,
  type AchievementApiSummary,
  type AchievementApiUnlock,
  type AchievementItem,
  type CommunityLeaderboardApiResponse,
  type CommunityLeaderboardDisplaySection,
  type CommunityLeaderboardType,
  type CommunityPublicSettings,
  type FoodCommunityApiCategoryRead,
  type FoodCommunityApiItem,
  type FoodCommunityApiShareResponse,
  type FoodCommunityCategory,
  type FoodCommunityItem,
  type FoodCommunityShareFields,
  type FutureModuleCard,
  type StoreApiPointsBalance,
  type StoreApiRedemption,
  type StoreCategory,
  type StoreProduct,
  type StoreRewardApiInput,
  type YearReviewApiResponse,
  type YearReviewApiShareAsset,
  type YearReviewApiSharePackage
} from "./futureModuleDisplay";
import {
  visualSmokeDemoPreview,
  visualSmokeDemoRecord,
  visualSmokeDemoRecordEditFields,
  visualSmokeDemoRecords,
  visualSmokeDemoReport,
  visualSmokeNeedsPreview,
  visualSmokeNeedsRecord,
  visualSmokeNeedsSelectedRecord
} from "./visualSmokeFixtures";
import {
  auxiliarySectionLabels,
  boundaryMetricDisplayItem,
  destinationCardDisplayItem,
  detailPairDisplayItem,
  manualRecordTypeDisplayItems,
  menuScreenDisplayItem,
  menuScreenDisplayItems,
  optionDisplayItem,
  optionDisplayItems,
  previewTupleDisplayItem,
  sessionManagementPreviewDisplayItem,
  valueLabelDisplayItem,
  valueLabelDisplayItems,
  visualSmokeRouteJumpDisplayItem,
  visualSmokeRouteJumpDisplayItems as buildVisualSmokeRouteJumpDisplayItems
} from "./sharedDisplayItems";
import {
  accountDisplayNameDisplayText,
  accountEmailDisplayValue,
  accountLoginDisplayValue,
  accountPublicDisplayNameText,
  accountSecurityAuthModeDisplayTexts,
  doctorShareAccountBoundaryText,
  doctorShareBoundaryDisplayRows,
  doctorShareReadinessChecklistDisplayItems,
  profileSettingsBoundaryDisplayRowsForState,
  profileReadinessChecklistDisplayItems
} from "./accountCopy";
import {
  homeGuidanceDirections,
  homeSpeechExamples,
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
  shouldOpenTodayRecordingTranscriptReview,
  transcriptClearedStatusMessage,
  transcriptReviewCostBoundaryChecklistDisplayItems,
  transcriptReviewDisplayTexts,
  transcriptReviewStatusDisplayTexts,
  transcriptReturnEditStatusMessage,
  transcriptReviewBackStatusMessage,
  transcriptReviewReadyStatusMessage,
  validateTranscriptForParser
} from "./recordingCopy";
import {
  aiCandidateEditCancelStatusMessage,
  aiCandidateEditFailureStatusMessage,
  aiCandidateEditOpenStatusMessage,
  aiCandidateEditSuccessStatusMessage,
  aiCandidateRemoveCancelStatusMessage,
  aiCandidateRemoveChecklistDisplayItems,
  aiCandidateRemoveConfirmStatusMessage,
  aiCandidateRemoveResultStatusMessage,
  aiPartialSaveFailureStatusMessage,
  aiPartialSaveRecordsStatusMessage,
  aiPartialSaveSummaryMessage,
  aiReviewCostBoundaryChecklistDisplayItems,
  aiReviewDisplayTexts,
  aiRemoveConfirmDisplayTexts,
  aiSaveConfirmBoundaryDisplayRows,
  aiSaveConfirmChecklistDisplayItems,
  aiSaveConfirmDisplayTexts,
  aiSaveConfirmReadyStatusMessage,
  aiSaveConfirmReturnStatusMessage,
  aiSaveFailureChecklistDisplayItems,
  aiSaveFailureStatusMessage,
  aiSaveProgressStatusMessage,
  aiSaveRecordsStatusMessage,
  aiSaveSuccessStatusMessage,
  aiSaveSuccessSummaryMessage,
  aiSaveUnavailableStatusMessage,
  dailyRecordLeaveGuardCancelStatusMessage,
  dailyRecordLeaveGuardConfirmStatusMessage,
  dailyRecordLeaveGuardDisplayTexts,
  dailyRecordLeaveGuardPromptStatusMessage,
  manualRecordConfirmDisplayTexts,
  manualRecordConfirmReadyStatusMessage,
  manualRecordConfirmReturnStatusMessage,
  manualRecordReturnStatusMessage,
  manualSubmitChecklistDisplayItems,
  parserAvailabilityDisplayMessages,
  parserBackendUnavailableStatusMessage,
  parserFailureRecoveryMessage,
  parserFailureStatusMessage,
  parserModelUnavailableText,
  parserModelUnavailableStatusMessage,
  parserProgressStatusMessage,
  parserSampleBlockedStatusMessage,
  parserSuccessStatusMessage,
  parserVoiceQuotaSyncedStatusMessage,
  previewRecordEditBoundaryCopy,
  recordDetailBoundaryChecklistDisplayItems,
  recordDetailReturnStatusMessage,
  recordEntrySettingsChecklistDisplayItems,
  saveResultDisplayTexts,
  saveSuccessBoundaryChecklistDisplayItems,
  tutorialManualEntryStatusMessage,
  tutorialRecordEntryStatusMessage
} from "./recordWorkflowCopy";
import {
  deleteSuccessBoundaryChecklistDisplayItems,
  deleteConfirmDisplayTexts,
  deleteConfirmReadyStatusMessage,
  deleteConfirmReturnStatusMessage,
  deleteConfirmChecklistDisplayItems,
  manualRecordCreateDisplayTexts,
  manualRecordCreateFailureStatusMessage,
  manualRecordCreateProgressStatusMessage,
  manualRecordCreateSuccessStatusMessage,
  manualRecordCreateSummaryMessage,
  manualRecordCreateUnavailableStatusMessage,
  previewRecordEditValidationDisplayText,
  recordDeleteFailureStatusMessage,
  recordDeleteProgressStatusMessage,
  recordDeleteSuccessStatusMessage,
  recordDeleteSummaryMessage,
  recordDeleteUnavailableStatusMessage,
  recordEditCancelStatusMessage,
  recordEditDisplayTexts,
  recordEditOpenStatusMessage,
  recordResultDestinationStatusMessage,
  recordSyncBoundaryDisplayTexts,
  recordSyncFailureStatusMessage,
  recordSyncInitialStatusMessage,
  recordSyncLoadingStatusMessage,
  recordSyncPageLoadingStatusMessage,
  recordSyncPageSuccessStatusMessage,
  recordSyncSuccessStatusMessage,
  recordSyncUnavailableStatusMessage,
  recordsStatusDisplayTexts,
  recordUpdateChecklistDisplayItems,
  recordUpdateFailureStatusMessage,
  recordUpdateProgressStatusMessage,
  recordUpdateSuccessStatusMessage,
  recordUpdateSummaryMessage,
  recordUpdateUnavailableStatusMessage,
  updateSuccessBoundaryChecklistDisplayItems,
  visualSmokeRecordSyncStatusMessage
} from "./recordStatusCopy";
import {
  authLogoutAllProgressStatusMessage,
  authLogoutAllMainStatusMessage,
  authLogoutAllSuccessStatusMessage,
  authLogoutFailureStatusMessage,
  authLogoutLocalClearStatusMessage,
  authLogoutMainStatusMessage,
  authLogoutProgressStatusMessage,
  authLogoutSuccessStatusMessage,
  authOperationBusyStatusMessage,
  authBoundaryChecklistDisplayItems,
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
  authStatusDisplayTexts,
  backendReconnectFailureDisplayMessages,
  backendReconnectProgressStatusMessage,
  backendReconnectSuccessStatusMessage,
  backendUrlChangedDisplayMessages,
  boundDevResetResponse,
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
  oidcExchangeUnavailableStatusMessage,
  type DevResetResponse
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
  nativeStatusDisplayTexts,
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
  reportGeneratedAtDisplayText as reportGeneratedAtDisplayValue,
  reportStatusDisplayTexts,
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
  deleteSuccessDestinationDisplayItems,
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
  saveSuccessDestinationDisplayItems,
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
  tutorialSafetyChecklistDisplayItems,
  updateSuccessDestinationDisplayItems,
  type QuickEntryMode
} from "./firstVersionFlowCopy";
import {
  historyBoundaryChecklistDisplayItems,
  historyCalendarDisplayTexts,
  historyManualEntryStatusMessage,
  historyNoRangeRecordsBodyCopy,
  historyNoRangeRecordsTitleCopy,
  historyNoRecordsBodyCopy,
  historyNoRecordsTitleCopy,
  historyRecordDetailStatusMessage,
  historyReturnTodayStatusMessage,
  noRealRecordHealthValueCopy
} from "./historyCopy";
import {
  buildHistoryDailyRecordSectionDisplayItems,
  historyCalendarDayDisplayItem,
  historyDailySummaryDisplayItem,
  historyDetailModeDisplayItem,
  historyDetailModeDisplayItems,
  historyDetailModes,
  historyRawRecordDisplayItems,
  type HistoryDetailMode
} from "./historyScreenData";
import {
  analysisBoundaryChecklistDisplayItems,
  analysisBoundaryDataCopy,
  analysisChartEmptyCopy,
  analysisCustomApplyStatusMessage,
  analysisDetailedReportStatusMessage,
  analysisManualEntryStatusMessage,
  analysisNoDataCopy,
  analysisNoDataStatusLabel,
  analysisRangeDisplayTexts,
  analysisRangeSummaryCopy,
  analysisReportButtonLabel,
  analysisReturnTodayStatusMessage,
  analysisSafetyIntroCopy,
  detailedReportBoundaryDisplayRows,
  detailedReportNoteDisplayItems,
  detailedReportManualEntryStatusMessage,
  detailedReportReturnAnalysisStatusMessage,
  detailedReportReturnTodayStatusMessage,
  type AnalysisRange
} from "./analysisCopy";
import {
  analysisRangeDisplayItem,
  analysisRangeDisplayItems,
  analysisRanges,
  basicReportRequestKey
} from "./analysisScreenData";
import {
  afterMealGlucoseCount as countAfterMealGlucose,
  analysisChartPoints as buildAnalysisChartPoints,
  analysisChartRange,
  analysisGlucoseRecords as buildAnalysisGlucoseRecords,
  analysisGlucoseValues as buildAnalysisGlucoseValues,
  analysisRecordsInDateRange,
  averageNumber,
  beforeMealGlucoseCount as countBeforeMealGlucose,
  boundBasicReport,
  currentRecordStreakDays,
  highestNumber,
  lowestNumber,
  recordTypeCount,
  selectedAnalysisChartPoint,
  yearlyReviewRecordStats
} from "./analysisDataTransforms";
import {
  analysisMetricInput as buildAnalysisMetricInput,
  analysisMetricRows as buildAnalysisMetricRows,
  detailedReportMetricInput as buildDetailedReportMetricInput,
  detailedReportMetricRows as buildDetailedReportMetricRows
} from "./analysisMetricTransforms";
import {
  aiReviewDateLabel,
  boundDailyTranscriptEntries,
  buildDailyRecordSaveRequest,
  createDailyTranscriptEntry,
  dailyRecordDateLabel,
  dailyRecordDraftScreenState,
  dailyRecordEntryMenuOpenStatusMessage,
  dailyRecordKeyFromRecords,
  dailyRecordReorganizationDisplayText,
  dailyRecordReorganizationStatusMessage,
  dailyRecordSummaryText,
  dailyTranscriptDisplayBundle,
  mergeSameDayParsePreviewDraft,
  todayTranscriptExpandedStatusMessage,
  type DailyRecordSaveResponse,
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
  isVoiceQuotaLow,
  membershipStatusReturnSubscriptionStatusMessage,
  menuReturnStatusMessage,
  modelRuntimeLabel,
  modelSelectionBoundaryCopy,
  privacyBoundaryDisplayRows,
  privacyIntegrationAccessibilityLabel,
  privacyIntegrationButtonLabel,
  privacyReadinessChecklistDisplayItems,
  privacySettingsIntroCopy,
  quotaDisplayTexts,
  quotaReadinessChecklistDisplayItems,
  recordingQuotaControlCopy,
  recordingQuotaDataBoundaryCopy,
  recordingQuotaIntroCopy,
  recordingQuotaSyncAccessibilityLabel,
  recordingQuotaSyncButtonLabel,
  reminderIntegrationAccessibilityLabel,
  reminderIntegrationButtonLabel,
  reminderPreviewDisplayItems as buildReminderPreviewDisplayItems,
  reminderReadinessChecklistDisplayItems,
  reminderSettingsIntroCopy,
  settingsAccountSecurityOpenStatusMessage,
  settingsSubpageStatusDisplayTexts,
  settingsSubpageReturnStatusMessage
} from "./settingsCopy";
import {
  authProviderDisplayItems as buildAuthProviderDisplayItems,
  authProviderPreviewDisplayItem,
  privacyControlDisplayRows as buildPrivacyControlDisplayRows,
  productionAuthReadinessDisplayRows as buildProductionAuthReadinessDisplayRows,
  sessionManagementDisplayItems as buildSessionManagementDisplayItems,
  settingsDisplayRows as buildSettingsDisplayRows,
  settingsRowDisplayItem,
  settingsRowSubpageTarget,
  subscriptionManagementDisplayRows as buildSubscriptionManagementDisplayRows,
  tutorialDisplaySteps as buildTutorialDisplaySteps,
  type SettingsRow
} from "./settingsScreenData";
import {
  downloadedModelDisplayLabel,
  downloadedWhisperModelDisplayItems,
  settingsChoiceDisplayBundle
} from "./settingsChoiceDisplay";
import {
  boundVoiceQuota,
  recordingEffectiveLimitSeconds,
  trialDaysLeft
} from "./subscriptionTransforms";
import {
  accountSecurityNoActionBoundaryCopy,
  accountSecurityProviderBoundaryCopy,
  accountSecurityReadinessBoundaryCopy,
  accountSecuritySessionBoundaryCopy,
  membershipFeatureDisplayRows,
  profileNoActionBoundaryCopy,
  recordingQuotaBoundaryDisplayRows,
  settingsSubscriptionSectionLabels,
  subscriptionActionStatusDisplayTexts,
  subscriptionCtaBoundaryCopy,
  subscriptionManagementIntroCopy,
  subscriptionManagementNoActionCopy,
  subscriptionManagementOpenStatusMessage,
  subscriptionManagementReadinessChecklistDisplayItems,
  subscriptionManagementReturnSettingsStatusMessage,
  subscriptionManagementSyncButtonLabel,
  subscriptionMembershipDisplayTexts,
  subscriptionMembershipStatusOpenStatusMessage,
  subscriptionComparisonDisplayRows as buildSubscriptionComparisonDisplayRows,
  subscriptionPaymentUnwiredCopy,
  subscriptionReadinessChecklistDisplayItems,
  accountSecurityBoundaryDisplayRowsForState,
  subscriptionSyncButtonLabel,
  subscriptionTrialBoundaryCopy
} from "./subscriptionCopy";
import {
  analysisDateBounds,
  boundDateInputText,
  boundTimeInputText,
  formatLocalDateInput,
  formatLocalTimeInput,
  isSameLocalDay,
  localDateKey,
  localDateTimeInputs,
  localDateTimeToIso,
  startOfCurrentMonth
} from "./dateTimeTransforms";
import { boundAccount, boundProfiles } from "./accountTransforms";
import { boundAiModelOptions } from "./aiModelTransforms";
import { boundDownloadedModels } from "./modelTransforms";
import {
  boundAuthTokenResponse,
  boundDeviceFingerprintForRequest,
  boundOidcIdTokenForRequest,
  boundOidcNonceForRequest,
  boundOidcProviderForRequest,
  boundRefreshTokenForRequest
} from "./authTransforms";
import { protectedRequestHeaders } from "./authRequestHeaders";
import { writeYearReviewShareAssetFile } from "./yearReviewShareFile";
import { DailyRecordDetailRow } from "./dailyRecordDetailRow";
import { DeleteConfirmPreviewBlock } from "./deleteConfirmPreviewBlock";
import { FieldLabel } from "./fieldLabel";
import { DetailRow } from "./detailRow";
import { HistoryCalendarMonthPicker } from "./historyCalendarMonthPicker";
import { HistoryDailySummaryTable } from "./historyDailySummaryTable";
import { HistoryIntroStatusBlocks } from "./historyIntroStatusBlocks";
import { HistoryNoRecordStatusBlock } from "./historyNoRecordStatusBlock";
import { HistorySelectedDatePanel } from "./historySelectedDatePanel";
import { HistorySyncBoundaryBlock } from "./historySyncBoundaryBlock";
import { HighlightBulletRow } from "./highlightBulletRow";
import { HighlightDetailRow } from "./highlightDetailRow";
import { ManualRecordCreatePreviewAction } from "./manualRecordCreatePreviewAction";
import { ManualRecordConfirmFooterActions } from "./manualRecordConfirmFooterActions";
import { ManualRecordConfirmPreviewBlock } from "./manualRecordConfirmPreviewBlock";
import { ManualRecordDateTimeFields } from "./manualRecordDateTimeFields";
import { ManualRecordExerciseFields } from "./manualRecordExerciseFields";
import { ManualRecordGlucoseFields } from "./manualRecordGlucoseFields";
import { ManualRecordHeaderIntro } from "./manualRecordHeaderIntro";
import { ManualRecordMealFields } from "./manualRecordMealFields";
import { ManualRecordMedicationFields } from "./manualRecordMedicationFields";
import { ManualRecordNoteFields } from "./manualRecordNoteFields";
import { ManualRecordTypeSelector } from "./manualRecordTypeSelector";
import { MetricCard } from "./metricCard";
import { RecordDetailActionPanel } from "./recordDetailActionPanel";
import { RecordDetailInfoPanel } from "./recordDetailInfoPanel";
import { RecordEditFooterActions } from "./recordEditFooterActions";
import { RecordEditHeaderFields } from "./recordEditHeaderFields";
import type {
  Account,
  AiModelOptions,
  AuthSessionItem,
  AuthTokenResponse,
  BasicReport,
  Profile,
  SaveEntryMethod,
  VoiceQuota
} from "./appTypes";

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
  const accountSecurityAuthModeDisplay = accountSecurityAuthModeDisplayTexts({
    allowMobileDevAuth,
    accountDisplayName,
    accountLoginDisplayText
  });
  const authModeDisplayLabel = accountSecurityAuthModeDisplay.label;
  const authModeDisplayCopy = accountSecurityAuthModeDisplay.copy;
  const accountSecurityCardAccessibilityLabel = accountSecurityAuthModeDisplay.cardAccessibilityLabel;
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
  const parserAvailabilityDisplay = parserAvailabilityDisplayMessages({
    parserModelUnavailableMessage,
    protectedBackendUnavailableMessage
  });
  const parserModelUnavailableDisplayMessage = parserAvailabilityDisplay.parserModelUnavailable;
  const protectedBackendUnavailableDisplayMessage = parserAvailabilityDisplay.protectedBackendUnavailable;
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
    () => recordListDisplayItems(todayRecords, "today"),
    [todayRecords]
  );
  const groupedHistoryRecordDisplaySections = useMemo(
    () => groupedRecordListDisplaySections(groupedHistoryRecords),
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
  const historyCalendarDisplay = historyCalendarDisplayTexts(historyCalendarMonthStart, selectedHistoryDate);
  const historyCalendarTitle = historyCalendarDisplay.title;
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
    () => historyRawRecordDisplayItems(selectedHistoryRecords),
    [selectedHistoryRecords]
  );
  const selectedHistoryRecordDisplayCount = clampNumber(
    selectedHistoryRecords.length,
    0,
    maxMobileCountValue
  );
  const selectedHistoryDateDisplayText = historyCalendarDisplay.selectedDate;
  const historyPreviousMonthButtonLabel = historyCalendarDisplay.previousMonthLabel;
  const historyNextMonthButtonLabel = historyCalendarDisplay.nextMonthLabel;
  const historyPreviousMonthAccessibilityLabel = historyCalendarDisplay.previousMonthAccessibility;
  const historyNextMonthAccessibilityLabel = historyCalendarDisplay.nextMonthAccessibility;
  const analysisSelectedDateBounds = useMemo(
    () => analysisDateBounds(analysisRange, analysisCustomStart, analysisCustomEnd),
    [analysisCustomEnd, analysisCustomStart, analysisRange]
  );
  const analysisRecords = useMemo(
    () => analysisRecordsInDateRange(recordsForDisplay, analysisSelectedDateBounds),
    [analysisSelectedDateBounds, recordsForDisplay]
  );
  const analysisGlucoseRecords = useMemo(
    () => buildAnalysisGlucoseRecords(analysisRecords),
    [analysisRecords]
  );
  const analysisGlucoseValues = buildAnalysisGlucoseValues(analysisGlucoseRecords);
  const analysisPreviewMode = recordsForDisplay.length === 0;
  const analysisRangeDisplay = analysisRangeDisplayTexts(
    analysisRange,
    analysisCustomStart,
    analysisCustomEnd,
    analysisRanges
  );
  const analysisRangeDisplayLabel = analysisRangeDisplay.label;
  const analysisCustomRangeStatusDisplayText = analysisRangeDisplay.customRangeStatus;
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
  const historyNoRealRecordHealthValueDisplayText = noRealRecordHealthValueCopy("history");
  const analysisNoDataStatusDisplayLabel = analysisNoDataStatusLabel();
  const analysisNoDataDisplayCopy = analysisNoDataCopy();
  const analysisBoundaryDataDisplayCopy = analysisBoundaryDataCopy(analysisPreviewMode);
  const lowConfidencePreviewRecordCount =
    preview?.records.filter((record) => (record.confidence ?? 1) < 0.7).length ?? 0;
  const rejectedPreviewEventCount = preview?.rejected_events.length ?? 0;
  const lowConfidencePreviewRecordDisplayCount = clampNumber(lowConfidencePreviewRecordCount, 0, maxMobilePreviewRecords);
  const rejectedPreviewEventDisplayCount = clampNumber(rejectedPreviewEventCount, 0, maxMobileRejectedEvents);
  const rejectedPreviewDisplayItems = preview ? buildRejectedPreviewDisplayItems(preview.rejected_events) : [];
  const aiReviewDateDisplayLabel = boundDisplayText(
    preview ? aiReviewDateLabel(preview.records) : "",
    maxDisplayDetailTextLength
  );
  const aiReviewDisplay = aiReviewDisplayTexts();
  const aiReviewNoCandidateTitleDisplayText = aiReviewDisplay.noCandidateTitle;
  const aiReviewNoCandidateBodyDisplayText = aiReviewDisplay.noCandidateBody;
  const aiReviewNoCandidateBoundaryDisplayText = aiReviewDisplay.noCandidateBoundary;
  const aiReviewNoPreviewTitleDisplayText = aiReviewDisplay.noPreviewTitle;
  const aiReviewNoPreviewBodyDisplayText = aiReviewDisplay.noPreviewBody;
  const aiReviewIntroDisplayText = aiReviewDisplay.intro;
  const aiReviewLowConfidenceDisplayText = aiReviewDisplay.lowConfidence;
  const aiReviewRejectedEventsDisplayText = aiReviewDisplay.rejectedEvents;
  const aiReviewBackendRequiredDisplayText = aiReviewDisplay.backendRequired;
  const hasAiSaveConfirmWarnings =
    lowConfidencePreviewRecordCount > 0 || rejectedPreviewEventCount > 0;
  const isAiSaveConfirmBlockedByBackend = !protectedBackendReady;
  const aiSaveConfirmDisplay = aiSaveConfirmDisplayTexts(
    isBusy,
    isAiSaveConfirmBlockedByBackend,
    hasAiSaveConfirmWarnings
  );
  const aiSaveConfirmIntroDisplayText = aiSaveConfirmDisplay.intro;
  const dailyRecordDateDisplayText = preview ? dailyRecordDateLabel(preview.records) : "";
  const dailyRecordSummaryDisplayText = preview ? dailyRecordSummaryText(preview.records) : "";
  const dailyRecordReorganizationDisplay = dailyRecordReorganizationDisplayText(
    dailyRecordOrganizationReason,
    dailyRecordOrganizationRevision
  );
  const dailyRecordSectionItems = preview ? buildDailyRecordSectionDisplayItems(preview.records) : [];
  const todayTranscriptDisplay = dailyTranscriptDisplayBundle(preview, dailyTranscriptEntries);
  const todayTranscriptDisplayItems = todayTranscriptDisplay.items;
  const todayTranscriptCountDisplayText = todayTranscriptDisplay.countText;
  const todayTranscriptAccessibilityLabel = todayTranscriptDisplay.accessibilityLabel;
  const aiSaveConfirmSubmitDisplayLabel = aiSaveConfirmDisplay.submit;
  const hasUnsavedPreviewRecords = unsavedPreviewRecordCount > 0;
  const dailyRecordDraftScreen = dailyRecordDraftScreenState({
    currentScreen,
    hasPreview: Boolean(preview),
    hasUnsavedPreviewRecords
  });
  const isDailyRecordFixedSaveVisible = dailyRecordDraftScreen.isFixedSaveVisible;
  const mainScrollContainerStyle = isDailyRecordFixedSaveVisible
    ? [styles.container, styles.containerWithFixedSaveBar]
    : styles.container;
  const hasUnsavedDailyRecordDraft = dailyRecordDraftScreen.hasUnsavedDraft;
  const dailyRecordLeaveGuardDisplay = dailyRecordLeaveGuardDisplayTexts();
  const dailyRecordLeaveGuardTitleDisplayText = dailyRecordLeaveGuardDisplay.title;
  const dailyRecordLeaveGuardBodyDisplayText = dailyRecordLeaveGuardDisplay.body;
  const dailyRecordLeaveGuardQuestionDisplayText = dailyRecordLeaveGuardDisplay.question;
  const dailyRecordLeaveGuardCancelAccessibilityLabel = dailyRecordLeaveGuardDisplay.cancelAccessibility;
  const dailyRecordLeaveGuardConfirmAccessibilityLabel = dailyRecordLeaveGuardDisplay.confirmAccessibility;
  const hasPartialAiSave = lastSaveEntryMethod === "ai" && hasUnsavedPreviewRecords;
  const hasManualFallbackWithAiCandidates =
    lastSaveEntryMethod === "manual" && hasUnsavedPreviewRecords;
  const aiSaveConfirmChecklistItems = aiSaveConfirmChecklistDisplayItems(unsavedPreviewRecordDisplayCount);
  const aiReviewCostBoundaryChecklistItems = aiReviewCostBoundaryChecklistDisplayItems();
  const transcriptReviewCostBoundaryChecklistItems = transcriptReviewCostBoundaryChecklistDisplayItems(
    protectedBackendReady,
    parserModelReady,
    parserModelUnavailableDisplayMessage
  );
  const saveSuccessBoundaryChecklistItems = saveSuccessBoundaryChecklistDisplayItems(
    lastSaveEntryMethod,
    hasUnsavedPreviewRecords,
    unsavedPreviewRecordDisplayCount,
    mobileRecordSyncDisplayLimit
  );
  const deleteSuccessBoundaryChecklistItems =
    deleteSuccessBoundaryChecklistDisplayItems(mobileRecordSyncDisplayLimit);
  const updateSuccessBoundaryChecklistItems =
    updateSuccessBoundaryChecklistDisplayItems(mobileRecordSyncDisplayLimit);
  const manualSubmitChecklistItems = manualSubmitChecklistDisplayItems();
  const recordDetailBoundaryChecklistItems = recordDetailBoundaryChecklistDisplayItems();
  const recordEntrySettingsChecklistItems = recordEntrySettingsChecklistDisplayItems(protectedBackendReady);
  const aiCandidateRemoveChecklistItems = aiCandidateRemoveChecklistDisplayItems();
  const aiSaveFailureChecklistItems = aiSaveFailureChecklistDisplayItems(unsavedPreviewRecordDisplayCount);
  const historyBoundaryChecklistItems = historyBoundaryChecklistDisplayItems(
    mobileRecordSyncDisplayLimit,
    maxMobileRecordCacheLimit,
    recordsForDisplay.length > 0
  );
  const deleteConfirmChecklistItems = deleteConfirmChecklistDisplayItems();
  const recordUpdateChecklistItems = recordUpdateChecklistDisplayItems();
  const analysisBoundaryChecklistItems = analysisBoundaryChecklistDisplayItems(
    analysisBoundaryDataDisplayCopy,
    maxMobileRecordCacheLimit,
    mobileReportQueryDisplayLimit
  );
  const saveSuccessDestinationItems = saveSuccessDestinationDisplayItems(hasUnsavedPreviewRecords);
  const deleteSuccessDestinationItems = deleteSuccessDestinationDisplayItems();
  const updateSuccessDestinationItems = updateSuccessDestinationDisplayItems(Boolean(selectedRecord));
  const currentChrome = screenChrome[currentScreen];
  const headerBackTarget = headerBackTargetForScreen(currentScreen, currentChrome, {
    menuReturnScreen,
    recordDetailReturnScreen,
    transcriptReviewReturnScreen,
    manualRecordReturnScreen,
    subscriptionReturnScreen,
    tutorialReturnScreen,
    foodPhotoReturnScreen,
    doctorShareReturnScreen,
    healthIntegrationReturnScreen,
    communityReturnScreen,
    rankingReturnScreen,
    achievementsReturnScreen,
    yearReviewReturnScreen,
    storeReturnScreen,
    saveSuccessReturnScreen
  });
  const primaryTabNavigation = primaryTabNavigationState({ currentScreen, isAnyRequestInFlight });
  const primaryTabItems = primaryTabNavigation.items;
  const showPrimaryTabs = primaryTabNavigation.show;
  const mvpFlowStepper = mvpFlowStepperState({
    currentScreen,
    lastSaveEntryMethod,
    hasUnsavedPreviewRecords
  });
  const mvpFlowStepIndex = mvpFlowStepper.stepIndex;
  const showMvpFlowStepper = mvpFlowStepper.show;
  const localAchievements = useMemo<AchievementItem[]>(
    () => localAchievementItemsForRecords(recordsForDisplay),
    [recordsForDisplay]
  );
  const achievements = achievementBackendItems.length > 0 ? achievementBackendItems : localAchievements;
  const achievementDisplayItems = useMemo(() => buildAchievementDisplayItems(achievements), [achievements]);
  const achievementUnlockedDisplayItems = useMemo(
    () => limitedAchievementDisplayItems(achievementUnlockedItems),
    [achievementUnlockedItems]
  );
  const achievementNewlyUnlockedDisplayItems = useMemo(
    () => limitedAchievementDisplayItems(achievementNewlyUnlockedItems),
    [achievementNewlyUnlockedItems]
  );
  const saveSuccessNewlyUnlockedDisplayItems = saveSuccessNewlyUnlockedAchievementDisplayItems(
    achievementNewlyUnlockedDisplayItems
  );
  const achievementCategoryDisplaySections = useMemo(
    () => buildAchievementCategoryDisplaySections(achievementDisplayItems),
    [achievementDisplayItems]
  );
  const achievementBadgeDisplaySummary = achievementBadgeSummary(achievementDisplayItems);
  const unlockedAchievementDisplayCount = clampNumber(
    achievementBadgeDisplaySummary.unlockedCount,
    0,
    maxMobileCountValue
  );
  const nextAchievementDisplayDays = clampNumber(
    achievementBadgeDisplaySummary.nextRemaining,
    0,
    maxMobileCountValue
  );
  const achievementYearReviewStatusDisplay = achievementYearReviewStatusDisplayTexts({
    achievementActionStatus,
    yearReviewActionStatus
  });
  const achievementActionStatusDisplayText = achievementYearReviewStatusDisplay.achievementAction;
  const currentYear = new Date().getFullYear();
  const yearReviewTargetDisplayYear = yearReviewTargetYear(new Date());
  const yearReviewGenerationDisplayText = nextYearReviewGenerationLabel(new Date());
  const yearlyRecordStats = useMemo(
    () => yearlyReviewRecordStats(records, yearReviewTargetDisplayYear),
    [records, yearReviewTargetDisplayYear]
  );
  const yearlyAchievementBadgeSummary = achievementBadgeSummary(achievementDisplayItems);
  const yearlyUnlockedBadgeDisplayCount = clampNumber(
    yearlyAchievementBadgeSummary.unlockedCount,
    0,
    maxMobileCountValue
  );
  const yearlyHighestBadgeDisplayLevel = clampNumber(
    yearlyAchievementBadgeSummary.highestLevel,
    0,
    maxMobileCountValue
  );
  const yearlyRecordDayDisplayCount = clampNumber(yearlyRecordStats.recordDayCount, 0, maxMobileCountValue);
  const yearlyGlucoseAverageDisplayValue = clampNullableNumber(yearlyRecordStats.glucoseAverage, 0, maxMobileGlucoseValue);
  const yearlyGlucoseHighestDisplayValue = clampNullableNumber(yearlyRecordStats.glucoseHighest, 0, maxMobileGlucoseValue);
  const yearlyGlucoseLowestDisplayValue = clampNullableNumber(yearlyRecordStats.glucoseLowest, 0, maxMobileGlucoseValue);
  const yearlyRecordDisplayCount = clampNumber(yearlyRecordStats.records.length, 0, maxMobileCountValue);
  const yearlyGlucoseRecordDisplayCount = clampNumber(yearlyRecordStats.glucoseRecords.length, 0, maxMobileCountValue);
  const yearlyExerciseRecordDisplayCount = clampNumber(yearlyRecordStats.typeCounts.get("exercise") ?? 0, 0, maxMobileCountValue);
  const yearlyMealRecordDisplayCount = clampNumber(yearlyRecordStats.typeCounts.get("meal") ?? 0, 0, maxMobileCountValue);
  const yearlyLongestStreakDisplayDays = clampNumber(yearlyRecordStats.longestStreak, 0, maxMobileCountValue);
  const backendYearMetricRows = backendYearReviewMetricDisplayRows(yearReviewBackendSummary);
  const backendYearHealthRows = backendYearReviewHealthOutcomeDisplayRows(yearReviewBackendSummary);
  const backendYearAiObservation = yearReviewBackendSummary?.ai_summary.find(
    (item) => item.kind === "important_observation"
  )?.text;
  const backendYearAiEncouragement = yearReviewBackendSummary?.ai_summary.find(
    (item) => item.kind === "encouragement"
  )?.text;
  const localYearlyReviewMetricRows = localYearlyReviewMetricDisplayRows(
    yearlyRecordDayDisplayCount,
    yearlyGlucoseRecordDisplayCount,
    yearlyMealRecordDisplayCount,
    yearlyExerciseRecordDisplayCount,
    yearlyLongestStreakDisplayDays,
    yearlyUnlockedBadgeDisplayCount,
    yearlyHighestBadgeDisplayLevel
  );
  const yearlyReviewMetricRows = backendYearMetricRows.length > 0 ? backendYearMetricRows : localYearlyReviewMetricRows;
  const localYearlyHealthOutcomeRows = localYearlyHealthOutcomeDisplayRows(
    yearlyGlucoseAverageDisplayValue,
    yearlyGlucoseHighestDisplayValue,
    yearlyGlucoseLowestDisplayValue
  );
  const yearlyHealthOutcomeRows = backendYearHealthRows.length > 0 ? backendYearHealthRows : localYearlyHealthOutcomeRows;
  const yearlyHighlightDisplayTexts = localYearlyHighlightDisplayItems(
    yearlyRecordDisplayCount,
    yearReviewTargetDisplayYear,
    yearlyRecordStats.mostRecordedType,
    yearlyLongestStreakDisplayDays
  );
  const yearlyInsightDisplayTexts = yearReviewInsightDisplayTexts({
    recordCount: yearlyRecordDisplayCount,
    averageGlucose: yearlyGlucoseAverageDisplayValue,
    longestStreakDays: yearlyLongestStreakDisplayDays,
    backendObservation: backendYearAiObservation,
    backendEncouragement: backendYearAiEncouragement
  });
  const yearlyGlucoseAverageDisplayText = yearlyInsightDisplayTexts.glucoseAverage;
  const yearlyAiObservationDisplayText = yearlyInsightDisplayTexts.aiObservation;
  const yearlyAiEncouragementDisplayText = yearlyInsightDisplayTexts.aiEncouragement;
  const yearReviewActionStatusDisplayText = achievementYearReviewStatusDisplay.yearReviewAction;
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
  const storeDisplay = useMemo(
    () =>
      storeDisplayBundle({
        backendProducts: storeBackendProducts,
        fallbackProducts: storeProducts,
        categories: storeCategories,
        selectedCategory: storeCategory,
        searchText: storeSearchText,
        redemptions: storeRedemptions,
        pointsBalance: storePointsBalance
      }),
    [storeBackendProducts, storeCategory, storePointsBalance, storeRedemptions, storeSearchText]
  );
  const storeProductsForDisplay = storeDisplay.productsForDisplay;
  const storeProductDisplayItems = storeDisplay.productDisplayItems;
  const storeRedemptionDisplayItems = storeDisplay.redemptionDisplayItems;
  const storeCategoryDisplayOptions = storeDisplay.categoryDisplayOptions;
  const foodCommunityDisplay = useMemo(
    () =>
      foodCommunityDisplayBundle({
        backendCategories: foodCommunityBackendCategories,
        fallbackCategories: foodCommunityCategories,
        backendItems: foodCommunityBackendItems,
        fallbackItems: foodCommunityItems,
        selectedCategory: foodCommunityCategory,
        searchText: foodCommunitySearchText,
        selectedItemId: selectedFoodCommunityItemId,
        shareFields: foodCommunityShareFields,
        pointsBalance: storePointsBalance
      }),
    [
      foodCommunityBackendCategories,
      foodCommunityBackendItems,
      foodCommunityCategory,
      foodCommunitySearchText,
      foodCommunityShareFields,
      selectedFoodCommunityItemId,
      storePointsBalance
    ]
  );
  const foodCommunityCategoriesForDisplay = foodCommunityDisplay.categoriesForDisplay;
  const foodCommunityCategoryDisplayOptions = foodCommunityDisplay.categoryDisplayOptions;
  const selectedFoodCommunityCategoryDisplay = foodCommunityDisplay.selectedCategoryDisplay;
  const foodCommunityItemsForDisplay = foodCommunityDisplay.itemsForDisplay;
  const foodCommunityDisplayItems = foodCommunityDisplay.itemDisplayItems;
  const visibleFoodCommunityItems = foodCommunityDisplay.visibleItems;
  const selectedFoodCommunityItem = foodCommunityDisplay.selectedItem;
  const foodCommunityShareFieldRows = foodCommunityDisplay.shareFieldRows;
  const foodCommunityPointRows = foodCommunityDisplay.pointRows;
  const foodCommunityRankingRows = foodCommunityDisplay.rankingRows;
  const visibleStoreProducts = storeDisplay.visibleProducts;
  const storeRedemptionBoundaryRows = storeDisplay.redemptionBoundaryRows;
  const settingsDisplayRows = useMemo(() => buildSettingsDisplayRows(), []);
  const settingsChoiceDisplay = useMemo(
    () =>
      settingsChoiceDisplayBundle({
        profiles,
        llmModels: models.llm_models,
        sttModels: models.stt_models,
        authSessions
      }),
    [authSessions, models.llm_models, models.stt_models, profiles]
  );
  const profileChoiceDisplayItems = settingsChoiceDisplay.profileChoiceDisplayItems;
  const llmModelChoiceDisplayItems = settingsChoiceDisplay.llmModelChoiceDisplayItems;
  const sttModelChoiceDisplayItems = settingsChoiceDisplay.sttModelChoiceDisplayItems;
  const tutorialDisplaySteps = useMemo(() => buildTutorialDisplaySteps(), []);
  const authProviderDisplayItems = useMemo(() => buildAuthProviderDisplayItems(), []);
  const sessionManagementDisplayItems = useMemo(
    () => buildSessionManagementDisplayItems(),
    []
  );
  const authSessionDisplayItems = settingsChoiceDisplay.authSessionDisplayItems;
  const productionAuthReadinessDisplayRows = useMemo(
    () => buildProductionAuthReadinessDisplayRows(),
    []
  );
  const glucoseUnitDisplayOptions = useMemo(() => optionDisplayItems(glucoseUnitOptions), []);
  const glucoseTimingDisplayOptions = useMemo(() => valueLabelDisplayItems(glucoseTimingOptions), []);
  const mealTypeDisplayOptions = useMemo(() => valueLabelDisplayItems(mealTypeOptions), []);
  const manualRecordTypeDisplayOptions = useMemo(
    () => manualRecordTypeDisplayItems(manualRecordTypes),
    []
  );
  const historyDetailModeDisplayOptions = useMemo(() => historyDetailModeDisplayItems(historyDetailModes), []);
  const analysisRangeDisplayOptions = useMemo(() => analysisRangeDisplayItems(analysisRanges), []);
  const menuDisplayItems = useMemo(() => menuScreenDisplayItems(menuScreens), []);
  const visualSmokeRouteJumpDisplayItems = useMemo(
    () => buildVisualSmokeRouteJumpDisplayItems(visualSmokeRouteJumps),
    []
  );
  const futureModuleDisplayCards = useMemo(
    () => futureModuleCardDisplayItems(futureModuleCards),
    []
  );
  const selectedFutureModuleDisplay = useMemo(
    () => selectedFutureModuleDisplayItem(selectedFutureModule),
    [selectedFutureModule]
  );
  const subscriptionComparisonDisplayRows = useMemo(
    () => buildSubscriptionComparisonDisplayRows(),
    []
  );
  const subscriptionReadinessChecklistItems = subscriptionReadinessChecklistDisplayItems();
  const subscriptionManagementDisplayRows = useMemo(
    () => buildSubscriptionManagementDisplayRows(),
    []
  );
  const subscriptionManagementReadinessChecklistItems =
    subscriptionManagementReadinessChecklistDisplayItems();
  const privacyControlDisplayRows = useMemo(() => buildPrivacyControlDisplayRows(), []);
  const accountSecurityBoundaryRows = accountSecurityBoundaryDisplayRowsForState({
    account,
    activeProfile,
    allowMobileDevAuth,
    protectedHeaderMode,
    tokenStorageMode,
    accessTokenTooLarge,
    authSessionCount: authSessionDisplayItems.length,
    protectedBackendReady
  });
  const profileSettingsBoundaryRows = profileSettingsBoundaryDisplayRowsForState({
    account,
    activeProfile,
    activeProfileLabel,
    activeProfileRelationshipDisplayText
  });
  const membershipFeatureRows = membershipFeatureDisplayRows();
  const authBoundaryChecklistItems = authBoundaryChecklistDisplayItems();
  const profileReadinessChecklistItems = profileReadinessChecklistDisplayItems();
  const quotaReadinessChecklistItems = quotaReadinessChecklistDisplayItems();
  const reminderPreviewDisplayItems = buildReminderPreviewDisplayItems();
  const reminderReadinessChecklistItems = reminderReadinessChecklistDisplayItems();
  const privacyReadinessChecklistItems = privacyReadinessChecklistDisplayItems();
  const tutorialSafetyChecklistItems = tutorialSafetyChecklistDisplayItems();
  const doctorShareReadinessChecklistItems = doctorShareReadinessChecklistDisplayItems();
  const healthIntegrationReadinessChecklistItems =
    healthIntegrationReadinessChecklistDisplayItems();
  const communityReadinessChecklistItems = communityReadinessChecklistDisplayItems();
  const rankingReadinessChecklistItems = rankingReadinessChecklistDisplayItems();
  const storeCheckoutReadinessChecklistItems = storeCheckoutReadinessChecklistDisplayItems();
  const storeCartUnavailableDisplay = storeCartUnavailableDisplayItem();
  const foodPhotoVisionBoundaryDisplay = foodPhotoVisionBoundaryDisplayItem();
  const foodPhotoEmptyResultChecklistItems = foodPhotoEmptyResultChecklistDisplayItems();
  const foodPhotoReadinessChecklistItems = foodPhotoReadinessChecklistDisplayItems();
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
  const reportSourceDisplay = reportSourceDisplayItem(
    activeAnalysisReport,
    analysisRecords.length,
    mobileReportQueryDisplayLimit
  );
  const reportStatusDisplay = reportStatusDisplayTexts({
    reportStatus,
    quotaStatus
  });
  const reportStatusDisplayText = reportStatusDisplay.report;
  const reportSourceDisplayLabel = reportSourceDisplay.label;
  const reportSourceDisplayCopy = reportSourceDisplay.copy;
  const reportGeneratedAtDisplayText = reportGeneratedAtDisplayValue(activeAnalysisReport?.generated_at);
  const futurePreviewDisplayLabels = futurePreviewSectionLabels();
  const futurePreviewStatusDisplay = futurePreviewStatusDisplayTexts({
    futureModuleActionStatus,
    doctorShareActionStatus,
    healthIntegrationActionStatus,
    communityActionStatus,
    rankingActionStatus,
    reportLimit: mobileReportQueryDisplayLimit
  });
  const futureModuleActionStatusDisplayText = futurePreviewStatusDisplay.futureModuleAction;
  const doctorShareActionStatusDisplayText = futurePreviewStatusDisplay.doctorShareAction;
  const healthIntegrationActionStatusDisplayText = futurePreviewStatusDisplay.healthIntegrationAction;
  const communityActionStatusDisplayText = futurePreviewStatusDisplay.communityAction;
  const rankingActionStatusDisplayText = futurePreviewStatusDisplay.rankingAction;
  const doctorShareTokenStatusMessage = futurePreviewStatusDisplay.doctorShareToken;
  const doctorShareReportBoundaryStatusMessage = futurePreviewStatusDisplay.doctorShareReportBoundary;
  const healthIntegrationPermissionStatusMessage = futurePreviewStatusDisplay.healthIntegrationPermission;
  const healthIntegrationMeterStatusMessage = futurePreviewStatusDisplay.healthIntegrationMeter;
  const communityPostingStatusMessage = futurePreviewStatusDisplay.communityPosting;
  const communityPrivacyStatusMessage = futurePreviewStatusDisplay.communityPrivacy;
  const foodCommunityShareStatusMessage = futurePreviewStatusDisplay.foodCommunityShare;
  const communityActionDisplay = communityActionDisplayTexts({
    leaderboardOptIn: communityPublicSettings?.leaderboard_opt_in ?? false
  });
  const foodCommunityShareButtonDisplayLabel = communityActionDisplay.foodCommunityShareButton;
  const foodCommunityShareAccessibilityDisplayLabel = communityActionDisplay.foodCommunityShareAccessibility;
  const storePreviewDisplay = storePreviewDisplayTexts(storeActionStatus);
  const storeActionStatusDisplayText = storePreviewDisplay.actionStatus;
  const storePreviewBoundaryDisplayText = storePreviewDisplay.previewBoundary;
  const storeEmptySearchDisplay = storeEmptySearchDisplayItem();
  const storeCartButtonDisplayLabel = storePreviewDisplay.cartButton;
  const storeCartButtonAccessibilityDisplayLabel = storePreviewDisplay.cartButtonAccessibility;
  const storeLocalBoundaryDisplayText = storePreviewDisplay.localBoundary;
  const storeCartIntroDisplayText = storePreviewDisplay.cartIntro;
  const storeCheckoutReadinessTitleDisplayText = storePreviewDisplay.checkoutReadinessTitle;
  const storeCartReturnButtonDisplayLabel = storePreviewDisplay.cartReturnButton;
  const rankingOptInButtonDisplayLabel = communityActionDisplay.rankingOptInButton;
  const rankingOptInAccessibilityDisplayLabel = communityActionDisplay.rankingOptInAccessibility;
  const foodPhotoStatusDisplay = foodPhotoStatusDisplayTexts(foodPhotoActionStatus);
  const foodPhotoActionStatusDisplayText = foodPhotoStatusDisplay.action;
  const foodPhotoUploadStatusMessage = foodPhotoStatusDisplay.upload;
  const foodPhotoIntegrationStatusMessage = foodPhotoStatusDisplay.integration;
  const foodPhotoRetakeStatusMessage = foodPhotoStatusDisplay.retake;
  const foodPhotoIntroDisplayText = foodPhotoIntroCopy();
  const foodPhotoUploadBoxDisplayLabel = foodPhotoUploadBoxLabel();
  const foodPhotoResultDisplayTitle = foodPhotoResultTitle();
  const foodPhotoReadinessTitleDisplayText = foodPhotoReadinessTitle();
  const foodPhotoIntegrationButtonDisplayLabel = foodPhotoIntegrationButtonLabel();
  const foodPhotoRetakeButtonDisplayLabel = foodPhotoRetakeButtonLabel();
  const foodPhotoIntegrationAccessibilityDisplayLabel = foodPhotoIntegrationButtonAccessibilityLabel();
  const foodPhotoRetakeAccessibilityDisplayLabel = foodPhotoRetakeButtonAccessibilityLabel();
  const quotaStatusDisplayText = reportStatusDisplay.quota;
  const subscriptionMembershipDisplay = subscriptionMembershipDisplayTexts(
    voiceQuota,
    quotaTrialDaysLeft,
    quotaStatusDisplayText
  );
  const subscriptionPlanDisplayText = subscriptionMembershipDisplay.subscriptionPlan;
  const subscriptionManagementPlanDisplayText = subscriptionMembershipDisplay.managementPlan;
  const subscriptionStatusDisplayText = subscriptionMembershipDisplay.subscriptionStatus;
  const subscriptionManagementStatusDisplayText = subscriptionMembershipDisplay.managementStatus;
  const membershipTrialHeroLabelDisplayText = subscriptionMembershipDisplay.trialHeroLabel;
  const membershipTrialDaysDisplayText = subscriptionMembershipDisplay.trialDays;
  const membershipPlanStatusDisplayText = subscriptionMembershipDisplay.planStatus;
  const quotaDisplay = quotaDisplayTexts(voiceQuota);
  const quotaUsedDisplayText = quotaDisplay.used;
  const quotaRemainingDisplayText = quotaDisplay.remaining;
  const quotaDailyLimitDisplayText = quotaDisplay.dailyLimit;
  const subscriptionQuotaDailyLimitDisplayText = quotaDisplay.subscriptionDailyLimit;
  const settingsQuotaHelperDisplayText = quotaDisplay.settingsHelper;
  const subscriptionActionStatusDisplay = subscriptionActionStatusDisplayTexts({
    subscriptionActionStatus,
    subscriptionManagementActionStatus,
    backendUnavailableMessage: protectedAccountBackendUnavailableMessage
  });
  const subscriptionActionStatusDisplayText = subscriptionActionStatusDisplay.subscriptionAction;
  const subscriptionManagementActionStatusDisplayText = subscriptionActionStatusDisplay.subscriptionManagementAction;
  const subscriptionTrialIntegrationStatusMessage = subscriptionActionStatusDisplay.trialIntegration;
  const subscriptionRenewalIntegrationStatusMessage = subscriptionActionStatusDisplay.renewalIntegration;
  const subscriptionManagementSyncingStatusMessage = subscriptionActionStatusDisplay.managementSyncing;
  const subscriptionManagementUnavailableStatusMessage = subscriptionActionStatusDisplay.managementUnavailable;
  const subscriptionManagementPaymentStatusMessage = subscriptionActionStatusDisplay.managementPayment;
  const authStatusDisplay = authStatusDisplayTexts({
    authActionStatus,
    devResetStatus,
    tokenStorageStatus
  });
  const authActionStatusDisplayText = authStatusDisplay.authAction;
  const tokenStorageStatusDisplayText = authStatusDisplay.tokenStorage;
  const nativeStatusDisplay = nativeStatusDisplayTexts(nativeStatus);
  const nativeStatusDisplayText = nativeStatusDisplay.native;
  const devResetStatusDisplayText = authStatusDisplay.devReset;
  const settingsSubpageStatusDisplay = settingsSubpageStatusDisplayTexts({
    profileActionStatus,
    recordingQuotaActionStatus,
    reminderActionStatus,
    privacyActionStatus,
    backendUnavailableMessage: protectedAccountBackendUnavailableMessage
  });
  const profileActionStatusDisplayText = settingsSubpageStatusDisplay.profileAction;
  const recordingQuotaActionStatusDisplayText = settingsSubpageStatusDisplay.recordingQuotaAction;
  const reminderActionStatusDisplayText = settingsSubpageStatusDisplay.reminderAction;
  const privacyActionStatusDisplayText = settingsSubpageStatusDisplay.privacyAction;
  const profileEditIntegrationStatusMessage = settingsSubpageStatusDisplay.profileEditIntegration;
  const recordingQuotaSyncingStatusMessage = settingsSubpageStatusDisplay.recordingQuotaSyncing;
  const recordingQuotaUnavailableStatusMessage = settingsSubpageStatusDisplay.recordingQuotaUnavailable;
  const reminderIntegrationStatusMessage = settingsSubpageStatusDisplay.reminderIntegration;
  const privacyIntegrationStatusMessage = settingsSubpageStatusDisplay.privacyIntegration;
  const recordsStatusDisplay = recordsStatusDisplayTexts(recordsStatus);
  const recordsStatusDisplayText = recordsStatusDisplay.records;
  const todayRecordSummaryDisplayText = todayRecordSummaryText(todayRecords.length);
  const historyRecordDisplayCount = clampNumber(historyRecords.length, 0, maxMobileCountValue);
  const rankingStreakDisplayDays = clampNumber(currentRecordStreakDays(records), 0, maxMobileCountValue);
  const analysisMetricInput = buildAnalysisMetricInput({
    report: activeAnalysisReport,
    localAverage: averageGlucose,
    localHighest: highestGlucose,
    localLowest: lowestGlucose,
    localGlucoseCount: analysisGlucoseRecords.length,
    localBeforeMealCount: beforeMealGlucoseCount,
    localAfterMealCount: afterMealGlucoseCount
  });
  const analysisMetricRows = buildAnalysisMetricRows(analysisMetricInput);
  const reportRecordDisplayCount = clampNumber(reportRecordCount, 0, maxMobileCountValue);
  const detailedReportMetricInput = buildDetailedReportMetricInput({
    report: activeAnalysisReport,
    localAverage: averageGlucose,
    localMinimum: lowestGlucose,
    localMaximum: highestGlucose,
    localBeforeMealCount: beforeMealGlucoseCount,
    localAfterMealCount: afterMealGlucoseCount,
    localMealCount: recordTypeCount(analysisRecords, "meal"),
    localExerciseCount: recordTypeCount(analysisRecords, "exercise"),
    localMedicationCount: recordTypeCount(analysisRecords, "medication")
  });
  const detailedReportMetricRows = buildDetailedReportMetricRows(detailedReportMetricInput);
  const aiSaveConfirmBoundaryRows = aiSaveConfirmBoundaryDisplayRows(
    unsavedPreviewRecordDisplayCount,
    lowConfidencePreviewRecordDisplayCount,
    rejectedPreviewEventDisplayCount
  );
  const detailedReportBoundaryRows = detailedReportBoundaryDisplayRows(
    reportSourceDisplayLabel,
    mobileReportQueryDisplayLimit
  );
  const doctorShareBoundaryRows = doctorShareBoundaryDisplayRows();
  const healthIntegrationBoundaryRows = healthIntegrationBoundaryDisplayRows();
  const communityBoundaryRows = communityBoundaryDisplayRows(
    communityPublicSettings?.leaderboard_opt_in ?? false
  );
  const rankingBoundaryRows = rankingBoundaryDisplayRows();
  const recordingQuotaBoundaryRows = recordingQuotaBoundaryDisplayRows(voiceQuota, quotaRemainingLow);
  const privacyBoundaryRows = privacyBoundaryDisplayRows();
  const selectedPreviewRecord =
    selectedPreviewIndex === null ? null : preview?.records[selectedPreviewIndex] ?? null;
  const pendingPreviewRemoveRecord =
    pendingPreviewRemoveIndex === null ? null : preview?.records[pendingPreviewRemoveIndex] ?? null;
  const previewRecordDisplayItems = preview ? pendingRecordDisplayItems(preview.records, "review") : [];
  const previewSaveConfirmDisplayItems = preview ? pendingRecordDisplayItems(preview.records, "save-confirm") : [];
  const selectedPreviewRecordDisplayItem =
    selectedPreviewRecord && selectedPreviewIndex !== null
      ? pendingRecordDisplayItem(selectedPreviewRecord, selectedPreviewIndex, "edit-preview")
      : null;
  const pendingPreviewRemoveDisplayItem =
    pendingPreviewRemoveRecord && pendingPreviewRemoveIndex !== null
      ? pendingRecordDisplayItem(pendingPreviewRemoveRecord, pendingPreviewRemoveIndex, "remove-preview")
      : null;
  const isDailyRecordRemoveConfirm = previewActionReturnScreen === "aiSaveConfirm";
  const aiRemoveConfirmDisplay = aiRemoveConfirmDisplayTexts(
    isDailyRecordRemoveConfirm,
    pendingPreviewRemoveDisplayItem?.confidencePercent ?? null
  );
  const aiRemoveConfirmTitleDisplayText = aiRemoveConfirmDisplay.title;
  const aiRemoveConfirmSubmitDisplayText = aiRemoveConfirmDisplay.submit;
  const aiRemoveConfirmBoundaryDisplayLabel = aiRemoveConfirmDisplay.boundaryLabel;
  const aiRemoveConfirmBoundaryDisplayText = aiRemoveConfirmDisplay.boundary;
  const aiRemoveConfirmSourceDisplayText = aiRemoveConfirmDisplay.source;
  const transcriptReviewDisplay = transcriptReviewDisplayTexts();
  const transcriptReviewIntroDisplayText = transcriptReviewDisplay.intro;
  const transcriptReviewPreParseGuidanceDisplayText = transcriptReviewDisplay.preParseGuidance;
  const transcriptReviewSampleWarningDisplayText = transcriptReviewDisplay.sampleWarning;
  const transcriptReviewPreflightPassedDisplayText = transcriptReviewDisplay.preflightPassed;
  const previewRecordEditBoundaryDisplayText = previewRecordEditBoundaryCopy();
  const selectedRecordDisplayItem = selectedRecord ? recordDetailDisplayItem(selectedRecord) : null;
  const manualRecordConfirmDisplayTextsForState = manualRecordConfirmDisplayTexts(isBusy);
  const manualRecordConfirmIntroDisplayText = manualRecordConfirmDisplayTextsForState.intro;
  const manualRecordConfirmSubmitDisplayLabel = manualRecordConfirmDisplayTextsForState.submit;
  const deleteConfirmDisplay = deleteConfirmDisplayTexts(selectedRecordDisplayItem, isBusy);
  const deleteConfirmIntroDisplayText = deleteConfirmDisplay.intro;
  const deleteConfirmRecordMetaDisplayText = deleteConfirmDisplay.recordMeta;
  const deleteConfirmSubmitDisplayLabel = deleteConfirmDisplay.submit;
  const historyNoRecordsTitleDisplayText = historyNoRecordsTitleCopy();
  const historyNoRecordsBodyDisplayText = historyNoRecordsBodyCopy();
  const historyNoRangeRecordsTitleDisplayText = historyNoRangeRecordsTitleCopy();
  const historyNoRangeRecordsBodyDisplayText = historyNoRangeRecordsBodyCopy();
  const analysisSafetyIntroDisplayText = analysisSafetyIntroCopy();
  const analysisChartEmptyDisplayText = analysisChartEmptyCopy();
  const analysisRangeSummaryDisplayText = analysisRangeSummaryCopy(
    analysisMetricInput.glucoseCount,
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
  const downloadedWhisperModelChoiceItems = downloadedWhisperModelDisplayItems(downloadedModels);
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
  const yearReviewHeaderDisplay = yearReviewHeaderDisplayTexts({
    targetYear: yearReviewTargetDisplayYear,
    recordCount: yearlyRecordDisplayCount,
    generationLabel: yearReviewGenerationDisplayText,
    summary: yearReviewBackendSummary,
    sharePackageId: yearReviewSharePackageId
  });
  const yearReviewPreviewBoundaryDisplayText = yearReviewHeaderDisplay.previewBoundary;
  const yearReviewHeroTitleDisplayText = yearReviewHeaderDisplay.heroTitle;
  const yearReviewHeroRecordCountDisplayText = yearReviewHeaderDisplay.heroRecordCount;
  const yearReviewLiveCalculationDisplayText = yearReviewHeaderDisplay.liveCalculation;
  const yearReviewSourceDisplayText = yearReviewHeaderDisplay.source;
  const yearReviewBadgeMaterialDisplayText = yearReviewHeaderDisplay.badgeMaterial;
  const yearReviewShareButtonDisplayLabel = yearReviewHeaderDisplay.shareButtonLabel;
  const yearReviewShareAccessibilityDisplayLabel = yearReviewHeaderDisplay.shareAccessibilityLabel;
  const yearReviewRevokeShareButtonDisplayLabel = yearReviewHeaderDisplay.revokeShareButtonLabel;
  const yearReviewRevokeShareAccessibilityDisplayLabel = yearReviewHeaderDisplay.revokeShareAccessibilityLabel;
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
  const transcriptStatusDisplay = transcriptReviewStatusDisplayTexts({
    transcriptValidationError,
    transcript,
    protectedBackendUnavailableMessage: protectedBackendUnavailableDisplayMessage,
    parserModelUnavailableMessage: parserModelUnavailableDisplayMessage,
    parserRecoveryMessage
  });
  const transcriptValidationDisplayText = transcriptStatusDisplay.transcriptValidation;
  const transcriptReviewValidationDisplayText = transcriptStatusDisplay.transcriptReviewValidation;
  const manualRecordCreateDisplay = manualRecordCreateDisplayTexts({
    validationError: manualRecordValidationError,
    backendUnavailableMessage: protectedBackendUnavailableDisplayMessage
  });
  const manualRecordValidationDisplayText = manualRecordCreateDisplay.validation;
  const recordEditDisplay = recordEditDisplayTexts(selectedRecordEditValidationError);
  const recordEditIntroDisplayText = recordEditDisplay.intro;
  const selectedRecordEditValidationDisplayText = recordEditDisplay.validation;
  const previewRecordEditValidationDisplay = previewRecordEditValidationDisplayText(previewRecordEditValidationError);
  const parserRecoveryDisplayText = transcriptStatusDisplay.parserRecovery;
  const saveResultDisplay = saveResultDisplayTexts({
    lastSavedSummary,
    lastSaveErrorSummary,
    lowConfidenceCount: lowConfidencePreviewRecordDisplayCount,
    rejectedEventCount: rejectedPreviewEventDisplayCount,
    backendUnavailableMessage: protectedBackendUnavailableDisplayMessage
  });
  const lastSavedSummaryDisplayText = saveResultDisplay.lastSavedSummary;
  const lastSaveErrorSummaryDisplayText = saveResultDisplay.lastSaveErrorSummary;
  const lowConfidenceWarningDisplayText = saveResultDisplay.lowConfidenceWarning;
  const rejectedPreviewWarningDisplayText = saveResultDisplay.rejectedPreviewWarning;
  const aiSaveBackendBlockedDisplayText = saveResultDisplay.aiSaveBackendBlocked;
  const transcriptBackendUnavailableDisplayText = transcriptStatusDisplay.backendUnavailable;
  const transcriptModelUnavailableDisplayText = transcriptStatusDisplay.modelUnavailable;
  const manualRecordBackendUnavailableDisplayText = manualRecordCreateDisplay.backendUnavailable;
  const recordSyncBoundaryDisplay = recordSyncBoundaryDisplayTexts({
    recordCount: recordsForDisplay.length,
    cacheLimit: maxMobileRecordCacheLimit,
    hasMore: recordsHasMore,
    isBackendReady: protectedBackendReady,
    isBusy
  });
  const recordsAtCacheLimit = recordSyncBoundaryDisplay.recordsAtCacheLimit;
  const canLoadMoreRecords = recordSyncBoundaryDisplay.canLoadMoreRecords;
  const historySyncBoundaryDisplayText = recordSyncBoundaryDisplay.history;
  const analysisSyncBoundaryDisplayText = recordSyncBoundaryDisplay.analysis;
  const detailedReportNoteItems = detailedReportNoteDisplayItems(mobileReportQueryDisplayLimit);

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
    setTranscriptReviewReturnScreen(transcriptReviewReturnTargetForScreen(currentScreen));
    setCurrentScreen("transcriptReview");
    setStatus(transcriptReviewReadyStatusMessage());
  }

  function returnToTranscriptEdit() {
    setPreview(null);
    clearSelectedPreviewEditDraft();
    setCurrentScreen("transcriptReview");
    setStatus(transcriptReturnEditStatusMessage());
  }

  function returnFromTranscriptReview() {
    clearParserPreviewState();
    clearPreviewSelectionState();
    setCurrentScreen(transcriptReviewReturnScreen);
    setStatus(transcriptReviewBackStatusMessage());
  }

  function retryTranscriptInput() {
    setIsRecordingPreview(false);
    setRecordingStartedAt(null);
    setRecordingElapsedSeconds(0);
    clearTranscriptDraftState();
    clearParserPreviewState();
    clearPreviewSelectionState();
    setCurrentScreen(transcriptReviewReturnScreen);
    setStatus(transcriptClearedStatusMessage());
  }

  function clearTranscriptDraftState() {
    setTranscript("");
    setTranscriptVoiceSeconds(0);
    setIsTranscriptSample(false);
  }

  function clearParserPreviewState() {
    setPreview(null);
    setParserRecoveryMessage("");
  }

  function clearDailyRecordDraftOrganizationState() {
    setDailyTranscriptEntries([]);
    setDailyRecordOrganizationRevision(0);
    setDailyRecordOrganizationReason(null);
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
    clearParserPreviewState();
  }

  function fillTranscriptSampleDraft() {
    updateTranscriptDraft(sampleText, "sample");
  }

  function seedManualRecordDateTimeForNow() {
    const nowInputs = localDateTimeInputs(new Date());
    setManualRecordDate(nowInputs.date);
    setManualRecordTime(nowInputs.time);
  }

  function seedManualRecordStateFromRecord(record: RecordItem) {
    setManualRecordFields(recordPayloadToEditFields(record));
    const dateTime = localDateTimeInputs(record.occurred_at);
    setManualRecordDate(dateTime.date);
    setManualRecordTime(dateTime.time);
  }

  function seedEmptyManualRecordStateForNow() {
    setManualRecordFields(emptyRecordEditFields());
    seedManualRecordDateTimeForNow();
  }

  function openManualRecord(returnScreen: AppScreen = currentScreen) {
    seedManualRecordDateTimeForNow();
    setManualRecordReturnScreen(returnScreen);
    setCurrentScreen("manualRecord");
  }

  function openRecordManualRecord() {
    openManualRecord("record");
    setStatus(recordManualEntryStatusMessage());
  }

  function openAiReviewManualRecord() {
    clearPreviewSelectionState();
    openManualRecord("aiReview");
    setStatus(aiReviewManualEntryStatusMessage());
  }

  function openTranscriptReviewManualRecord() {
    clearPreviewSelectionState();
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

  function clearSelectedAnalysisPoint() {
    setSelectedAnalysisPointIndex(null);
  }

  function selectAnalysisRange(range: AnalysisRange) {
    setAnalysisRange(range);
    clearSelectedAnalysisPoint();
  }

  function pressAnalysisRangeOption(item: ReturnType<typeof analysisRangeDisplayItem>) {
    selectAnalysisRange(item.value);
  }

  function updateAnalysisCustomStartInput(value: string) {
    setAnalysisCustomStart(boundDateInputText(value));
    clearSelectedAnalysisPoint();
  }

  function updateAnalysisCustomEndInput(value: string) {
    setAnalysisCustomEnd(boundDateInputText(value));
    clearSelectedAnalysisPoint();
  }

  async function applyAnalysisCustomRange() {
    if (isReportLoading) {
      return;
    }
    clearSelectedAnalysisPoint();
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
    clearRecordSyncPaginationStatus(visualSmokeRecordSyncStatusMessage());
  }

  function clearBasicReportCache() {
    setBasicReport(null);
    setBasicReportKey("");
  }

  function clearVoiceQuotaStatus(statusMessage: string) {
    setVoiceQuota(null);
    setQuotaStatus(statusMessage);
  }

  function clearRecordSyncPaginationStatus(statusMessage: string) {
    setRecordsStatus(statusMessage);
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
    clearVoiceQuotaStatus(voiceQuotaInitialStatusMessage());
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
    clearRecordSyncPaginationStatus(recordSyncInitialStatusMessage());
    clearBasicReportCache();
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
    clearDailyRecordDraftOrganizationState();
    clearTranscriptDraftState();
    setSelectedRecord(null);
    clearBasicReportCache();
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
      setStatus(authLogoutMainStatusMessage());
    } catch (error) {
      clearMobileSessionState();
      setAuthActionStatus(authLogoutFailureStatusMessage(error));
      setStatus(authLogoutLocalClearStatusMessage());
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
      setStatus(authLogoutAllMainStatusMessage());
    } catch (error) {
      clearMobileSessionState();
      setAuthActionStatus(authLogoutFailureStatusMessage(error));
      setStatus(authLogoutLocalClearStatusMessage());
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
      clearRecordingPreviewRuntime();
      setStatus(recordingStartFailureStatusMessage(error));
    } finally {
      recordingStartInFlight.current = false;
    }
  }

  function clearRecordingPreviewRuntime(elapsedSeconds = 0) {
    setIsRecordingPreview(false);
    setRecordingStartedAt(null);
    setRecordingElapsedSeconds(elapsedSeconds);
  }

  function resetRecordingPreview() {
    audioRecordingRef.current = null;
    clearRecordingPreviewRuntime();
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
      clearRecordingPreviewRuntime();
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
    clearRecordingPreviewRuntime();
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
      clearRecordingPreviewRuntime(elapsedSeconds);
      recordingStopInFlight.current = false;
    }
    if (shouldOpenTodayRecordingTranscriptReview(currentScreen, elapsedSeconds)) {
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

  function seedPreviewEditStateFromRecord(record: PendingRecord) {
    setPreviewEditFields(recordPayloadToEditFields(record));
    const dateTime = localDateTimeInputs(record.occurred_at);
    setPreviewEditDate(dateTime.date);
    setPreviewEditTime(dateTime.time);
  }

  function clearPreviewEditDraftFields() {
    setPreviewEditFields(emptyRecordEditFields());
  }

  function clearSelectedPreviewEditDraft() {
    setSelectedPreviewIndex(null);
    clearPreviewEditDraftFields();
  }

  function clearDailyRecordEntryMenu() {
    setDailyRecordMenuIndex(null);
  }

  function seedEmptyPreviewEditStateForNow() {
    clearPreviewEditDraftFields();
    const nowInputs = localDateTimeInputs(new Date());
    setPreviewEditDate(nowInputs.date);
    setPreviewEditTime(nowInputs.time);
  }

  function clearPreviewMenuSelectionIndexes() {
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    clearDailyRecordEntryMenu();
  }

  function selectPreviewEditIndex(index: number) {
    clearDailyRecordEntryMenu();
    setPendingPreviewRemoveIndex(null);
    setSelectedPreviewIndex(index);
  }

  function selectPreviewRemoveIndex(index: number) {
    clearDailyRecordEntryMenu();
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(index);
  }

  function openPreviewRecordEdit(index: number, returnScreen: AppScreen = "aiReview") {
    const record = preview?.records[index];
    if (!record) {
      return;
    }
    setPreviewActionReturnScreen(returnScreen);
    selectPreviewEditIndex(index);
    seedPreviewEditStateFromRecord(record);
    setCurrentScreen("editPreviewRecord");
    setStatus(aiCandidateEditOpenStatusMessage());
  }

  function returnFromPreviewRecordEdit() {
    clearPreviewMenuSelectionIndexes();
    seedEmptyPreviewEditStateForNow();
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
    selectPreviewRemoveIndex(index);
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
    clearPreviewMenuSelectionIndexes();
    clearPreviewEditDraftFields();
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
    clearDailyRecordEntryMenu();
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
      clearSelectedPreviewEditDraft();
      clearDailyRecordEntryMenu();
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
    clearPreviewSelectionState();
    setLastSaveErrorSummary("");
    setCurrentScreen("aiSaveConfirm");
    setStatus(aiSaveConfirmReadyStatusMessage());
  }

  function openTodayTranscriptText() {
    setStatus(todayTranscriptExpandedStatusMessage());
  }

  function openDailyRecordEntryMenu(item: ReturnType<typeof dailyRecordEntryDisplayItem>) {
    setDailyRecordMenuIndex((current) => (current === item.index ? null : item.index));
    setStatus(dailyRecordEntryMenuOpenStatusMessage(item.typeLabel));
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

  function clearPreviewSelectionState() {
    setSelectedPreviewIndex(null);
    setPendingPreviewRemoveIndex(null);
    setPreviewEditFields(emptyRecordEditFields());
  }

  function clearPreviewActionState() {
    clearPreviewSelectionState();
    setLastSaveErrorSummary("");
  }

  function returnFromAiSaveConfirm() {
    clearPreviewActionState();
    setCurrentScreen("aiReview");
    setStatus(aiSaveConfirmReturnStatusMessage());
  }

  function processUnsavedPreviewRecords() {
    if (!preview || preview.records.length === 0) {
      setCurrentScreen("today");
      return;
    }
    clearPreviewActionState();
    setCurrentScreen("aiReview");
    setStatus(saveSuccessProcessUnsavedStatusMessage());
  }

  function openSaveSuccessDestination(target: AppScreen) {
    if (target === "aiReview") {
      processUnsavedPreviewRecords();
      return;
    }
    clearPreviewActionState();
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
    clearPreviewActionState();
    openManualRecord(manualRecordReturnScreen);
    setStatus(saveSuccessManualContinueStatusMessage());
  }

  function openSaveSuccessRecordEntry() {
    clearPreviewActionState();
    setCurrentScreen("record");
    setStatus(saveSuccessRecordEntryStatusMessage());
  }

  function openSaveSuccessRecordDetail() {
    clearPreviewActionState();
    openSelectedRecordDetail("saveSuccess");
    setStatus(saveSuccessViewDetailStatusMessage());
  }

  function returnFromSaveSuccessToToday() {
    openSaveSuccessDestination("today");
  }

  function returnFromAiSaveFailureToAiReview() {
    clearPreviewActionState();
    setCurrentScreen("aiReview");
    setStatus(aiSaveFailureBackAiReviewStatusMessage());
  }

  function returnFromAiSaveFailureToSaveConfirm() {
    clearPreviewActionState();
    if (!preview || preview.records.length === 0) {
      setCurrentScreen("aiReview");
      setStatus(aiSaveFailureBackAiReviewStatusMessage());
      return;
    }
    setCurrentScreen("aiSaveConfirm");
    setStatus(aiSaveFailureReturnSaveConfirmStatusMessage());
  }

  function openAiSaveFailureManualFallback() {
    clearPreviewSelectionState();
    openManualRecord("aiReview");
    setStatus(aiSaveFailureManualFallbackStatusMessage());
  }

  async function loadVoiceQuota(accountId: string, tokenOverride = accessToken) {
    const tokenForHeaders = tokenOverride.trim();
    if ((!protectedAuthReady && !tokenForHeaders) || accountId.trim().length === 0) {
      clearVoiceQuotaStatus(voiceQuotaUnavailableStatusMessage(protectedAccountBackendUnavailableMessage));
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
        clearVoiceQuotaStatus(voiceQuotaSyncFailureStatusMessage());
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
    const subpageTarget = settingsRowSubpageTarget(row);
    if (subpageTarget) {
      setCurrentScreen(subpageTarget);
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

  function openMenuTargetRoute(target: AppScreen) {
    if (target === "community") {
      openCommunity("menu");
      return true;
    }
    if (target === "ranking") {
      openRanking("menu");
      return true;
    }
    if (target === "manualRecord") {
      openManualRecord("menu");
      return true;
    }
    if (target === "subscription") {
      openSubscription("menu");
      return true;
    }
    if (target === "tutorial") {
      openTutorial("menu");
      return true;
    }
    if (target === "foodPhoto") {
      openFoodPhoto("menu");
      return true;
    }
    if (target === "achievements") {
      openAchievements("menu");
      return true;
    }
    if (target === "yearReview") {
      openYearReview("menu");
      return true;
    }
    if (target === "store") {
      openStore("menu");
      return true;
    }
    return false;
  }

  function openMenuDestination(target: AppScreen) {
    if (openMenuTargetRoute(target)) {
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

  function openFutureModuleDetailResult(module: FutureModuleCard | null) {
    setSelectedFutureModule(module);
    setFutureModuleActionStatus(previewActionClearStatusMessage());
    setCurrentScreen("futureModuleDetail");
  }

  function futurePreviewReturnScreen(returnScreen: AppScreen, selfScreen: AppScreen) {
    return returnScreen === selfScreen ? "futureModules" : returnScreen;
  }

  function openDoctorShare(returnScreen: AppScreen = currentScreen) {
    setDoctorShareReturnScreen(futurePreviewReturnScreen(returnScreen, "doctorShare"));
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
    setHealthIntegrationReturnScreen(futurePreviewReturnScreen(returnScreen, "healthIntegration"));
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
    setCommunityReturnScreen(futurePreviewReturnScreen(returnScreen, "community"));
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
    setRankingReturnScreen(futurePreviewReturnScreen(returnScreen, "ranking"));
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

  function seedVisualSmokeDemoRecords() {
    setRecords(visualSmokeDemoRecords());
  }

  function seedVisualSmokeDemoPreview() {
    setPreview(visualSmokeDemoPreview());
  }

  function seedVisualSmokeSelectedRecord(record: RecordItem) {
    seedVisualSmokeDemoRecords();
    setSelectedRecord(record);
  }

  function seedVisualSmokeHistoryRecordSelection(record: RecordItem) {
    seedVisualSmokeSelectedRecord(record);
    setRecordDetailReturnScreen("history");
  }

  function openVisualSmokeRecordSeedRoute(target: AppScreen) {
    if (target === "saveSuccess") {
      const demoRecord = visualSmokeDemoRecord();
      seedVisualSmokeSelectedRecord(demoRecord);
      setLastSavedSummary("Visual smoke demo save result.");
      setLastSaveEntryMethod("ai");
      setCurrentScreen("saveSuccess");
      return true;
    }
    if (target === "deleteSuccess") {
      seedVisualSmokeDemoRecords();
      setSelectedRecord(null);
      setRecordDetailReturnScreen("history");
      openDeleteSuccessResult("Visual smoke demo delete result.");
      return true;
    }
    if (target === "updateSuccess") {
      const demoRecord = visualSmokeDemoRecord();
      seedVisualSmokeDemoRecords();
      selectRecordForResult(demoRecord);
      setRecordDetailReturnScreen("history");
      openUpdateSuccessResult("Visual smoke demo update result.");
      return true;
    }
    if (target === "recordDetail") {
      const demoRecord = visualSmokeDemoRecord();
      seedVisualSmokeHistoryRecordSelection(demoRecord);
      setCurrentScreen("recordDetail");
      return true;
    }
    if (target === "editRecord") {
      const demoRecord = visualSmokeDemoRecord();
      seedVisualSmokeSelectedRecord(demoRecord);
      seedRecordEditStateFromRecord(demoRecord);
      setCurrentScreen("editRecord");
      return true;
    }
    if (target === "deleteConfirm") {
      const demoRecord = visualSmokeDemoRecord();
      seedVisualSmokeHistoryRecordSelection(demoRecord);
      setCurrentScreen("deleteConfirm");
      return true;
    }
    return false;
  }

  function openVisualSmokeWorkflowSeedRoute(target: AppScreen) {
    if (target === "manualRecordConfirm") {
      const demoRecord = visualSmokeDemoRecord();
      setManualRecordType("glucose");
      seedManualRecordStateFromRecord(demoRecord);
      setManualRecordReturnScreen("menu");
      setCurrentScreen("manualRecordConfirm");
      return true;
    }
    if (target === "detailedReport") {
      seedVisualSmokeDemoRecords();
      setBasicReport(visualSmokeDemoReport());
      setReportStatus(visualSmokeRecordSyncStatusMessage());
      setCurrentScreen("detailedReport");
      return true;
    }
    return false;
  }

  function openVisualSmokeAiSeedRoute(target: AppScreen) {
    if (target === "aiSaveFailure") {
      seedVisualSmokeDemoPreview();
      openAiSaveFailureResult("Visual smoke demo save failure.");
      return true;
    }
    if (target === "editPreviewRecord") {
      const demoPreview = visualSmokeDemoPreview();
      const demoRecord = demoPreview.records[0];
      setPreview(demoPreview);
      setPendingPreviewRemoveIndex(null);
      setSelectedPreviewIndex(0);
      seedPreviewEditStateFromRecord(demoRecord);
      setCurrentScreen("editPreviewRecord");
      return true;
    }
    if (target === "aiRemoveConfirm") {
      seedVisualSmokeDemoPreview();
      setSelectedPreviewIndex(null);
      setPendingPreviewRemoveIndex(0);
      setCurrentScreen("aiRemoveConfirm");
      return true;
    }
    return false;
  }

  function openVisualSmokeMenuReturnRoute(target: AppScreen) {
    if (target === "manualRecord") {
      openManualRecord("menu");
      return true;
    }
    if (target === "subscription") {
      openSubscription("menu");
      return true;
    }
    if (target === "tutorial") {
      openTutorial("menu");
      return true;
    }
    if (target === "achievements") {
      openAchievements("menu");
      return true;
    }
    if (target === "yearReview") {
      openYearReview("menu");
      return true;
    }
    if (target === "store") {
      openStore("menu");
      return true;
    }
    if (target === "storeCart") {
      setStoreReturnScreen("menu");
      openStoreCart();
      return true;
    }
    if (target === "foodPhoto") {
      openFoodPhoto("menu");
      return true;
    }
    return false;
  }

  function openVisualSmokeFutureModuleRoute(target: AppScreen) {
    if (target === "futureModuleDetail") {
      openFutureModuleDetailResult(futureModuleCards[0] ?? null);
      return true;
    }
    if (target === "doctorShare") {
      openDoctorShare("futureModules");
      return true;
    }
    if (target === "healthIntegration") {
      openHealthIntegration("futureModules");
      return true;
    }
    if (target === "community") {
      openCommunity("futureModules");
      return true;
    }
    if (target === "ranking") {
      openRanking("futureModules");
      return true;
    }
    return false;
  }

  function openVisualSmokeTranscriptRoute(target: AppScreen) {
    if (target === "transcriptReview") {
      setTranscriptReviewReturnScreen("record");
      updateTranscriptDraft(sampleText, "sample");
      setCurrentScreen("transcriptReview");
      return true;
    }
    return false;
  }

  function openVisualSmokeRoute(target: AppScreen) {
    if (!enableDebugTools || !allowMobileDevAuth) {
      return;
    }
    activateVisualSmokePreview();
    if (isVisualSmokeRecordListScreen(target)) {
      seedVisualSmokeDemoRecords();
      setCurrentScreen(target);
      return;
    }
    if (target === "record") {
      setCurrentScreen("record");
      return;
    }
    if (openVisualSmokeTranscriptRoute(target)) {
      return;
    }
    if (isVisualSmokeAiPreviewScreen(target)) {
      seedVisualSmokeDemoPreview();
      setCurrentScreen(target);
      return;
    }
    if (openVisualSmokeAiSeedRoute(target)) {
      return;
    }
    if (openVisualSmokeRecordSeedRoute(target)) {
      return;
    }
    if (openVisualSmokeWorkflowSeedRoute(target)) {
      return;
    }
    if (openVisualSmokeMenuReturnRoute(target)) {
      return;
    }
    if (isVisualSmokeSubscriptionStatusScreen(target)) {
      setCurrentScreen(target);
      return;
    }
    if (isVisualSmokeSettingsMenuScreen(target)) {
      setCurrentScreen(target);
      return;
    }
    if (openVisualSmokeFutureModuleRoute(target)) {
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
      const deepLinkRoute = visualSmokeRouteFromDeepLinkUrl(url, enableDebugTools, allowMobileDevAuth);
      if (!deepLinkRoute) {
        return;
      }
      openVisualSmokeRoute(deepLinkRoute);
      setStatus(visualSmokeDeepLinkStatusMessage(deepLinkRoute));
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
    openFutureModuleDetailResult(module);
  }

  function openFutureModuleTargetRoute(target: AppScreen) {
    if (target === "foodPhoto") {
      openFoodPhoto("futureModules");
      return true;
    }
    if (target === "doctorShare") {
      openDoctorShare("futureModules");
      return true;
    }
    if (target === "healthIntegration") {
      openHealthIntegration("futureModules");
      return true;
    }
    if (target === "community") {
      openCommunity("futureModules");
      return true;
    }
    if (target === "ranking") {
      openRanking("futureModules");
      return true;
    }
    if (target === "achievements") {
      openAchievements("futureModules");
      return true;
    }
    if (target === "yearReview") {
      openYearReview("futureModules");
      return true;
    }
    if (target === "store") {
      openStore("futureModules");
      return true;
    }
    return false;
  }

  function openFutureModuleDestination(target: AppScreen | undefined, module: FutureModuleCard) {
    setFutureModuleActionStatus(previewActionClearStatusMessage());
    if (!target) {
      openFutureModuleDetail(module);
      return;
    }
    if (openFutureModuleTargetRoute(target)) {
      return;
    }
    setCurrentScreen(target);
  }

  function pressFutureModuleDestination(item: ReturnType<typeof futureModuleCardDisplayItem>) {
    openFutureModuleDestination(item.target, item.module);
  }

  async function loadBasicReportForCurrentRange(mode: "analysis" | "detailed") {
    if (!protectedBackendReady) {
      clearBasicReportCache();
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
        clearBasicReportCache();
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
    const foodCommunitySyncStatus = foodCommunitySyncStatusMessages({
      backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
      itemCount: 0
    });
    if (!protectedAccountBackendReady || !account) {
      setCommunityActionStatus(foodCommunitySyncStatus.unavailable);
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
      setCommunityActionStatus(foodCommunitySyncStatus.inFlight);
      return;
    }
    communitySyncInFlightKeys.current.add(communityKey);
    setCommunityActionStatus(foodCommunitySyncStatus.loading);
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
        foodCommunitySyncStatusMessages({
          backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
          itemCount: nextItems.length
        }).success
      );
    } catch {
      if (latestCommunitySyncKey.current === communityKey) {
        setFoodCommunityBackendItems([]);
        setCommunityActionStatus(foodCommunitySyncStatus.failure);
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
    const detailStatus = foodCommunityDetailStatusMessages({
      itemTitle: "",
      exampleCount: 0
    });
    latestFoodCommunityDetailKey.current = detailKey;
    if (foodCommunityDetailInFlightKeys.current.has(detailKey)) {
      setCommunityActionStatus(detailStatus.inFlight);
      return;
    }
    foodCommunityDetailInFlightKeys.current.add(detailKey);
    setCommunityActionStatus(detailStatus.loading);
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
        foodCommunityDetailStatusMessages({
          itemTitle: detailedItem.title,
          exampleCount: detailedItem.examples.length
        }).success
      );
    } catch {
      if (latestFoodCommunityDetailKey.current === detailKey) {
        setCommunityActionStatus(detailStatus.failure);
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
      setCommunityActionStatus(
        communityPublicSettingsStatusMessages({
          backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
          leaderboardOptIn: false
        }).loadFailure
      );
    }
  }

  function updateCommunityPublicDisplayNameDraft(value: string) {
    setCommunityPublicDisplayNameDraft(boundDisplayText(value, maxDisplayTextLength));
  }

  async function saveCommunityPublicSettings(nextOptIn?: boolean) {
    const publicSettingsStatus = communityPublicSettingsStatusMessages({
      backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
      leaderboardOptIn: nextOptIn ?? communityPublicSettings?.leaderboard_opt_in ?? false
    });
    if (visualSmokePreviewActive.current) {
      setCommunityActionStatus(publicSettingsStatus.visualSmoke);
      return;
    }
    if (!protectedAccountBackendReady || !account) {
      setCommunityActionStatus(publicSettingsStatus.unavailable);
      return;
    }
    const displayName = (communityPublicDisplayNameDraft || accountPublicDisplayNameDisplayText).trim();
    if (!displayName) {
      setCommunityActionStatus(publicSettingsStatus.missingDisplayName);
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
        communityPublicSettingsStatusMessages({
          backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
          leaderboardOptIn: boundedSettings.leaderboard_opt_in
        }).success
      );
      void loadCommunityLeaderboards();
    } catch {
      setCommunityActionStatus(publicSettingsStatus.failure);
    }
  }

  async function loadCommunityLeaderboards() {
    if (visualSmokePreviewActive.current) {
      return;
    }
    const leaderboardSyncStatus = communityLeaderboardSyncStatusMessages({
      backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
      sectionCount: 0,
      entryCount: 0
    });
    if (!protectedAccountBackendReady || !account) {
      setRankingActionStatus(leaderboardSyncStatus.unavailable);
      return;
    }
    const rankingTypes: CommunityLeaderboardType[] = ["share_count", "contribution", "food_tester"];
    const rankingKey = [normalizedApiBaseUrl, account.id, communityPublicSettings?.leaderboard_opt_in ?? false].join(":");
    latestRankingSyncKey.current = rankingKey;
    if (rankingSyncInFlightKeys.current.has(rankingKey)) {
      setRankingActionStatus(leaderboardSyncStatus.inFlight);
      return;
    }
    rankingSyncInFlightKeys.current.add(rankingKey);
    setRankingActionStatus(leaderboardSyncStatus.loading);
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
        communityLeaderboardSyncStatusMessages({
          backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
          sectionCount: displaySections.length,
          entryCount
        }).success
      );
    } catch {
      if (latestRankingSyncKey.current === rankingKey) {
        setRankingLeaderboardSections([]);
        setRankingActionStatus(leaderboardSyncStatus.failure);
      }
    } finally {
      rankingSyncInFlightKeys.current.delete(rankingKey);
    }
  }

  async function loadStoreCatalogAndPoints() {
    if (visualSmokePreviewActive.current) {
      return;
    }
    const storeSyncStatus = storeCatalogSyncStatusMessages({
      backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
      redemptionCount: 0,
      pointsBalance: 0
    });
    if (!protectedAccountBackendReady || !account) {
      setStoreActionStatus(storeSyncStatus.unavailable);
      return;
    }
    const storeKey = [normalizedApiBaseUrl, account.id].join(":");
    latestStoreSyncKey.current = storeKey;
    if (storeSyncInFlightKeys.current.has(storeKey)) {
      setStoreActionStatus(storeSyncStatus.inFlight);
      return;
    }
    storeSyncInFlightKeys.current.add(storeKey);
    setStoreActionStatus(storeSyncStatus.loading);
    try {
      const [rewards, points, redemptions] = await Promise.all([
        requestJson<StoreRewardApiInput[]>(normalizedApiBaseUrl, "/store/rewards", {
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
        storeCatalogSyncStatusMessages({
          backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
          redemptionCount: redemptions.length,
          pointsBalance: points.balance
        }).success
      );
    } catch {
      if (latestStoreSyncKey.current === storeKey) {
        setStoreBackendProducts([]);
        setStorePointsBalance(null);
        setStoreRedemptions([]);
        setStoreActionStatus(storeSyncStatus.failure);
      }
    } finally {
      storeSyncInFlightKeys.current.delete(storeKey);
    }
  }

  async function loadAchievementSummary(syncUnlocks = false) {
    if (visualSmokePreviewActive.current) {
      return;
    }
    const achievementSyncStatus = achievementSyncStatusMessages({
      backendUnavailableMessage: protectedBackendUnavailableMessage,
      syncUnlocks,
      unlockedCount: 0,
      persistedUnlockCount: 0,
      newlyUnlockedCount: 0,
      nextRemaining: 0,
      unlockHistoryCopy: "已讀取解鎖紀錄"
    });
    if (!protectedBackendReady || !account || !activeProfile) {
      setAchievementBackendItems([]);
      setAchievementNewlyUnlockedItems([]);
      setAchievementUnlockedItems([]);
      setAchievementActionStatus(achievementSyncStatus.unavailable);
      return;
    }
    const achievementKey = [normalizedApiBaseUrl, account.id, activeProfile.id].join(":");
    latestAchievementSyncKey.current = achievementKey;
    if (achievementSyncInFlightKeys.current.has(achievementKey)) {
      setAchievementActionStatus(achievementSyncStatus.inFlight);
      return;
    }
    achievementSyncInFlightKeys.current.add(achievementKey);
    setAchievementActionStatus(achievementSyncStatus.loading);
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
        achievementSyncStatusMessages({
          backendUnavailableMessage: protectedBackendUnavailableMessage,
          syncUnlocks,
          unlockedCount: summary.unlocked_count,
          persistedUnlockCount,
          newlyUnlockedCount,
          nextRemaining: summary.next_remaining,
          unlockHistoryCopy
        }).success
      );
    } catch {
      if (latestAchievementSyncKey.current === achievementKey) {
        setAchievementBackendItems([]);
        setAchievementNewlyUnlockedItems([]);
        setAchievementUnlockedItems([]);
        setAchievementActionStatus(achievementSyncStatus.failure);
      }
    } finally {
      achievementSyncInFlightKeys.current.delete(achievementKey);
    }
  }

  async function loadYearReview() {
    if (visualSmokePreviewActive.current) {
      return;
    }
    const targetYear = String(yearReviewTargetYear(new Date()));
    const yearReviewSyncStatus = yearReviewSyncStatusMessages({
      backendUnavailableMessage: protectedBackendUnavailableMessage,
      year: targetYear
    });
    if (!protectedBackendReady || !account || !activeProfile) {
      setYearReviewActionStatus(yearReviewSyncStatus.unavailable);
      return;
    }
    const yearReviewKey = [normalizedApiBaseUrl, account.id, activeProfile.id, targetYear].join(":");
    latestYearReviewSyncKey.current = yearReviewKey;
    if (yearReviewSyncInFlightKeys.current.has(yearReviewKey)) {
      setYearReviewActionStatus(yearReviewSyncStatus.inFlight);
      return;
    }
    yearReviewSyncInFlightKeys.current.add(yearReviewKey);
    setYearReviewActionStatus(yearReviewSyncStatus.loading);
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
      setYearReviewActionStatus(
        yearReviewSyncStatusMessages({
          backendUnavailableMessage: protectedBackendUnavailableMessage,
          year: summary.year,
          snapshotId: summary.snapshot_id
        }).success
      );
    } catch {
      if (latestYearReviewSyncKey.current === yearReviewKey) {
        setYearReviewBackendSummary(null);
        setYearReviewActionStatus(yearReviewSyncStatus.failure);
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
    const shareCardStatus = yearReviewShareCardStatusMessages({
      backendUnavailableMessage: protectedBackendUnavailableMessage,
      shareFilename: "",
      privacyCopy: "",
      packageCopy: "",
      checksumShort: "",
      shareResultCopy: "",
      resultReportCopy: ""
    });
    if (!protectedBackendReady || !account || !activeProfile) {
      setYearReviewActionStatus(shareCardStatus.unavailable);
      return;
    }
    const targetYear = String(yearReviewTargetYear(new Date()));
    setYearReviewActionStatus(shareCardStatus.loading);
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
        yearReviewShareCardStatusMessages({
          backendUnavailableMessage: protectedBackendUnavailableMessage,
          shareFilename,
          privacyCopy,
          packageCopy,
          checksumShort,
          shareResultCopy,
          resultReportCopy
        }).success
      );
    } catch {
      setYearReviewActionStatus(shareCardStatus.failure);
    }
  }

  async function revokeYearReviewSharePackage() {
    const revokeStatus = yearReviewRevokeStatusMessages({
      backendUnavailableMessage: protectedBackendUnavailableMessage,
      sharePackageId: yearReviewSharePackageId,
      revokedCopy: ""
    });
    if (visualSmokePreviewActive.current) {
      setYearReviewActionStatus(revokeStatus.visualSmoke);
      return;
    }
    if (!yearReviewSharePackageId) {
      setYearReviewActionStatus(revokeStatus.empty);
      return;
    }
    if (!protectedBackendReady || !account) {
      setYearReviewActionStatus(revokeStatus.unavailable);
      return;
    }
    const targetSharePackageId = boundIdentifier(yearReviewSharePackageId);
    if (!targetSharePackageId) {
      setYearReviewSharePackageId("");
      setYearReviewActionStatus(revokeStatus.invalid);
      return;
    }
    setYearReviewActionStatus(revokeStatus.loading);
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
        yearReviewRevokeStatusMessages({
          backendUnavailableMessage: protectedBackendUnavailableMessage,
          sharePackageId: targetSharePackageId,
          revokedCopy
        }).success
      );
    } catch {
      setYearReviewActionStatus(revokeStatus.failure);
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
    const shareStatus = foodCommunityShareStatusMessages({
      backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
      awardedPoints: 0,
      timeErrorMessage: ""
    });
    if (visualSmokePreviewActive.current) {
      setCommunityActionStatus(shareStatus.visualSmoke);
      return;
    }
    if (!protectedAccountBackendReady || !account || !selectedFoodCommunityItem) {
      setCommunityActionStatus(shareStatus.unavailable);
      return;
    }
    if (foodShareInFlight.current) {
      setCommunityActionStatus(shareStatus.inFlight);
      return;
    }
    const beforeGlucose = Number(foodCommunityShareFields.beforeGlucose);
    const afterGlucose = Number(foodCommunityShareFields.afterGlucose);
    const foodName = boundDisplayText(
      foodCommunityShareFields.foodName || selectedFoodCommunityItem.title,
      maxDisplayTextLength
    ).trim();
    if (!foodName) {
      setCommunityActionStatus(shareStatus.missingFoodName);
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
      setCommunityActionStatus(shareStatus.invalidGlucose);
      return;
    }
    let eatenAt = "";
    try {
      eatenAt = localDateTimeToIso(foodCommunityShareFields.eatenDate, foodCommunityShareFields.eatenTime);
    } catch (error) {
      setCommunityActionStatus(
        foodCommunityShareStatusMessages({
          backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
          awardedPoints: 0,
          timeErrorMessage: error instanceof Error ? error.message : "食用時間格式不正確。"
        }).invalidTime
      );
      return;
    }
    foodShareInFlight.current = true;
    setIsBusy(true);
    setCommunityActionStatus(shareStatus.loading);
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
        foodCommunityShareStatusMessages({
          backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
          awardedPoints: response.awarded_points,
          timeErrorMessage: ""
        }).success
      );
      void loadStoreCatalogAndPoints();
      void loadCommunityLeaderboards();
    } catch {
      setCommunityActionStatus(shareStatus.failure);
    } finally {
      foodShareInFlight.current = false;
      setIsBusy(false);
    }
  }

  async function redeemStoreProduct(product: ReturnType<typeof storeProductDisplayItem>) {
    const redeemStatus = storeRedeemStatusMessages({
      backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
      productTitle: product.title,
      fulfillmentCopy: "",
      pointsCost: 0
    });
    if (visualSmokePreviewActive.current) {
      setStoreActionStatus(redeemStatus.visualSmoke);
      return;
    }
    if (!protectedAccountBackendReady || !account) {
      setStoreActionStatus(redeemStatus.unavailable);
      return;
    }
    if (product.rewardStatus !== "redeemable") {
      setStoreActionStatus(product.actionStatus);
      return;
    }
    if (!product.id) {
      setStoreActionStatus(redeemStatus.invalidProduct);
      return;
    }
    if (storeRedemptionInFlight.current) {
      setStoreActionStatus(redeemStatus.inFlight);
      return;
    }
    storeRedemptionInFlight.current = true;
    setIsBusy(true);
    setStoreActionStatus(redeemStatus.loading);
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
        storeRedeemStatusMessages({
          backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
          productTitle: product.title,
          fulfillmentCopy,
          pointsCost: redemption.points_cost
        }).success
      );
      void loadStoreCatalogAndPoints();
    } catch {
      setStoreActionStatus(redeemStatus.failure);
    } finally {
      storeRedemptionInFlight.current = false;
      setIsBusy(false);
    }
  }

  async function useStoreRedemption(redemption: ReturnType<typeof storeRedemptionDisplayItem>) {
    const redemptionUseStatus = storeRedemptionUseStatusMessages({
      backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
      redemptionTitle: redemption.title,
      statusLabel: redemption.statusLabel,
      usedIdentifier: ""
    });
    if (visualSmokePreviewActive.current) {
      setStoreActionStatus(redemptionUseStatus.visualSmoke);
      return;
    }
    if (!protectedAccountBackendReady || !account) {
      setStoreActionStatus(redemptionUseStatus.unavailable);
      return;
    }
    if (!redemption.isUsable) {
      setStoreActionStatus(redemptionUseStatus.unusable);
      return;
    }
    if (!redemption.id) {
      setStoreActionStatus(redemptionUseStatus.invalid);
      return;
    }
    if (storeRedemptionInFlight.current) {
      setStoreActionStatus(redemptionUseStatus.inFlight);
      return;
    }
    storeRedemptionInFlight.current = true;
    setIsBusy(true);
    setStoreActionStatus(redemptionUseStatus.loading);
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
        storeRedemptionUseStatusMessages({
          backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
          redemptionTitle: redemption.title,
          statusLabel: redemption.statusLabel,
          usedIdentifier: usedRedemption.fulfillment_code || usedRedemption.reward_code
        }).success
      );
      void loadStoreCatalogAndPoints();
    } catch {
      setStoreActionStatus(redemptionUseStatus.failure);
    } finally {
      storeRedemptionInFlight.current = false;
      setIsBusy(false);
    }
  }

  async function boot() {
    if (visualSmokePreviewActive.current) {
      const display = visualSmokeBootSkippedDisplayMessages();
      setStatus(display.status);
      setAuthActionStatus(display.authStatus);
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
          const display = visualSmokeBootIgnoredDisplayMessages();
          setStatus(display.status);
          setAuthActionStatus(display.authStatus);
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
    clearParserPreviewState();
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
      clearTranscriptDraftState();
      clearDailyRecordDraftOrganizationState();
      setRecords((current) => boundRecordsList([...createdRecords, ...current]));
      setRecordsStatus(aiSaveRecordsStatusMessage(createdRecords.length));
      if (createdRecords[0]) {
        selectRecordForResult(createdRecords[0]);
      }
      setLastSaveErrorSummary("");
      openSaveSuccessResult(aiSaveSuccessSummaryMessage(savedCount), "ai", "today");
      setStatus(aiSaveSuccessStatusMessage());
      syncAchievementsAfterRecordSave();
    } catch (error) {
      const message = aiSaveFailureStatusMessage(error);
      openAiSaveFailureResult(message);
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
        clearRecordSyncPaginationStatus(recordSyncFailureStatusMessage());
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
      clearRecordSyncPaginationStatus(recordSyncFailureStatusMessage());
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

  function seedRecordEditStateFromRecord(record: RecordItem) {
    setRecordEditFields(recordPayloadToEditFields(record));
    const dateTime = localDateTimeInputs(record.occurred_at);
    setRecordEditDate(dateTime.date);
    setRecordEditTime(dateTime.time);
  }

  function selectRecordForResult(record: RecordItem) {
    setSelectedRecord(record);
    setRecordEditFields(recordPayloadToEditFields(record));
  }

  function openSaveSuccessResult(summary: string, entryMethod: SaveEntryMethod, returnScreen: AppScreen) {
    setLastSavedSummary(summary);
    setLastSaveEntryMethod(entryMethod);
    setSaveSuccessReturnScreen(returnScreen);
    setCurrentScreen("saveSuccess");
  }

  function openAiSaveFailureResult(message: string) {
    setLastSaveErrorSummary(message);
    setLastSaveEntryMethod("ai");
    setCurrentScreen("aiSaveFailure");
  }

  function openUpdateSuccessResult(summary: string) {
    setLastUpdatedSummary(summary);
    setCurrentScreen("updateSuccess");
  }

  function openDeleteSuccessResult(summary: string) {
    setLastDeletedSummary(summary);
    setCurrentScreen("deleteSuccess");
  }

  function seedEmptyRecordEditStateForNow() {
    setRecordEditFields(emptyRecordEditFields());
    const nowInputs = localDateTimeInputs(new Date());
    setRecordEditDate(nowInputs.date);
    setRecordEditTime(nowInputs.time);
  }

  function openRecordDetail(record: RecordItem, returnScreen: AppScreen = "today") {
    setSelectedRecord(record);
    setRecordDetailReturnScreen(returnScreen);
    seedRecordEditStateFromRecord(record);
    setCurrentScreen("recordDetail");
  }

  function openSelectedRecordDetail(returnScreen: AppScreen) {
    if (!selectedRecord) {
      return;
    }
    setRecordDetailReturnScreen(returnScreen);
    seedRecordEditStateFromRecord(selectedRecord);
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
    seedRecordEditStateFromRecord(selectedRecord);
    setCurrentScreen("editRecord");
    setStatus(recordEditOpenStatusMessage());
  }

  function returnFromRecordEdit() {
    if (selectedRecord) {
      seedRecordEditStateFromRecord(selectedRecord);
    } else {
      seedEmptyRecordEditStateForNow();
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
      selectRecordForResult(updated);
      openUpdateSuccessResult(recordUpdateSummaryMessage(1));
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
      seedEmptyRecordEditStateForNow();
      openDeleteSuccessResult(recordDeleteSummaryMessage(1));
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
      selectRecordForResult(created);
      seedEmptyManualRecordStateForNow();
      openSaveSuccessResult(manualRecordCreateSummaryMessage(1), "manual", manualRecordReturnScreen);
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
      const display = visualSmokeBootSkippedDisplayMessages();
      setStatus(display.status);
      setAuthActionStatus(display.authStatus);
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
            {primaryTabItems.map((screen) => {
              const isCurrentPrimaryTab = screen.isCurrent;
              const isPrimaryTabLocked = screen.isLocked;
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
                  <HighlightBulletRow key={item} text={item} />
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
                  <HighlightBulletRow key={item} text={item} />
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
                            <DailyRecordDetailRow key={`${item.key}-${row.label}`} label={row.label} value={row.value} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <FieldLabel icon={"📅"} label={"日期"} />
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
                <FieldLabel icon={"🕒"} label={"時間"} />
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
              <FieldLabel icon={"🏷"} label={"類型"} />
              <Text style={styles.recordContent}>{selectedPreviewRecordDisplayItem?.typeLabel ?? "紀錄"}</Text>
            </View>
            {selectedPreviewRecord.record_type === "glucose" ? (
              <>
                <View style={styles.formField}>
                  <FieldLabel icon={"💧"} label={"血糖數值"} />
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
                  <FieldLabel icon={"◌"} label={"情境"} />
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
                  <FieldLabel icon={"🥣"} label={"餐別"} />
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
                  <FieldLabel icon={"🍽"} label={"飲食內容"} />
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
                  <FieldLabel icon={"🚶"} label={"運動"} />
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
                  <FieldLabel icon={"⏱"} label={"時長（分鐘）"} />
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
                  <FieldLabel icon={"💊"} label={"用藥"} />
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
                  <FieldLabel icon={"▣"} label={"劑量"} />
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
                  <FieldLabel icon={"📝"} label={"備註類型"} />
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
                  <FieldLabel icon={"#"} label={"標籤"} />
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
                <FieldLabel icon={"{}"} label={"payload_json"} />
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
              <Text style={styles.warningText}>{previewRecordEditValidationDisplay}</Text>
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
            <ManualRecordHeaderIntro
              backAccessibilityLabel={coreFlowDisplayLabels.manualReturnAccessibility}
              backLabel={coreFlowDisplayLabels.back}
              introText="不經 AI parser，直接建立結構化紀錄；可節省 LLM token，仍走後端驗證與權限檢查。"
              title="手動新增紀錄"
              onBackPress={returnFromManualRecord}
            />
            <ManualRecordDateTimeFields
              dateAccessibilityLabel={auxiliaryDisplayLabels.dateInputAccessibility}
              dateMaxLength={maxDateInputLength}
              dateValue={manualRecordDate}
              timeAccessibilityLabel={auxiliaryDisplayLabels.timeInputAccessibility}
              timeMaxLength={maxTimeInputLength}
              timeValue={manualRecordTime}
              onDateChange={updateManualRecordDateInput}
              onTimeChange={updateManualRecordTimeInput}
            />
            <ManualRecordTypeSelector
              options={manualRecordTypeDisplayOptions}
              selectedValue={manualRecordType}
              onTypePress={pressManualRecordTypeOption}
            />

            {manualRecordType === "glucose" ? (
              <ManualRecordGlucoseFields
                glucoseTiming={manualRecordFields.glucoseTiming}
                glucoseValue={manualRecordFields.glucoseValue}
                glucoseValueAccessibilityLabel={auxiliaryDisplayLabels.glucoseValueInputAccessibility}
                glucoseValueMaxLength={recordEditFieldMaxLength("glucoseValue")}
                glucoseUnit={manualRecordFields.glucoseUnit}
                timingOptions={glucoseTimingDisplayOptions}
                unitOptions={glucoseUnitDisplayOptions}
                onGlucoseValueChange={updateManualRecordGlucoseValue}
                onTimingPress={pressManualRecordGlucoseTimingOption}
                onUnitPress={pressManualRecordGlucoseUnitOption}
              />
            ) : null}

            {manualRecordType === "meal" ? (
              <ManualRecordMealFields
                foodItems={manualRecordFields.foodItems}
                foodItemsAccessibilityLabel={auxiliaryDisplayLabels.foodItemsInputAccessibility}
                foodItemsMaxLength={recordEditFieldMaxLength("foodItems")}
                mealType={manualRecordFields.mealType}
                mealTypeOptions={mealTypeDisplayOptions}
                onFoodItemsChange={updateManualRecordFoodItems}
                onMealTypePress={pressManualRecordMealTypeOption}
              />
            ) : null}

            {manualRecordType === "exercise" ? (
              <ManualRecordExerciseFields
                activity={manualRecordFields.exerciseActivity}
                activityAccessibilityLabel={auxiliaryDisplayLabels.exerciseActivityInputAccessibility}
                activityMaxLength={recordEditFieldMaxLength("exerciseActivity")}
                minutes={manualRecordFields.exerciseMinutes}
                minutesAccessibilityLabel={auxiliaryDisplayLabels.exerciseMinutesInputAccessibility}
                minutesMaxLength={recordEditFieldMaxLength("exerciseMinutes")}
                onActivityChange={updateManualRecordExerciseActivity}
                onMinutesChange={updateManualRecordExerciseMinutes}
              />
            ) : null}

            {manualRecordType === "medication" ? (
              <ManualRecordMedicationFields
                dose={manualRecordFields.medicationDose}
                doseAccessibilityLabel={auxiliaryDisplayLabels.medicationDoseInputAccessibility}
                doseMaxLength={recordEditFieldMaxLength("medicationDose")}
                name={manualRecordFields.medicationName}
                nameAccessibilityLabel={auxiliaryDisplayLabels.medicationNameInputAccessibility}
                nameMaxLength={recordEditFieldMaxLength("medicationName")}
                onDoseChange={updateManualRecordMedicationDose}
                onNameChange={updateManualRecordMedicationName}
              />
            ) : null}

            {manualRecordType === "note" ? (
              <ManualRecordNoteFields
                kind={manualRecordFields.noteKind}
                kindAccessibilityLabel={auxiliaryDisplayLabels.noteKindInputAccessibility}
                kindMaxLength={recordEditFieldMaxLength("noteKind")}
                tags={manualRecordFields.noteTags}
                tagsAccessibilityLabel={auxiliaryDisplayLabels.noteTagsInputAccessibility}
                tagsMaxLength={recordEditFieldMaxLength("noteTags")}
                onKindChange={updateManualRecordNoteKind}
                onTagsChange={updateManualRecordNoteTags}
              />
            ) : null}

            <ManualRecordCreatePreviewAction
              accessibilityLabel={coreFlowDisplayLabels.manualCreatePreviewAccessibility}
              disabled={Boolean(manualRecordValidationError) || isBusy || !protectedBackendReady}
              label={coreFlowDisplayLabels.createRecord}
              warningText={
                manualRecordValidationError
                  ? manualRecordValidationDisplayText
                  : protectedBackendUnavailableMessage
                    ? manualRecordBackendUnavailableDisplayText
                    : null
              }
              onPress={enterManualRecordConfirm}
            />
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
            <ManualRecordConfirmPreviewBlock
              badgeLabel={auxiliaryDisplayLabels.preSaveConfirmBadge}
              icon={manualRecordConfirmDisplay.icon}
              introText={manualRecordConfirmIntroDisplayText}
              payloadSummary={manualRecordConfirmDisplay.payloadSummary}
              sourceLine={manualRecordConfirmDisplay.sourceLine}
              typeLabel={manualRecordConfirmDisplay.typeLabel}
            />
            <ManualRecordConfirmFooterActions
              checklistItems={manualSubmitChecklistItems}
              preCheckTitle={coreFlowDisplayLabels.preSubmitCheck}
              returnAccessibilityLabel={coreFlowDisplayLabels.manualConfirmReturnAccessibility}
              returnDisabled={isBusy}
              returnLabel={coreFlowDisplayLabels.returnEdit}
              submitAccessibilityLabel={coreFlowDisplayLabels.manualCreateSubmitAccessibility}
              submitDisabled={Boolean(manualRecordValidationError) || isBusy || !protectedBackendReady}
              submitLabel={manualRecordConfirmSubmitDisplayLabel}
              warningText={
                manualRecordValidationError
                  ? manualRecordValidationDisplayText
                  : protectedBackendUnavailableMessage
                    ? manualRecordBackendUnavailableDisplayText
                    : null
              }
              onReturnPress={returnFromManualRecordConfirm}
              onSubmitPress={submitManualRecordCreate}
            />
          </View>
        ) : null}

        {currentScreen === "history" ? (
          <View style={styles.pageSection}>
            <Text style={styles.sectionTitle}>歷史紀錄</Text>
            <HistoryIntroStatusBlocks
              boundaryItems={historyBoundaryChecklistItems}
              boundaryTitle={coreFlowDisplayLabels.historyDataBoundary}
              syncBody={recordsStatusDisplayText}
              syncTitle={coreFlowDisplayLabels.recordSyncStatus}
            />
            <HistoryCalendarMonthPicker
              days={historyCalendarDisplayItems}
              nextMonthAccessibilityLabel={historyNextMonthAccessibilityLabel}
              nextMonthLabel={historyNextMonthButtonLabel}
              previousMonthAccessibilityLabel={historyPreviousMonthAccessibilityLabel}
              previousMonthLabel={historyPreviousMonthButtonLabel}
              title={historyCalendarTitle}
              onDayPress={pressHistoryCalendarDay}
              onNextMonthPress={openNextHistoryMonth}
              onPreviousMonthPress={openPreviousHistoryMonth}
            />
            <HistoryDailySummaryTable
              emptyBody={historyNoRangeRecordsBodyDisplayText}
              emptyTitle={historyNoRangeRecordsTitleDisplayText}
              items={historyDailySummaryDisplayItems}
              selectedDate={selectedHistoryDate}
              onSummaryPress={pressHistoryDailySummary}
            />
            {recordsForDisplay.length === 0 ? (
              <HistoryNoRecordStatusBlock
                body={historyNoRealRecordHealthValueDisplayText}
                title={coreFlowDisplayLabels.historyDataStatus}
              />
            ) : null}
            {recordsForDisplay.length >= mobileRecordSyncLimit ? (
              <HistorySyncBoundaryBlock
                body={historySyncBoundaryDisplayText}
                canLoadMoreRecords={canLoadMoreRecords}
                loadMoreAccessibilityLabel={coreFlowDisplayLabels.historyLoadMoreAccessibility}
                loadMoreLabel={coreFlowDisplayLabels.historyLoadMore}
                title={coreFlowDisplayLabels.historySyncBoundary}
                onLoadMore={loadMoreRecords}
              />
            ) : null}
            <HistorySelectedDatePanel
              detailMode={historyDetailMode}
              detailModeOptions={historyDetailModeDisplayOptions}
              emptyBody={historyNoRangeRecordsBodyDisplayText}
              emptyTitle={historyNoRangeRecordsTitleDisplayText}
              rawItems={selectedHistoryRawDisplayItems}
              recordCount={selectedHistoryRecordDisplayCount}
              sectionItems={selectedHistoryDailySectionItems}
              selectedDateLabel={selectedHistoryDateDisplayText}
              selectedSourceLabel={selectedHistoryDailySummary.sourceLabel}
              selectedStorageLabel={selectedHistoryDailySummary.storageLabel}
              selectedSummaryText={selectedHistoryDailySummary.summaryText}
              selectedSyncLabel={selectedHistoryDailySummary.syncLabel}
              onDetailModePress={pressHistoryDetailModeOption}
              onEntryPress={pressHistoryDailyEntry}
            />
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
            <RecordDetailInfoPanel
              boundaryItems={recordDetailBoundaryChecklistItems}
              boundaryTitle={coreFlowDisplayLabels.detailBoundary}
              dateLabel={"日期"}
              dateTimeLabel={selectedRecordDisplayItem?.dateTimeLabel ?? "尚未選擇紀錄"}
              dateValue={selectedRecordDisplayItem?.dateLabel ?? "尚無"}
              detailRows={selectedRecordDetailRows}
              exerciseValue={selectedRecordDisplayItem?.exerciseSummary ?? "無"}
              mainInfoTitle={coreFlowDisplayLabels.mainInfo}
              medicationValue={selectedRecordDisplayItem?.medicationSummary ?? "無"}
              payloadSummary={selectedRecordDisplayItem?.payloadSummary ?? "沒有資料"}
              sourceTitle={coreFlowDisplayLabels.source}
              sourceValue={selectedRecordDisplayItem?.sourceLabel ?? "尚無"}
              supplementalInfoTitle={coreFlowDisplayLabels.supplementalInfo}
              timeLabel={"時間"}
              timeValue={selectedRecordDisplayItem?.timeLabel ?? "尚無"}
              typeLabel={"類型"}
              typeValue={selectedRecordDisplayItem?.typeLabel ?? "請從今日或歷史紀錄選擇一筆真實紀錄。"}
            />
            <RecordDetailActionPanel
              canManageRecord={Boolean(selectedRecord)}
              deleteAccessibilityLabel={coreFlowDisplayLabels.recordDeleteOpenAccessibility}
              disabled={isBusy}
              editAccessibilityLabel={coreFlowDisplayLabels.recordEditOpenAccessibility}
              editLabel={coreFlowDisplayLabels.edit}
              onDeletePress={openDeleteConfirm}
              onEditPress={openRecordEdit}
            />
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
            <DeleteConfirmPreviewBlock
              dangerLabel={auxiliaryDisplayLabels.dangerOperation}
              introText={deleteConfirmIntroDisplayText}
              recordMetaText={deleteConfirmRecordMetaDisplayText}
              recordSummary={selectedRecordDisplayItem.payloadSummary}
              recordTypeLabel={selectedRecordDisplayItem.typeLabel}
            />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.deletePreConfirm}</Text>
              {deleteConfirmChecklistItems.map((item) => (
                <HighlightBulletRow key={item} text={item} />
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
            <RecordEditHeaderFields
              dateAccessibilityLabel={auxiliaryDisplayLabels.dateInputAccessibility}
              dateMaxLength={maxDateInputLength}
              dateValue={recordEditDate}
              timeAccessibilityLabel={auxiliaryDisplayLabels.timeInputAccessibility}
              timeMaxLength={maxTimeInputLength}
              timeValue={recordEditTime}
              typeLabel={selectedRecordDisplayItem?.typeLabel ?? "紀錄"}
              onDateChange={updateRecordEditDateInput}
              onTimeChange={updateRecordEditTimeInput}
            />
            {selectedRecord.record_type === "glucose" ? (
              <>
                <View style={styles.formField}>
                  <FieldLabel icon={"💧"} label={"血糖數值"} />
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
                  <FieldLabel icon={"◌"} label={"情境"} />
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
                  <FieldLabel icon={"🥣"} label={"餐別"} />
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
                  <FieldLabel icon={"🍽"} label={"飲食內容"} />
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
                  <FieldLabel icon={"🚶"} label={"運動"} />
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
                  <FieldLabel icon={"⏱"} label={"時長（分鐘）"} />
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
                  <FieldLabel icon={"💊"} label={"用藥"} />
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
                  <FieldLabel icon={"▣"} label={"劑量"} />
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
                  <FieldLabel icon={"📝"} label={"備註類型"} />
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
                  <FieldLabel icon={"#"} label={"標籤"} />
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
                <FieldLabel icon={"{}"} label={"payload_json"} />
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
            <RecordEditFooterActions
              cancelAccessibilityLabel={coreFlowDisplayLabels.recordEditReturnAccessibility}
              cancelLabel={coreFlowDisplayLabels.cancel}
              checklistItems={recordUpdateChecklistItems}
              disabled={Boolean(selectedRecordEditValidationError) || isBusy}
              preCheckTitle={coreFlowDisplayLabels.updatePreCheck}
              saveLabel={coreFlowDisplayLabels.saveChanges}
              submitAccessibilityLabel={coreFlowDisplayLabels.recordUpdateSubmitAccessibility}
              validationText={selectedRecordEditValidationError ? selectedRecordEditValidationDisplayText : null}
              onCancelPress={returnFromRecordEdit}
              onSubmitPress={submitRecordUpdate}
            />
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
                    <FieldLabel icon={"📅"} label={"開始日期"} />
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
                    <FieldLabel icon={"📅"} label={"結束日期"} />
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
                <MetricCard key={row.label} label={row.label} value={row.value} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <MetricCard key={row.label} label={row.label} value={row.value} />
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
              {detailedReportNoteItems.map((item) => (
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
                      <HighlightBulletRow key={requirement.key} text={requirement.text} />
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
                <HighlightBulletRow key={requirement.key} text={requirement.text} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
                  <FieldLabel icon={"📅"} label={"食用日期"} />
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
                  <FieldLabel icon={"🕒"} label={"食用時間"} />
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
                <HighlightDetailRow key={row.label} label={row.label} value={row.value} />
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
                <HighlightDetailRow key={row.label} label={row.label} value={row.value} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
              <Text style={styles.evidence}>{tokenStorageStatusDisplayText}</Text>
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
                <HighlightBulletRow key={item} text={item} />
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
  historyItemTitle: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10
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
