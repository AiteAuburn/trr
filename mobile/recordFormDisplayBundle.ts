import { analysisRangeDisplayItems, analysisRanges } from "./analysisScreenData";
import { historyDetailModeDisplayItems, historyDetailModes } from "./historyScreenData";
import {
  glucoseTimingOptions,
  glucoseUnitOptions,
  manualRecordTypes,
  mealTypeOptions
} from "./recordEditTransforms";
import {
  manualRecordTypeDisplayItems,
  optionDisplayItems,
  valueLabelDisplayItems
} from "./sharedDisplayItems";

export function recordFormStaticDisplayBundle() {
  return {
    glucoseUnitOptions: optionDisplayItems(glucoseUnitOptions),
    glucoseTimingOptions: valueLabelDisplayItems(glucoseTimingOptions),
    mealTypeOptions: valueLabelDisplayItems(mealTypeOptions),
    manualRecordTypeOptions: manualRecordTypeDisplayItems(manualRecordTypes),
    historyDetailModeOptions: historyDetailModeDisplayItems(historyDetailModes),
    analysisRangeOptions: analysisRangeDisplayItems(analysisRanges)
  };
}
