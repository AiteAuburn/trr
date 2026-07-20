import {
  membershipFeatureDisplayRows,
  subscriptionComparisonDisplayRows,
  subscriptionManagementReadinessChecklistDisplayItems,
  subscriptionReadinessChecklistDisplayItems
} from "./subscriptionCopy";
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
