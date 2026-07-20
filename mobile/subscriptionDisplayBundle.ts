import {
  membershipFeatureDisplayRows,
  subscriptionActionStatusDisplayTexts,
  subscriptionComparisonDisplayRows,
  subscriptionMembershipDisplayTexts,
  subscriptionManagementReadinessChecklistDisplayItems,
  subscriptionReadinessChecklistDisplayItems
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
    subscriptionManagementPayment: actionStatus.managementPayment
  };
}
