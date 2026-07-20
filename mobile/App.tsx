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
  AnalysisRangeSelector,
  analysisRangeOptionAccessibilityLabel,
  analysisRangeOptionKey,
  analysisRangeOptionLabel,
  analysisRangeOptionSelected,
  analysisRangeTarget,
  type AnalysisRangeOption
} from "./analysisRangeSelector";
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
  aiSaveConfirmState,
  previewActionReturnState,
  previewRecordState,
  recordCollectionState,
  saveSuccessState
} from "./appViewState";
import { AnalysisCustomDateRangeFields } from "./analysisCustomDateRangeFields";
import {
  boundDisplayText,
  boundIdentifier,
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
  displayPayload,
  displayTextValue,
  groupedRecordListDisplaySectionsForRecords,
  manualRecordConfirmDisplayItem,
  pendingRemoveDisplayIcon,
  pendingRemoveDisplayPayloadSummary,
  pendingRemoveDisplayTypeLabel,
  previewRecordDisplayBundle,
  previewRecordEditTypeLabel,
  rejectedPreviewEventKey,
  rejectedPreviewEventReasonText,
  rejectedPreviewEventSourceText,
  recordDetailCardTarget,
  recordEditHeaderTypeLabel,
  recordListDisplayItem,
  recordListDisplayItems,
  recordTypeIcon,
  selectedRecordDisplayBundleForRecord,
  selectedRecordDetailDateLabel,
  selectedRecordDetailDateTimeLabel,
  selectedRecordDetailExerciseSummary,
  selectedRecordDetailMedicationSummary,
  selectedRecordDetailPayloadSummary,
  selectedRecordDetailSourceLabel,
  selectedRecordDetailTimeLabel,
  selectedRecordDetailTypeLabel
} from "./recordDisplay";
import {
  boundRecordEditField,
  buildPayloadFromEditFields,
  emptyRecordEditFields,
  glucoseTimingOptions,
  glucoseUnitOptions,
  manualRecordOptionTarget,
  manualRecordTypes,
  mealTypeOptions,
  previewRecordsWithoutRecord,
  previewRecordsWithEditedRecord,
  recordEditFieldValue,
  recordEditOptionTarget,
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
  recordsListWithoutDeletedRecord,
  recordsListWithUpdatedRecord,
  todayRecordItems,
  type ParsePreviewResponse,
  type PendingRecord,
  type RecordItem
} from "./recordBounds";
import {
  createClientSaveBatchId,
  previewRecordsForSave
} from "./recordSaveTransforms";
import {
  headerBackTargetForScreen,
  isSettingsSubpageScreen,
  isVisualSmokeAiPreviewScreen,
  isVisualSmokeRecordListScreen,
  isVisualSmokeSettingsMenuScreen,
  isVisualSmokeSubscriptionStatusScreen,
  menuScreens,
  mvpFlowStepIndicatorText,
  mvpFlowStepIsActive,
  mvpFlowStepIsDone,
  mvpFlowStepKey,
  mvpFlowStepLabel,
  mvpFlowSteps,
  mvpFlowStepperState,
  primaryTabAccessibilityText,
  primaryTabIsCurrent,
  primaryTabIsLocked,
  primaryTabKey,
  primaryTabLabel,
  primaryScreens,
  primaryTabNavigationState,
  primaryTabTarget,
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
  achievementItemsFromApi,
  achievementLocalComputationCopy,
  achievementNewlyUnlockedItemsForSync,
  achievementNextBadgeCopy,
  achievementPreviewBoundaryCopy,
  achievementSyncStatusMessages,
  achievementUnlocksFromApi,
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
  communityActionStatusLabel,
  communityActionStatusText,
  communityActionStatusVisible,
  communityHeroIconLabel,
  communityLeaderboardSyncStatusMessages,
  communityLeaderboardDisplaySections,
  communityLeaderboardTypes,
  communityPostAccessibilityLabel,
  communityPostButtonLabel,
  communityPublicNamePreviewLabel,
  communityPublicProfileSaveAccessibilityLabel,
  communityPublicProfileSaveButtonLabel,
  communityPublicSettingsStatusMessages,
  communityPrivacyAccessibilityLabel,
  emptyFoodCommunityShareFields,
  communityReadinessChecklistDisplayItems,
  communityScreenSubtitleCopy,
  communityScreenTitleLabel,
  foodCommunityCategoriesFromApi,
  foodCommunityCategories,
  foodCommunityCategoryDefaultItemId,
  foodCommunityCategoryDisplayItem,
  foodCommunityCategoryOptionAccessibilityLabel,
  foodCommunityCategoryOptionKey,
  foodCommunityCategoryOptionLabel,
  foodCommunityCategoryOptionSelected,
  foodCommunityCategorySummary,
  foodCommunityCategoryTarget,
  foodCommunityDatabaseIntroCopy,
  foodCommunityDatabaseSectionLabel,
  foodCommunityDetailAverageRiseDisplayText,
  foodCommunityDetailAverageRiseLabel,
  foodCommunityDetailIndividualShares,
  foodCommunityDetailIndividualShareSectionLabel,
  foodCommunityDetailMaximumRiseDisplayText,
  foodCommunityDetailMaximumRiseLabel,
  foodCommunityDetailMinimumRiseDisplayText,
  foodCommunityDetailMinimumRiseLabel,
  foodCommunityDetailPanelVisible,
  foodCommunityDetailSelectedItemId,
  foodCommunityDetailShareCountDisplayText,
  foodCommunityDetailShareCountLabel,
  foodCommunityDetailStatusMessages,
  foodCommunityDetailStatusExampleCount,
  foodCommunityDetailStatusTitle,
  foodCommunityDetailTitleDisplayText,
  foodCommunityDisplayBundle,
  foodCommunityItemDisplayItem,
  foodCommunityItemFromApi,
  foodCommunityItemsFromApi,
  foodCommunityItemsWithShareUpdateFromApi,
  foodCommunityItemsWithDetail,
  foodCommunityItemTarget,
  foodCommunityItems,
  foodCommunityListDefaultItemId,
  foodCommunityPointsStoreBridgeCopy,
  foodCommunityRankingSectionLabel,
  foodCommunityShareCategory,
  foodCommunityShareEatenDateLabel,
  foodCommunityShareEatenTimeLabel,
  foodCommunityShareFallbackFoodName,
  foodCommunityShareSectionLabel,
  foodCommunityShareStatusMessages,
  foodCommunityShareSelectedItemIdFromApi,
  foodCommunitySyncStatusMessages,
  futureModuleCards,
  futureModuleCardDisplayItems,
  futureModuleDetailBoundaryCopy,
  futureModuleDetailReturnStatusMessage,
  futureModuleImplementationOrderCopy,
  futureModuleRequirementKey,
  futureModuleRequirementText,
  futureModulesOpenStatusMessage,
  futureModulesReturnMenuStatusMessage,
  futurePreviewBoundaryBadgeLabel,
  futurePreviewBoundaryCopyText,
  futurePreviewCloseAccessibilityLabel,
  futurePreviewReadinessSectionLabel,
  futurePreviewReturnStatusMessage,
  futurePreviewReturnAccessibilityLabel,
  futurePreviewReturnButtonLabel,
  futurePreviewSectionLabels,
  futurePreviewStatusDisplayTexts,
  healthIntegrationBoundaryDisplayRows,
  healthIntegrationExternalDataBoundaryCopy,
  healthIntegrationPreviewBoundaryDisplayItem,
  healthIntegrationReadinessChecklistDisplayItems,
  achievementYearReviewStatusDisplayTexts,
  limitedAchievementDisplayItems,
  localAchievementItemsForRecords,
  privacyPreviewBoundaryDisplayItem,
  rankingActionStatusLabel,
  rankingActionStatusText,
  rankingActionStatusVisible,
  rankingBoundaryDisplayRows,
  rankingCloseButtonLabel,
  rankingHeroIconLabel,
  rankingLocalStreakPreviewLabel,
  rankingLocalPreviewBoundaryCopy,
  rankingOptInActionAccessibilityLabel,
  rankingOptInActionButtonLabel,
  rankingPreviewBoundaryDisplayItem,
  rankingPublicActionAccessibilityLabel,
  rankingPublicActionButtonLabel,
  rankingReadinessChecklistDisplayItems,
  rankingScreenSubtitleCopy,
  rankingScreenTitleLabel,
  rankingStreakDisplayText,
  reminderPreviewBoundaryDisplayItem,
  selectedFutureModuleDisplayItem,
  localYearlyHealthOutcomeDisplayRows,
  localYearlyHighlightDisplayItems,
  localYearlyReviewMetricDisplayRows,
  saveSuccessNewlyUnlockedAchievementDisplayItems,
  storeCategories,
  storeCategoryDisplayItem,
  storeCategoryOptionAccessibilityLabel,
  storeCategoryOptionKey,
  storeCategoryOptionLabel,
  storeCategoryOptionSelected,
  storeCategoryTarget,
  storeCartUnavailableDisplayItem,
  storeCheckoutReadinessChecklistDisplayItems,
  storeEmptySearchDisplayItem,
  storeCatalogSyncStatusMessages,
  storePreviewDisplayTexts,
  storeRedeemStatusMessages,
  storeRedemptionUseStatusMessages,
  storeDisplayBundle,
  storeProductsFromApi,
  storeProductActionAccessibilityLabel,
  storeProductActionLabel,
  storeProductActionStatus,
  storeProductCardBadge,
  storeProductCardDescription,
  storeProductCardIcon,
  storeProductCardKey,
  storeProductCardPointsCost,
  storeProductCardTitle,
  storeProductDisplayItem,
  storeProductRedeemTitle,
  storeProductRewardId,
  storeProducts,
  storeRedemptionActionAccessibilityLabel,
  storeRedemptionActionDisabled,
  storeRedemptionActionLabel,
  storeRedemptionCardKey,
  storeRedemptionCardStatusLabel,
  storeRedemptionCardSubtitle,
  storeRedemptionCardTitle,
  storeRedemptionDisplayItem,
  storeRedemptionUseId,
  storeRedemptionUseStatusLabel,
  storeRedemptionUseTitle,
  storeRedemptionsFromApi,
  yearReviewBoundaryDisplayCopy,
  yearReviewBackendAiSummaryTexts,
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
  detailPairDisplayItem,
  manualRecordTypeDisplayItems,
  menuScreenDisplayItems,
  optionDisplayItem,
  optionDisplayItems,
  previewTupleDisplayItem,
  valueLabelDisplayItem,
  valueLabelDisplayItems,
  visualSmokeRouteJumpDisplayItems as buildVisualSmokeRouteJumpDisplayItems
} from "./sharedDisplayItems";
import {
  accountDisplayNameDisplayText,
  accountEmailDisplayValue,
  accountLoginDisplayValue,
  accountPublicDisplayNameForSettings,
  accountSecurityAuthModeDisplayTexts,
  doctorShareAccountBoundaryText,
  doctorShareBoundaryDisplayRows,
  doctorShareReadinessChecklistDisplayItems,
  profileSettingsBoundaryDisplayRowsForState,
  profileReadinessChecklistDisplayItems
} from "./accountCopy";
import {
  homeSpeechExamples,
  homeSpeechExampleDotIsActive,
  homeSpeechExampleDotKey,
  homeSpeechExampleLabel,
  homeSpeechExamplePaginationAccessibilityLabel,
  homeSpeechExampleText,
  homeRecordingDisplayBundle,
  homeRecordingPreviewBoundaryCopy,
  recordPageRecordingPreviewBoundaryCopy,
  recordingFinishedStatusMessage,
  recordingLimitCopy,
  recordingLimitReachedStatusMessage,
  recordingPermissionDeniedStatusMessage,
  recordingQuotaExhaustedStatusMessage,
  recordingResetStatusMessage,
  recordingResultDisplayBundle,
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
  parserModelReadyFromMessage,
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
  nativeBenchmarkMissingInputState,
  nativeBenchmarkResultState,
  nativeBenchmarkStartState,
  nativeDebugDefaultState,
  nativeDebugUnavailableState,
  nativeDownloadedModelsFailureState,
  nativeLlamaFailureState,
  nativeLlamaMissingInputState,
  nativeLlamaOutputSummaryMessage,
  nativeLlamaStartState,
  nativeLlamaSuccessState,
  nativeBenchmarkAccessibilityLabel,
  nativeDownloadKindAccessibilityLabel,
  nativeLlamaRunAccessibilityLabel,
  nativeModelDownloadAccessibilityLabel,
  nativeModelDownloadButtonLabel,
  nativeModelDownloadFailureState,
  nativeModelDownloadStartState,
  nativeModelDownloadSuccessState,
  nativeModuleCheckAccessibilityLabel,
  nativeModuleCheckButtonLabel,
  nativeModuleCheckFailureState,
  nativeModuleCheckStartState,
  nativeModuleCheckResultState,
  nativeStatusDisplayTexts,
  nativeWhisperFailureState,
  nativeWhisperMissingInputState,
  nativeWhisperRunAccessibilityLabel,
  nativeWhisperStartState,
  nativeWhisperSuccessState,
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
  buildHistoryDailySummaryDisplayItems,
  historyCalendarDayDisplayItem,
  historyDailySummaryDisplayItem,
  historyDateTarget,
  historyDetailModeDisplayItem,
  historyDetailModeDisplayItems,
  historyDetailModes,
  historyDetailModeTarget,
  historyRawRecordDisplayItems,
  historyRecordsByDateMap,
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
  analysisRangeDisplayItems,
  analysisRanges,
  basicReportRequestKey
} from "./analysisScreenData";
import {
  afterMealGlucoseCount as countAfterMealGlucose,
  analysisAxisLabel,
  analysisChartPointAccessibilityLabel,
  analysisChartPointIsSelected,
  analysisChartPointKey,
  analysisChartPointOffset,
  analysisChartPoints as buildAnalysisChartPoints,
  analysisChartPointValue,
  analysisChartRange,
  analysisGlucoseRecords as buildAnalysisGlucoseRecords,
  analysisGlucoseValues as buildAnalysisGlucoseValues,
  analysisReportState,
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
  aiReviewPreviewDisplayBundle,
  boundDailyTranscriptEntries,
  buildDailyRecordSaveRequest,
  createDailyTranscriptEntry,
  dailyRecordDisplayBundle,
  dailyRecordDraftScreenState,
  dailyRecordEntryMenuOpenStatusMessage,
  dailyRecordKeyFromRecords,
  dailyRecordReorganizationDisplayText,
  dailyRecordReorganizationStatusMessage,
  dailyTranscriptDisplayBundle,
  mergeSameDayParsePreviewDraft,
  parserTranscriptSource,
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
  selectedModelDisplayLabel,
  selectedModelRuntimeDisplayLabel,
  settingsAccountSecurityOpenStatusMessage,
  settingsSubpageStatusDisplayTexts,
  settingsSubpageReturnStatusMessage
} from "./settingsCopy";
import {
  authProviderDisplayItems as buildAuthProviderDisplayItems,
  authProviderPreviewDisplayItem,
  authProviderPreviewTarget,
  privacyControlDisplayRows as buildPrivacyControlDisplayRows,
  productionAuthReadinessDisplayRows as buildProductionAuthReadinessDisplayRows,
  sessionManagementDisplayItems as buildSessionManagementDisplayItems,
  settingsDisplayRows as buildSettingsDisplayRows,
  settingsRowSubpageTarget,
  subscriptionManagementDisplayRows as buildSubscriptionManagementDisplayRows,
  tutorialDisplaySteps as buildTutorialDisplaySteps,
  tutorialStepDescription,
  tutorialStepIcon,
  tutorialStepKey,
  tutorialStepTitle,
  type SettingsRow
} from "./settingsScreenData";
import {
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
  localDateTimeInputs,
  localDateTimeToIso,
  startOfCurrentMonth
} from "./dateTimeTransforms";
import { activeProfileForId, boundAccount, boundProfiles } from "./accountTransforms";
import {
  boundAiModelOptions,
  defaultSttModelOption,
  preferredLlmModelOption,
  selectedLlmModelOption,
  selectedSttModelOption
} from "./aiModelTransforms";
import {
  appendNativeLlamaBenchmarkResult,
  appendNativeWhisperBenchmarkResult,
  downloadedWhisperModelRefreshResult,
  hasNativeLlamaInput,
  hasNativeWhisperInput,
  nativeDebugInputValue,
  nativeLlamaInput,
  nativeWhisperInput,
  nativeBenchmarkResults,
  nativeDebugActionBlocked,
  nativeDebugActionReady,
  nativeLlamaRequestArgs,
  nativeModelDownloadRequestArgs,
  nativeModelDownloadSuccessPaths,
  nativeWhisperRequestArgs
} from "./modelTransforms";
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
import { AchievementCategorySectionList } from "./achievementCategorySectionList";
import { AchievementUnlockedCardList } from "./achievementUnlockedCardList";
import { AiCandidateList } from "./aiCandidateList";
import { AiFlowChecklist } from "./aiFlowChecklist";
import { AiReviewActionRow } from "./aiReviewActionRow";
import { AiSaveFailureActionRow } from "./aiSaveFailureActionRow";
import { CoreFlowEntryActionRow } from "./coreFlowEntryActionRow";
import { DailyRecordSectionList } from "./dailyRecordSectionList";
import { DangerConfirmActionRow } from "./dangerConfirmActionRow";
import { DeleteConfirmPreviewBlock } from "./deleteConfirmPreviewBlock";
import { DeleteSuccessActionRow } from "./deleteSuccessActionRow";
import { FieldLabel } from "./fieldLabel";
import { FutureBoundaryGrid } from "./futureBoundaryGrid";
import { FutureReadinessChecklist } from "./futureReadinessChecklist";
import { DetailRow } from "./detailRow";
import { DetailedReportBoundaryGrid } from "./detailedReportBoundaryGrid";
import { CommunityActionRow } from "./communityActionRow";
import { DoctorShareActionRow } from "./doctorShareActionRow";
import { FoodPhotoActionRow } from "./foodPhotoActionRow";
import { HealthIntegrationActionRow } from "./healthIntegrationActionRow";
import { RankingActionRow } from "./rankingActionRow";
import { RankingLeaderboardList } from "./rankingLeaderboardList";
import { HomeGuidanceCard } from "./homeGuidanceCard";
import { HistoryCalendarMonthPicker } from "./historyCalendarMonthPicker";
import { HistoryDailySummaryTable } from "./historyDailySummaryTable";
import { HistoryIntroStatusBlocks } from "./historyIntroStatusBlocks";
import { HistoryNoRecordStatusBlock } from "./historyNoRecordStatusBlock";
import { HistorySelectedDatePanel } from "./historySelectedDatePanel";
import { HistorySyncBoundaryBlock } from "./historySyncBoundaryBlock";
import { AccountSecurityActionGrid } from "./accountSecurityActionGrid";
import { AuthProviderPreviewList } from "./authProviderPreviewList";
import { authSessionManagementActionStatus, boundAuthSessionItems } from "./authSessionDisplay";
import { AuthSessionDisplayList } from "./authSessionDisplayList";
import { BackendUrlField } from "./backendUrlField";
import { HighlightBulletRow } from "./highlightBulletRow";
import { HighlightDetailList } from "./highlightDetailList";
import { InsightFlowChecklist } from "./insightFlowChecklist";
import { InsightEmptyActionRow } from "./insightEmptyActionRow";
import { CommunityPublicDisplayNameField } from "./communityPublicDisplayNameField";
import { CommerceReadinessChecklist } from "./commerceReadinessChecklist";
import { DailyTranscriptList } from "./dailyTranscriptList";
import { ManualRecordCreatePreviewAction } from "./manualRecordCreatePreviewAction";
import { ManualRecordConfirmFooterActions } from "./manualRecordConfirmFooterActions";
import {
  ManualRecordConfirmPreviewBlock,
  manualConfirmPreviewIcon,
  manualConfirmPreviewPayloadSummary,
  manualConfirmPreviewSourceLine,
  manualConfirmPreviewTypeLabel
} from "./manualRecordConfirmPreviewBlock";
import { ManualRecordDateTimeFields } from "./manualRecordDateTimeFields";
import { ManualRecordExerciseFields } from "./manualRecordExerciseFields";
import { ManualRecordGlucoseFields } from "./manualRecordGlucoseFields";
import { ManualRecordHeaderIntro } from "./manualRecordHeaderIntro";
import { ManualRecordMealFields } from "./manualRecordMealFields";
import { ManualRecordMedicationFields } from "./manualRecordMedicationFields";
import { ManualRecordNoteFields } from "./manualRecordNoteFields";
import {
  ManualRecordTypeSelector,
  manualRecordTypeTarget
} from "./manualRecordTypeSelector";
import { MenuDestinationGrid } from "./menuDestinationGrid";
import { MembershipFeatureList } from "./membershipFeatureList";
import { MetricGrid } from "./metricGrid";
import { DownloadedModelList } from "./downloadedModelList";
import { NativeDebugActionButton } from "./nativeDebugActionButton";
import { NativeDebugRunActions } from "./nativeDebugRunActions";
import { NativeDownloadKindSelector } from "./nativeDownloadKindSelector";
import { NativeDebugTextField } from "./nativeDebugTextField";
import { OutcomeChecklist } from "./outcomeChecklist";
import { PreviewStatusList } from "./previewStatusList";
import { PreviewRecordEditActionRow } from "./previewRecordEditActionRow";
import { ProductionAuthReadinessList } from "./productionAuthReadinessList";
import { QuickEntryModeRail } from "./quickEntryModeRail";
import { RecordingResultActionRow } from "./recordingResultActionRow";
import {
  RecordingWhisperModelSelector,
  recordingWhisperModelPathTarget,
  recordingWhisperModelStatusLabel
} from "./recordingWhisperModelSelector";
import { RecordFlowChecklist } from "./recordFlowChecklist";
import { RecordDetailActionPanel } from "./recordDetailActionPanel";
import { RecordDetailInfoPanel } from "./recordDetailInfoPanel";
import { RecordResultDestinationGrid } from "./recordResultDestinationGrid";
import { RecordEditFooterActions } from "./recordEditFooterActions";
import { RecordEditHeaderFields } from "./recordEditHeaderFields";
import { RecordJsonField } from "./recordJsonField";
import {
  RecordOptionField,
  RecordOptionRow,
  previewEditOptionTarget
} from "./recordOptionField";
import { RecordTextField, recordTextFieldStyles } from "./recordTextField";
import { SaveSuccessActionRow } from "./saveSuccessActionRow";
import { SettingsBoundaryGrid } from "./settingsBoundaryGrid";
import { SettingsChecklist } from "./settingsChecklist";
import { SettingsRowList, type SettingsDisplayRow } from "./settingsRowList";
import { SubscriptionChecklist } from "./subscriptionChecklist";
import { SubscriptionComparisonList } from "./subscriptionComparisonList";
import { TranscriptDraftInput } from "./transcriptDraftInput";
import { FoodCommunitySearchField } from "./foodCommunitySearchField";
import { FoodCommunityDetailShareList } from "./foodCommunityDetailShareList";
import { FoodCommunityItemList } from "./foodCommunityItemList";
import { FoodCommunityShareDateTimeFields } from "./foodCommunityShareDateTimeFields";
import { FoodCommunityShareTextFields } from "./foodCommunityShareTextFields";
import { FutureModuleCardList } from "./futureModuleCardList";
import { SegmentSelector } from "./segmentSelector";
import {
  SettingsModelChoiceSelector,
  settingsModelChoiceTarget
} from "./settingsModelChoiceSelector";
import {
  SettingsProfileChoiceSelector,
  settingsProfileChoiceTarget
} from "./settingsProfileChoiceSelector";
import { SettingsSubpageActionRow } from "./settingsSubpageActionRow";
import { SettingsSubpageCloseButton } from "./settingsSubpageCloseButton";
import { SessionManagementPreviewList } from "./sessionManagementPreviewList";
import { StoreSearchField } from "./storeSearchField";
import { SubscriptionSubpageActionRow } from "./subscriptionSubpageActionRow";
import { SubscriptionSubpageCloseButton } from "./subscriptionSubpageCloseButton";
import { TranscriptReviewActionRow } from "./transcriptReviewActionRow";
import { UpdateSuccessActionRow } from "./updateSuccessActionRow";
import { VisualSmokeRouteJumpGrid } from "./visualSmokeRouteJumpGrid";
import { YearlyHighlightList } from "./yearlyHighlightList";
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

