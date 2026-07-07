import type { AppScreen } from "./navigationConfig";

const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxUiMessageLength = 300;

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundUiMessage(value: string) {
  return value.slice(0, maxUiMessageLength);
}

type ActiveProfileDisplaySource = {
  display_name?: string | null;
  relationship?: string | null;
};

export function activeProfileLabelText(activeProfile: ActiveProfileDisplaySource | null, profileCount: number) {
  if (activeProfile) {
    return boundDisplayText(activeProfile.display_name ?? "");
  }
  return boundDisplayText(profileCount === 0 ? "尚未建立照護對象" : "尚未選擇照護對象");
}

export function activeProfileInlineText(activeProfileLabel: string) {
  return boundDisplayText(`目前對象：${activeProfileLabel}`, maxDisplayDetailTextLength);
}

export function activeProfileRelationshipText(activeProfile: ActiveProfileDisplaySource | null) {
  return boundDisplayText(activeProfile?.relationship ?? "未載入", 40);
}

export function advancedSettingsToggleLabel(isExpanded: boolean) {
  return boundDisplayText(isExpanded ? "收合進階設定" : "顯示進階設定", maxDisplayTextLength);
}

export function backendReconnectButtonLabel(isConnecting: boolean) {
  return boundDisplayText(isConnecting ? "連線中..." : "重新連線", maxDisplayTextLength);
}

export function settingsAccountSecurityOpenStatusMessage() {
  return boundUiMessage("已前往帳號與登入安全；本頁不呼叫 AI，也不寫入健康紀錄。");
}

export function settingsSubpageReturnStatusMessage() {
  return boundUiMessage("已返回設定；子頁預覽不會呼叫 AI、LLM 或寫入 backend。");
}

export function menuReturnStatusMessage(target: AppScreen) {
  const targetLabel = target === "today" ? "今日紀錄" : target === "record" ? "快速記錄" : "上一頁";
  return boundUiMessage(`已返回${targetLabel}；功能選單導覽不呼叫 AI、LLM、STT、Vision 或 backend write。`);
}

export function membershipStatusReturnSubscriptionStatusMessage() {
  return boundUiMessage("已返回會員方案；會員狀態頁只讀取目前同步資料，不會呼叫付款或 AI。");
}

export function modelRuntimeLabel(
  runtime?: "local" | "browser" | "server_stub" | "server_api" | "cloud_disabled"
) {
  if (runtime === "local") {
    return "本地模型";
  }
  if (runtime === "browser") {
    return "裝置/瀏覽器";
  }
  if (runtime === "server_stub") {
    return "後端測試模型";
  }
  if (runtime === "server_api") {
    return "後端 API";
  }
  if (runtime === "cloud_disabled") {
    return "雲端停用";
  }
  return "尚未載入";
}

export function modelSelectionBoundaryCopy() {
  return boundDisplayText("未啟用模型不可選；雲端 fallback 在 v1 預設停用。", maxDisplayDetailTextLength);
}

export function recordingQuotaDataBoundaryCopy() {
  return boundDisplayText(
    "此頁不呼叫 parser、不呼叫 AI、不上傳音檔、不保存逐字稿；只有使用者手動同步時才讀取 backend quota 狀態。",
    maxDisplayDetailTextLength
  );
}

export function recordingQuotaIntroCopy() {
  return boundDisplayText("顯示今日語音用量；平時不打擾，接近上限才提醒。", maxDisplayDetailTextLength);
}

export function recordingQuotaControlCopy() {
  return boundDisplayText(
    "額度由 backend entitlement / quota API 決定；mobile 不自行信任本機計數，也不把錄音檔或逐字稿寫入此頁。",
    maxDisplayDetailTextLength
  );
}

export function recordingQuotaSyncButtonLabel(isSyncing: boolean) {
  return boundDisplayText(isSyncing ? "同步中..." : "同步額度", maxDisplayTextLength);
}

export function recordingQuotaSyncAccessibilityLabel(isSyncing: boolean) {
  return boundDisplayText(
    isSyncing ? "正在同步語音額度，不上傳錄音或逐字稿" : "同步語音額度，只讀取 backend quota metadata",
    maxDisplayDetailTextLength
  );
}

export function reminderSettingsIntroCopy() {
  return boundDisplayText("先規劃提醒 UI；正式通知與背景排程尚未啟用。", maxDisplayDetailTextLength);
}

export function reminderIntegrationButtonLabel() {
  return boundDisplayText("查看通知整合狀態", maxDisplayTextLength);
}

export function reminderIntegrationAccessibilityLabel() {
  return boundDisplayText("查看通知整合狀態，不建立通知或背景排程", maxDisplayDetailTextLength);
}

export function privacySettingsIntroCopy() {
  return boundDisplayText("先定義分享、匯出、刪除與通知內容邊界。", maxDisplayDetailTextLength);
}

export function privacyIntegrationButtonLabel() {
  return boundDisplayText("查看隱私整合狀態", maxDisplayTextLength);
}

export function privacyIntegrationAccessibilityLabel() {
  return boundDisplayText("查看隱私整合狀態，不匯出、刪除或公開資料", maxDisplayDetailTextLength);
}
