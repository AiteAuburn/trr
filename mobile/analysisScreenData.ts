import type { AnalysisRange } from "./analysisCopy";

const maxDisplayTextLength = 160;
const maxDisplayDetailTextLength = 240;

export const analysisRanges: Array<{ id: AnalysisRange; label: string }> = [
  { id: "week", label: "本週" },
  { id: "month", label: "本月" },
  { id: "custom", label: "自訂日期區間" }
];

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

export function analysisRangeDisplayItem(value: { id: AnalysisRange; label: string }) {
  const label = boundDisplayText(value.label || "時間範圍", 60);
  return {
    value: value.id,
    label,
    accessibilityLabel: boundDisplayText(`切換分析範圍：${label}，同步 backend bounded report`, maxDisplayDetailTextLength)
  };
}

export function analysisRangeDisplayItems(values: ReadonlyArray<{ id: AnalysisRange; label: string }>) {
  return values.map(analysisRangeDisplayItem);
}

export function basicReportRequestKey(
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
