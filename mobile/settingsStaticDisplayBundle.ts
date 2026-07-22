import { profileReadinessChecklistDisplayItems } from "./accountCopy";
import { authBoundaryChecklistDisplayItems } from "./authStatusCopy";
import { tutorialSafetyChecklistDisplayItems } from "./firstVersionFlowCopy";
import {
  privacyBoundaryDisplayRows,
  privacyReadinessChecklistDisplayItems,
  quotaReadinessChecklistDisplayItems,
  reminderPreviewDisplayItems,
  reminderReadinessChecklistDisplayItems
} from "./settingsCopy";
import {
  authProviderDisplayItems,
  privacyControlDisplayRows,
  productionAuthReadinessDisplayRows,
  sessionManagementDisplayItems,
  settingsDisplayRows,
  tutorialDisplaySteps
} from "./settingsScreenData";

export function settingsStaticDisplayBundle() {
  return {
    settingsRows: settingsDisplayRows(),
    tutorialSteps: tutorialDisplaySteps(),
    authProviderItems: authProviderDisplayItems(),
    sessionManagementItems: sessionManagementDisplayItems(),
    productionAuthReadinessRows: productionAuthReadinessDisplayRows(),
    privacyControlRows: privacyControlDisplayRows(),
    authBoundaryChecklistItems: authBoundaryChecklistDisplayItems(),
    profileReadinessChecklistItems: profileReadinessChecklistDisplayItems(),
    quotaReadinessChecklistItems: quotaReadinessChecklistDisplayItems(),
    reminderPreviewItems: reminderPreviewDisplayItems(),
    reminderReadinessChecklistItems: reminderReadinessChecklistDisplayItems(),
    privacyBoundaryRows: privacyBoundaryDisplayRows(),
    privacyReadinessChecklistItems: privacyReadinessChecklistDisplayItems(),
    tutorialSafetyChecklistItems: tutorialSafetyChecklistDisplayItems()
  };
}