type NativeBenchmarkResult = Awaited<ReturnType<typeof benchmarkNativeWhisper>> | Awaited<ReturnType<typeof benchmarkNativeLlama>>;

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
  const [nativeStatus, setNativeStatus] = useState(() => nativeDebugDefaultState().status);
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
  const activeProfile = activeProfileForId(profiles, activeProfileId);
  const selectedSttModel = selectedSttModelOption(models, sttModelId);
  const selectedLlmModel = selectedLlmModelOption(models, llmModelId);
  const parserModelUnavailableMessage = parserModelUnavailableText(selectedLlmModel, selectedSttModel);
  const parserModelReady = parserModelReadyFromMessage(parserModelUnavailableMessage);
  const accountDisplayName = accountDisplayNameDisplayText(account);
  const accountEmailDisplayText = accountEmailDisplayValue(account);
  const accountLoginDisplayText = accountLoginDisplayValue(account);
  const doctorShareAccountBoundaryDisplayText = doctorShareAccountBoundaryText(account);
  const activeProfileLabel = activeProfileLabelText(activeProfile, profiles.length);
  const activeProfileInlineDisplayText = activeProfileInlineText(activeProfileLabel);
  const activeProfileRelationshipDisplayText = activeProfileRelationshipText(activeProfile);
  const accountPublicDisplayNameDisplayText = accountPublicDisplayNameForSettings(communityPublicSettings, account);
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
    () => todayRecordItems(recordsForDisplay),
    [recordsForDisplay]
  );
  const historyRecords = recordsForDisplay;
  const todayRecordDisplayItems = useMemo(
    () => recordListDisplayItems(todayRecords, "today"),
    [todayRecords]
  );
  const groupedHistoryRecordDisplaySections = useMemo(
    () => groupedRecordListDisplaySectionsForRecords(historyRecords),
    [historyRecords]
  );
  const recordDisplayState = recordCollectionState(
    recordsForDisplay,
    mobileRecordSyncLimit,
    maxMobileRecordCacheLimit,
    maxMobileCountValue
  );
  const historyRecordsByDate = useMemo(() => historyRecordsByDateMap(recordsForDisplay), [recordsForDisplay]);
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
    () => buildHistoryDailySummaryDisplayItems(historyRecordsByDate, isVisualSmokePreviewMode),
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
  const analysisPreviewMode = recordDisplayState.isEmpty;
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
  const previewState = previewRecordState(preview);
  const unsavedPreviewRecordCount = previewState.recordCount;
  const unsavedPreviewRecordDisplayCount = previewState.displayCount;
  const mobileRecordSyncDisplayLimit = clampNumber(mobileRecordSyncLimit, 0, maxMobileCountValue);
  const mobileReportQueryDisplayLimit = clampNumber(mobileReportQueryLimit, 0, maxMobileCountValue);
  const historyNoRealRecordHealthValueDisplayText = noRealRecordHealthValueCopy("history");
  const analysisNoDataStatusDisplayLabel = analysisNoDataStatusLabel();
  const analysisNoDataDisplayCopy = analysisNoDataCopy();
  const analysisBoundaryDataDisplayCopy = analysisBoundaryDataCopy(analysisPreviewMode);
  const lowConfidencePreviewRecordCount = previewState.lowConfidenceRecordCount;
  const rejectedPreviewEventCount = previewState.rejectedEventCount;
  const lowConfidencePreviewRecordDisplayCount = previewState.lowConfidenceDisplayCount;
  const rejectedPreviewEventDisplayCount = previewState.rejectedEventDisplayCount;
  const aiReviewPreviewDisplay = aiReviewPreviewDisplayBundle(
    preview,
    previewState.records,
    previewState.rejectedEvents
  );
  const rejectedPreviewDisplayItems = aiReviewPreviewDisplay.rejectedItems;
  const aiReviewDateDisplayLabel = aiReviewPreviewDisplay.dateLabel;
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
  const aiSaveConfirmViewState = aiSaveConfirmState({
    isBusy,
    protectedBackendReady,
    previewState
  });
  const hasAiSaveConfirmWarnings = aiSaveConfirmViewState.hasWarnings;
  const isAiSaveConfirmBlockedByBackend = aiSaveConfirmViewState.isBlockedByBackend;
  const isAiSaveConfirmSubmitDisabled = aiSaveConfirmViewState.isSubmitDisabled;
  const aiSaveConfirmDisplay = aiSaveConfirmDisplayTexts(
    isBusy,
    isAiSaveConfirmBlockedByBackend,
    hasAiSaveConfirmWarnings
  );
  const aiSaveConfirmTitleDisplayText = aiSaveConfirmDisplay.title;
  const aiSaveConfirmDateLabelDisplayText = aiSaveConfirmDisplay.dateLabel;
  const aiSaveConfirmSummaryLabelDisplayText = aiSaveConfirmDisplay.summaryLabel;
  const aiSaveConfirmIntroDisplayText = aiSaveConfirmDisplay.intro;
  const dailyRecordDisplay = dailyRecordDisplayBundle(preview, previewState.records);
  const dailyRecordDateDisplayText = dailyRecordDisplay.dateText;
  const dailyRecordSummaryDisplayText = dailyRecordDisplay.summaryText;
  const dailyRecordReorganizationDisplay = dailyRecordReorganizationDisplayText(
    dailyRecordOrganizationReason,
    dailyRecordOrganizationRevision
  );
  const dailyRecordSectionItems = dailyRecordDisplay.sectionItems;
  const todayTranscriptDisplay = dailyTranscriptDisplayBundle(preview, dailyTranscriptEntries);
  const todayTranscriptDisplayItems = todayTranscriptDisplay.items;
  const todayTranscriptTitleDisplayText = todayTranscriptDisplay.title;
  const todayTranscriptBodyDisplayText = todayTranscriptDisplay.body;
  const todayTranscriptCountDisplayText = todayTranscriptDisplay.countText;
  const todayTranscriptAccessibilityLabel = todayTranscriptDisplay.accessibilityLabel;
  const aiSaveConfirmSubmitDisplayLabel = aiSaveConfirmDisplay.submit;
  const hasUnsavedPreviewRecords = unsavedPreviewRecordCount > 0;
  const dailyRecordDraftScreen = dailyRecordDraftScreenState({
    currentScreen,
    hasPreview: Boolean(preview),
    hasUnsavedPreviewRecords,
    isBusy
  });
  const isDailyRecordFixedSaveVisible = dailyRecordDraftScreen.isFixedSaveVisible;
  const isDailyRecordFixedSaveDockVisible = dailyRecordDraftScreen.isFixedSaveDockVisible;
  const isDailyRecordFixedSaveReturnDisabled = dailyRecordDraftScreen.isFixedSaveReturnDisabled;
  const mainScrollContainerStyle = isDailyRecordFixedSaveVisible
    ? [styles.container, styles.containerWithFixedSaveBar]
    : styles.container;
  const hasUnsavedDailyRecordDraft = dailyRecordDraftScreen.hasUnsavedDraft;
  const shouldGuardDailyRecordLeave = dailyRecordDraftScreen.shouldGuardLeave;
  const shouldShowDailyRecordLeaveGuard = dailyRecordLeaveGuardVisible;
  const dailyRecordLeaveGuardDisplay = dailyRecordLeaveGuardDisplayTexts();
  const dailyRecordLeaveGuardTitleDisplayText = dailyRecordLeaveGuardDisplay.title;
  const dailyRecordLeaveGuardBodyDisplayText = dailyRecordLeaveGuardDisplay.body;
  const dailyRecordLeaveGuardQuestionDisplayText = dailyRecordLeaveGuardDisplay.question;
  const dailyRecordLeaveGuardCancelDisplayText = dailyRecordLeaveGuardDisplay.cancel;
  const dailyRecordLeaveGuardCancelAccessibilityLabel = dailyRecordLeaveGuardDisplay.cancelAccessibility;
  const dailyRecordLeaveGuardConfirmDisplayText = dailyRecordLeaveGuardDisplay.confirm;
  const dailyRecordLeaveGuardConfirmAccessibilityLabel = dailyRecordLeaveGuardDisplay.confirmAccessibility;
  const saveSuccessViewState = saveSuccessState(lastSaveEntryMethod, hasUnsavedPreviewRecords);
  const hasPartialAiSave = saveSuccessViewState.hasPartialAiSave;
  const hasManualFallbackWithAiCandidates = saveSuccessViewState.hasManualFallbackWithAiCandidates;
  const aiSaveConfirmChecklistItems = aiSaveConfirmChecklistDisplayItems(unsavedPreviewRecordDisplayCount);
  const aiReviewCostBoundaryChecklistItems = aiReviewCostBoundaryChecklistDisplayItems();
  const transcriptReviewCostBoundaryChecklistItems = transcriptReviewCostBoundaryChecklistDisplayItems(
    protectedBackendReady,
    parserModelReady,
    parserModelUnavailableDisplayMessage
  );
  const saveSuccessBoundaryChecklistItems = saveSuccessBoundaryChecklistDisplayItems(
    lastSaveEntryMethod,
    saveSuccessViewState.hasUnsavedPreviewRecords,
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
    recordDisplayState.hasRecords
  );
  const deleteConfirmChecklistItems = deleteConfirmChecklistDisplayItems();
  const recordUpdateChecklistItems = recordUpdateChecklistDisplayItems();
  const analysisBoundaryChecklistItems = analysisBoundaryChecklistDisplayItems(
    analysisBoundaryDataDisplayCopy,
    maxMobileRecordCacheLimit,
    mobileReportQueryDisplayLimit
  );
  const saveSuccessDestinationItems = saveSuccessDestinationDisplayItems(
    saveSuccessViewState.hasUnsavedPreviewRecords
  );
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
  const backendYearAiSummaryTexts = yearReviewBackendAiSummaryTexts(yearReviewBackendSummary);
  const backendYearAiObservation = backendYearAiSummaryTexts.observation;
  const backendYearAiEncouragement = backendYearAiSummaryTexts.encouragement;
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
  const homeRecordingDisplay = homeRecordingDisplayBundle({
    currentExampleIndex: homeExampleIndex,
    elapsedSeconds: recordingElapsedSeconds,
    hasWhisperModel: Boolean(whisperModelPath.trim()),
    isRecording: isRecordingPreview
  });
  const recordingPreviewDisplayText = homeRecordingDisplay.previewText;
  const recordingEffectiveLimitDisplaySeconds = recordingEffectiveLimitSeconds(voiceQuota);
  const recordingLimitDisplayText = recordingLimitCopy(recordingEffectiveLimitDisplaySeconds);
  const homeRecordingSecondaryHintDisplayText = homeRecordingDisplay.secondaryHint;
  const homeRecordingModelStatusDisplayText = homeRecordingDisplay.modelStatus;
  const homeCurrentSpeechExample = homeRecordingDisplay.currentExample;
  const homeRecordingPreviewBoundaryDisplayText = homeRecordingPreviewBoundaryCopy();
  const recordPageRecordingPreviewBoundaryDisplayText = recordPageRecordingPreviewBoundaryCopy();
  const recordingResultDisplay = recordingResultDisplayBundle(recordingElapsedSeconds);
  const recordingSimulatedResultDisplayText = recordingResultDisplay.simulatedResult;
  const recordingElapsedSecondsDisplayText = recordingResultDisplay.elapsed;
  const recordingResultBodyDisplayText = recordingResultDisplay.body;
  const recordingResultPrimaryActionDisplayText = recordingResultDisplay.primaryAction;
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
  const analysisReport = analysisReportState({
    basicReport,
    basicReportKey,
    currentBasicReportKey,
    localRecordCount: analysisRecords.length
  });
  const activeAnalysisReport = analysisReport.activeReport;
  const reportRecordCount = analysisReport.recordCount;
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
  const auxiliaryDisplayLabels = auxiliarySectionLabels();
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
  const communityCloseAccessibilityDisplayLabel = futurePreviewCloseAccessibilityLabel(auxiliaryDisplayLabels.closeReturn);
  const communityPreviewBoundaryBadgeDisplayLabel = futurePreviewBoundaryBadgeLabel(communityPreviewBoundaryDisplay);
  const communityPreviewBoundaryCopyDisplayText = futurePreviewBoundaryCopyText(communityPreviewBoundaryDisplay);
  const communityPostAccessibilityDisplayLabel = communityPostAccessibilityLabel(futurePreviewDisplayLabels);
  const communityPostButtonDisplayLabel = communityPostButtonLabel(futurePreviewDisplayLabels);
  const communityPrivacyAccessibilityDisplayLabel = communityPrivacyAccessibilityLabel(futurePreviewDisplayLabels);
  const communityActionStatusDisplayLabel = communityActionStatusLabel(futurePreviewDisplayLabels);
  const communityActionStatusDisplayCopy = communityActionStatusText(communityActionStatusDisplayText);
  const communityReadinessSectionDisplayLabel = futurePreviewReadinessSectionLabel(futurePreviewDisplayLabels);
  const communityReturnFutureModulesAccessibilityDisplayLabel = futurePreviewReturnAccessibilityLabel(futurePreviewDisplayLabels);
  const communityReturnFutureModulesButtonDisplayLabel = futurePreviewReturnButtonLabel(futurePreviewDisplayLabels);
  const communityReturnFutureModulesPressTarget = communityReturnFutureModulesPressHandler();
  const communityPublicProfileSaveAccessibilityDisplayLabel = communityPublicProfileSaveAccessibilityLabel();
  const communityPublicProfileSaveButtonDisplayLabel = communityPublicProfileSaveButtonLabel();
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
  const rankingOptInButtonDisplayLabel = rankingOptInActionButtonLabel(communityActionDisplay.rankingOptInButton);
  const rankingOptInAccessibilityDisplayLabel = rankingOptInActionAccessibilityLabel(communityActionDisplay.rankingOptInAccessibility);
  const rankingOptInActionPressTarget = rankingOptInActionPressHandler();
  const rankingCloseButtonDisplayLabel = rankingCloseButtonLabel();
  const rankingCloseAccessibilityDisplayLabel = futurePreviewCloseAccessibilityLabel(auxiliaryDisplayLabels.closeReturn);
  const rankingClosePressTarget = rankingClosePressHandler();
  const rankingPublicActionButtonDisplayLabel = rankingPublicActionButtonLabel(futurePreviewDisplayLabels);
  const rankingPublicActionAccessibilityDisplayLabel = rankingPublicActionAccessibilityLabel(futurePreviewDisplayLabels);
  const rankingPublicActionPressTarget = rankingPublicActionPressHandler();
  const rankingReturnFutureModulesButtonDisplayLabel = futurePreviewReturnButtonLabel(futurePreviewDisplayLabels);
  const rankingReturnFutureModulesAccessibilityDisplayLabel = futurePreviewReturnAccessibilityLabel(futurePreviewDisplayLabels);
  const rankingReturnFutureModulesPressTarget = rankingReturnFutureModulesPressHandler();
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
  const historyRecordDisplayCount = recordDisplayState.displayCount;
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
  const reportRecordDisplayCount = analysisReport.recordDisplayCount;
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
  const previewRecordDisplay = previewRecordDisplayBundle({
    pendingPreviewRemoveIndex,
    previewExists: Boolean(preview),
    records: previewState.records,
    selectedPreviewIndex
  });
  const selectedPreviewRecord = previewRecordDisplay.selectedPreviewRecord;
  const pendingPreviewRemoveRecord = previewRecordDisplay.pendingPreviewRemoveRecord;
  const previewRecordDisplayItems = previewRecordDisplay.previewRecordDisplayItems;
  const previewSaveConfirmDisplayItems = previewRecordDisplay.previewSaveConfirmDisplayItems;
  const selectedPreviewRecordDisplayItem = previewRecordDisplay.selectedPreviewRecordDisplayItem;
  const pendingPreviewRemoveDisplayItem = previewRecordDisplay.pendingPreviewRemoveDisplayItem;
  const previewActionReturn = previewActionReturnState(previewActionReturnScreen);
  const isPreviewActionReturningToDailyRecord = previewActionReturn.isReturningToDailyRecord;
  const isDailyRecordRemoveConfirm = previewActionReturn.isDailyRecordRemoveConfirm;
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
  const selectedRecordDisplay = selectedRecordDisplayBundleForRecord(selectedRecord);
  const selectedRecordDisplayItem = selectedRecordDisplay.displayItem;
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
  const selectedRecordDetailRows = selectedRecordDisplay.detailRows;
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
    recordCount: recordDisplayState.recordCount,
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
    openScreenWithStatus("transcriptReview", transcriptReviewReadyStatusMessage());
  }

  function returnToTranscriptEdit() {
    setPreview(null);
    clearSelectedPreviewEditDraft();
    openScreenWithStatus("transcriptReview", transcriptReturnEditStatusMessage());
  }

  function returnFromTranscriptReviewWithStatus(statusMessage: string) {
    clearParserPreviewState();
    clearPreviewSelectionState();
    openScreenWithStatus(transcriptReviewReturnScreen, statusMessage);
  }

  function returnFromTranscriptReview() {
    returnFromTranscriptReviewWithStatus(transcriptReviewBackStatusMessage());
  }

  function retryTranscriptInput() {
    setIsRecordingPreview(false);
    setRecordingStartedAt(null);
    setRecordingElapsedSeconds(0);
    clearTranscriptDraftState();
    returnFromTranscriptReviewWithStatus(transcriptClearedStatusMessage());
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

  function setManualRecordDateTimeInputs(dateTime: { date: string; time: string }) {
    setManualRecordDate(dateTime.date);
    setManualRecordTime(dateTime.time);
  }

  function seedManualRecordDateTimeForNow() {
    setManualRecordDateTimeInputs(localDateTimeInputs(new Date()));
  }

  function seedManualRecordStateFromRecord(record: RecordItem) {
    setManualRecordFields(recordPayloadToEditFields(record));
    setManualRecordDateTimeInputs(localDateTimeInputs(record.occurred_at));
  }

  function seedEmptyManualRecordStateForNow() {
    setManualRecordFields(emptyRecordEditFields());
    seedManualRecordDateTimeForNow();
  }

  function openScreen(screen: AppScreen) {
    setCurrentScreen(screen);
  }

  function openScreenWithStatus(screen: AppScreen, statusMessage: string) {
    openScreen(screen);
    setStatus(statusMessage);
  }

  function openManualRecord(returnScreen: AppScreen = currentScreen) {
    seedManualRecordDateTimeForNow();
    setManualRecordReturnScreen(returnScreen);
    openScreen("manualRecord");
  }

  function openManualRecordWithStatus(returnScreen: AppScreen, statusMessage: string) {
    openManualRecord(returnScreen);
    setStatus(statusMessage);
  }

  function openRecordManualRecord() {
    openManualRecordWithStatus("record", recordManualEntryStatusMessage());
  }

  function openAiReviewManualRecord() {
    clearPreviewSelectionState();
    openManualRecordWithStatus("aiReview", aiReviewManualEntryStatusMessage());
  }

  function openTranscriptReviewManualRecord() {
    clearPreviewSelectionState();
    openManualRecordWithStatus("transcriptReview", transcriptReviewManualEntryStatusMessage());
  }

  function returnFromManualRecord() {
    openScreenWithStatus(manualRecordReturnScreen, manualRecordReturnStatusMessage(manualRecordReturnScreen));
  }

  function returnFromRecordDetail() {
    openScreenWithStatus(recordDetailReturnScreen, recordDetailReturnStatusMessage(recordDetailReturnScreen));
  }

  function openTutorialRecordEntry() {
    openScreenWithStatus("record", tutorialRecordEntryStatusMessage());
  }

  function openTutorialManualRecord() {
    openManualRecordWithStatus("tutorial", tutorialManualEntryStatusMessage());
  }

  function openTodayManualRecord() {
    openManualRecordWithStatus("today", todayManualEntryStatusMessage());
  }

  function openTodayRecordEntry() {
    openScreenWithStatus("record", todayRecordEntryStatusMessage());
  }

  function openTodayRecordDetail(record: RecordItem) {
    openRecordDetailWithStatus(record, "today", todayRecordDetailStatusMessage());
  }

  function openTodayRecordDetailCard(record: RecordItem) {
    openTodayRecordDetail(record);
  }

  function pressTodayRecordDetailCard(item: ReturnType<typeof recordListDisplayItem>) {
    openTodayRecordDetailCard(recordDetailCardTarget(item));
  }

  function openTodayAnalysis() {
    openScreenWithStatus("analysis", todayAnalysisStatusMessage());
  }

  function returnFromHistoryToToday() {
    openScreenWithStatus("today", historyReturnTodayStatusMessage());
  }

  function openHistoryManualRecord() {
    openManualRecordWithStatus("history", historyManualEntryStatusMessage());
  }

  function openHistoryRecordDetail(record: RecordItem) {
    openRecordDetailWithStatus(record, "history", historyRecordDetailStatusMessage());
  }

  function openHistoryRecordDetailCard(record: RecordItem) {
    openHistoryRecordDetail(record);
  }

  function pressHistoryRecordDetailCard(item: ReturnType<typeof recordListDisplayItem>) {
    openHistoryRecordDetailCard(recordDetailCardTarget(item));
  }

  function pressHistoryDailyEntry(
    item: ReturnType<typeof buildHistoryDailyRecordSectionDisplayItems>[number]["entries"][number]
  ) {
    openHistoryRecordDetailCard(recordDetailCardTarget(item));
  }

  function openAnalysisManualRecord() {
    openManualRecordWithStatus("analysis", analysisManualEntryStatusMessage());
  }

  function returnFromAnalysisToToday() {
    openScreenWithStatus("today", analysisReturnTodayStatusMessage());
  }

  function openAnalysisDetailedReport() {
    setStatus(analysisDetailedReportStatusMessage());
    void openDetailedReport();
  }

  function returnFromDetailedReportToAnalysis() {
    openScreenWithStatus("analysis", detailedReportReturnAnalysisStatusMessage());
  }

  function openDetailedReportManualRecord() {
    openManualRecordWithStatus("detailedReport", detailedReportManualEntryStatusMessage());
  }

  function returnFromDetailedReportToToday() {
    openScreenWithStatus("today", detailedReportReturnTodayStatusMessage());
  }

  function selectManualRecordType(type: ManualRecordType) {
    setManualRecordType(type);
  }

  function pressManualRecordTypeOption(type: (typeof manualRecordTypeDisplayOptions)[number]) {
    selectManualRecordType(manualRecordTypeTarget(type));
  }

  function selectHistoryCalendarDate(dateKey: string) {
    setSelectedHistoryDate(boundDateInputText(dateKey));
    setHistoryDetailMode("structured");
  }

  function pressHistoryCalendarDay(item: ReturnType<typeof historyCalendarDayDisplayItem>) {
    selectHistoryCalendarDate(historyDateTarget(item));
  }

  function pressHistoryDailySummary(item: ReturnType<typeof historyDailySummaryDisplayItem>) {
    selectHistoryCalendarDate(historyDateTarget(item));
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
    selectHistoryDetailMode(historyDetailModeTarget(item));
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

  function pressAnalysisRangeOption(item: AnalysisRangeOption) {
    selectAnalysisRange(analysisRangeTarget(item));
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

  function openManualRecordUnavailable(screen: AppScreen) {
    openScreenWithStatus(screen, manualRecordCreateUnavailableStatusMessage(protectedBackendUnavailableMessage));
  }

  function enterManualRecordConfirm() {
    const validationError = validateRecordForm(
      manualRecordType,
      manualRecordFields,
      manualRecordDate,
      manualRecordTime
    );
    if (validationError) {
      openScreenWithStatus("manualRecord", validationError);
      return;
    }
    if (!protectedBackendReady) {
      openManualRecordUnavailable("manualRecord");
      return;
    }
    openScreenWithStatus("manualRecordConfirm", manualRecordConfirmReadyStatusMessage());
  }

  function returnFromManualRecordConfirm() {
    openScreenWithStatus("manualRecord", manualRecordConfirmReturnStatusMessage());
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
    openScreenWithStatus("record", quickEntryTextModeStatusMessage());
  }

  function handleRecordQuickEntryMode(mode: QuickEntryMode) {
    handleQuickEntryMode(mode, "record");
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
    const nextNativeState = nativeDebugDefaultState();
    setNativeStatus(nextNativeState.status);
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
      const boundedSessions = boundAuthSessionItems(response);
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
    const defaultStt = defaultSttModelOption(modelOptions);
    if (defaultStt) {
      setSttModelId(defaultStt.id);
    }
    const preferredLlm = preferredLlmModelOption(modelOptions);
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
    if (shouldGuardDailyRecordLeave) {
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
    openScreen(headerBackTarget);
  }

  function requestDailyRecordLeaveGuard() {
    showDailyRecordLeaveGuard(dailyRecordLeaveGuardPromptStatusMessage());
  }

  function cancelDailyRecordLeaveGuard() {
    hideDailyRecordLeaveGuard(dailyRecordLeaveGuardCancelStatusMessage());
  }

  function confirmDailyRecordLeaveGuard() {
    hideDailyRecordLeaveGuard(dailyRecordLeaveGuardConfirmStatusMessage());
    returnFromAiSaveConfirm();
  }

  function showDailyRecordLeaveGuard(statusMessage: string) {
    setDailyRecordLeaveGuardVisible(true);
    setStatus(statusMessage);
  }

  function hideDailyRecordLeaveGuard(statusMessage: string) {
    setDailyRecordLeaveGuardVisible(false);
    setStatus(statusMessage);
  }

  function openMenu(returnScreen: AppScreen = currentScreen) {
    setMenuReturnScreen(returnScreen === "menu" ? "today" : returnScreen);
    openScreen("menu");
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
    const safeAudioPath = nativeDebugInputValue(sourceAudioPath.trim());
    const safeModelPath = nativeDebugInputValue(whisperModelPath.trim());
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
      openScreenWithStatus("transcriptReview", recordingWhisperSuccessStatusMessage());
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
    openScreenWithStatus("record", recordingTextFallbackStatusMessage());
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
        capturedAudioPath = uri ? nativeDebugInputValue(uri) : "";
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
      openScreenWithStatus("transcriptReview", recordingTextFallbackStatusMessage());
    }
  }

  function releaseRecordingPreview() {
    void finishRecordingPreview();
  }

  function setPreviewEditDateTimeInputs(dateTime: { date: string; time: string }) {
    setPreviewEditDate(dateTime.date);
    setPreviewEditTime(dateTime.time);
  }

  function seedPreviewEditStateFromRecord(record: PendingRecord) {
    setPreviewEditFields(recordPayloadToEditFields(record));
    setPreviewEditDateTimeInputs(localDateTimeInputs(record.occurred_at));
  }

  function clearPreviewEditDraftFields() {
    setPreviewEditFields(emptyRecordEditFields());
  }

  function clearSelectedPreviewEditSelection() {
    setSelectedPreviewIndex(null);
  }

  function setSelectedPreviewEditSelection(index: number) {
    setSelectedPreviewIndex(index);
  }

  function clearSelectedPreviewEditDraft() {
    clearSelectedPreviewEditSelection();
    clearPreviewEditDraftFields();
  }

  function clearPreviewEditActionState() {
    clearSelectedPreviewEditDraft();
    clearDailyRecordEntryMenu();
  }

  function clearPreviewEditSelectionState() {
    clearSelectedPreviewEditSelection();
    clearDailyRecordEntryMenu();
  }

  function clearPendingPreviewRemoveSelection() {
    setPendingPreviewRemoveIndex(null);
  }

  function setPendingPreviewRemoveSelection(index: number) {
    setPendingPreviewRemoveIndex(index);
  }

  function clearPreviewRemoveActionState() {
    clearPendingPreviewRemoveSelection();
    clearDailyRecordEntryMenu();
  }

  function clearDailyRecordEntryMenu() {
    setDailyRecordMenuIndex(null);
  }

  function seedEmptyPreviewEditStateForNow() {
    clearPreviewEditDraftFields();
    setPreviewEditDateTimeInputs(localDateTimeInputs(new Date()));
  }

  function clearPreviewMenuSelectionIndexes() {
    clearSelectedPreviewEditSelection();
    clearPreviewRemoveActionState();
  }

  function selectPreviewEditIndex(index: number) {
    clearPreviewRemoveActionState();
    setSelectedPreviewEditSelection(index);
  }

  function selectPreviewRemoveIndex(index: number) {
    clearPreviewEditSelectionState();
    setPendingPreviewRemoveSelection(index);
  }

  function setPreviewActionReturnTarget(returnScreen: AppScreen) {
    setPreviewActionReturnScreen(returnScreen);
  }

  function previewRecordAtIndex(index: number) {
    return preview?.records[index] ?? null;
  }

  function openPreviewRecordEdit(index: number, returnScreen: AppScreen = "aiReview") {
    const record = previewRecordAtIndex(index);
    if (!record) {
      return;
    }
    setPreviewActionReturnTarget(returnScreen);
    selectPreviewEditIndex(index);
    seedPreviewEditStateFromRecord(record);
    openPreviewEditScreen();
  }

  function openPreviewEditScreen() {
    openScreenWithStatus("editPreviewRecord", aiCandidateEditOpenStatusMessage());
  }

  function returnFromPreviewRecordEdit() {
    resetPreviewRecordEditCancelState();
    openPreviewActionReturnScreenWithStatus(aiCandidateEditCancelStatusMessage());
  }

  function resetPreviewRecordEditCancelState() {
    clearPreviewMenuSelectionIndexes();
    seedEmptyPreviewEditStateForNow();
  }

  function openPreviewRecordRemoveConfirm(index: number, returnScreen: AppScreen = "aiReview") {
    const record = previewRecordAtIndex(index);
    if (!record) {
      returnFromMissingPreviewRecordRemoveOpen(returnScreen);
      return;
    }
    setPreviewActionReturnTarget(returnScreen);
    selectPreviewRemoveIndex(index);
    openPreviewRemoveConfirmScreen();
  }

  function returnFromMissingPreviewRecordRemoveOpen(returnScreen: AppScreen) {
    openScreen(returnScreen);
  }

  function openPreviewRemoveConfirmScreen() {
    openScreenWithStatus("aiRemoveConfirm", aiCandidateRemoveConfirmStatusMessage());
  }

  function editAiCandidateRecord(index: number) {
    openPreviewRecordEdit(index);
  }

  function removeAiCandidateRecord(index: number) {
    openPreviewRecordRemoveConfirm(index);
  }

  function returnFromPreviewRemoveConfirm() {
    resetPreviewRecordRemoveCancelState();
    openPreviewActionReturnScreenWithStatus(aiCandidateRemoveCancelStatusMessage());
  }

  function resetPreviewRecordRemoveCancelState() {
    clearPreviewMenuSelectionIndexes();
    clearPreviewEditDraftFields();
  }

  function openPreviewActionReturnScreen() {
    openScreen(previewActionReturnScreen);
  }

  function openPreviewActionReturnScreenWithStatus(statusMessage: string) {
    openScreenWithStatus(previewActionReturnScreen, statusMessage);
  }

  function openPreviewRemoveConfirmReturnScreen() {
    openPreviewActionReturnScreen();
  }

  function returnFromPreviewRecordEditSaveSuccess() {
    resetPreviewRecordEditSaveSuccessState();
    openPreviewActionReturnScreen();
  }

  function resetPreviewRecordEditSaveSuccessState() {
    clearPreviewEditActionState();
  }

  function returnFromMissingPreviewRecordEditSaveDraft() {
    openScreen("aiReview");
  }

  function returnFromMissingPreviewRecordRemoveConfirm() {
    resetMissingPreviewRecordRemoveConfirmState();
    openPreviewRemoveConfirmReturnScreen();
  }

  function resetMissingPreviewRecordRemoveConfirmState() {
    clearPendingPreviewRemoveSelection();
  }

  function returnFromPreviewRecordRemoveConfirmSuccess(removeIndex: number) {
    applyPreviewRecordRemoveConfirmSuccess(removeIndex);
    openPreviewRemoveConfirmReturnScreen();
  }

  function applyPreviewRecordRemoveConfirmSuccess(removeIndex: number) {
    removePreviewRecord(removeIndex);
  }

  function applyPreviewRecords(nextRecords: PendingRecord[]) {
    if (!preview) {
      return false;
    }
    setPreview(boundParsePreviewResponse(previewWithRecords(preview, nextRecords)));
    return true;
  }

  function applyAiCandidateRemovePreviewRecords(nextRecords: PendingRecord[]) {
    applyPreviewRecordsWithStatus(nextRecords, aiCandidateRemoveResultStatusMessage(nextRecords.length));
  }

  function applyAiCandidateEditPreviewRecords(nextRecords: PendingRecord[]) {
    applyPreviewRecordsWithStatus(nextRecords, aiCandidateEditSuccessStatusMessage());
  }

  function applyPreviewRecordsWithStatus(nextRecords: PendingRecord[], statusMessage: string) {
    if (!applyPreviewRecords(nextRecords)) {
      return;
    }
    setStatus(statusMessage);
  }

  function previewWithRecords(currentPreview: ParsePreviewResponse, nextRecords: PendingRecord[]) {
    return { ...currentPreview, records: nextRecords };
  }

  function reorganizeDailyRecordDraftAfterChange(
    nextPreview: ParsePreviewResponse,
    reason: DailyRecordReorganizationReason,
    statusOverride?: string
  ) {
    const reorganizedPreview = boundParsePreviewResponse(nextPreview);
    const nextRevision = nextDailyRecordOrganizationRevision();
    setPreview(reorganizedPreview);
    setDailyRecordOrganizationRevision(nextRevision);
    setDailyRecordOrganizationReason(reason);
    setStatus(
      dailyRecordReorganizationStatusForChange(reason, reorganizedPreview, nextRevision, statusOverride)
    );
  }

  function nextDailyRecordOrganizationRevision() {
    return clampNumber(dailyRecordOrganizationRevision + 1, 0, maxMobileCountValue);
  }

  function dailyRecordReorganizationStatusForChange(
    reason: DailyRecordReorganizationReason,
    reorganizedPreview: ParsePreviewResponse,
    nextRevision: number,
    statusOverride?: string
  ) {
    return statusOverride ??
      dailyRecordReorganizationStatusMessage(reason, reorganizedPreview.records.length, nextRevision);
  }

  function parserSuccessStatusForPreview(nextPreview: ParsePreviewResponse, voiceSeconds: number) {
    return voiceSeconds > 0
      ? parserVoiceQuotaSyncedStatusMessage(nextPreview.records.length, voiceSeconds)
      : parserSuccessStatusMessage(nextPreview.records.length);
  }

  function mergedParserPreviewForResponse(
    currentPreview: ParsePreviewResponse | null,
    response: ParsePreviewResponse
  ) {
    const boundedPreview = boundedParserPreviewResponse(response);
    return mergeSameDayParsePreviewDraft(currentPreview, boundedPreview);
  }

  function boundedParserPreviewResponse(response: ParsePreviewResponse) {
    return boundParsePreviewResponse(response);
  }

  function parserPreviewRequestBody(
    profileId: string,
    text: string,
    occurredAt: string,
    voiceSeconds: number
  ) {
    const modelIds = parserPreviewModelIds();
    return {
      profile_id: profileId,
      transcript: text,
      stt_model_id: modelIds.sttModelId,
      llm_model_id: modelIds.llmModelId,
      occurred_at: occurredAt,
      voice_seconds: voiceSeconds
    };
  }

  function parserPreviewModelIds() {
    return {
      sttModelId,
      llmModelId
    };
  }

  function requestParserPreview(
    accountId: string,
    profileId: string,
    text: string,
    occurredAt: string,
    voiceSeconds: number
  ) {
    return requestJson<ParsePreviewResponse>(
      normalizedApiBaseUrl,
      "/ai/parse-preview",
      parserPreviewRequestOptions(accountId, profileId, text, occurredAt, voiceSeconds)
    );
  }

  function parserPreviewRequestOptions(
    accountId: string,
    profileId: string,
    text: string,
    occurredAt: string,
    voiceSeconds: number
  ) {
    return {
      method: "POST",
      headers: protectedRequestHeaders(accountId, accessToken),
      body: JSON.stringify(parserPreviewRequestBody(profileId, text, occurredAt, voiceSeconds))
    };
  }

  async function requestMergedParserPreview(
    accountId: string,
    profileId: string,
    text: string,
    occurredAt: string,
    voiceSeconds: number,
    currentPreview: ParsePreviewResponse | null
  ) {
    const response = await requestParserPreview(accountId, profileId, text, occurredAt, voiceSeconds);
    return mergedParserPreviewForResponse(currentPreview, response);
  }

  async function requestMergedParserPreviewForContext(
    context: {
      account: Account;
      activeProfile: Profile;
    },
    text: string,
    occurredAt: string,
    voiceSeconds: number,
    currentPreview: ParsePreviewResponse | null
  ) {
    return requestMergedParserPreview(
      context.account.id,
      context.activeProfile.id,
      text,
      occurredAt,
      voiceSeconds,
      currentPreview
    );
  }

  function appendDailyTranscriptEntry(entry: DailyTranscriptEntry) {
    setDailyTranscriptEntries((current) => boundDailyTranscriptEntries([...current, entry]));
  }

  function appendParserTranscriptEntry(occurredAt: string, text: string, voiceSeconds: number) {
    const transcriptEntry = createDailyTranscriptEntry(
      occurredAt,
      text,
      parserTranscriptSource(voiceSeconds)
    );
    if (transcriptEntry) {
      appendDailyTranscriptEntry(transcriptEntry);
    }
  }

  function handleParserPreviewSuccess(
    nextPreview: ParsePreviewResponse,
    occurredAt: string,
    text: string,
    voiceSeconds: number
  ) {
    appendParserTranscriptEntry(occurredAt, text, voiceSeconds);
    openAiReviewAfterParserSuccess();
    reorganizeDailyRecordDraftAfterChange(
      nextPreview,
      "add",
      parserSuccessStatusForPreview(nextPreview, voiceSeconds)
    );
    refreshVoiceQuotaAfterParserSuccess(voiceSeconds);
  }

  function openAiReviewAfterParserSuccess() {
    resetParserTranscriptVoiceSeconds();
    openScreen("aiReview");
  }

  function resetParserTranscriptVoiceSeconds() {
    setTranscriptVoiceSeconds(0);
  }

  function refreshVoiceQuotaAfterParserSuccess(voiceSeconds: number) {
    const currentAccount = account;
    if (shouldRefreshVoiceQuotaAfterParserSuccess(voiceSeconds, currentAccount)) {
      void loadVoiceQuota(currentAccount.id);
    }
  }

  function shouldRefreshVoiceQuotaAfterParserSuccess(
    voiceSeconds: number,
    currentAccount: Account | null
  ): currentAccount is Account {
    return voiceSeconds > 0 && Boolean(currentAccount);
  }

  function handleParserPreviewFailure(error: unknown) {
    const message = parserFailureStatusMessage(error);
    setParserRecoveryMessage(parserFailureRecoveryMessage(message));
    setStatus(message);
  }

  function startParserPreviewRequest() {
    parsePreviewInFlight.current = true;
    setIsBusy(true);
  }

  function prepareParserPreviewRequest() {
    const existingDailyPreview = parserExistingDailyPreview();
    clearParserPreviewState();
    startParserPreviewProgressStatus();
    return {
      existingDailyPreview,
      parserVoiceSeconds: parserPreviewVoiceSeconds(),
      parseOccurredAt: parserPreviewOccurredAt()
    };
  }

  function startPreparedParserPreviewRequest() {
    startParserPreviewRequest();
    return prepareParserPreviewRequest();
  }

  function startParserPreviewProgressStatus() {
    setStatus(parserProgressStatusMessage());
  }

  function parserExistingDailyPreview() {
    return preview;
  }

  function parserPreviewVoiceSeconds() {
    return clampNumber(transcriptVoiceSeconds, 0, maxMobileCountValue);
  }

  function parserPreviewOccurredAt() {
    return new Date().toISOString();
  }

  function finishParserPreviewRequest() {
    parsePreviewInFlight.current = false;
    setIsBusy(false);
  }

  function isParserPreviewRequestBlocked() {
    return isBusy || parsePreviewInFlight.current;
  }

  function parserProfileContext() {
    return {
      account,
      activeProfile
    };
  }

  function hasParserProfileContext(context: {
    account: Account | null;
    activeProfile: Profile | null;
  }): context is {
    account: Account;
    activeProfile: Profile;
  } {
    return Boolean(context.account && context.activeProfile);
  }

  function requestPreparedParserPreview(
    context: {
      account: Account;
      activeProfile: Profile;
    },
    text: string,
    preparedRequest: ReturnType<typeof prepareParserPreviewRequest>
  ) {
    return requestMergedParserPreviewForContext(
      context,
      text,
      preparedRequest.parseOccurredAt,
      preparedRequest.parserVoiceSeconds,
      preparedRequest.existingDailyPreview
    );
  }

  function handlePreparedParserPreviewSuccess(
    nextPreview: ParsePreviewResponse,
    text: string,
    preparedRequest: ReturnType<typeof prepareParserPreviewRequest>
  ) {
    handleParserPreviewSuccess(
      nextPreview,
      preparedRequest.parseOccurredAt,
      text,
      preparedRequest.parserVoiceSeconds
    );
  }

  async function submitPreparedParserPreview(
    context: {
      account: Account;
      activeProfile: Profile;
    },
    text: string,
    preparedRequest: ReturnType<typeof prepareParserPreviewRequest>
  ) {
    const mergedDailyPreview = await requestPreparedParserPreview(context, text, preparedRequest);
    handlePreparedParserPreviewSuccess(mergedDailyPreview, text, preparedRequest);
  }

  async function completePreparedParserPreviewRequest(
    context: {
      account: Account;
      activeProfile: Profile;
    },
    text: string,
    preparedRequest: ReturnType<typeof prepareParserPreviewRequest>
  ) {
    try {
      await submitPreparedParserPreview(context, text, preparedRequest);
    } catch (error) {
      handleParserPreviewFailure(error);
    } finally {
      finishParserPreviewRequest();
    }
  }

  async function startAndCompleteParserPreviewRequest(context: {
    account: Account;
    activeProfile: Profile;
  }) {
    const preparedRequest = startPreparedParserPreviewRequest();
    await completePreparedParserPreviewRequest(context, parserTranscriptText(), preparedRequest);
  }

  function applyPreviewRecordRemoveChange(currentPreview: ParsePreviewResponse, nextRecords: PendingRecord[]) {
    if (isPreviewActionReturningToDailyRecord) {
      reorganizeDailyRecordDraftAfterChange(previewWithRecords(currentPreview, nextRecords), "delete");
    } else {
      applyAiCandidateRemovePreviewRecords(nextRecords);
    }
  }

  function applyPreviewRecordRemoveChangeAndClearState(
    currentPreview: ParsePreviewResponse,
    nextRecords: PendingRecord[]
  ) {
    applyPreviewRecordRemoveChange(currentPreview, nextRecords);
    clearPreviewRemoveActionState();
  }

  function buildPreviewRecordRemoveRecords(currentPreview: ParsePreviewResponse, removeIndex: number) {
    return previewRecordsWithoutRecord(currentPreview.records, removeIndex);
  }

  function previewRecordRemoveDraft(removeIndex: number) {
    const removeDraftSource = {
      currentPreview: preview,
      removeIndex
    };
    if (!hasPreviewRecordRemoveDraft(removeDraftSource)) {
      return null;
    }
    return {
      currentPreview: removeDraftSource.currentPreview,
      removeIndex: removeDraftSource.removeIndex
    };
  }

  function hasPreviewRecordRemoveDraft(source: {
    currentPreview: ParsePreviewResponse | null;
    removeIndex: number;
  }): source is {
    currentPreview: ParsePreviewResponse;
    removeIndex: number;
  } {
    return Boolean(source.currentPreview);
  }

  function removePreviewRecordDraft(removeDraft: NonNullable<ReturnType<typeof previewRecordRemoveDraft>>) {
    const nextRecords = buildPreviewRecordRemoveRecords(removeDraft.currentPreview, removeDraft.removeIndex);
    applyPreviewRecordRemoveChangeAndClearState(removeDraft.currentPreview, nextRecords);
  }

  function removePreviewRecord(index: number) {
    const removeDraft = previewRecordRemoveDraft(index);
    if (!removeDraft) {
      return;
    }
    removePreviewRecordDraft(removeDraft);
  }

  function pendingPreviewRecordRemoveConfirmIndex() {
    return pendingPreviewRemoveIndex === null || !pendingPreviewRemoveRecord
      ? null
      : pendingPreviewRemoveIndex;
  }

  function confirmPreviewRecordRemove() {
    const removeIndex = pendingPreviewRecordRemoveConfirmIndex();
    if (removeIndex === null) {
      returnFromMissingPreviewRecordRemoveConfirm();
      return;
    }
    returnFromPreviewRecordRemoveConfirmSuccess(removeIndex);
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
    selectPreviewEditGlucoseUnit(previewEditOptionTarget(option));
  }

  function selectPreviewEditGlucoseTiming(value: string) {
    updatePreviewEditField("glucoseTiming", value);
  }

  function pressPreviewEditGlucoseTimingOption(option: ReturnType<typeof valueLabelDisplayItem>) {
    selectPreviewEditGlucoseTiming(previewEditOptionTarget(option));
  }

  function selectPreviewEditMealType(value: string) {
    updatePreviewEditField("mealType", value);
  }

  function pressPreviewEditMealTypeOption(option: ReturnType<typeof valueLabelDisplayItem>) {
    selectPreviewEditMealType(previewEditOptionTarget(option));
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

  function applyPreviewRecordEditChange(currentPreview: ParsePreviewResponse, nextRecords: PendingRecord[]) {
    if (isPreviewActionReturningToDailyRecord) {
      reorganizeDailyRecordDraftAfterChange(previewWithRecords(currentPreview, nextRecords), "edit");
    } else {
      applyAiCandidateEditPreviewRecords(nextRecords);
    }
  }

  function buildPreviewRecordEditPayload(recordType: string) {
    const payload = buildPayloadFromEditFields(recordType, previewEditFields);
    if (!isPreviewRecordEditPayloadObject(payload)) {
      throw new Error("payload_json must be an object");
    }
    return payload;
  }

  function isPreviewRecordEditPayloadObject(payload: unknown): payload is Record<string, unknown> {
    return Boolean(payload && typeof payload === "object" && !Array.isArray(payload));
  }

  function validatePreviewRecordEdit(recordType: string) {
    return validateRecordForm(
      recordType,
      previewEditFields,
      previewEditDate,
      previewEditTime
    );
  }

  function buildPreviewRecordEditRecords(
    currentPreview: ParsePreviewResponse,
    editIndex: number,
    payload: Record<string, unknown>
  ) {
    return previewRecordsWithEditedRecord(
      currentPreview.records,
      editIndex,
      previewRecordEditOccurredAt(),
      payload
    );
  }

  function previewRecordEditOccurredAt() {
    return localDateTimeToIso(previewEditDate, previewEditTime);
  }

  function buildPreviewRecordEditChangeRecords(
    currentPreview: ParsePreviewResponse,
    editIndex: number,
    recordType: string
  ) {
    const payload = buildPreviewRecordEditPayload(recordType);
    return buildPreviewRecordEditRecords(currentPreview, editIndex, payload);
  }

  function previewRecordEditType(record: PendingRecord) {
    return record.record_type;
  }

  function handlePreviewRecordEditFailure(error: unknown) {
    setStatus(aiCandidateEditFailureStatusMessage(error));
  }

  function handlePreviewRecordEditValidationFailure(validationError: string) {
    setStatus(validationError);
  }

  function validatePreviewRecordEditForSave(recordType: string) {
    const validationError = validatePreviewRecordEdit(recordType);
    if (hasPreviewRecordEditValidationError(validationError)) {
      handlePreviewRecordEditValidationFailure(validationError);
      return false;
    }
    return true;
  }

  function hasPreviewRecordEditValidationError(validationError: string | null): validationError is string {
    return Boolean(validationError);
  }

  function applyPreviewRecordEditChangeAndReturnSuccess(
    currentPreview: ParsePreviewResponse,
    nextRecords: PendingRecord[]
  ) {
    applyPreviewRecordEditChange(currentPreview, nextRecords);
    returnFromPreviewRecordEditSaveSuccess();
  }

  function previewRecordEditSaveDraft() {
    const editDraftSource = {
      currentPreview: preview,
      editIndex: selectedPreviewIndex,
      record: selectedPreviewRecord
    };
    if (!hasPreviewRecordEditSaveDraft(editDraftSource)) {
      return null;
    }
    return {
      currentPreview: editDraftSource.currentPreview,
      editIndex: editDraftSource.editIndex,
      record: editDraftSource.record
    };
  }

  function hasPreviewRecordEditSaveDraft(source: {
    currentPreview: ParsePreviewResponse | null;
    editIndex: number | null;
    record: PendingRecord | null;
  }): source is {
    currentPreview: ParsePreviewResponse;
    editIndex: number;
    record: PendingRecord;
  } {
    return Boolean(source.currentPreview && source.editIndex !== null && source.record);
  }

  function savePreviewRecordEditDraft(
    editDraft: NonNullable<ReturnType<typeof previewRecordEditSaveDraft>>,
    recordType: string
  ) {
    const nextRecords = buildPreviewRecordEditChangeRecords(
      editDraft.currentPreview,
      editDraft.editIndex,
      recordType
    );
    applyPreviewRecordEditChangeAndReturnSuccess(editDraft.currentPreview, nextRecords);
  }

  function savePreviewRecordEditDraftWithFailureHandling(
    editDraft: NonNullable<ReturnType<typeof previewRecordEditSaveDraft>>,
    recordType: string
  ) {
    try {
      savePreviewRecordEditDraft(editDraft, recordType);
    } catch (error) {
      handlePreviewRecordEditFailure(error);
    }
  }

  function savePreviewRecordEdit() {
    const editDraft = previewRecordEditSaveDraft();
    if (!editDraft) {
      returnFromMissingPreviewRecordEditSaveDraft();
      return;
    }
    const recordType = previewRecordEditType(editDraft.record);
    if (!validatePreviewRecordEditForSave(recordType)) {
      return;
    }

    savePreviewRecordEditDraftWithFailureHandling(editDraft, recordType);
  }

  function enterAiSaveConfirm() {
    if (previewState.isEmpty) {
      openScreen("aiReview");
      return;
    }
    clearPreviewSelectionState();
    setLastSaveErrorSummary("");
    openScreenWithStatus("aiSaveConfirm", aiSaveConfirmReadyStatusMessage());
  }

  function openTodayTranscriptText() {
    setStatus(todayTranscriptExpandedStatusMessage());
  }

  function dailyRecordEntryReturnScreen(): AppScreen {
    return "aiSaveConfirm";
  }

  function openDailyRecordEntryMenu(index: number, typeLabel: string) {
    setDailyRecordMenuIndex((current) => (current === index ? null : index));
    setStatus(dailyRecordEntryMenuOpenStatusMessage(typeLabel));
  }

  function editDailyRecordEntry(index: number) {
    openPreviewRecordEdit(index, dailyRecordEntryReturnScreen());
  }

  function deleteDailyRecordEntry(index: number) {
    openPreviewRecordRemoveConfirm(index, dailyRecordEntryReturnScreen());
  }

  function clearPreviewSelectionState() {
    clearSelectedPreviewEditDraft();
    clearPendingPreviewRemoveSelection();
  }

  function clearPreviewActionState() {
    clearPreviewSelectionState();
    setLastSaveErrorSummary("");
  }

  function returnToAiReviewWithClearedPreviewStatus(statusMessage: string) {
    clearPreviewActionState();
    openScreenWithStatus("aiReview", statusMessage);
  }

  function returnFromAiSaveConfirm() {
    returnToAiReviewWithClearedPreviewStatus(aiSaveConfirmReturnStatusMessage());
  }

  function processUnsavedPreviewRecords() {
    if (previewState.isEmpty) {
      openScreen("today");
      return;
    }
    returnToAiReviewWithClearedPreviewStatus(saveSuccessProcessUnsavedStatusMessage());
  }

  function openSaveSuccessDestination(target: AppScreen) {
    if (target === "aiReview") {
      processUnsavedPreviewRecords();
      return;
    }
    clearPreviewActionState();
    openScreenWithStatus(target, saveSuccessDestinationStatusMessage(target));
  }

  function openSaveSuccessDestinationCard(target: AppScreen) {
    openSaveSuccessDestination(target);
  }

  function openSaveSuccessManualContinue() {
    clearPreviewActionState();
    openManualRecord(manualRecordReturnScreen);
    setStatus(saveSuccessManualContinueStatusMessage());
  }

  function openSaveSuccessRecordEntry() {
    clearPreviewActionState();
    openScreenWithStatus("record", saveSuccessRecordEntryStatusMessage());
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
    returnToAiReviewWithClearedPreviewStatus(aiSaveFailureBackAiReviewStatusMessage());
  }

  function openAiSaveConfirmWithStatus(statusMessage: string) {
    openScreenWithStatus("aiSaveConfirm", statusMessage);
  }

  function returnFromAiSaveFailureToSaveConfirm() {
    if (previewState.isEmpty) {
      returnToAiReviewWithClearedPreviewStatus(aiSaveFailureBackAiReviewStatusMessage());
      return;
    }
    clearPreviewActionState();
    openAiSaveConfirmWithStatus(aiSaveFailureReturnSaveConfirmStatusMessage());
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
      openScreen(subpageTarget);
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

  function pressSettingsRow(row: SettingsDisplayRow) {
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
    startAuthProviderChallenge(authProviderPreviewTarget(item));
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

  function pressAuthSessionManagementPreview(item: { actionStatus: string }) {
    showAuthSessionManagementStatus(authSessionManagementActionStatus(item));
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
    selectSettingsProfileChoice(settingsProfileChoiceTarget(profile));
  }

  function selectSettingsLlmModelChoice(modelId: string) {
    selectLlmModelFromSettings(modelId);
  }

  function pressSettingsLlmModelChoice(model: (typeof llmModelChoiceDisplayItems)[number]) {
    selectSettingsLlmModelChoice(settingsModelChoiceTarget(model));
  }

  function selectSettingsSttModelChoice(modelId: string) {
    selectSttModelFromSettings(modelId);
  }

  function pressSettingsSttModelChoice(model: (typeof sttModelChoiceDisplayItems)[number]) {
    selectSettingsSttModelChoice(settingsModelChoiceTarget(model));
  }

  function selectRecordingWhisperModelChoice(item: (typeof downloadedWhisperModelChoiceItems)[number]) {
    setWhisperModelPath(recordingWhisperModelPathTarget(item));
    setStatus(recordingModelSelectedStatusMessage(recordingWhisperModelStatusLabel(item)));
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
    setModelUrl(nativeDebugInputValue(value));
  }

  function updateWhisperModelPathInput(value: string) {
    setWhisperModelPath(nativeDebugInputValue(value));
  }

  function updateNativeAudioPathInput(value: string) {
    setAudioPath(nativeDebugInputValue(value));
  }

  function updateLlamaModelPathInput(value: string) {
    setLlamaModelPath(nativeDebugInputValue(value));
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
    openMenuPreviewScreen("subscription", returnScreen, setSubscriptionReturnScreen);
  }

  function openPrimaryTab(target: AppScreen) {
    if (target === "menu") {
      openMenu(currentScreen);
      return;
    }
    openScreen(target);
  }

  function pressPrimaryTab(screen: { id: AppScreen }) {
    openPrimaryTab(primaryTabTarget(screen));
  }

  function returnFromMenu() {
    openScreenWithStatus(menuReturnScreen, menuReturnStatusMessage(menuReturnScreen));
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
    openScreen(target);
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

  function openSubscriptionStatusScreen(screen: AppScreen, statusMessage: string) {
    openScreenWithStatus(screen, statusMessage);
  }

  function openSubscriptionManagementFromSubscription() {
    openSubscriptionStatusScreen("subscriptionManagement", subscriptionManagementOpenStatusMessage());
  }

  function openMembershipStatusFromSubscription() {
    openSubscriptionStatusScreen("membershipStatus", subscriptionMembershipStatusOpenStatusMessage());
  }

  function syncSubscriptionManagementStatus() {
    if (account && protectedAccountBackendReady) {
      setSubscriptionManagementActionStatus(subscriptionManagementSyncingStatusMessage);
      void loadVoiceQuota(account.id);
      return;
    }
    setSubscriptionManagementActionStatus(subscriptionManagementUnavailableStatusMessage);
  }

  function returnToSettingsWithStatus(statusMessage: string) {
    openScreenWithStatus("settings", statusMessage);
  }

  function returnFromSubscriptionManagementToSettings() {
    returnToSettingsWithStatus(subscriptionManagementReturnSettingsStatusMessage());
  }

  function openAccountSecurityFromSettings() {
    openScreenWithStatus("accountSecurity", settingsAccountSecurityOpenStatusMessage());
  }

  function returnFromSettingsSubpage() {
    returnToSettingsWithStatus(settingsSubpageReturnStatusMessage());
  }

  function showSubscriptionManagementPaymentStatus() {
    setSubscriptionManagementActionStatus(subscriptionManagementPaymentStatusMessage);
  }

  function returnFromMembershipStatusToSubscription() {
    openScreenWithStatus("subscription", membershipStatusReturnSubscriptionStatusMessage());
  }

  function openMembershipRenewalManagement() {
    setSubscriptionActionStatus(subscriptionRenewalIntegrationStatusMessage);
    openSubscriptionManagementFromSubscription();
  }

  function openMembershipManagement() {
    openSubscriptionManagementFromSubscription();
  }

  function openMenuPreviewScreen(
    screen: AppScreen,
    returnScreen: AppScreen,
    setReturnScreen: (screen: AppScreen) => void
  ) {
    setReturnScreen(menuPreviewReturnScreen(returnScreen, screen));
    openScreen(screen);
  }

  function openTutorial(returnScreen: AppScreen = currentScreen) {
    openMenuPreviewScreen("tutorial", returnScreen, setTutorialReturnScreen);
  }

  function openFoodPhoto(returnScreen: AppScreen = currentScreen) {
    openMenuPreviewScreen("foodPhoto", returnScreen, setFoodPhotoReturnScreen);
  }

  function openFutureModulesFromMenu() {
    setFutureModuleActionStatus(futurePreviewActionClearStatusMessage());
    openScreenWithStatus("futureModules", futureModulesOpenStatusMessage());
  }

  function returnFromFutureModulesToMenu() {
    openScreenWithStatus("menu", futureModulesReturnMenuStatusMessage());
  }

  function returnFromFutureModuleDetail() {
    openScreenWithStatus("futureModules", futureModuleDetailReturnStatusMessage());
  }

  function openFutureModuleDetailResult(module: FutureModuleCard | null) {
    setSelectedFutureModule(module);
    setFutureModuleActionStatus(futurePreviewActionClearStatusMessage());
    openScreen("futureModuleDetail");
  }

  function futurePreviewReturnScreen(returnScreen: AppScreen, selfScreen: AppScreen) {
    return returnScreen === selfScreen ? "futureModules" : returnScreen;
  }

  function futurePreviewActionClearStatusMessage() {
    return previewActionClearStatusMessage();
  }

  function openFuturePreviewScreen(
    screen: AppScreen,
    returnScreen: AppScreen,
    setReturnScreen: (screen: AppScreen) => void,
    setActionStatus: (statusMessage: string) => void
  ) {
    setReturnScreen(futurePreviewReturnScreen(returnScreen, screen));
    setActionStatus(futurePreviewActionClearStatusMessage());
    openScreen(screen);
  }

  function returnFromFuturePreviewScreen(returnScreen: AppScreen) {
    openScreenWithStatus(returnScreen, futurePreviewReturnStatusMessage(returnScreen));
  }

  function returnFromFoodPhoto() {
    returnFromFuturePreviewScreen(foodPhotoReturnScreen);
  }

  function openDoctorShare(returnScreen: AppScreen = currentScreen) {
    openFuturePreviewScreen("doctorShare", returnScreen, setDoctorShareReturnScreen, setDoctorShareActionStatus);
  }

  function returnFromDoctorSharePreview() {
    returnFromFuturePreviewScreen(doctorShareReturnScreen);
  }

  function showDoctorShareTokenStatus() {
    setDoctorShareActionStatus(doctorShareTokenStatusMessage);
  }

  function showDoctorShareReportBoundaryStatus() {
    setDoctorShareActionStatus(doctorShareReportBoundaryStatusMessage);
  }

  function openHealthIntegration(returnScreen: AppScreen = currentScreen) {
    openFuturePreviewScreen(
      "healthIntegration",
      returnScreen,
      setHealthIntegrationReturnScreen,
      setHealthIntegrationActionStatus
    );
  }

  function returnFromHealthIntegrationPreview() {
    returnFromFuturePreviewScreen(healthIntegrationReturnScreen);
  }

  function showHealthIntegrationPermissionStatus() {
    setHealthIntegrationActionStatus(healthIntegrationPermissionStatusMessage);
  }

  function showHealthIntegrationMeterStatus() {
    setHealthIntegrationActionStatus(healthIntegrationMeterStatusMessage);
  }

  function openCommunity(returnScreen: AppScreen = currentScreen) {
    openFuturePreviewScreen("community", returnScreen, setCommunityReturnScreen, setCommunityActionStatus);
    void loadCommunityPublicSettings();
    void loadFoodCommunityCategories();
    void loadCommunityFoods();
  }

  function returnFromCommunityPreview() {
    returnFromFuturePreviewScreen(communityReturnScreen);
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

  function commerceSearchInputValue(value: string) {
    return boundStoreSearchText(value);
  }

  function updateFoodCommunitySearchInput(value: string) {
    setFoodCommunitySearchText(commerceSearchInputValue(value));
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

  function communityReturnFutureModulesPressHandler() {
    return returnFromCommunityPreview;
  }

  function rankingClosePressHandler() {
    return returnFromRankingPreview;
  }

  function rankingPublicActionPressHandler() {
    return showRankingPublicStatus;
  }

  function rankingOptInActionPressHandler() {
    return showRankingOptInStatus;
  }

  function rankingReturnFutureModulesPressHandler() {
    return returnFromRankingPreview;
  }

  function selectFoodCommunityCategory(category: FoodCommunityCategory) {
    setFoodCommunityCategory(category);
    setSelectedFoodCommunityItemId(foodCommunityCategoryDefaultItemId(foodCommunityItemsForDisplay, category));
  }

  function pressFoodCommunityCategoryOption(category: ReturnType<typeof foodCommunityCategoryDisplayItem>) {
    selectFoodCommunityCategory(foodCommunityCategoryTarget(category));
  }

  function selectFoodCommunityItem(itemId: string) {
    const boundedItemId = boundIdentifier(itemId);
    setSelectedFoodCommunityItemId(boundedItemId);
    if (foodCommunityBackendItems.some((item) => item.id === boundedItemId)) {
      void loadFoodCommunityDetail(boundedItemId);
    }
  }

  function pressFoodCommunityItem(item: { id: string }) {
    selectFoodCommunityItem(foodCommunityItemTarget(item));
  }

  function showFoodCommunityShareStatus() {
    void submitFoodCommunityShare();
  }

  function openRanking(returnScreen: AppScreen = currentScreen) {
    openFuturePreviewScreen("ranking", returnScreen, setRankingReturnScreen, setRankingActionStatus);
    void loadCommunityLeaderboards();
  }

  function returnFromRankingPreview() {
    returnFromFuturePreviewScreen(rankingReturnScreen);
  }

  function showRankingPublicStatus() {
    void loadCommunityLeaderboards();
  }

  function showRankingOptInStatus() {
    void saveCommunityPublicSettings(!(communityPublicSettings?.leaderboard_opt_in ?? false));
  }

  function menuPreviewReturnScreen(returnScreen: AppScreen, selfScreen: AppScreen) {
    return returnScreen === selfScreen ? "menu" : returnScreen;
  }

  function openAchievements(returnScreen: AppScreen = currentScreen) {
    openMenuPreviewScreen("achievements", returnScreen, setAchievementsReturnScreen);
    void loadAchievementSummary();
  }

  function returnFromAchievements() {
    returnFromFuturePreviewScreen(achievementsReturnScreen);
  }

  function showAchievementIntegrationStatus() {
    void loadAchievementSummary(true);
  }

  function syncAchievementsAfterRecordSave() {
    void loadAchievementSummary(true);
  }

  function openYearReview(returnScreen: AppScreen = currentScreen) {
    openMenuPreviewScreen("yearReview", returnScreen, setYearReviewReturnScreen);
    void loadYearReview();
  }

  function returnFromYearReview() {
    returnFromFuturePreviewScreen(yearReviewReturnScreen);
  }

  function showYearReviewShareStatus() {
    void loadYearReviewShareCard();
  }

  function revokeYearReviewShareStatus() {
    void revokeYearReviewSharePackage();
  }

  function openStore(returnScreen: AppScreen = currentScreen) {
    openMenuPreviewScreen("store", returnScreen, setStoreReturnScreen);
    void loadStoreCatalogAndPoints();
  }

  function updateStoreSearchInput(value: string) {
    setStoreSearchText(commerceSearchInputValue(value));
  }

  function selectStoreCategory(category: StoreCategory) {
    setStoreCategory(category);
  }

  function pressStoreCategoryOption(category: ReturnType<typeof storeCategoryDisplayItem>) {
    selectStoreCategory(storeCategoryTarget(category));
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
    openScreenWithStatus("storeCart", commercePreviewOpenCartStatusMessage());
  }

  function returnFromStore() {
    returnFromFuturePreviewScreen(storeReturnScreen);
  }

  function returnFromStoreCartToStore() {
    openScreenWithStatus("store", commercePreviewReturnStoreStatusMessage());
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

  function openVisualSmokeHistoryRecordScreen(record: RecordItem, screen: AppScreen) {
    seedVisualSmokeHistoryRecordSelection(record);
    openScreen(screen);
  }

  function openVisualSmokeRecordSeedRoute(target: AppScreen) {
    if (target === "saveSuccess") {
      const demoRecord = visualSmokeDemoRecord();
      seedVisualSmokeSelectedRecord(demoRecord);
      setLastSavedSummary("Visual smoke demo save result.");
      setLastSaveEntryMethod("ai");
      openScreen("saveSuccess");
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
      openVisualSmokeHistoryRecordScreen(demoRecord, "recordDetail");
      return true;
    }
    if (target === "editRecord") {
      const demoRecord = visualSmokeDemoRecord();
      seedVisualSmokeSelectedRecord(demoRecord);
      seedRecordEditStateFromRecord(demoRecord);
      openScreen("editRecord");
      return true;
    }
    if (target === "deleteConfirm") {
      const demoRecord = visualSmokeDemoRecord();
      openVisualSmokeHistoryRecordScreen(demoRecord, "deleteConfirm");
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
      openScreen("manualRecordConfirm");
      return true;
    }
    if (target === "detailedReport") {
      seedVisualSmokeDemoRecords();
      setBasicReport(visualSmokeDemoReport());
      setReportStatus(visualSmokeRecordSyncStatusMessage());
      openScreen("detailedReport");
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
      openScreen("editPreviewRecord");
      return true;
    }
    if (target === "aiRemoveConfirm") {
      seedVisualSmokeDemoPreview();
      setSelectedPreviewIndex(null);
      setPendingPreviewRemoveIndex(0);
      openScreen("aiRemoveConfirm");
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
      openScreen("transcriptReview");
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
      openScreen(target);
      return;
    }
    if (target === "record") {
      openScreen("record");
      return;
    }
    if (openVisualSmokeTranscriptRoute(target)) {
      return;
    }
    if (isVisualSmokeAiPreviewScreen(target)) {
      seedVisualSmokeDemoPreview();
      openScreen(target);
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
      openScreen(target);
      return;
    }
    if (isVisualSmokeSettingsMenuScreen(target)) {
      openScreen(target);
      return;
    }
    if (openVisualSmokeFutureModuleRoute(target)) {
      return;
    }
    openScreen(target);
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
    setFutureModuleActionStatus(futurePreviewActionClearStatusMessage());
    if (!target) {
      openFutureModuleDetail(module);
      return;
    }
    if (openFutureModuleTargetRoute(target)) {
      return;
    }
    openScreen(target);
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
    openScreen("detailedReport");
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
      const nextItems = foodCommunityItemsFromApi(foods);
      setFoodCommunityBackendItems(nextItems);
      const nextSelectedItemId = foodCommunityListDefaultItemId(nextItems, selectedFoodCommunityItemId);
      setSelectedFoodCommunityItemId(nextSelectedItemId);
      if (nextSelectedItemId) {
        void loadFoodCommunityDetail(nextSelectedItemId);
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
      const mappedCategories = foodCommunityCategoriesFromApi(categories);
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
        foodCommunityItemsWithDetail(current, detailedItem)
      );
      setSelectedFoodCommunityItemId(foodCommunityDetailSelectedItemId(detailedItem));
      setCommunityActionStatus(
        foodCommunityDetailStatusMessages({
          itemTitle: foodCommunityDetailStatusTitle(detailedItem),
          exampleCount: foodCommunityDetailStatusExampleCount(detailedItem)
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
        communityLeaderboardTypes.map((leaderboardType) => {
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
      const displaySections = communityLeaderboardDisplaySections(sections);
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
      setStoreBackendProducts(storeProductsFromApi(rewards));
      setStorePointsBalance({
        balance: clampNumber(points.balance, 0, maxMobileCountValue),
        lifetime_earned: clampNumber(points.lifetime_earned, 0, maxMobileCountValue),
        lifetime_redeemed: clampNumber(points.lifetime_redeemed, 0, maxMobileCountValue)
      });
      setStoreRedemptions(storeRedemptionsFromApi(redemptions));
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
      const mappedSummaryItems = achievementItemsFromApi(summary.items);
      setAchievementBackendItems(mappedSummaryItems);
      setAchievementNewlyUnlockedItems(achievementNewlyUnlockedItemsForSync(mappedSummaryItems, syncUnlocks));
      let unlockHistoryCopy = "已讀取解鎖紀錄";
      try {
        const unlocks = await requestJson<AchievementApiUnlock[]>(
          normalizedApiBaseUrl,
          `/achievements/unlocks?${query.toString()}`,
          { headers: protectedRequestHeaders(account.id, accessToken) }
        );
        setAchievementUnlockedItems(achievementUnlocksFromApi(unlocks));
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
      foodCommunityShareFields.foodName || foodCommunityShareFallbackFoodName(selectedFoodCommunityItem),
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
            category: apiFoodCategoryFromMobile(foodCommunityShareCategory(selectedFoodCommunityItem)),
            eaten_at: eatenAt,
            before_glucose: beforeGlucose,
            after_glucose: afterGlucose,
            public_note: foodCommunityShareFields.note || undefined
          })
        }
      );
      setFoodCommunityBackendItems((current) => foodCommunityItemsWithShareUpdateFromApi(current, response.food));
      setSelectedFoodCommunityItemId(foodCommunityShareSelectedItemIdFromApi(response.food));
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
      productTitle: storeProductRedeemTitle(product),
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
      setStoreActionStatus(storeProductActionStatus(product));
      return;
    }
    const rewardId = storeProductRewardId(product);
    if (!rewardId) {
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
          body: JSON.stringify({ reward_code: rewardId })
        }
      );
      const fulfillmentCopy =
        redemption.status === "issued" && redemption.fulfillment_code
          ? `已發出 ${redemption.fulfillment_type === "discount_code" ? "折扣碼" : "優惠券"}：${boundIdentifier(redemption.fulfillment_code)}`
          : `已建立兌換 reservation：${boundIdentifier(redemption.reward_code)}`;
      setStoreActionStatus(
        storeRedeemStatusMessages({
          backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
          productTitle: storeProductRedeemTitle(product),
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
      redemptionTitle: storeRedemptionUseTitle(redemption),
      statusLabel: storeRedemptionUseStatusLabel(redemption),
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
    const redemptionId = storeRedemptionUseId(redemption);
    if (!redemptionId) {
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
        `/store/redemptions/${redemptionId}/use`,
        {
          method: "POST",
          headers: protectedRequestHeaders(account.id, accessToken)
        }
      );
      setStoreActionStatus(
        storeRedemptionUseStatusMessages({
          backendUnavailableMessage: protectedAccountBackendUnavailableMessage,
          redemptionTitle: storeRedemptionUseTitle(redemption),
          statusLabel: storeRedemptionUseStatusLabel(redemption),
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
      const defaultStt = defaultSttModelOption(modelOptions);
      if (defaultStt) {
        setSttModelId(defaultStt.id);
      }
      const preferredLlm = preferredLlmModelOption(modelOptions);
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

  function openParserRecoveryMessage(message: string) {
    setParserRecoveryMessage(message);
    openScreenWithStatus("transcriptReview", message);
  }

  function handleParserBackendUnavailable() {
    const boundedMessage = parserBackendUnavailableStatusMessage(protectedBackendUnavailableMessage);
    openParserRecoveryMessage(boundedMessage);
  }

  function handleParserModelUnavailable() {
    const boundedMessage = parserModelUnavailableStatusMessage(parserModelUnavailableMessage);
    openParserRecoveryMessage(boundedMessage);
  }

  function handleParserSampleBlockedTranscript() {
    const message = parserSampleBlockedStatusMessage();
    setParserRecoveryMessage(message);
    setStatus(message);
  }

  function handleParserTranscriptValidationError(message: string) {
    setStatus(message);
  }

  function parserTranscriptValidationMessage() {
    return transcriptValidationError;
  }

  function parserTranscriptText() {
    return transcript;
  }

  function isParserBackendUnavailable() {
    return !protectedBackendReady;
  }

  function isParserModelUnavailable() {
    return !parserModelReady;
  }

  function isParserSampleTranscriptBlocked() {
    return isTranscriptSample;
  }

  function guardedParserPreviewContext() {
    if (isParserPreviewRequestBlocked()) {
      return null;
    }
    if (isParserBackendUnavailable()) {
      handleParserBackendUnavailable();
      return null;
    }
    const parserContext = parserProfileContext();
    if (!hasParserProfileContext(parserContext)) {
      return null;
    }
    if (isParserModelUnavailable()) {
      handleParserModelUnavailable();
      return null;
    }
    const validationMessage = parserTranscriptValidationMessage();
    if (validationMessage) {
      handleParserTranscriptValidationError(validationMessage);
      return null;
    }
    if (isParserSampleTranscriptBlocked()) {
      handleParserSampleBlockedTranscript();
      return null;
    }

    return parserContext;
  }

  async function parseTranscript() {
    const parserContext = guardedParserPreviewContext();
    if (!parserContext) {
      return;
    }

    await startAndCompleteParserPreviewRequest(parserContext);
  }

  function startPreviewSaveRequest() {
    previewSaveInFlight.current = true;
    setIsBusy(true);
    setStatus(aiSaveProgressStatusMessage());
  }

  function finishPreviewSaveRequest() {
    previewSaveInFlight.current = false;
    setIsBusy(false);
  }

  function buildPreviewRecordsForCurrentSave(currentPreview: ParsePreviewResponse) {
    return previewRecordsForSave(currentPreview.records, previewState.recordCount);
  }

  function dailyRecordSaveRequestBody(nextPreview: ParsePreviewResponse, recordsToSave: PendingRecord[]) {
    return buildDailyRecordSaveRequest(nextPreview, recordsToSave, dailyTranscriptEntries);
  }

  function requestDailyRecordSave(
    accountId: string,
    nextPreview: ParsePreviewResponse,
    recordsToSave: PendingRecord[]
  ) {
    return requestJson<DailyRecordSaveResponse>(normalizedApiBaseUrl, "/daily-records/save", {
      method: "POST",
      headers: protectedRequestHeaders(accountId, accessToken),
      body: JSON.stringify(dailyRecordSaveRequestBody(nextPreview, recordsToSave))
    });
  }

  function dailyRecordSaveCreatedRecords(saveResponse: DailyRecordSaveResponse) {
    return boundRecordsList(saveResponse.records, maxMobilePreviewRecords);
  }

  function clearDailyRecordSaveDraftState() {
    setPreview(null);
    clearTranscriptDraftState();
    clearDailyRecordDraftOrganizationState();
  }

  function applyDailyRecordSaveCreatedRecords(createdRecords: RecordItem[]) {
    setRecords((current) => boundRecordsList([...createdRecords, ...current]));
    setRecordsStatus(aiSaveRecordsStatusMessage(createdRecords.length));
  }

  function selectDailyRecordSaveResult(createdRecords: RecordItem[]) {
    if (createdRecords[0]) {
      selectRecordForResult(createdRecords[0]);
    }
  }

  function openDailyRecordSaveSuccessResult(savedCount: number) {
    setLastSaveErrorSummary("");
    openSaveSuccessResult(aiSaveSuccessSummaryMessage(savedCount), "ai", "today");
    setStatus(aiSaveSuccessStatusMessage());
    syncAchievementsAfterRecordSave();
  }

  function handleDailyRecordSaveSuccess(saveResponse: DailyRecordSaveResponse, savedCount: number) {
    const createdRecords = dailyRecordSaveCreatedRecords(saveResponse);
    clearDailyRecordSaveDraftState();
    applyDailyRecordSaveCreatedRecords(createdRecords);
    selectDailyRecordSaveResult(createdRecords);
    openDailyRecordSaveSuccessResult(savedCount);
  }

  function handleDailyRecordSaveFailure(error: unknown) {
    const message = aiSaveFailureStatusMessage(error);
    openAiSaveFailureResult(message);
    setStatus(message);
  }

  function guardedDailyRecordSaveContext() {
    if (isBusy || previewSaveInFlight.current) {
      return null;
    }
    if (!preview || previewState.isEmpty) {
      return null;
    }
    if (!protectedBackendReady) {
      openAiSaveConfirmWithStatus(aiSaveUnavailableStatusMessage(protectedBackendUnavailableMessage));
      return null;
    }
    if (!account) {
      return null;
    }

    return {
      account,
      preview
    };
  }

  async function submitDailyRecordSave(saveContext: { account: Account; preview: ParsePreviewResponse }) {
    const recordsToSave = buildPreviewRecordsForCurrentSave(saveContext.preview);
    const saveResponse = await requestDailyRecordSave(saveContext.account.id, saveContext.preview, recordsToSave);
    handleDailyRecordSaveSuccess(saveResponse, recordsToSave.length);
  }

  async function completeDailyRecordSaveRequest(saveContext: { account: Account; preview: ParsePreviewResponse }) {
    try {
      await submitDailyRecordSave(saveContext);
    } catch (error) {
      handleDailyRecordSaveFailure(error);
    } finally {
      finishPreviewSaveRequest();
    }
  }

  async function startAndCompleteDailyRecordSaveRequest(saveContext: { account: Account; preview: ParsePreviewResponse }) {
    startPreviewSaveRequest();
    await completeDailyRecordSaveRequest(saveContext);
  }

  async function savePreviewRecords() {
    const saveContext = guardedDailyRecordSaveContext();
    if (!saveContext) {
      return;
    }

    await startAndCompleteDailyRecordSaveRequest(saveContext);
  }

  function guardedInitialRecordSyncContext() {
    if (visualSmokePreviewActive.current) {
      setRecordsStatus(visualSmokeRecordSyncStatusMessage());
      return null;
    }
    if (!protectedBackendReady) {
      setRecordsStatus(recordSyncUnavailableStatusMessage(protectedBackendUnavailableMessage));
      return null;
    }
    if (!account || !activeProfileId) {
      return null;
    }

    return {
      account,
      activeProfileId,
      syncKey: `${normalizedApiBaseUrl}:${account.id}:${activeProfileId}`
    };
  }

  function requestInitialRecordSync(syncContext: { account: Account; activeProfileId: string }) {
    const query = new URLSearchParams({
      profile_id: syncContext.activeProfileId,
      limit: String(mobileRecordSyncLimit)
    });
    return requestJson<RecordItem[]>(
      normalizedApiBaseUrl,
      `/records?${query.toString()}`,
      { headers: protectedRequestHeaders(syncContext.account.id, accessToken) }
    );
  }

  function handleInitialRecordSyncSuccess(response: RecordItem[]) {
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
  }

  function startInitialRecordSyncRequest(syncContext: { syncKey: string }) {
    latestRecordSyncKey.current = syncContext.syncKey;
    if (recordSyncInFlightKeys.current.has(syncContext.syncKey)) {
      return false;
    }
    recordSyncInFlightKeys.current.add(syncContext.syncKey);
    setRecordsStatus(recordSyncLoadingStatusMessage());
    return true;
  }

  function handleInitialRecordSyncFailure(syncContext: { syncKey: string }) {
    if (latestRecordSyncKey.current === syncContext.syncKey) {
      clearRecordSyncPaginationStatus(recordSyncFailureStatusMessage());
    }
  }

  function finishInitialRecordSyncRequest(syncContext: { syncKey: string }) {
    recordSyncInFlightKeys.current.delete(syncContext.syncKey);
  }

  async function completeInitialRecordSyncRequest(syncContext: {
    account: Account;
    activeProfileId: string;
    syncKey: string;
  }) {
    try {
      const response = await requestInitialRecordSync(syncContext);
      if (latestRecordSyncKey.current !== syncContext.syncKey) {
        return;
      }
      handleInitialRecordSyncSuccess(response);
    } catch {
      handleInitialRecordSyncFailure(syncContext);
    } finally {
      finishInitialRecordSyncRequest(syncContext);
    }
  }

  async function startAndCompleteInitialRecordSyncRequest(syncContext: {
    account: Account;
    activeProfileId: string;
    syncKey: string;
  }) {
    if (!startInitialRecordSyncRequest(syncContext)) {
      return;
    }
    await completeInitialRecordSyncRequest(syncContext);
  }

  async function loadRecords() {
    const syncContext = guardedInitialRecordSyncContext();
    if (!syncContext) {
      return;
    }

    await startAndCompleteInitialRecordSyncRequest(syncContext);
  }

  function guardedMoreRecordSyncContext() {
    if (visualSmokePreviewActive.current) {
      setRecordsStatus(visualSmokeRecordSyncStatusMessage());
      return null;
    }
    if (!protectedBackendReady) {
      setRecordsStatus(recordSyncUnavailableStatusMessage(protectedBackendUnavailableMessage));
      return null;
    }
    if (!account || !activeProfileId || recordDisplayState.isEmpty || recordDisplayState.isAtCacheLimit) {
      return null;
    }
    const cursorRecord = recordDisplayState.lastRecord;
    if (!cursorRecord?.occurred_at || !cursorRecord.created_at) {
      clearRecordSyncPaginationStatus(recordSyncFailureStatusMessage());
      return null;
    }

    return {
      account,
      activeProfileId,
      cursorRecord,
      syncKey: `${normalizedApiBaseUrl}:${account.id}:${activeProfileId}:before:${cursorRecord.occurred_at}:${cursorRecord.created_at}`
    };
  }

  function requestMoreRecordSync(syncContext: {
    account: Account;
    activeProfileId: string;
    cursorRecord: RecordItem;
  }) {
    const query = new URLSearchParams({
      profile_id: syncContext.activeProfileId,
      limit: String(mobileRecordSyncLimit),
      before: syncContext.cursorRecord.occurred_at,
      before_created_at: syncContext.cursorRecord.created_at
    });
    return requestJson<RecordItem[]>(
      normalizedApiBaseUrl,
      `/records?${query.toString()}`,
      { headers: protectedRequestHeaders(syncContext.account.id, accessToken) }
    );
  }

  function handleMoreRecordSyncSuccess(response: RecordItem[]) {
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
  }

  function handleMoreRecordSyncFailure() {
    setRecordsStatus(recordSyncFailureStatusMessage());
  }

  function finishMoreRecordSyncRequest(syncContext: { syncKey: string }) {
    recordSyncInFlightKeys.current.delete(syncContext.syncKey);
  }

  function startMoreRecordSyncRequest(syncContext: { syncKey: string }) {
    if (recordSyncInFlightKeys.current.has(syncContext.syncKey)) {
      return false;
    }
    recordSyncInFlightKeys.current.add(syncContext.syncKey);
    setRecordsStatus(recordSyncPageLoadingStatusMessage());
    return true;
  }

  async function completeMoreRecordSyncRequest(syncContext: {
    account: Account;
    activeProfileId: string;
    cursorRecord: RecordItem;
    syncKey: string;
  }) {
    try {
      const response = await requestMoreRecordSync(syncContext);
      handleMoreRecordSyncSuccess(response);
    } catch {
      handleMoreRecordSyncFailure();
    } finally {
      finishMoreRecordSyncRequest(syncContext);
    }
  }

  async function startAndCompleteMoreRecordSyncRequest(syncContext: {
    account: Account;
    activeProfileId: string;
    cursorRecord: RecordItem;
    syncKey: string;
  }) {
    if (!startMoreRecordSyncRequest(syncContext)) {
      return;
    }
    await completeMoreRecordSyncRequest(syncContext);
  }

  async function loadMoreRecords() {
    const syncContext = guardedMoreRecordSyncContext();
    if (!syncContext) {
      return;
    }

    await startAndCompleteMoreRecordSyncRequest(syncContext);
  }

  function setRecordEditDateTimeInputs(dateTime: { date: string; time: string }) {
    setRecordEditDate(dateTime.date);
    setRecordEditTime(dateTime.time);
  }

  function seedRecordEditStateFromRecord(record: RecordItem) {
    setRecordEditFields(recordPayloadToEditFields(record));
    setRecordEditDateTimeInputs(localDateTimeInputs(record.occurred_at));
  }

  function selectRecordForResult(record: RecordItem) {
    setSelectedRecord(record);
    setRecordEditFields(recordPayloadToEditFields(record));
  }

  function openSaveSuccessResult(summary: string, entryMethod: SaveEntryMethod, returnScreen: AppScreen) {
    setLastSavedSummary(summary);
    setLastSaveEntryMethod(entryMethod);
    setSaveSuccessReturnScreen(returnScreen);
    openScreen("saveSuccess");
  }

  function openAiSaveFailureResult(message: string) {
    setLastSaveErrorSummary(message);
    setLastSaveEntryMethod("ai");
    openScreen("aiSaveFailure");
  }

  function openRecordSummaryResult(
    summary: string,
    screen: "updateSuccess" | "deleteSuccess",
    setSummary: (summary: string) => void
  ) {
    setSummary(summary);
    openScreen(screen);
  }

  function openUpdateSuccessResult(summary: string) {
    openRecordSummaryResult(summary, "updateSuccess", setLastUpdatedSummary);
  }

  function openDeleteSuccessResult(summary: string) {
    openRecordSummaryResult(summary, "deleteSuccess", setLastDeletedSummary);
  }

  function seedEmptyRecordEditStateForNow() {
    setRecordEditFields(emptyRecordEditFields());
    setRecordEditDateTimeInputs(localDateTimeInputs(new Date()));
  }

  function openRecordDetailScreen(record: RecordItem, returnScreen: AppScreen) {
    setRecordDetailReturnScreen(returnScreen);
    seedRecordEditStateFromRecord(record);
    openScreen("recordDetail");
  }

  function openRecordDetail(record: RecordItem, returnScreen: AppScreen = "today") {
    setSelectedRecord(record);
    openRecordDetailScreen(record, returnScreen);
  }

  function openRecordDetailWithStatus(record: RecordItem, returnScreen: AppScreen, statusMessage: string) {
    openRecordDetail(record, returnScreen);
    setStatus(statusMessage);
  }

  function selectedRecordForDetailOpen() {
    return selectedRecord;
  }

  function openSelectedRecordDetail(returnScreen: AppScreen) {
    const record = selectedRecordForDetailOpen();
    if (!record) {
      return;
    }
    openRecordDetailScreen(record, returnScreen);
  }

  function returnToRecordDetailForMissingSelection() {
    openScreen("recordDetail");
  }

  function selectedRecordForDeleteConfirm() {
    const record = selectedRecord;
    if (!record) {
      returnToRecordDetailForMissingSelection();
      return null;
    }
    return record;
  }

  function openDeleteConfirm() {
    if (!selectedRecordForDeleteConfirm()) {
      return;
    }
    openScreenWithStatus("deleteConfirm", deleteConfirmReadyStatusMessage());
  }

  function returnFromDeleteConfirm() {
    openScreenWithStatus("recordDetail", deleteConfirmReturnStatusMessage());
  }

  function selectedRecordForEditOpen() {
    const record = selectedRecord;
    if (!record) {
      returnToRecordDetailForMissingSelection();
      return null;
    }
    return record;
  }

  function openRecordEdit() {
    const record = selectedRecordForEditOpen();
    if (!record) {
      return;
    }
    seedRecordEditStateFromRecord(record);
    openScreenWithStatus("editRecord", recordEditOpenStatusMessage());
  }

  function seedRecordEditStateForReturn() {
    if (selectedRecord) {
      seedRecordEditStateFromRecord(selectedRecord);
    } else {
      seedEmptyRecordEditStateForNow();
    }
  }

  function returnFromRecordEdit() {
    seedRecordEditStateForReturn();
    openScreenWithStatus("recordDetail", recordEditCancelStatusMessage());
  }

  function openRecordResultDestination(kind: "delete" | "update", target: AppScreen) {
    openScreenWithStatus(target, recordResultDestinationStatusMessage(kind, target));
  }

  function openDeleteSuccessDestination(target: AppScreen) {
    openRecordResultDestination("delete", target);
  }

  function openRecordResultDestinationCard(kind: "delete" | "update", target: AppScreen) {
    if (kind === "delete") {
      openDeleteSuccessDestination(target);
      return;
    }
    openUpdateSuccessDestination(target);
  }

  function openDeleteSuccessDestinationCard(target: AppScreen) {
    openRecordResultDestinationCard("delete", target);
  }

  function openDeleteSuccessHistoryDestination() {
    openDeleteSuccessDestination("history");
  }

  function openUpdateSuccessRecordDetailDestination() {
    openSelectedRecordDetail("updateSuccess");
    setStatus(recordResultDestinationStatusMessage("update", "recordDetail"));
  }

  function openUpdateSuccessDestination(target: AppScreen) {
    if (target === "recordDetail") {
      openUpdateSuccessRecordDetailDestination();
      return;
    }
    openRecordResultDestination("update", target);
  }

  function openUpdateSuccessDestinationCard(target: AppScreen) {
    openRecordResultDestinationCard("update", target);
  }

  function openUpdatedRecordDetail() {
    openUpdateSuccessRecordDetailDestination();
  }

  function recordResultReturnDestination() {
    return recordDetailReturnScreen;
  }

  function returnFromDeleteSuccess() {
    openDeleteSuccessDestination(recordResultReturnDestination());
  }

  function returnFromUpdateSuccess() {
    openUpdateSuccessDestination(recordResultReturnDestination());
  }

  function openRecordActionUnavailable(screen: AppScreen, statusMessage: string) {
    openScreenWithStatus(screen, statusMessage);
  }

  function openRecordUpdateUnavailable() {
    openRecordActionUnavailable("editRecord", recordUpdateUnavailableStatusMessage(protectedBackendUnavailableMessage));
  }

  function openRecordDeleteUnavailable() {
    openRecordActionUnavailable("deleteConfirm", recordDeleteUnavailableStatusMessage(protectedBackendUnavailableMessage));
  }

  function startRecordUpdateRequest() {
    recordUpdateInFlight.current = true;
    setIsBusy(true);
    setStatus(recordUpdateProgressStatusMessage());
  }

  function finishRecordUpdateRequest() {
    recordUpdateInFlight.current = false;
    setIsBusy(false);
  }

  async function requestSelectedRecordUpdate(recordId: string, accountId: string, payload: object) {
    const updatedResponse = await requestJson<RecordItem>(
      normalizedApiBaseUrl,
      `/records/${recordId}`,
      {
        method: "PATCH",
        headers: protectedRequestHeaders(accountId, accessToken),
        body: JSON.stringify({
          occurred_at: localDateTimeToIso(recordEditDate, recordEditTime),
          payload_json: payload
        })
      }
    );
    return boundRecordItem(updatedResponse);
  }

  function handleSelectedRecordUpdateSuccess(updated: RecordItem) {
    setRecords((current) => recordsListWithUpdatedRecord(current, updated));
    selectRecordForResult(updated);
    openUpdateSuccessResult(recordUpdateSummaryMessage(1));
    setStatus(recordUpdateSuccessStatusMessage());
  }

  function handleSelectedRecordUpdateFailure(error: unknown) {
    setStatus(recordUpdateFailureStatusMessage(error));
  }

  function buildSelectedRecordUpdatePayload(recordType: string) {
    const payload = buildPayloadFromEditFields(recordType, recordEditFields);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("payload_json must be an object");
    }
    return payload;
  }

  function validateSelectedRecordUpdateForSubmit(recordType: string) {
    const validationError = validateRecordForm(
      recordType,
      recordEditFields,
      recordEditDate,
      recordEditTime
    );
    if (validationError) {
      setStatus(validationError);
      return false;
    }
    return true;
  }

  async function completeSelectedRecordUpdateRequest(recordId: string, accountId: string, recordType: string) {
    try {
      const payload = buildSelectedRecordUpdatePayload(recordType);
      const updated = await requestSelectedRecordUpdate(recordId, accountId, payload);
      handleSelectedRecordUpdateSuccess(updated);
    } catch (error) {
      handleSelectedRecordUpdateFailure(error);
    } finally {
      finishRecordUpdateRequest();
    }
  }

  async function startAndCompleteSelectedRecordUpdateRequest(recordId: string, accountId: string, recordType: string) {
    startRecordUpdateRequest();
    await completeSelectedRecordUpdateRequest(recordId, accountId, recordType);
  }

  function isRecordUpdateRequestBlocked() {
    return isBusy || recordUpdateInFlight.current;
  }

  function selectedRecordForGuardedRecordActionContext() {
    return selectedRecord;
  }

  function accountForGuardedRecordActionContext() {
    return account;
  }

  function guardedSelectedRecordUpdateContext() {
    if (isRecordUpdateRequestBlocked()) {
      return null;
    }
    const record = selectedRecordForGuardedRecordActionContext();
    if (!record) {
      return null;
    }
    if (!protectedBackendReady) {
      openRecordUpdateUnavailable();
      return null;
    }
    const actionAccount = accountForGuardedRecordActionContext();
    if (!actionAccount) {
      return null;
    }
    return { account: actionAccount, record };
  }

  async function updateSelectedRecord() {
    const updateContext = guardedSelectedRecordUpdateContext();
    if (!updateContext) {
      return;
    }
    const updateArgs = selectedRecordUpdateRequestArgs(updateContext);
    if (!validateSelectedRecordUpdateForSubmit(updateArgs.recordType)) {
      return;
    }

    await startAndCompleteSelectedRecordUpdateRequest(
      updateArgs.recordId,
      updateArgs.accountId,
      updateArgs.recordType
    );
  }

  function selectedRecordUpdateRequestArgs(updateContext: NonNullable<ReturnType<typeof guardedSelectedRecordUpdateContext>>) {
    return {
      accountId: updateContext.account.id,
      recordId: updateContext.record.id,
      recordType: updateContext.record.record_type
    };
  }

  function startRecordDeleteRequest() {
    recordDeleteInFlight.current = true;
    setIsBusy(true);
    setStatus(recordDeleteProgressStatusMessage());
  }

  function finishRecordDeleteRequest() {
    recordDeleteInFlight.current = false;
    setIsBusy(false);
  }

  async function requestSelectedRecordDelete(recordId: string, accountId: string) {
    await requestNoContent(normalizedApiBaseUrl, `/records/${recordId}`, {
      method: "DELETE",
      headers: protectedRequestHeaders(accountId, accessToken)
    });
  }

  function handleSelectedRecordDeleteSuccess(recordId: string) {
    setRecords((current) => recordsListWithoutDeletedRecord(current, recordId));
    setSelectedRecord(null);
    seedEmptyRecordEditStateForNow();
    openDeleteSuccessResult(recordDeleteSummaryMessage(1));
    setStatus(recordDeleteSuccessStatusMessage());
  }

  function handleSelectedRecordDeleteFailure(error: unknown) {
    setStatus(recordDeleteFailureStatusMessage(error));
  }

  async function completeSelectedRecordDeleteRequest(recordId: string, accountId: string) {
    try {
      await requestSelectedRecordDelete(recordId, accountId);
      handleSelectedRecordDeleteSuccess(recordId);
    } catch (error) {
      handleSelectedRecordDeleteFailure(error);
    } finally {
      finishRecordDeleteRequest();
    }
  }

  async function startAndCompleteSelectedRecordDeleteRequest(recordId: string, accountId: string) {
    startRecordDeleteRequest();
    await completeSelectedRecordDeleteRequest(recordId, accountId);
  }

  function isRecordDeleteRequestBlocked() {
    return isBusy || recordDeleteInFlight.current;
  }

  function guardedSelectedRecordDeleteContext() {
    if (isRecordDeleteRequestBlocked()) {
      return null;
    }
    const record = selectedRecordForGuardedRecordActionContext();
    if (!record) {
      return null;
    }
    if (!protectedBackendReady) {
      openRecordDeleteUnavailable();
      return null;
    }
    const actionAccount = accountForGuardedRecordActionContext();
    if (!actionAccount) {
      return null;
    }
    return { account: actionAccount, record };
  }

  async function deleteSelectedRecord() {
    const deleteContext = guardedSelectedRecordDeleteContext();
    if (!deleteContext) {
      return;
    }

    const deleteArgs = selectedRecordDeleteRequestArgs(deleteContext);
    await startAndCompleteSelectedRecordDeleteRequest(deleteArgs.recordId, deleteArgs.accountId);
  }

  function selectedRecordDeleteRequestArgs(deleteContext: NonNullable<ReturnType<typeof guardedSelectedRecordDeleteContext>>) {
    return {
      accountId: deleteContext.account.id,
      recordId: deleteContext.record.id
    };
  }

  function startManualCreateRequest() {
    manualCreateInFlight.current = true;
    setIsBusy(true);
    setStatus(manualRecordCreateProgressStatusMessage());
  }

  function finishManualCreateRequest() {
    manualCreateInFlight.current = false;
    setIsBusy(false);
  }

  function manualRecordCreateMetadata() {
    return {
      client_save_batch_id: createClientSaveBatchId(),
      client_save_sequence: 1,
      client_save_batch_size: 1,
      entry_method: "manual_form"
    };
  }

  async function requestManualRecordCreate(profileId: string, accountId: string, payload: object) {
    const createdResponse = await requestJson<RecordItem>(normalizedApiBaseUrl, "/records", {
      method: "POST",
      headers: protectedRequestHeaders(accountId, accessToken),
      body: JSON.stringify({
        profile_id: profileId,
        record_type: manualRecordType,
        occurred_at: localDateTimeToIso(manualRecordDate, manualRecordTime),
        payload_json: payload,
        metadata_json: manualRecordCreateMetadata(),
        source: "manual"
      })
    });
    return boundRecordItem(createdResponse);
  }

  function handleManualRecordCreateSuccess(created: RecordItem) {
    setRecords((current) => boundRecordsList([created, ...current]));
    selectRecordForResult(created);
    seedEmptyManualRecordStateForNow();
    openSaveSuccessResult(manualRecordCreateSummaryMessage(1), "manual", manualRecordReturnScreen);
    setStatus(manualRecordCreateSuccessStatusMessage());
    syncAchievementsAfterRecordSave();
  }

  function handleManualRecordCreateFailure(error: unknown) {
    setStatus(manualRecordCreateFailureStatusMessage(error));
  }

  function buildManualRecordCreatePayload() {
    const payload = buildPayloadFromEditFields(manualRecordType, manualRecordFields);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("payload_json must be an object");
    }
    return payload;
  }

  function validateManualRecordCreateForSubmit() {
    const validationError = validateRecordForm(
      manualRecordType,
      manualRecordFields,
      manualRecordDate,
      manualRecordTime
    );
    if (validationError) {
      setStatus(validationError);
      return false;
    }
    return true;
  }

  async function completeManualRecordCreateRequest(profileId: string, accountId: string) {
    try {
      const payload = buildManualRecordCreatePayload();
      const created = await requestManualRecordCreate(profileId, accountId, payload);
      handleManualRecordCreateSuccess(created);
    } catch (error) {
      handleManualRecordCreateFailure(error);
    } finally {
      finishManualCreateRequest();
    }
  }

  async function startAndCompleteManualRecordCreateRequest(profileId: string, accountId: string) {
    startManualCreateRequest();
    await completeManualRecordCreateRequest(profileId, accountId);
  }

  function isManualCreateRequestBlocked() {
    return isBusy || manualCreateInFlight.current;
  }

  function manualRecordCreateAccountProfileContext() {
    if (!account || !activeProfile) {
      return null;
    }
    return { account, activeProfile };
  }

  function guardedManualRecordCreateContext() {
    if (isManualCreateRequestBlocked()) {
      return null;
    }
    if (!protectedBackendReady) {
      openManualRecordUnavailable("manualRecordConfirm");
      return null;
    }
    const createContext = manualRecordCreateAccountProfileContext();
    if (!createContext) {
      return null;
    }
    return createContext;
  }

  async function createManualRecord() {
    const createContext = guardedManualRecordCreateContext();
    if (!createContext) {
      return;
    }
    if (!validateManualRecordCreateForSubmit()) {
      return;
    }

    const createArgs = manualRecordCreateRequestArgs(createContext);
    await startAndCompleteManualRecordCreateRequest(createArgs.profileId, createArgs.accountId);
  }

  function manualRecordCreateRequestArgs(createContext: NonNullable<ReturnType<typeof guardedManualRecordCreateContext>>) {
    return {
      accountId: createContext.account.id,
      profileId: createContext.activeProfile.id
    };
  }

  async function refreshDownloadedModels(showStatus = false) {
    try {
      const refreshResult = downloadedWhisperModelRefreshResult(await listDownloadedModels());
      setDownloadedModels(refreshResult.downloadedModels);
      if (!whisperModelPath.trim() && refreshResult.initialWhisperModelPath) {
        setWhisperModelPath(nativeDebugInputValue(refreshResult.initialWhisperModelPath));
      }
      if (showStatus) {
        setStatus(recordingModelRefreshStatusMessage(refreshResult.whisperModelCount));
      }
    } catch (error) {
      handleDownloadedModelsRefreshFailure(error, showStatus);
    }
  }

  function handleDownloadedModelsRefreshFailure(error: unknown, showStatus: boolean) {
    const nextState = nativeDownloadedModelsFailureState(error);
    applyNativeStatusState(nextState);
    if (showStatus) {
      setStatus(recordingModelRefreshFailureStatusMessage(error));
    }
  }

  function applyNativeStatusState(nextState: { status: string }) {
    setNativeStatus(nextState.status);
  }

  function openNativeDebugUnavailable() {
    const nextState = nativeDebugUnavailableState();
    applyNativeStatusState(nextState);
  }

  function isNativeDebugActionBlocked() {
    return nativeDebugActionBlocked(isBusy);
  }

  function startNativeDebugAction() {
    setIsBusy(true);
  }

  function finishNativeDebugAction() {
    setIsBusy(false);
  }

  function isNativeDebugActionReady() {
    if (!nativeDebugActionReady({ isBusy, enableDebugTools })) {
      if (!isNativeDebugActionBlocked() && !enableDebugTools) {
        openNativeDebugUnavailable();
      }
      return false;
    }
    return true;
  }

  function handleNativeWhisperSuccess(text: string) {
    updateTranscriptDraft(text);
    const nextState = nativeWhisperSuccessState();
    applyNativeStatusState(nextState);
  }

  function startNativeWhisperStatus() {
    const nextState = nativeWhisperStartState();
    applyNativeStatusState(nextState);
  }

  function handleNativeWhisperMissingInput() {
    const nextState = nativeWhisperMissingInputState();
    applyNativeStatusState(nextState);
  }

  function handleNativeLlamaSuccess(output: string) {
    setLlamaDebugOutput(nativeLlamaOutputSummaryMessage(output.length));
    const nextState = nativeLlamaSuccessState();
    applyNativeStatusState(nextState);
  }

  function startNativeLlamaStatus() {
    const nextState = nativeLlamaStartState();
    applyNativeStatusState(nextState);
  }

  function handleNativeLlamaMissingInput() {
    const nextState = nativeLlamaMissingInputState();
    applyNativeStatusState(nextState);
  }

  function handleNativeBenchmarkMissingInput() {
    const nextState = nativeBenchmarkMissingInputState();
    applyNativeStatusState(nextState);
  }

  function startNativeBenchmarkStatus() {
    const nextState = nativeBenchmarkStartState();
    applyNativeStatusState(nextState);
  }

  function handleNativeBenchmarkSuccess(results: NativeBenchmarkResult[]) {
    const nextState = nativeBenchmarkResultState(results);
    applyNativeStatusState(nextState);
  }

  function startNativeModelDownloadStatus() {
    const nextState = nativeModelDownloadStartState();
    setDownloadProgress(nextState.progress);
    applyNativeStatusState(nextState);
  }

  function handleNativeModelDownloadFailure(error: unknown) {
    const nextState = nativeModelDownloadFailureState(error);
    applyNativeStatusState(nextState);
  }

  function handleNativeModuleCheckSuccess(message: string) {
    const nextState = nativeModuleCheckResultState(message);
    applyNativeStatusState(nextState);
  }

  function startNativeModuleCheckStatus() {
    const nextState = nativeModuleCheckStartState();
    applyNativeStatusState(nextState);
  }

  function handleNativeModuleCheckFailure(error: unknown) {
    const nextState = nativeModuleCheckFailureState(error);
    applyNativeStatusState(nextState);
  }

  function handleNativeWhisperFailure(error: unknown) {
    const nextState = nativeWhisperFailureState(error);
    applyNativeStatusState(nextState);
  }

  function handleNativeLlamaFailure(error: unknown) {
    const nextState = nativeLlamaFailureState(error);
    applyNativeStatusState(nextState);
  }

  async function handleNativeModelDownloadSuccess(uri: string) {
    const nextPaths = nativeModelDownloadSuccessPaths(downloadKind, uri);
    if (nextPaths.llamaModelPath) {
      setLlamaModelPath(nextPaths.llamaModelPath);
    }
    if (nextPaths.whisperModelPath) {
      setWhisperModelPath(nextPaths.whisperModelPath);
    }
    await refreshDownloadedModels();
    const nextState = nativeModelDownloadSuccessState();
    applyNativeStatusState(nextState);
  }

  async function downloadSelectedModel() {
    if (!isNativeDebugActionReady()) {
      return;
    }
    startNativeDebugAction();
    startNativeModelDownloadStatus();
    try {
      const uri = await downloadModel(
        nativeModelDownloadRequestArgs({
          url: modelUrl,
          kind: downloadKind,
          onProgress: setDownloadProgress
        })
      );
      await handleNativeModelDownloadSuccess(uri);
    } catch (error) {
      handleNativeModelDownloadFailure(error);
    } finally {
      finishNativeDebugAction();
    }
  }

  async function checkNativeModules() {
    if (!isNativeDebugActionReady()) {
      return;
    }
    startNativeDebugAction();
    startNativeModuleCheckStatus();
    try {
      const result = await checkNativeLocalModules();
      handleNativeModuleCheckSuccess(result.message);
    } catch (error) {
      handleNativeModuleCheckFailure(error);
    } finally {
      finishNativeDebugAction();
    }
  }

  async function runNativeWhisper() {
    if (!isNativeDebugActionReady()) {
      return;
    }
    const whisperInput = nativeWhisperInput({ audioPath, modelPath: whisperModelPath });
    if (!hasNativeWhisperInput(whisperInput)) {
      handleNativeWhisperMissingInput();
      return;
    }
    startNativeDebugAction();
    startNativeWhisperStatus();
    try {
      const text = await transcribeWithNativeWhisper(nativeWhisperRequestArgs(whisperInput));
      handleNativeWhisperSuccess(text);
    } catch (error) {
      handleNativeWhisperFailure(error);
    } finally {
      finishNativeDebugAction();
    }
  }

  async function runNativeLlama() {
    if (!isNativeDebugActionReady()) {
      return;
    }
    const llamaInput = nativeLlamaInput({ modelPath: llamaModelPath, transcript });
    if (!hasNativeLlamaInput(llamaInput)) {
      handleNativeLlamaMissingInput();
      return;
    }
    startNativeDebugAction();
    startNativeLlamaStatus();
    try {
      const output = await parseWithNativeLlama(nativeLlamaRequestArgs(llamaInput));
      handleNativeLlamaSuccess(output);
    } catch (error) {
      handleNativeLlamaFailure(error);
    } finally {
      finishNativeDebugAction();
    }
  }

  async function runNativeBenchmarks() {
    if (!isNativeDebugActionReady()) {
      return;
    }
    startNativeDebugAction();
    startNativeBenchmarkStatus();
    try {
      const results = await nativeBenchmarkResults({
        audioPath,
        whisperModelPath,
        llamaModelPath,
        transcript,
        benchmarkWhisper: benchmarkNativeWhisper,
        benchmarkLlama: benchmarkNativeLlama
      });
      if (results.length === 0) {
        handleNativeBenchmarkMissingInput();
        return;
      }
      handleNativeBenchmarkSuccess(results);
    } finally {
      finishNativeDebugAction();
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
    selectRecordEditGlucoseUnit(recordEditOptionTarget(option));
  }

  function selectRecordEditGlucoseTiming(value: string) {
    updateRecordEditField("glucoseTiming", value);
  }

  function pressRecordEditGlucoseTimingOption(option: ReturnType<typeof valueLabelDisplayItem>) {
    selectRecordEditGlucoseTiming(recordEditOptionTarget(option));
  }

  function selectRecordEditMealType(value: string) {
    updateRecordEditField("mealType", value);
  }

  function pressRecordEditMealTypeOption(option: ReturnType<typeof valueLabelDisplayItem>) {
    selectRecordEditMealType(recordEditOptionTarget(option));
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
    selectManualRecordGlucoseUnit(manualRecordOptionTarget(option));
  }

  function selectManualRecordGlucoseTiming(value: string) {
    updateManualRecordField("glucoseTiming", value);
  }

  function pressManualRecordGlucoseTimingOption(option: ReturnType<typeof valueLabelDisplayItem>) {
    selectManualRecordGlucoseTiming(manualRecordOptionTarget(option));
  }

  function selectManualRecordMealType(value: string) {
    updateManualRecordField("mealType", value);
  }

  function pressManualRecordMealTypeOption(option: ReturnType<typeof valueLabelDisplayItem>) {
    selectManualRecordMealType(manualRecordOptionTarget(option));
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
      if (shouldGuardDailyRecordLeave) {
        requestDailyRecordLeaveGuard();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [shouldGuardDailyRecordLeave]);

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
              const isCurrentPrimaryTab = primaryTabIsCurrent(screen);
              const isPrimaryTabLocked = primaryTabIsLocked(screen);
              const primaryTabAccessibility = primaryTabAccessibilityText(screen);

              return (
                <Pressable
                  key={primaryTabKey(screen)}
                  accessibilityLabel={primaryTabAccessibility}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isPrimaryTabLocked, selected: isCurrentPrimaryTab }}
                  disabled={isPrimaryTabLocked}
                  style={[
                    styles.tabPill,
                    isCurrentPrimaryTab ? styles.tabPillActive : null,
                    isPrimaryTabLocked ? styles.tabPillDisabled : null
                  ]}
                  onPress={() => pressPrimaryTab(screen)}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      isCurrentPrimaryTab ? styles.tabPillTextActive : null,
                      isPrimaryTabLocked ? styles.tabPillTextDisabled : null
                    ]}
                  >
                    {primaryTabLabel(screen)}
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
              const isActive = mvpFlowStepIsActive(index, mvpFlowStepIndex);
              const isDone = mvpFlowStepIsDone(index, mvpFlowStepIndex);
              return (
                <View key={mvpFlowStepKey(step)} style={styles.flowStepItem}>
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
                      {mvpFlowStepIndicatorText(index, isDone)}
                    </Text>
                  </View>
                  <Text style={[styles.flowStepLabel, isActive ? styles.flowStepLabelActive : null]}>
                    {mvpFlowStepLabel(step)}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {currentScreen === "today" ? (
          <View style={styles.homeMinimalSection}>
            <HomeGuidanceCard />
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
                <Text style={styles.homeExampleIndex}>{homeSpeechExampleLabel(homeCurrentSpeechExample)}</Text>
                <View
                  style={styles.homeExamplePagination}
                  accessibilityLabel={homeSpeechExamplePaginationAccessibilityLabel(
                    homeExampleIndex,
                    homeSpeechExamples.length
                  )}
                >
                  {homeSpeechExamples.map((example, index) => (
                    <View
                      key={homeSpeechExampleDotKey(example)}
                      style={[
                        styles.homeExampleDot,
                        homeSpeechExampleDotIsActive(index, homeExampleIndex) ? styles.homeExampleDotActive : null
                      ]}
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.homeExampleText}>{homeSpeechExampleText(homeCurrentSpeechExample)}</Text>
            </View>
          </View>
        ) : null}

        {currentScreen === "record" ? (
          <>
            <View style={styles.pageSection}>
              <Text style={styles.sectionTitle}>快速記錄</Text>
              <Text style={styles.evidence}>先確認文字，再讓 AI 整理成候選紀錄；確認後才會儲存。</Text>
              <QuickEntryModeRail
                disabled={isBusy}
                items={quickEntryModeDisplayItemsForRender}
                onModePress={handleRecordQuickEntryMode}
              />
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{coreFlowDisplayLabels.parseSettings}</Text>
                <Text style={styles.evidence}>
                  LLM：{selectedModelDisplayLabel(selectedLlmModel, llmModelId)} · {selectedModelRuntimeDisplayLabel(selectedLlmModel)}
                </Text>
                <Text style={styles.evidence}>
                  STT：{selectedModelDisplayLabel(selectedSttModel, sttModelId)} · {selectedModelRuntimeDisplayLabel(selectedSttModel)}
                </Text>
                <RecordFlowChecklist items={recordEntrySettingsChecklistItems} />
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
                    <RecordingResultActionRow
                      onRerecordPress={resetRecordingPreview}
                      onUseTextPress={useRecordRecordingResultTextFallback}
                      rerecordAccessibilityLabel={coreFlowDisplayLabels.rerecordAccessibility}
                      rerecordLabel={coreFlowDisplayLabels.rerecord}
                      useTextAccessibilityLabel={coreFlowDisplayLabels.useRecordingTextAccessibility}
                      useTextLabel={recordingResultPrimaryActionDisplayText}
                    />
                </View>
              ) : null}
              <TranscriptDraftInput
                accessibilityLabel={auxiliaryDisplayLabels.transcriptInputAccessibility}
                value={transcript}
                onChangeText={updateTranscriptDraft}
                maxLength={maxTranscriptTextLength}
                inputStyle={[styles.input, styles.transcriptInput]}
                placeholder="例如：昨天晚餐後兩小時血糖 168，晚餐吃火鍋，飯後走路 20 分鐘。"
              />
                <CoreFlowEntryActionRow
                  fillSampleAccessibilityLabel={coreFlowDisplayLabels.fillSampleAccessibility}
                  fillSampleLabel={coreFlowDisplayLabels.fillSample}
                  isNextDisabled={Boolean(transcriptValidationError) || isBusy}
                  manualAddAccessibilityLabel={coreFlowDisplayLabels.manualAddAccessibility}
                  manualAddLabel={coreFlowDisplayLabels.manualAdd}
                  nextAccessibilityLabel={coreFlowDisplayLabels.nextOrganizeAccessibility}
                  nextLabel={coreFlowDisplayLabels.nextOrganize}
                  onFillSamplePress={fillTranscriptSampleDraft}
                  onManualAddPress={openRecordManualRecord}
                  onNextPress={openTranscriptReview}
                />
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
                <AiFlowChecklist items={aiReviewCostBoundaryChecklistItems} />
              </View>
              {previewState.hasRecords ? (
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
                <AiCandidateList
                  editLabel={coreFlowDisplayLabels.edit}
                  items={previewRecordDisplayItems}
                  lowConfidenceText={aiReviewLowConfidenceDisplayText}
                  onEditCandidate={editAiCandidateRecord}
                  onRemoveCandidate={removeAiCandidateRecord}
                  removeLabel="移除"
                />
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
                      <View key={rejectedPreviewEventKey(event)} style={styles.rejectedEventCard}>
                        <Text style={styles.rejectedText}>{rejectedPreviewEventSourceText(event)}</Text>
                        <Text style={styles.evidence}>{rejectedPreviewEventReasonText(event)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <AiReviewActionRow
                  enterSaveAccessibilityLabel={coreFlowDisplayLabels.enterSaveConfirmAccessibility}
                  enterSaveDisabled={isBusy || !account}
                  enterSaveLabel={coreFlowDisplayLabels.enterSaveConfirm}
                  manualAddAccessibilityLabel={coreFlowDisplayLabels.manualAddAccessibility}
                  manualAddLabel={coreFlowDisplayLabels.manualAdd}
                  onEnterSavePress={enterAiSaveConfirm}
                  onManualAddPress={openAiReviewManualRecord}
                  onReturnEditPress={returnToTranscriptEdit}
                  returnEditAccessibilityLabel={coreFlowDisplayLabels.returnEditAccessibility}
                  returnEditLabel={coreFlowDisplayLabels.returnEdit}
                  showEnterSave={previewState.hasRecords}
                  showManualAdd={previewState.isEmpty}
                />
                {previewState.hasRecords && !account ? (
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
                <Text style={styles.sectionTitle}>{aiSaveConfirmTitleDisplayText}</Text>
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
            {shouldShowDailyRecordLeaveGuard ? (
              <View style={styles.dailyLeaveGuardCard}>
                <Text style={styles.label}>{dailyRecordLeaveGuardTitleDisplayText}</Text>
                <Text style={styles.warningText}>{dailyRecordLeaveGuardBodyDisplayText}</Text>
                <Text style={styles.evidence}>{dailyRecordLeaveGuardQuestionDisplayText}</Text>
                <DangerConfirmActionRow
                  cancelAccessibilityLabel={dailyRecordLeaveGuardCancelAccessibilityLabel}
                  cancelLabel={dailyRecordLeaveGuardCancelDisplayText}
                  confirmAccessibilityLabel={dailyRecordLeaveGuardConfirmAccessibilityLabel}
                  confirmLabel={dailyRecordLeaveGuardConfirmDisplayText}
                  onCancelPress={cancelDailyRecordLeaveGuard}
                  onConfirmPress={confirmDailyRecordLeaveGuard}
                />
              </View>
            ) : null}
            <View style={styles.dailyRecordDateCard}>
              <Text style={styles.confidence}>{aiSaveConfirmDateLabelDisplayText}</Text>
              <Text style={styles.dailyRecordDateText}>{dailyRecordDateDisplayText}</Text>
            </View>
            <View style={styles.dailySummaryCard}>
              <Text style={styles.previewModeBadge}>{aiSaveConfirmSummaryLabelDisplayText}</Text>
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
                <Text style={styles.label}>{todayTranscriptTitleDisplayText}</Text>
                <Text style={styles.evidence}>{todayTranscriptBodyDisplayText}</Text>
              </View>
              <Text style={styles.countText}>{todayTranscriptCountDisplayText}</Text>
            </Pressable>
            <DailyTranscriptList items={todayTranscriptDisplayItems} />
            <DailyRecordSectionList
              menuIndex={dailyRecordMenuIndex}
              onEditEntry={editDailyRecordEntry}
              onManageEntry={openDailyRecordEntryMenu}
              onRemoveEntry={deleteDailyRecordEntry}
              sections={dailyRecordSectionItems}
            />
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
              <AiFlowChecklist items={aiSaveConfirmChecklistItems} />
            </View>
            <FutureBoundaryGrid rows={aiSaveConfirmBoundaryRows} />
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
                <Text>{pendingRemoveDisplayIcon(pendingPreviewRemoveDisplayItem)}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.confidence}>{pendingRemoveDisplayTypeLabel(pendingPreviewRemoveDisplayItem)}</Text>
                <Text style={styles.recordContent}>{pendingRemoveDisplayPayloadSummary(pendingPreviewRemoveDisplayItem)}</Text>
                <Text style={styles.evidence}>{aiRemoveConfirmSourceDisplayText}</Text>
              </View>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.removeScope}</Text>
              <AiFlowChecklist items={aiCandidateRemoveChecklistItems} />
            </View>
            <DangerConfirmActionRow
              cancelAccessibilityLabel={coreFlowDisplayLabels.cancelAccessibility}
              cancelLabel={coreFlowDisplayLabels.cancel}
              confirmAccessibilityLabel={coreFlowDisplayLabels.confirmRemoveAccessibility}
              confirmLabel={aiRemoveConfirmSubmitDisplayText}
              onCancelPress={returnFromPreviewRemoveConfirm}
              onConfirmPress={confirmPreviewRecordRemove}
            />
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
              <AiFlowChecklist items={aiSaveFailureChecklistItems} />
            </View>
            <AiSaveFailureActionRow
              backAccessibilityLabel={coreFlowDisplayLabels.backAiConfirmAccessibility}
              backLabel={coreFlowDisplayLabels.backAiConfirm}
              manualAddAccessibilityLabel={coreFlowDisplayLabels.manualAddAccessibility}
              manualAddLabel={coreFlowDisplayLabels.manualAdd}
              onBackPress={returnFromAiSaveFailureToAiReview}
              onManualAddPress={openAiSaveFailureManualFallback}
              onReturnSavePress={returnFromAiSaveFailureToSaveConfirm}
              returnSaveAccessibilityLabel={coreFlowDisplayLabels.returnSaveConfirmAccessibility}
              returnSaveDisabled={previewState.isEmpty}
              returnSaveLabel={coreFlowDisplayLabels.returnSaveConfirm}
            />
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
            <TranscriptDraftInput
              accessibilityLabel={auxiliaryDisplayLabels.transcriptInputAccessibility}
              value={transcript}
              onChangeText={updateTranscriptDraft}
              maxLength={maxTranscriptTextLength}
              inputStyle={[styles.input, styles.transcriptReviewInput]}
              placeholder="輸入或貼上血糖、飲食、運動或用藥紀錄..."
            />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.preOrganizeHint}</Text>
              <Text style={styles.evidence}>{transcriptReviewPreParseGuidanceDisplayText}</Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.costBoundary}</Text>
              <RecordFlowChecklist items={transcriptReviewCostBoundaryChecklistItems} />
            </View>
            <TranscriptReviewActionRow
              isSubmitDisabled={
                Boolean(transcriptValidationError) ||
                isTranscriptSample ||
                isBusy ||
                !protectedBackendReady ||
                !parserModelReady
              }
              onRetryPress={retryTranscriptInput}
              onSubmitPress={submitTranscriptParse}
              retryAccessibilityLabel={coreFlowDisplayLabels.retryInputAccessibility}
              retryLabel={coreFlowDisplayLabels.retryInput}
              submitAccessibilityLabel={coreFlowDisplayLabels.submitTranscriptParseAccessibility}
              submitLabel={coreFlowDisplayLabels.nextOrganize}
            />
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
            <RecordEditHeaderFields
              dateAccessibilityLabel={auxiliaryDisplayLabels.dateInputAccessibility}
              dateMaxLength={maxDateInputLength}
              dateValue={previewEditDate}
              timeAccessibilityLabel={auxiliaryDisplayLabels.timeInputAccessibility}
              timeMaxLength={maxTimeInputLength}
              timeValue={previewEditTime}
              typeLabel={previewRecordEditTypeLabel(selectedPreviewRecordDisplayItem)}
              onDateChange={updatePreviewEditDateInput}
              onTimeChange={updatePreviewEditTimeInput}
            />
            {selectedPreviewRecord.record_type === "glucose" ? (
              <>
                <RecordTextField
                  icon={"💧"}
                  label={"血糖數值"}
                  accessibilityLabel={auxiliaryDisplayLabels.glucoseValueInputAccessibility}
                  value={recordEditFieldValue(previewEditFields, "glucoseValue")}
                  onChangeText={updatePreviewEditGlucoseValue}
                  keyboardType="numeric"
                  maxLength={recordEditFieldMaxLength("glucoseValue")}
                  inputStyle={styles.input}
                  placeholder="138"
                />
                <RecordOptionRow
                  options={glucoseUnitDisplayOptions}
                  selectedValue={recordEditFieldValue(previewEditFields, "glucoseUnit")}
                  onOptionPress={pressPreviewEditGlucoseUnitOption}
                />
                <RecordOptionField
                  icon={"◌"}
                  label={"情境"}
                  options={glucoseTimingDisplayOptions}
                  selectedValue={recordEditFieldValue(previewEditFields, "glucoseTiming")}
                  onOptionPress={pressPreviewEditGlucoseTimingOption}
                />
              </>
            ) : null}
            {selectedPreviewRecord.record_type === "meal" ? (
              <>
                <RecordOptionField
                  icon={"🥣"}
                  label={"餐別"}
                  options={mealTypeDisplayOptions}
                  selectedValue={recordEditFieldValue(previewEditFields, "mealType")}
                  onOptionPress={pressPreviewEditMealTypeOption}
                />
                <RecordTextField
                  icon={"🍽"}
                  label={"飲食內容"}
                  accessibilityLabel={auxiliaryDisplayLabels.foodItemsInputAccessibility}
                  value={recordEditFieldValue(previewEditFields, "foodItems")}
                  onChangeText={updatePreviewEditFoodItems}
                  maxLength={recordEditFieldMaxLength("foodItems")}
                  multiline
                  textAlignVertical="top"
                  inputStyle={[styles.input, recordTextFieldStyles.multilineField]}
                  placeholder="水煮蛋、熱狗"
                />
              </>
            ) : null}
            {selectedPreviewRecord.record_type === "exercise" ? (
              <>
                <RecordTextField
                  icon={"🚶"}
                  label={"運動"}
                  accessibilityLabel={auxiliaryDisplayLabels.exerciseActivityInputAccessibility}
                  value={recordEditFieldValue(previewEditFields, "exerciseActivity")}
                  onChangeText={updatePreviewEditExerciseActivity}
                  maxLength={recordEditFieldMaxLength("exerciseActivity")}
                  inputStyle={styles.input}
                  placeholder="走路"
                />
                <RecordTextField
                  icon={"⏱"}
                  label={"時長（分鐘）"}
                  accessibilityLabel={auxiliaryDisplayLabels.exerciseMinutesInputAccessibility}
                  value={recordEditFieldValue(previewEditFields, "exerciseMinutes")}
                  onChangeText={updatePreviewEditExerciseMinutes}
                  keyboardType="numeric"
                  maxLength={recordEditFieldMaxLength("exerciseMinutes")}
                  inputStyle={styles.input}
                  placeholder="20"
                />
              </>
            ) : null}
            {selectedPreviewRecord.record_type === "medication" ? (
              <>
                <RecordTextField
                  icon={"💊"}
                  label={"用藥"}
                  accessibilityLabel={auxiliaryDisplayLabels.medicationNameInputAccessibility}
                  value={recordEditFieldValue(previewEditFields, "medicationName")}
                  onChangeText={updatePreviewEditMedicationName}
                  maxLength={recordEditFieldMaxLength("medicationName")}
                  inputStyle={styles.input}
                  placeholder="藥名或胰島素描述"
                />
                <RecordTextField
                  icon={"▣"}
                  label={"劑量"}
                  accessibilityLabel={auxiliaryDisplayLabels.medicationDoseInputAccessibility}
                  value={recordEditFieldValue(previewEditFields, "medicationDose")}
                  onChangeText={updatePreviewEditMedicationDose}
                  maxLength={recordEditFieldMaxLength("medicationDose")}
                  inputStyle={styles.input}
                  placeholder="例如：1 顆、8u"
                />
              </>
            ) : null}
            {selectedPreviewRecord.record_type === "note" ? (
              <>
                <RecordTextField
                  icon={"📝"}
                  label={"備註類型"}
                  accessibilityLabel={auxiliaryDisplayLabels.noteKindInputAccessibility}
                  value={recordEditFieldValue(previewEditFields, "noteKind")}
                  onChangeText={updatePreviewEditNoteKind}
                  maxLength={recordEditFieldMaxLength("noteKind")}
                  inputStyle={styles.input}
                  placeholder="symptom"
                />
                <RecordTextField
                  icon={"#"}
                  label={"標籤"}
                  accessibilityLabel={auxiliaryDisplayLabels.noteTagsInputAccessibility}
                  value={recordEditFieldValue(previewEditFields, "noteTags")}
                  onChangeText={updatePreviewEditNoteTags}
                  maxLength={recordEditFieldMaxLength("noteTags")}
                  multiline
                  textAlignVertical="top"
                  inputStyle={[styles.input, recordTextFieldStyles.multilineField]}
                  placeholder="頭暈、疲倦"
                />
              </>
            ) : null}
            {!["glucose", "meal", "exercise", "medication", "note"].includes(
              selectedPreviewRecord.record_type
            ) ? (
              <RecordJsonField
                accessibilityLabel={auxiliaryDisplayLabels.fallbackJsonInputAccessibility}
                value={recordEditFieldValue(previewEditFields, "fallbackJson")}
                onChangeText={updatePreviewEditFallbackJson}
                maxLength={recordEditFieldMaxLength("fallbackJson")}
                inputStyle={[styles.input, styles.jsonInput]}
              />
            ) : null}
            <PreviewRecordEditActionRow
              applyAccessibilityLabel={coreFlowDisplayLabels.previewEditApplyAccessibility}
              applyDisabled={Boolean(previewRecordEditValidationError)}
              applyLabel={coreFlowDisplayLabels.applyChanges}
              cancelAccessibilityLabel={coreFlowDisplayLabels.previewEditReturnAccessibility}
              cancelLabel={coreFlowDisplayLabels.cancel}
              onApplyPress={savePreviewRecordEdit}
              onCancelPress={returnFromPreviewRecordEdit}
            />
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
                  : saveSuccessViewState.isManualSave
                    ? "手動儲存完成"
                    : "儲存完成"}
              </Text>
              <Text style={styles.evidence}>
                {lastSavedSummaryDisplayText}
              </Text>
            </View>
            {saveSuccessNewlyUnlockedDisplayItems.length > 0 ? (
              <AchievementUnlockedCardList
                badgeLabel="新解鎖"
                items={saveSuccessNewlyUnlockedDisplayItems}
                keyPrefix="save-success-new-unlock"
                title="新解鎖成就"
              />
            ) : null}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.saveResult}</Text>
              <Text style={styles.evidence}>
              {saveSuccessViewState.isManualSave
                  ? hasManualFallbackWithAiCandidates
                    ? `這筆資料由手動表單直接建立，沒有呼叫 parser 或 LLM；仍有 ${unsavedPreviewRecordDisplayCount} 筆 AI 候選保留在確認流程。`
                    : "這筆資料由手動表單直接建立，沒有呼叫 parser 或 LLM；你可以回到今日紀錄查看，也可以繼續新增下一筆。"
                  : saveSuccessViewState.hasUnsavedPreviewRecords
                    ? `已有部分紀錄儲存成功，仍有 ${unsavedPreviewRecordDisplayCount} 筆候選紀錄尚未儲存；不會自動重試或再次呼叫 AI。`
                    : "你可以回到今日紀錄查看，也可以繼續新增下一筆。AI 原始文字只用於確認流程；儲存後已清空目前輸入。"}
              </Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.postSaveBoundary}</Text>
              <OutcomeChecklist items={saveSuccessBoundaryChecklistItems} />
            </View>
            <RecordResultDestinationGrid
              items={saveSuccessDestinationItems}
              onDestinationPress={openSaveSuccessDestinationCard}
            />
            <SaveSuccessActionRow
              canContinueManual={saveSuccessViewState.canContinueManual}
              canContinueRecordEntry={saveSuccessViewState.canContinueRecordEntry}
              continueManualAccessibilityLabel={coreFlowDisplayLabels.saveSuccessManualContinueAccessibility}
              continueManualLabel={coreFlowDisplayLabels.continueManualAdd}
              detailAccessibilityLabel={coreFlowDisplayLabels.saveSuccessDetailAccessibility}
              detailLabel={coreFlowDisplayLabels.viewDetail}
              hasUnsavedPreviewRecords={saveSuccessViewState.hasUnsavedPreviewRecords}
              onContinueManualPress={openSaveSuccessManualContinue}
              onProcessUnsavedPress={processUnsavedPreviewRecords}
              onRecordEntryPress={openSaveSuccessRecordEntry}
              onReturnTodayPress={returnFromSaveSuccessToToday}
              onViewDetailPress={openSaveSuccessRecordDetail}
              pauseEntryText="請先處理未儲存 AI 候選；新增入口會在候選處理後恢復。"
              processUnsavedAccessibilityLabel={coreFlowDisplayLabels.saveSuccessProcessUnsavedAccessibility}
              processUnsavedLabel={coreFlowDisplayLabels.processUnsavedCandidates}
              recordEntryAccessibilityLabel={coreFlowDisplayLabels.saveSuccessRecordEntryAccessibility}
              recordEntryLabel={coreFlowDisplayLabels.continueRecord}
              returnTodayAccessibilityLabel={coreFlowDisplayLabels.saveSuccessReturnTodayAccessibility}
              returnTodayLabel={coreFlowDisplayLabels.backToday}
              shouldPauseEntryActions={saveSuccessViewState.shouldPauseEntryActions}
              showDetail={Boolean(selectedRecord)}
              voiceTextLabel={coreFlowDisplayLabels.voiceText}
            />
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
              <OutcomeChecklist items={deleteSuccessBoundaryChecklistItems} />
            </View>
            <RecordResultDestinationGrid
              items={deleteSuccessDestinationItems}
              onDestinationPress={openDeleteSuccessDestinationCard}
            />
            <DeleteSuccessActionRow
              historyAccessibilityLabel={coreFlowDisplayLabels.deleteSuccessHistoryAccessibility}
              historyLabel={coreFlowDisplayLabels.viewHistory}
              onHistoryPress={openDeleteSuccessHistoryDestination}
              onReturnPress={returnFromDeleteSuccess}
              returnAccessibilityLabel={coreFlowDisplayLabels.recordResultReturnAccessibility}
              returnLabel={recordDetailReturnScreen === "history" ? "回歷史紀錄" : "回今日紀錄"}
            />
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
              <OutcomeChecklist items={updateSuccessBoundaryChecklistItems} />
            </View>
            <RecordResultDestinationGrid
              items={updateSuccessDestinationItems}
              onDestinationPress={openUpdateSuccessDestinationCard}
            />
            <UpdateSuccessActionRow
              detailAccessibilityLabel={coreFlowDisplayLabels.updatedRecordDetailAccessibility}
              detailLabel={coreFlowDisplayLabels.viewDetail}
              onDetailPress={openUpdatedRecordDetail}
              onReturnPress={returnFromUpdateSuccess}
              returnAccessibilityLabel={coreFlowDisplayLabels.recordResultReturnAccessibility}
              returnLabel={recordDetailReturnScreen === "history" ? "回歷史紀錄" : "回今日紀錄"}
              showDetail={Boolean(selectedRecord)}
            />
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
                glucoseTiming={recordEditFieldValue(manualRecordFields, "glucoseTiming")}
                glucoseValue={recordEditFieldValue(manualRecordFields, "glucoseValue")}
                glucoseValueAccessibilityLabel={auxiliaryDisplayLabels.glucoseValueInputAccessibility}
                glucoseValueMaxLength={recordEditFieldMaxLength("glucoseValue")}
                glucoseUnit={recordEditFieldValue(manualRecordFields, "glucoseUnit")}
                timingOptions={glucoseTimingDisplayOptions}
                unitOptions={glucoseUnitDisplayOptions}
                onGlucoseValueChange={updateManualRecordGlucoseValue}
                onTimingPress={pressManualRecordGlucoseTimingOption}
                onUnitPress={pressManualRecordGlucoseUnitOption}
              />
            ) : null}

            {manualRecordType === "meal" ? (
              <ManualRecordMealFields
                foodItems={recordEditFieldValue(manualRecordFields, "foodItems")}
                foodItemsAccessibilityLabel={auxiliaryDisplayLabels.foodItemsInputAccessibility}
                foodItemsMaxLength={recordEditFieldMaxLength("foodItems")}
                mealType={recordEditFieldValue(manualRecordFields, "mealType")}
                mealTypeOptions={mealTypeDisplayOptions}
                onFoodItemsChange={updateManualRecordFoodItems}
                onMealTypePress={pressManualRecordMealTypeOption}
              />
            ) : null}

            {manualRecordType === "exercise" ? (
              <ManualRecordExerciseFields
                activity={recordEditFieldValue(manualRecordFields, "exerciseActivity")}
                activityAccessibilityLabel={auxiliaryDisplayLabels.exerciseActivityInputAccessibility}
                activityMaxLength={recordEditFieldMaxLength("exerciseActivity")}
                minutes={recordEditFieldValue(manualRecordFields, "exerciseMinutes")}
                minutesAccessibilityLabel={auxiliaryDisplayLabels.exerciseMinutesInputAccessibility}
                minutesMaxLength={recordEditFieldMaxLength("exerciseMinutes")}
                onActivityChange={updateManualRecordExerciseActivity}
                onMinutesChange={updateManualRecordExerciseMinutes}
              />
            ) : null}

            {manualRecordType === "medication" ? (
              <ManualRecordMedicationFields
                dose={recordEditFieldValue(manualRecordFields, "medicationDose")}
                doseAccessibilityLabel={auxiliaryDisplayLabels.medicationDoseInputAccessibility}
                doseMaxLength={recordEditFieldMaxLength("medicationDose")}
                name={recordEditFieldValue(manualRecordFields, "medicationName")}
                nameAccessibilityLabel={auxiliaryDisplayLabels.medicationNameInputAccessibility}
                nameMaxLength={recordEditFieldMaxLength("medicationName")}
                onDoseChange={updateManualRecordMedicationDose}
                onNameChange={updateManualRecordMedicationName}
              />
            ) : null}

            {manualRecordType === "note" ? (
              <ManualRecordNoteFields
                kind={recordEditFieldValue(manualRecordFields, "noteKind")}
                kindAccessibilityLabel={auxiliaryDisplayLabels.noteKindInputAccessibility}
                kindMaxLength={recordEditFieldMaxLength("noteKind")}
                tags={recordEditFieldValue(manualRecordFields, "noteTags")}
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
              icon={manualConfirmPreviewIcon(manualRecordConfirmDisplay)}
              introText={manualRecordConfirmIntroDisplayText}
              payloadSummary={manualConfirmPreviewPayloadSummary(manualRecordConfirmDisplay)}
              sourceLine={manualConfirmPreviewSourceLine(manualRecordConfirmDisplay)}
              typeLabel={manualConfirmPreviewTypeLabel(manualRecordConfirmDisplay)}
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
            {recordDisplayState.isEmpty ? (
              <HistoryNoRecordStatusBlock
                body={historyNoRealRecordHealthValueDisplayText}
                title={coreFlowDisplayLabels.historyDataStatus}
              />
            ) : null}
            {recordDisplayState.isAtSyncBoundary ? (
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
              dateTimeLabel={selectedRecordDetailDateTimeLabel(selectedRecordDisplayItem)}
              dateValue={selectedRecordDetailDateLabel(selectedRecordDisplayItem)}
              detailRows={selectedRecordDetailRows}
              exerciseValue={selectedRecordDetailExerciseSummary(selectedRecordDisplayItem)}
              mainInfoTitle={coreFlowDisplayLabels.mainInfo}
              medicationValue={selectedRecordDetailMedicationSummary(selectedRecordDisplayItem)}
              payloadSummary={selectedRecordDetailPayloadSummary(selectedRecordDisplayItem)}
              sourceTitle={coreFlowDisplayLabels.source}
              sourceValue={selectedRecordDetailSourceLabel(selectedRecordDisplayItem)}
              supplementalInfoTitle={coreFlowDisplayLabels.supplementalInfo}
              timeLabel={"時間"}
              timeValue={selectedRecordDetailTimeLabel(selectedRecordDisplayItem)}
              typeLabel={"類型"}
              typeValue={selectedRecordDetailTypeLabel(selectedRecordDisplayItem)}
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
              <InsightFlowChecklist items={deleteConfirmChecklistItems} />
            </View>
            <DangerConfirmActionRow
              cancelAccessibilityLabel={coreFlowDisplayLabels.recordDeleteCancelAccessibility}
              cancelDisabled={isBusy}
              cancelLabel={coreFlowDisplayLabels.cancel}
              confirmAccessibilityLabel={coreFlowDisplayLabels.recordDeleteSubmitAccessibility}
              confirmDisabled={isBusy}
              confirmLabel={deleteConfirmSubmitDisplayLabel}
              onCancelPress={returnFromDeleteConfirm}
              onConfirmPress={submitRecordDelete}
            />
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
              typeLabel={recordEditHeaderTypeLabel(selectedRecordDisplayItem)}
              onDateChange={updateRecordEditDateInput}
              onTimeChange={updateRecordEditTimeInput}
            />
            {selectedRecord.record_type === "glucose" ? (
              <>
                <RecordTextField
                  icon={"💧"}
                  label={"血糖數值"}
                  accessibilityLabel={auxiliaryDisplayLabels.glucoseValueInputAccessibility}
                  value={recordEditFieldValue(recordEditFields, "glucoseValue")}
                  onChangeText={updateRecordEditGlucoseValue}
                  keyboardType="numeric"
                  maxLength={recordEditFieldMaxLength("glucoseValue")}
                  inputStyle={styles.input}
                  placeholder="138"
                />
                <RecordOptionRow
                  options={glucoseUnitDisplayOptions}
                  selectedValue={recordEditFieldValue(recordEditFields, "glucoseUnit")}
                  onOptionPress={pressRecordEditGlucoseUnitOption}
                />
                <RecordOptionField
                  icon={"◌"}
                  label={"情境"}
                  options={glucoseTimingDisplayOptions}
                  selectedValue={recordEditFieldValue(recordEditFields, "glucoseTiming")}
                  onOptionPress={pressRecordEditGlucoseTimingOption}
                />
              </>
            ) : null}

            {selectedRecord.record_type === "meal" ? (
              <>
                <RecordOptionField
                  icon={"🥣"}
                  label={"餐別"}
                  options={mealTypeDisplayOptions}
                  selectedValue={recordEditFieldValue(recordEditFields, "mealType")}
                  onOptionPress={pressRecordEditMealTypeOption}
                />
                <RecordTextField
                  icon={"🍽"}
                  label={"飲食內容"}
                  accessibilityLabel={auxiliaryDisplayLabels.foodItemsInputAccessibility}
                  value={recordEditFieldValue(recordEditFields, "foodItems")}
                  onChangeText={updateRecordEditFoodItems}
                  maxLength={recordEditFieldMaxLength("foodItems")}
                  multiline
                  textAlignVertical="top"
                  inputStyle={[styles.input, recordTextFieldStyles.multilineField]}
                  placeholder="水煮蛋、熱狗"
                />
              </>
            ) : null}

            {selectedRecord.record_type === "exercise" ? (
              <>
                <RecordTextField
                  icon={"🚶"}
                  label={"運動"}
                  accessibilityLabel={auxiliaryDisplayLabels.exerciseActivityInputAccessibility}
                  value={recordEditFieldValue(recordEditFields, "exerciseActivity")}
                  onChangeText={updateRecordEditExerciseActivity}
                  maxLength={recordEditFieldMaxLength("exerciseActivity")}
                  inputStyle={styles.input}
                  placeholder="走路"
                />
                <RecordTextField
                  icon={"⏱"}
                  label={"時長（分鐘）"}
                  accessibilityLabel={auxiliaryDisplayLabels.exerciseMinutesInputAccessibility}
                  value={recordEditFieldValue(recordEditFields, "exerciseMinutes")}
                  onChangeText={updateRecordEditExerciseMinutes}
                  keyboardType="numeric"
                  maxLength={recordEditFieldMaxLength("exerciseMinutes")}
                  inputStyle={styles.input}
                  placeholder="20"
                />
              </>
            ) : null}

            {selectedRecord.record_type === "medication" ? (
              <>
                <RecordTextField
                  icon={"💊"}
                  label={"用藥"}
                  accessibilityLabel={auxiliaryDisplayLabels.medicationNameInputAccessibility}
                  value={recordEditFieldValue(recordEditFields, "medicationName")}
                  onChangeText={updateRecordEditMedicationName}
                  maxLength={recordEditFieldMaxLength("medicationName")}
                  inputStyle={styles.input}
                  placeholder="藥名或胰島素描述"
                />
                <RecordTextField
                  icon={"▣"}
                  label={"劑量"}
                  accessibilityLabel={auxiliaryDisplayLabels.medicationDoseInputAccessibility}
                  value={recordEditFieldValue(recordEditFields, "medicationDose")}
                  onChangeText={updateRecordEditMedicationDose}
                  maxLength={recordEditFieldMaxLength("medicationDose")}
                  inputStyle={styles.input}
                  placeholder="例如：1 顆、8u"
                />
              </>
            ) : null}

            {selectedRecord.record_type === "note" ? (
              <>
                <RecordTextField
                  icon={"📝"}
                  label={"備註類型"}
                  accessibilityLabel={auxiliaryDisplayLabels.noteKindInputAccessibility}
                  value={recordEditFieldValue(recordEditFields, "noteKind")}
                  onChangeText={updateRecordEditNoteKind}
                  maxLength={recordEditFieldMaxLength("noteKind")}
                  inputStyle={styles.input}
                  placeholder="symptom"
                />
                <RecordTextField
                  icon={"#"}
                  label={"標籤"}
                  accessibilityLabel={auxiliaryDisplayLabels.noteTagsInputAccessibility}
                  value={recordEditFieldValue(recordEditFields, "noteTags")}
                  onChangeText={updateRecordEditNoteTags}
                  maxLength={recordEditFieldMaxLength("noteTags")}
                  multiline
                  textAlignVertical="top"
                  inputStyle={[styles.input, recordTextFieldStyles.multilineField]}
                  placeholder="頭暈、疲倦"
                />
              </>
            ) : null}

            {!["glucose", "meal", "exercise", "medication", "note"].includes(
              selectedRecord.record_type
            ) ? (
              <RecordJsonField
                accessibilityLabel={auxiliaryDisplayLabels.fallbackJsonInputAccessibility}
                value={recordEditFieldValue(recordEditFields, "fallbackJson")}
                onChangeText={updateRecordEditFallbackJson}
                maxLength={recordEditFieldMaxLength("fallbackJson")}
                inputStyle={[styles.input, styles.jsonInput]}
              />
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
            <AnalysisRangeSelector
              options={analysisRangeDisplayOptions}
              optionKey={analysisRangeOptionKey}
              optionAccessibilityLabel={analysisRangeOptionAccessibilityLabel}
              optionLabel={analysisRangeOptionLabel}
              isSelected={(item) => analysisRangeOptionSelected(item, analysisRange)}
              onOptionPress={pressAnalysisRangeOption}
            />
            {analysisRange === "custom" ? (
              <>
                <AnalysisCustomDateRangeFields
                  startAccessibilityLabel={auxiliaryDisplayLabels.analysisStartDateInputAccessibility}
                  startValue={analysisCustomStart}
                  onStartChange={updateAnalysisCustomStartInput}
                  startMaxLength={maxDateInputLength}
                  endAccessibilityLabel={auxiliaryDisplayLabels.analysisEndDateInputAccessibility}
                  endValue={analysisCustomEnd}
                  onEndChange={updateAnalysisCustomEndInput}
                  endMaxLength={maxDateInputLength}
                />
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
                        const pointOffset = analysisChartPointOffset(point, chartMinimum, chartRange);
                        const isSelected = analysisChartPointIsSelected(index, selectedAnalysisPointIndex);
                        const pointAccessibilityLabel = analysisChartPointAccessibilityLabel(point);
                        return (
                          <Pressable
                            key={analysisChartPointKey(point)}
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
                      <Text key={analysisChartPointKey(point)} style={styles.chartAxisLabel}>
                        {analysisAxisLabel(point, index, analysisChartPoints.length)}
                      </Text>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.emptyText}>{analysisChartEmptyDisplayText}</Text>
              )}
            </View>
            <MetricGrid rows={analysisMetricRows} />
            <Text style={styles.evidence}>{analysisRangeSummaryDisplayText}</Text>
            {analysisGlucoseRecords.length === 0 ? (
              <InsightEmptyActionRow
                manualAccessibilityLabel={coreFlowDisplayLabels.analysisManualAccessibility}
                manualLabel={coreFlowDisplayLabels.manualAdd}
                onManualPress={openAnalysisManualRecord}
                onReturnPress={returnFromAnalysisToToday}
                returnAccessibilityLabel={coreFlowDisplayLabels.analysisReturnTodayAccessibility}
                returnLabel={coreFlowDisplayLabels.backTodayAlt}
              />
            ) : null}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.analysisDataBoundary}</Text>
              <InsightFlowChecklist items={analysisBoundaryChecklistItems} />
            </View>
            {recordDisplayState.isAtSyncBoundary ? (
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
            <DetailedReportBoundaryGrid rows={detailedReportBoundaryRows} />
            <MetricGrid rows={detailedReportMetricRows} />
            {reportRecordCount === 0 ? (
              <InsightEmptyActionRow
                manualAccessibilityLabel={coreFlowDisplayLabels.reportManualAccessibility}
                manualLabel={coreFlowDisplayLabels.manualAdd}
                onManualPress={openDetailedReportManualRecord}
                onReturnPress={returnFromDetailedReportToToday}
                returnAccessibilityLabel={coreFlowDisplayLabels.reportReturnTodayAccessibility}
                returnLabel={coreFlowDisplayLabels.backTodayAlt}
              />
            ) : null}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{coreFlowDisplayLabels.reportNotes}</Text>
              <InsightFlowChecklist items={detailedReportNoteItems} />
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
              <SubscriptionComparisonList rows={subscriptionComparisonDisplayRows} />
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.formalReadiness}</Text>
              <SubscriptionChecklist items={subscriptionReadinessChecklistItems} />
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
              <SubscriptionSubpageCloseButton
                accessibilityLabel={auxiliaryDisplayLabels.closeReturn}
                onPress={returnFromSubscriptionManagementToSettings}
              />
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
              <PreviewStatusList rows={subscriptionManagementDisplayRows} />
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.formalReadiness}</Text>
              <SubscriptionChecklist items={subscriptionManagementReadinessChecklistItems} />
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.noAction}</Text>
              <Text style={styles.evidence}>{subscriptionManagementNoActionDisplayText}</Text>
            </View>
            <SubscriptionSubpageActionRow
              actionAccessibilityLabel={settingsSubscriptionDisplayLabels.paymentIntegrationAccessibility}
              actionLabel={settingsSubscriptionDisplayLabels.paymentIntegrationButton}
              onActionPress={showSubscriptionManagementPaymentStatus}
              onReturnPress={returnFromSubscriptionManagementToSettings}
              returnAccessibilityLabel={settingsSubscriptionDisplayLabels.returnSettingsAccessibility}
              returnLabel={settingsSubscriptionDisplayLabels.returnSettings}
            />
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
              <SubscriptionSubpageCloseButton
                accessibilityLabel={auxiliaryDisplayLabels.closeReturn}
                onPress={returnFromMembershipStatusToSubscription}
              />
            </View>
            <View style={styles.heroCard}>
              <Text style={styles.evidence}>{membershipTrialHeroLabelDisplayText}</Text>
              <Text style={styles.heroNumber}>{membershipTrialDaysDisplayText}</Text>
              <Text style={styles.evidence}>{membershipPlanStatusDisplayText}</Text>
            </View>
            <View style={styles.pricingCard}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.memberFeatures}</Text>
              <MembershipFeatureList rows={membershipFeatureRows} />
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
            <MenuDestinationGrid items={menuDisplayItems} onDestinationPress={openMenuDestination} />
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
                <VisualSmokeRouteJumpGrid
                  items={visualSmokeRouteJumpDisplayItems}
                  onRoutePress={openVisualSmokeRoute}
                />
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
            <FutureModuleCardList
              cards={futureModuleDisplayCards}
              labels={futurePreviewDisplayLabels}
              onDestinationPress={openFutureModuleDestination}
            />
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
                <HighlightBulletRow key={futureModuleRequirementKey(requirement)} text={futureModuleRequirementText(requirement)} />
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
            <FutureBoundaryGrid rows={doctorShareBoundaryRows} />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{futurePreviewDisplayLabels.formalReadiness}</Text>
              <FutureReadinessChecklist items={doctorShareReadinessChecklistItems} />
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{futurePreviewDisplayLabels.backendFoundation}</Text>
              <Text style={styles.evidence}>{doctorShareBackendBoundaryDisplayText}</Text>
            </View>
            <DoctorShareActionRow
              onReportPress={showDoctorShareReportBoundaryStatus}
              onTokenPress={showDoctorShareTokenStatus}
              reportAccessibilityLabel={futurePreviewDisplayLabels.doctorReportAccessibility}
              reportLabel={futurePreviewDisplayLabels.doctorReportButton}
              tokenAccessibilityLabel={futurePreviewDisplayLabels.doctorTokenAccessibility}
              tokenLabel={futurePreviewDisplayLabels.doctorTokenButton}
            />
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
            <FutureBoundaryGrid rows={healthIntegrationBoundaryRows} />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{futurePreviewDisplayLabels.formalReadiness}</Text>
              <FutureReadinessChecklist items={healthIntegrationReadinessChecklistItems} />
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{futurePreviewDisplayLabels.externalDataBoundary}</Text>
              <Text style={styles.evidence}>{healthIntegrationExternalDataBoundaryDisplayText}</Text>
            </View>
            <HealthIntegrationActionRow
              meterAccessibilityLabel={futurePreviewDisplayLabels.healthMeterAccessibility}
              meterLabel={futurePreviewDisplayLabels.healthMeterButton}
              onMeterPress={showHealthIntegrationMeterStatus}
              onPermissionPress={showHealthIntegrationPermissionStatus}
              permissionAccessibilityLabel={futurePreviewDisplayLabels.healthPermissionAccessibility}
              permissionLabel={futurePreviewDisplayLabels.healthPermissionButton}
            />
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
                <Text style={styles.sectionTitle}>{communityScreenTitleLabel()}</Text>
                <Text style={styles.evidence}>{communityScreenSubtitleCopy()}</Text>
              </View>
              <Pressable accessibilityLabel={communityCloseAccessibilityDisplayLabel} accessibilityRole="button" style={styles.closeButton} onPress={returnFromCommunityPreview}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{communityPreviewBoundaryBadgeDisplayLabel}</Text>
              <Text style={styles.evidence}>{communityPreviewBoundaryCopyDisplayText}</Text>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{foodCommunityDatabaseSectionLabel()}</Text>
              <Text style={styles.evidence}>{foodCommunityDatabaseIntroCopy()}</Text>
            </View>
            <FoodCommunitySearchField
              accessibilityLabel={auxiliaryDisplayLabels.foodCommunitySearchInputAccessibility}
              value={foodCommunitySearchText}
              onChangeText={updateFoodCommunitySearchInput}
              maxLength={maxStoreSearchTextLength}
            />
            <SegmentSelector
              options={foodCommunityCategoryDisplayOptions}
              optionKey={foodCommunityCategoryOptionKey}
              optionAccessibilityLabel={foodCommunityCategoryOptionAccessibilityLabel}
              optionLabel={foodCommunityCategoryOptionLabel}
              isSelected={(category) => foodCommunityCategoryOptionSelected(category, foodCommunityCategory)}
              onOptionPress={pressFoodCommunityCategoryOption}
            />
            {selectedFoodCommunityCategoryDisplay ? (
              <Text style={styles.evidence}>{foodCommunityCategorySummary(selectedFoodCommunityCategoryDisplay)}</Text>
            ) : null}
            <FoodCommunityItemList
              items={visibleFoodCommunityItems}
              onSelectItem={pressFoodCommunityItem}
              selectedItem={selectedFoodCommunityItem}
            />
            {foodCommunityDetailPanelVisible(selectedFoodCommunityItem) ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{foodCommunityDetailTitleDisplayText(selectedFoodCommunityItem)}</Text>
                <View style={styles.reportBoundaryGrid}>
                  <View style={styles.reportBoundaryCard}>
                    <Text style={styles.confidence}>{foodCommunityDetailShareCountLabel()}</Text>
                    <Text style={styles.recordType}>{foodCommunityDetailShareCountDisplayText(selectedFoodCommunityItem)}</Text>
                  </View>
                  <View style={styles.reportBoundaryCard}>
                    <Text style={styles.confidence}>{foodCommunityDetailAverageRiseLabel()}</Text>
                    <Text style={styles.recordType}>{foodCommunityDetailAverageRiseDisplayText(selectedFoodCommunityItem)}</Text>
                  </View>
                  <View style={styles.reportBoundaryCard}>
                    <Text style={styles.confidence}>{foodCommunityDetailMaximumRiseLabel()}</Text>
                    <Text style={styles.recordType}>{foodCommunityDetailMaximumRiseDisplayText(selectedFoodCommunityItem)}</Text>
                  </View>
                  <View style={styles.reportBoundaryCard}>
                    <Text style={styles.confidence}>{foodCommunityDetailMinimumRiseLabel()}</Text>
                    <Text style={styles.recordType}>{foodCommunityDetailMinimumRiseDisplayText(selectedFoodCommunityItem)}</Text>
                  </View>
                </View>
                <Text style={styles.label}>{foodCommunityDetailIndividualShareSectionLabel()}</Text>
                <FoodCommunityDetailShareList shares={foodCommunityDetailIndividualShares(selectedFoodCommunityItem)} />
              </View>
            ) : null}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{foodCommunityShareSectionLabel()}</Text>
              <FoodCommunityShareTextFields
                foodNameAccessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareFoodNameAccessibility}
                foodNameValue={foodCommunityShareFields.foodName}
                foodNameMaxLength={maxDisplayTextLength}
                dateTimeFields={
                  <FoodCommunityShareDateTimeFields
                    dateAccessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareEatenDateAccessibility}
                    dateLabel={foodCommunityShareEatenDateLabel()}
                    dateMaxLength={maxDateInputLength}
                    dateValue={foodCommunityShareFields.eatenDate}
                    timeAccessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareEatenTimeAccessibility}
                    timeLabel={foodCommunityShareEatenTimeLabel()}
                    timeMaxLength={maxTimeInputLength}
                    timeValue={foodCommunityShareFields.eatenTime}
                    onDateChange={updateFoodCommunityEatenDate}
                    onTimeChange={updateFoodCommunityEatenTime}
                  />
                }
                beforeGlucoseAccessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareBeforeGlucoseAccessibility}
                beforeGlucoseValue={foodCommunityShareFields.beforeGlucose}
                afterGlucoseAccessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareAfterGlucoseAccessibility}
                afterGlucoseValue={foodCommunityShareFields.afterGlucose}
                noteAccessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareNoteAccessibility}
                noteValue={foodCommunityShareFields.note}
                noteMaxLength={maxDisplayDetailTextLength}
                onFoodNameChange={updateFoodCommunityFoodName}
                onBeforeGlucoseChange={updateFoodCommunityBeforeGlucose}
                onAfterGlucoseChange={updateFoodCommunityAfterGlucose}
                onNoteChange={updateFoodCommunityNote}
              />
              <HighlightDetailList rows={foodCommunityShareFieldRows} />
            </View>
            <FutureBoundaryGrid rows={foodCommunityPointRows} />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{foodCommunityRankingSectionLabel()}</Text>
              <HighlightDetailList rows={foodCommunityRankingRows} />
              <Text style={styles.evidence}>{foodCommunityPointsStoreBridgeCopy()}</Text>
            </View>
            <View style={styles.heroCardFeature}>
              <View style={styles.heroIconBubble}>
                <Text style={styles.heroIconText}>{communityHeroIconLabel()}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.evidence}>{communityPublicNamePreviewLabel()}</Text>
                <Text style={styles.heroNumber}>{accountPublicDisplayNameDisplayText}</Text>
                <Text style={styles.evidence}>{communityPublicNameBoundaryDisplayText}</Text>
                <CommunityPublicDisplayNameField
                  accessibilityLabel={auxiliaryDisplayLabels.communityPublicDisplayNameAccessibility}
                  value={communityPublicDisplayNameDraft}
                  onChangeText={updateCommunityPublicDisplayNameDraft}
                  maxLength={maxDisplayTextLength}
                />
                <Pressable
                  accessibilityLabel={communityPublicProfileSaveAccessibilityDisplayLabel}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isBusy || !protectedAccountBackendReady }}
                  style={[styles.secondaryButton, isBusy || !protectedAccountBackendReady ? styles.buttonDisabled : null]}
                  disabled={isBusy || !protectedAccountBackendReady}
                  onPress={saveCommunityPublicProfile}
                >
                  <Text style={styles.secondaryButtonText}>{communityPublicProfileSaveButtonDisplayLabel}</Text>
                </Pressable>
              </View>
            </View>
            <FutureBoundaryGrid rows={communityBoundaryRows} />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{communityReadinessSectionDisplayLabel}</Text>
              <FutureReadinessChecklist items={communityReadinessChecklistItems} />
            </View>
            <CommunityActionRow
              isShareDisabled={isBusy || !protectedAccountBackendReady}
              onPostPress={showCommunityPostingStatus}
              onPrivacyPress={showCommunityPrivacyStatus}
              onSharePress={showFoodCommunityShareStatus}
              postAccessibilityLabel={communityPostAccessibilityDisplayLabel}
              postLabel={communityPostButtonDisplayLabel}
              privacyAccessibilityLabel={communityPrivacyAccessibilityDisplayLabel}
              privacyLabel={rankingOptInButtonDisplayLabel}
              shareAccessibilityLabel={foodCommunityShareAccessibilityDisplayLabel}
              shareLabel={foodCommunityShareButtonDisplayLabel}
            />
            {communityActionStatusVisible(communityActionStatus) ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{communityActionStatusDisplayLabel}</Text>
                <Text style={styles.evidence}>{communityActionStatusDisplayCopy}</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={communityReturnFutureModulesAccessibilityDisplayLabel}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={communityReturnFutureModulesPressTarget}
            >
              <Text style={styles.secondaryButtonText}>{communityReturnFutureModulesButtonDisplayLabel}</Text>
            </Pressable>
          </View>
        ) : null}

        {currentScreen === "ranking" ? (
          <View style={styles.pageSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{rankingScreenTitleLabel()}</Text>
                <Text style={styles.evidence}>{rankingScreenSubtitleCopy()}</Text>
              </View>
              <Pressable accessibilityLabel={rankingCloseAccessibilityDisplayLabel} accessibilityRole="button" style={styles.closeButton} onPress={rankingClosePressTarget}>
                <Text style={styles.closeButtonText}>{rankingCloseButtonDisplayLabel}</Text>
              </Pressable>
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{futurePreviewBoundaryBadgeLabel(rankingPreviewBoundaryDisplay)}</Text>
              <Text style={styles.evidence}>{futurePreviewBoundaryCopyText(rankingPreviewBoundaryDisplay)}</Text>
            </View>
            <View style={styles.heroCardFeature}>
              <View style={styles.heroIconBubble}>
                <Text style={styles.heroIconText}>{rankingHeroIconLabel()}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.evidence}>{rankingLocalStreakPreviewLabel()}</Text>
                <Text style={styles.heroNumber}>{rankingStreakDisplayText(rankingStreakDisplayDays)}</Text>
                <Text style={styles.evidence}>{rankingLocalPreviewBoundaryDisplayText}</Text>
              </View>
            </View>
            <FutureBoundaryGrid rows={rankingBoundaryRows} />
            <RankingLeaderboardList sections={rankingLeaderboardSections} />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{futurePreviewReadinessSectionLabel(futurePreviewDisplayLabels)}</Text>
              <FutureReadinessChecklist items={rankingReadinessChecklistItems} />
            </View>
            <RankingActionRow
              onOptInPress={rankingOptInActionPressTarget}
              onPublicPress={rankingPublicActionPressTarget}
              optInAccessibilityLabel={rankingOptInAccessibilityDisplayLabel}
              optInLabel={rankingOptInButtonDisplayLabel}
              publicAccessibilityLabel={rankingPublicActionAccessibilityDisplayLabel}
              publicLabel={rankingPublicActionButtonDisplayLabel}
            />
            {rankingActionStatusVisible(rankingActionStatus) ? (
              <View style={styles.inlineInfoBlock}>
                <Text style={styles.label}>{rankingActionStatusLabel(futurePreviewDisplayLabels)}</Text>
                <Text style={styles.evidence}>{rankingActionStatusText(rankingActionStatusDisplayText)}</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={rankingReturnFutureModulesAccessibilityDisplayLabel}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={rankingReturnFutureModulesPressTarget}
            >
              <Text style={styles.secondaryButtonText}>{rankingReturnFutureModulesButtonDisplayLabel}</Text>
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
            <SettingsRowList
              onRowPress={pressSettingsRow}
              quotaHelperText={settingsQuotaHelperDisplayText}
              rows={settingsDisplayRows}
            />
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
                  <BackendUrlField
                    accessibilityLabel={auxiliaryDisplayLabels.backendUrlInputAccessibility}
                    value={apiBaseUrl}
                    onChangeText={updateApiBaseUrlDraft}
                    maxLength={maxBackendUrlLength}
                    disabled={isAnyRequestInFlight}
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
                  <SettingsProfileChoiceSelector
                    activeProfileId={activeProfileId}
                    disabled={isAnyRequestInFlight}
                    items={profileChoiceDisplayItems}
                    onProfilePress={pressSettingsProfileChoice}
                  />
                </View>
                <Text style={styles.evidence}>
                  處理中會暫停切換照護對象與模型，避免 parser、同步或儲存使用到不一致設定。
                </Text>
                <Text style={styles.label}>{auxiliaryDisplayLabels.llmModel}</Text>
                <SettingsModelChoiceSelector
                  disabled={isAnyRequestInFlight}
                  items={llmModelChoiceDisplayItems}
                  onModelPress={pressSettingsLlmModelChoice}
                  selectedModelId={llmModelId}
                />
                <Text style={styles.evidence}>{modelSelectionBoundaryDisplayText}</Text>
                <Text style={styles.label}>{auxiliaryDisplayLabels.sttModel}</Text>
                <SettingsModelChoiceSelector
                  disabled={isAnyRequestInFlight}
                  items={sttModelChoiceDisplayItems}
                  onModelPress={pressSettingsSttModelChoice}
                  selectedModelId={sttModelId}
                />
              </>
            ) : null}
            <View style={styles.rejectedBox}>
              <Text style={styles.label}>本機 Whisper 模型</Text>
              <Text style={styles.evidence}>
                選擇已下載的本機 Whisper 模型，供首頁與記錄頁錄音轉文字使用；不呼叫雲端、不上傳音檔。
              </Text>
              {downloadedWhisperModelChoiceItems.length > 0 ? (
                <RecordingWhisperModelSelector
                  items={downloadedWhisperModelChoiceItems}
                  onModelPress={pressRecordingWhisperModelChoice}
                  selectedPath={whisperModelPath}
                />
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
                <NativeDebugTextField
                  accessibilityLabel={auxiliaryDisplayLabels.modelUrlInputAccessibility}
                  value={modelUrl}
                  onChangeText={updateNativeModelUrlInput}
                  maxLength={maxNativeDebugInputLength}
                  disabled={isBusy}
                  placeholder="https://.../model.gguf"
                />
                  <NativeDownloadKindSelector
                    disabled={isBusy}
                    llamaAccessibilityLabel={nativeLlamaDownloadKindAccessibilityDisplayLabel}
                    onLlamaPress={selectLlamaNativeDownloadKind}
                    onWhisperPress={selectWhisperNativeDownloadKind}
                    selectedKind={downloadKind}
                    whisperAccessibilityLabel={nativeWhisperDownloadKindAccessibilityDisplayLabel}
                  />
                  <NativeDebugActionButton
                    accessibilityLabel={nativeModuleCheckAccessibilityDisplayLabel}
                    disabled={isBusy}
                    label={nativeModuleCheckDisplayLabel}
                    onPress={checkNativeModulesFromSettings}
                  />
                  <NativeDebugActionButton
                    accessibilityLabel={nativeModelDownloadAccessibilityDisplayLabel}
                    disabled={isBusy}
                    label={nativeModelDownloadDisplayLabel}
                    onPress={downloadNativeModelFromSettings}
                  />
                  <DownloadedModelList models={downloadedModels} />
                <NativeDebugTextField
                  accessibilityLabel={auxiliaryDisplayLabels.whisperModelPathInputAccessibility}
                  value={whisperModelPath}
                  onChangeText={updateWhisperModelPathInput}
                  maxLength={maxNativeDebugInputLength}
                  disabled={isBusy}
                  placeholder="Whisper model path"
                />
                <NativeDebugTextField
                  accessibilityLabel={auxiliaryDisplayLabels.audioPathInputAccessibility}
                  value={audioPath}
                  onChangeText={updateNativeAudioPathInput}
                  maxLength={maxNativeDebugInputLength}
                  disabled={isBusy}
                  placeholder="Audio file path"
                />
                <NativeDebugTextField
                  accessibilityLabel={auxiliaryDisplayLabels.llamaModelPathInputAccessibility}
                  value={llamaModelPath}
                  onChangeText={updateLlamaModelPathInput}
                  maxLength={maxNativeDebugInputLength}
                  disabled={isBusy}
                  placeholder="Llama GGUF model path"
                />
                <NativeDebugRunActions
                  benchmarkAccessibilityLabel={nativeBenchmarkAccessibilityDisplayLabel}
                  benchmarkLabel={auxiliaryDisplayLabels.benchmark}
                  disabled={isBusy}
                  llamaAccessibilityLabel={nativeLlamaRunAccessibilityDisplayLabel}
                  llamaLabel={auxiliaryDisplayLabels.llama}
                  onBenchmarkPress={runNativeBenchmarksFromSettings}
                  onLlamaPress={runNativeLlamaFromSettings}
                  onWhisperPress={runNativeWhisperFromSettings}
                  whisperAccessibilityLabel={nativeWhisperRunAccessibilityDisplayLabel}
                  whisperLabel={auxiliaryDisplayLabels.whisper}
                />
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
              <SettingsSubpageCloseButton
                accessibilityLabel={auxiliaryDisplayLabels.closeReturn}
                onPress={returnFromSettingsSubpage}
              />
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
            <SettingsBoundaryGrid rows={accountSecurityBoundaryRows} />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.authProviderPreview}</Text>
              <Text style={styles.evidence}>{accountSecurityProviderBoundaryDisplayText}</Text>
            </View>
            <AuthProviderPreviewList
              disabled={isAuthOperationInFlight}
              items={authProviderDisplayItems}
              onProviderPress={pressAuthProviderPreview}
            />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.sessionPreview}</Text>
              <Text style={styles.evidence}>{accountSecuritySessionBoundaryDisplayText}</Text>
            </View>
            <AccountSecurityActionGrid
              disabled={isAuthOperationInFlight}
              loadSessionsAccessibilityLabel={settingsSubscriptionDisplayLabels.loadSessionsAccessibility}
              loadSessionsLabel={settingsSubscriptionDisplayLabels.loadSessions}
              logoutAllAccessibilityLabel={settingsSubscriptionDisplayLabels.logoutAllAccessibility}
              logoutAllLabel={settingsSubscriptionDisplayLabels.logoutAll}
              logoutLocalAccessibilityLabel={settingsSubscriptionDisplayLabels.logoutLocalAccessibility}
              logoutLocalLabel={settingsSubscriptionDisplayLabels.logoutLocal}
              onLoadSessionsPress={loadAuthSessionsFromSecurity}
              onLogoutAllPress={logoutAllAuthSessionsFromSecurity}
              onLogoutLocalPress={logoutAuthSessionFromSecurity}
              onRefreshSessionPress={refreshAuthSessionFromSecurity}
              refreshSessionAccessibilityLabel={settingsSubscriptionDisplayLabels.refreshSessionAccessibility}
              refreshSessionLabel={settingsSubscriptionDisplayLabels.refreshSession}
            />
            {authSessionDisplayItems.length > 0 ? (
              <AuthSessionDisplayList items={authSessionDisplayItems} />
            ) : null}
            <SessionManagementPreviewList
              items={sessionManagementDisplayItems}
              onSessionPress={pressAuthSessionManagementPreview}
            />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.authReadiness}</Text>
              <Text style={styles.evidence}>{accountSecurityReadinessBoundaryDisplayText}</Text>
              <Text style={styles.evidence}>{tokenStorageStatusDisplayText}</Text>
              <ProductionAuthReadinessList items={productionAuthReadinessDisplayRows} />
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.authBoundary}</Text>
              <SettingsChecklist items={authBoundaryChecklistItems} />
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.noAction}</Text>
              <Text style={styles.evidence}>{accountSecurityNoActionBoundaryDisplayText}</Text>
            </View>
            <SettingsSubpageActionRow
              actionAccessibilityLabel={settingsSubscriptionDisplayLabels.localClearAccessibility}
              actionLabel={settingsSubscriptionDisplayLabels.localClearButton}
              onActionPress={clearLocalSessionFromSettings}
              onReturnPress={returnFromSettingsSubpage}
              returnAccessibilityLabel={settingsSubscriptionDisplayLabels.returnSettingsAccessibility}
              returnLabel={settingsSubscriptionDisplayLabels.returnSettings}
            />
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
              <SettingsSubpageCloseButton
                accessibilityLabel={auxiliaryDisplayLabels.closeReturn}
                onPress={returnFromSettingsSubpage}
              />
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
            <SettingsBoundaryGrid rows={profileSettingsBoundaryRows} />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.profileEditReadiness}</Text>
              <SettingsChecklist items={profileReadinessChecklistItems} />
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.noAction}</Text>
              <Text style={styles.evidence}>{profileNoActionBoundaryDisplayText}</Text>
            </View>
            <SettingsSubpageActionRow
              actionAccessibilityLabel={settingsSubscriptionDisplayLabels.editIntegrationAccessibility}
              actionLabel={settingsSubscriptionDisplayLabels.editIntegrationButton}
              onActionPress={showProfileEditIntegrationStatus}
              onReturnPress={returnFromSettingsSubpage}
              returnAccessibilityLabel={settingsSubscriptionDisplayLabels.returnSettingsAccessibility}
              returnLabel={settingsSubscriptionDisplayLabels.returnSettings}
            />
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
              <SettingsSubpageCloseButton
                accessibilityLabel={auxiliaryDisplayLabels.closeReturn}
                onPress={returnFromSettingsSubpage}
              />
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
            <SettingsBoundaryGrid rows={recordingQuotaBoundaryRows} />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.formalReadiness}</Text>
              <SettingsChecklist items={quotaReadinessChecklistItems} />
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.dataCostBoundary}</Text>
              <Text style={styles.evidence}>{recordingQuotaDataBoundaryDisplayText}</Text>
            </View>
            <SettingsSubpageActionRow
              actionAccessibilityLabel={recordingQuotaSyncAccessibilityDisplayLabel}
              actionDisabled={isQuotaSyncing}
              actionLabel={recordingQuotaSyncButtonDisplayLabel}
              onActionPress={syncRecordingQuotaSettings}
              onReturnPress={returnFromSettingsSubpage}
              returnAccessibilityLabel={settingsSubscriptionDisplayLabels.returnSettingsAccessibility}
              returnLabel={settingsSubscriptionDisplayLabels.returnSettings}
            />
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
              <SettingsSubpageCloseButton
                accessibilityLabel={auxiliaryDisplayLabels.closeReturn}
                onPress={returnFromSettingsSubpage}
              />
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{reminderPreviewBoundaryDisplay.badge}</Text>
              <Text style={styles.evidence}>{reminderPreviewBoundaryDisplay.copy}</Text>
            </View>
            <View style={styles.aiReviewList}>
              <PreviewStatusList iconFallback="鈴" rows={reminderPreviewDisplayItems} />
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.formalReadiness}</Text>
              <SettingsChecklist items={reminderReadinessChecklistItems} />
            </View>
            <SettingsSubpageActionRow
              actionAccessibilityLabel={reminderIntegrationAccessibilityDisplayLabel}
              actionLabel={reminderIntegrationButtonDisplayLabel}
              onActionPress={showReminderIntegrationStatus}
              onReturnPress={returnFromSettingsSubpage}
              returnAccessibilityLabel={settingsSubscriptionDisplayLabels.returnSettingsAccessibility}
              returnLabel={settingsSubscriptionDisplayLabels.returnSettings}
            />
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
              <SettingsSubpageCloseButton
                accessibilityLabel={auxiliaryDisplayLabels.closeReturn}
                onPress={returnFromSettingsSubpage}
              />
            </View>
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.previewModeBadge}>{privacyPreviewBoundaryDisplay.badge}</Text>
              <Text style={styles.evidence}>{privacyPreviewBoundaryDisplay.copy}</Text>
            </View>
            <SettingsBoundaryGrid rows={privacyBoundaryRows} />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{settingsSubscriptionDisplayLabels.formalReadiness}</Text>
              <SettingsChecklist items={privacyReadinessChecklistItems} />
            </View>
            <View style={styles.aiReviewList}>
              <PreviewStatusList rows={privacyControlDisplayRows} />
            </View>
            <SettingsSubpageActionRow
              actionAccessibilityLabel={privacyIntegrationAccessibilityDisplayLabel}
              actionLabel={privacyIntegrationButtonDisplayLabel}
              onActionPress={showPrivacyIntegrationStatus}
              onReturnPress={returnFromSettingsSubpage}
              returnAccessibilityLabel={settingsSubscriptionDisplayLabels.returnSettingsAccessibility}
              returnLabel={settingsSubscriptionDisplayLabels.returnSettings}
            />
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
              <View key={tutorialStepKey(step)} style={styles.timelineCard}>
                <View style={styles.iconCircle}>
                  <Text>{tutorialStepIcon(step)}</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.recordType}>{tutorialStepTitle(step)}</Text>
                  <Text style={styles.evidence}>{tutorialStepDescription(step)}</Text>
                </View>
              </View>
            ))}
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{auxiliaryDisplayLabels.tutorialSafety}</Text>
              <SettingsChecklist items={tutorialSafetyChecklistItems} />
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
              <AchievementUnlockedCardList
                badgeLabel="新解鎖"
                items={achievementNewlyUnlockedDisplayItems}
                keyPrefix="new-unlock"
                title="本次新解鎖"
              />
            ) : null}
            {achievementUnlockedDisplayItems.length > 0 ? (
              <AchievementUnlockedCardList
                badgeLabel="已保存"
                items={achievementUnlockedDisplayItems}
                keyPrefix="unlock"
                title="已解鎖徽章"
              />
            ) : null}
            <AchievementCategorySectionList sections={achievementCategoryDisplaySections} />
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
            <MetricGrid rows={yearlyReviewMetricRows} />
            <MetricGrid rows={yearlyHealthOutcomeRows} />
            <View style={styles.highlightCard}>
              <Text style={styles.label}>{auxiliaryDisplayLabels.yearHighlights}</Text>
              <YearlyHighlightList items={yearlyHighlightDisplayTexts} />
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
            <FutureBoundaryGrid rows={storeRedemptionBoundaryRows} />
            <StoreSearchField
              accessibilityLabel={auxiliaryDisplayLabels.storeSearchInputAccessibility}
              value={storeSearchText}
              onChangeText={updateStoreSearchInput}
              maxLength={maxStoreSearchTextLength}
            />
            <SegmentSelector
              options={storeCategoryDisplayOptions}
              optionKey={storeCategoryOptionKey}
              optionAccessibilityLabel={storeCategoryOptionAccessibilityLabel}
              optionLabel={storeCategoryOptionLabel}
              isSelected={(category) => storeCategoryOptionSelected(category, storeCategory)}
              onOptionPress={pressStoreCategoryOption}
            />
            {visibleStoreProducts.length > 0 ? visibleStoreProducts.map((product) => (
              <View key={storeProductCardKey(product)} style={styles.productCard}>
                <View style={styles.productImage}>
                  <Text style={styles.productImageText}>{storeProductCardIcon(product)}</Text>
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.recordContent}>{storeProductCardTitle(product)}</Text>
                    {storeProductCardBadge(product) ? <Text style={styles.productBadge}>{storeProductCardBadge(product)}</Text> : null}
                  </View>
                  <Text style={styles.evidence}>{storeProductCardDescription(product)}</Text>
                  <Text style={styles.planPriceText}>{storeProductCardPointsCost(product)}</Text>
                </View>
                <Pressable
                  accessibilityLabel={storeProductActionAccessibilityLabel(product)}
                  accessibilityRole="button"
                  style={styles.roundActionButton}
                  onPress={() => pressStoreProductStatus(product)}
                >
                  <Text style={styles.secondaryButtonText}>{storeProductActionLabel(product)}</Text>
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
                  <View key={storeRedemptionCardKey(product)} style={styles.productCard}>
                    <View style={styles.productImage}>
                      <Text style={styles.productImageText}>券</Text>
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.recordContent}>{storeRedemptionCardTitle(product)}</Text>
                        <Text style={styles.productBadge}>{storeRedemptionCardStatusLabel(product)}</Text>
                      </View>
                      <Text style={styles.evidence}>{storeRedemptionCardSubtitle(product)}</Text>
                    </View>
                    <Pressable
                      accessibilityLabel={storeRedemptionActionAccessibilityLabel(product)}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: storeRedemptionActionDisabled(product) }}
                      style={[
                        styles.roundActionButton,
                        storeRedemptionActionDisabled(product) ? styles.buttonDisabled : null
                      ]}
                      disabled={storeRedemptionActionDisabled(product)}
                      onPress={() => pressStoreRedemptionStatus(product)}
                    >
                      <Text style={styles.secondaryButtonText}>{storeRedemptionActionLabel(product)}</Text>
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
              <CommerceReadinessChecklist items={storeCheckoutReadinessChecklistItems} />
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
              <CommerceReadinessChecklist items={foodPhotoEmptyResultChecklistItems} />
            </View>
            <FoodPhotoActionRow
              accessibilityLabel={foodPhotoIntegrationAccessibilityDisplayLabel}
              label={foodPhotoIntegrationButtonDisplayLabel}
              onPress={showFoodPhotoIntegrationStatus}
            />
            <View style={styles.inlineInfoBlock}>
              <Text style={styles.label}>{foodPhotoReadinessTitleDisplayText}</Text>
              <CommerceReadinessChecklist items={foodPhotoReadinessChecklistItems} />
            </View>
            <FoodPhotoActionRow
              accessibilityLabel={foodPhotoRetakeAccessibilityDisplayLabel}
              label={foodPhotoRetakeButtonDisplayLabel}
              onPress={showFoodPhotoRetakeStatus}
            />
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
      {isDailyRecordFixedSaveDockVisible ? (
        <View style={styles.fixedSaveBarDock}>
          <View style={styles.fixedSaveBar}>
            <Pressable
              accessibilityLabel={coreFlowDisplayLabels.returnConfirmAccessibility}
              accessibilityRole="button"
              accessibilityState={{ disabled: isDailyRecordFixedSaveReturnDisabled }}
              style={[
                styles.secondaryButton,
                isDailyRecordFixedSaveReturnDisabled ? styles.buttonDisabled : null
              ]}
              disabled={isDailyRecordFixedSaveReturnDisabled}
              onPress={requestDailyRecordLeaveGuard}
            >
              <Text style={styles.secondaryButtonText}>{coreFlowDisplayLabels.returnConfirm}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={coreFlowDisplayLabels.submitAiSaveAccessibility}
              accessibilityRole="button"
              accessibilityState={{
                disabled: isAiSaveConfirmSubmitDisabled
              }}
              style={[
                styles.primaryButton,
                isAiSaveConfirmSubmitDisabled ? styles.buttonDisabled : null
              ]}
              disabled={isAiSaveConfirmSubmitDisabled}
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
  openSection: {
    gap: 10
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
