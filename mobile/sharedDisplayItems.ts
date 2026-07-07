import type { AppScreen } from "./navigationConfig";

const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundUiMessage(value: string) {
  return value.slice(0, 300);
}

export function tutorialStepDisplayItem(value: readonly string[]) {
  return {
    icon: boundDisplayText(value[0] || "•", 4),
    title: boundDisplayText(value[1] || "教學步驟", maxDisplayTextLength),
    description: boundDisplayText(value[2] || "尚未設定教學說明。", maxDisplayDetailTextLength)
  };
}

export function previewTupleDisplayItem(value: readonly [string, string, string]) {
  const title = boundDisplayText(value[0] || "項目", maxDisplayTextLength);
  return {
    title,
    statusLabel: boundDisplayText(value[1] || "未設定", 40),
    copy: boundDisplayText(value[2] || "尚未設定說明。", maxDisplayDetailTextLength),
    icon: boundDisplayText(title[0] || "•", 4)
  };
}

export function sessionManagementPreviewDisplayItem(value: readonly [string, string, string]) {
  const item = previewTupleDisplayItem(value);
  return {
    ...item,
    accessibilityLabel: boundDisplayText(`查看${item.title}session 管理狀態，不顯示 raw token`, maxDisplayDetailTextLength),
    actionStatus: boundUiMessage(
      `${item.title} 尚未啟用；需完成 server-side session list、refresh token revoke、裝置識別與安全儲存清除後才可操作。`
    )
  };
}

export function boundaryMetricDisplayItem(value: readonly [string, string]) {
  return {
    label: boundDisplayText(value[0] || "狀態", 60),
    value: boundDisplayText(value[1] || "未設定", 80)
  };
}

export function metricDisplayItem(value: readonly [string, string]) {
  return {
    label: boundDisplayText(value[0] || "指標", 60),
    value: boundDisplayText(value[1] || "尚無", 80)
  };
}

export function detailPairDisplayItem(value: readonly [string, string]) {
  return {
    label: boundDisplayText(value[0] || "項目", 60),
    value: boundDisplayText(value[1] || "尚未設定", maxDisplayDetailTextLength)
  };
}

export function reminderPreviewDisplayItem(value: readonly [string, string, string, string]) {
  return {
    title: boundDisplayText(value[0] || "提醒", maxDisplayTextLength),
    time: boundDisplayText(value[1] || "尚未設定", 60),
    copy: boundDisplayText(value[2] || "尚未設定提醒說明。", maxDisplayDetailTextLength),
    statusLabel: boundDisplayText(value[3] || "未設定", 40)
  };
}

export function optionDisplayItem(value: string) {
  const label = boundDisplayText(value || "選項", 60);
  return {
    value: boundDisplayText(value || "unknown", 40),
    label,
    accessibilityLabel: boundDisplayText(`選擇${label}選項`, maxDisplayTextLength)
  };
}

export function valueLabelDisplayItem(value: readonly [string, string]) {
  const label = boundDisplayText(value[1] || "選項", 60);
  return {
    value: boundDisplayText(value[0] || "unknown", 40),
    label,
    accessibilityLabel: boundDisplayText(`選擇${label}選項`, maxDisplayTextLength)
  };
}

export function comparisonDisplayItem(value: readonly [string, string, string]) {
  return {
    feature: boundDisplayText(value[0] || "功能", 80),
    trial: boundDisplayText(value[1] || "未設定", 80),
    annual: boundDisplayText(value[2] || "未設定", 80)
  };
}

export function destinationCardDisplayItem(value: readonly string[]) {
  const label = boundDisplayText(value[1] || "前往頁面", maxDisplayTextLength);
  return {
    icon: boundDisplayText(value[0] || "•", 4),
    label,
    helper: boundDisplayText(value[2] || "查看相關頁面。", maxDisplayDetailTextLength),
    accessibilityLabel: boundDisplayText(`前往${label}`, maxDisplayTextLength),
    target: value[3] as AppScreen
  };
}

export function menuScreenDisplayItem(value: { id: AppScreen; label: string; icon: string }) {
  const label = boundDisplayText(value.label || "功能", 60);
  return {
    target: value.id,
    label,
    icon: boundDisplayText(value.icon || "•", 4),
    accessibilityLabel: boundDisplayText(`前往${label}`, maxDisplayTextLength)
  };
}

export function visualSmokeRouteJumpDisplayItem(value: { id: AppScreen; label: string }) {
  const label = boundDisplayText(value.label || "頁面", maxDisplayTextLength);
  return {
    target: value.id,
    label,
    accessibilityLabel: boundDisplayText(`Visual smoke 前往${label}`, maxDisplayTextLength)
  };
}

export function resultChecklistItem(value: string) {
  return boundDisplayText(value, maxDisplayDetailTextLength);
}
