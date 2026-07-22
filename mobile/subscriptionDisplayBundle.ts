import {
  membershipFeatureDisplayRows,
  subscriptionActionStatusDisplayTexts,
  subscriptionComparisonDisplayRows,
  subscriptionCtaBoundaryCopy,
  subscriptionMembershipDisplayTexts,
  subscriptionManagementIntroCopy,
  subscriptionManagementNoActionCopy,
  subscriptionManagementReadinessChecklistDisplayItems,
  subscriptionManagementSyncButtonLabel,
  subscriptionPaymentUnwiredCopy,
  recordingQuotaBoundaryDisplayRows,
  subscriptionReadinessChecklistDisplayItems,
  subscriptionSyncButtonLabel,
  subscriptionTrialBoundaryCopy
} from "./subscriptionCopy";
import type { VoiceQuotaTransformSource } from "./subscriptionTransforms";
import { quotaDisplayTexts } from "./settingsCopy";
import { subscriptionManagementDisplayRows } from "./settingsScreenData";

export function subscriptionStaticDisplayBundle() {
  return {
    comparisonRows: subscriptionComparisonDisplayRows(),
    readinessChecklistItems: subscriptionReadinessChecklistDisplayItems(),
    managementRows: subscriptionManagementDisplayRows(),
    managementReadinessChecklistItems: subscriptionManagementReadinessChecklistDisplayItems(),
    membershipFeatureRows: membershipFeatureDisplayRows()
  };
}

export function subscriptionRuntimeDisplayBundle(value: {
  voiceQuota: VoiceQuotaTransformSource | null;
  quotaTrialDaysLeft: number | null;
  quotaStatusDisplayText: string;
  subscriptionActionStatus: string;
  subscriptionManagementActionStatus: string;
  backendUnavailableMessage: string;
  quotaRemainingLow: boolean;
}) {
  const membership = subscriptionMembershipDisplayTexts(
    value.voiceQuota,
    value.quotaTrialDaysLeft,
    value.quotaStatusDisplayText
  );
  const quota = quotaDisplayTexts(value.voiceQuota);
  const actionStatus = subscriptionActionStatusDisplayTexts({
    subscriptionActionStatus: value.subscriptionActionStatus,
    subscriptionManagementActionStatus: value.subscriptionManagementActionStatus,
    backendUnavailableMessage: value.backendUnavailableMessage
  });

  return {
    subscriptionPlan: membership.subscriptionPlan,
    subscriptionManagementPlan: membership.managementPlan,
    subscriptionStatus: membership.subscriptionStatus,
    subscriptionManagementStatus: membership.managementStatus,
    membershipTrialHeroLabel: membership.trialHeroLabel,
    membershipTrialDays: membership.trialDays,
    membershipPlanStatus: membership.planStatus,
    quotaUsed: quota.used,
    quotaRemaining: quota.remaining,
    quotaDailyLimit: quota.dailyLimit,
    subscriptionQuotaDailyLimit: quota.subscriptionDailyLimit,
    settingsQuotaHelper: quota.settingsHelper,
    subscriptionActionStatus: actionStatus.subscriptionAction,
    subscriptionManagementActionStatus: actionStatus.subscriptionManagementAction,
    subscriptionTrialIntegration: actionStatus.trialIntegration,
    subscriptionRenewalIntegration: actionStatus.renewalIntegration,
    subscriptionManagementSyncing: actionStatus.managementSyncing,
    subscriptionManagementUnavailable: actionStatus.managementUnavailable,
    subscriptionManagementPayment: actionStatus.managementPayment,
    recordingQuotaBoundaryRows: recordingQuotaBoundaryDisplayRows(value.voiceQuota, value.quotaRemainingLow)
  };
}

export function subscriptionActionControlDisplayBundle(isQuotaSyncing: boolean) {
  return {
    trialBoundary: subscriptionTrialBoundaryCopy(),
    paymentUnwired: subscriptionPaymentUnwiredCopy(),
    ctaBoundary: subscriptionCtaBoundaryCopy(),
    syncButton: subscriptionSyncButtonLabel(isQuotaSyncing),
    managementIntro: subscriptionManagementIntroCopy(),
    managementNoAction: subscriptionManagementNoActionCopy(),
    managementSyncButton: subscriptionManagementSyncButtonLabel(isQuotaSyncing)
  };
}
