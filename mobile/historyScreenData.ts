export type HistoryDetailMode = "structured" | "raw";

const maxDisplayTextLength = 160;
const maxDisplayDetailTextLength = 240;

export const historyDetailModes: Array<{ id: HistoryDetailMode; label: string; accessibilityCopy: string }> = [
  { id: "structured", label: "AI 整理", accessibilityCopy: "查看 AI 分析整理後的紀錄" },
  { id: "raw", label: "原始紀錄", accessibilityCopy: "查看原始語音轉文字內容" }
];

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

export function historyDetailModeDisplayItem(value: { id: HistoryDetailMode; label: string; accessibilityCopy: string }) {
  const label = boundDisplayText(value.label || "紀錄模式", 60);
  return {
    value: value.id,
    label,
    accessibilityLabel: boundDisplayText(value.accessibilityCopy || `查看${label}`, maxDisplayDetailTextLength)
  };
}
