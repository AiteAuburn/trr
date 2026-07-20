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
    privacyControlRows: privacyControlDisplayRows()
  };
}
