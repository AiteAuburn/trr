import type { AppScreen } from "./navigationConfig";

const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxUiMessageLength = 300;
const voiceQuotaLowWarningThresholdSeconds = 120;

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

type VoiceQuotaDisplaySource = {
  remaining_seconds_today: number;
};

type VoiceQuotaUsageDisplaySource = VoiceQuotaDisplaySource & {
  used_seconds_today: number;
  daily_limit_seconds: number;
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

export function formatVoiceMinutes(seconds: number) {
  const safeSeconds = Math.max(0, Math.min(3600, seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes} 分鐘`;
  }
  return `${minutes} 分 ${remainingSeconds} 秒`;
}

export function isVoiceQuotaLow(
  quota: VoiceQuotaDisplaySource | null,
  thresholdSeconds = voiceQuotaLowWarningThresholdSeconds
) {
  return Boolean(quota && quota.remaining_seconds_today <= thresholdSeconds);
}

export function captureVoiceQuotaCopy(quota: VoiceQuotaDisplaySource | null) {
  if (!quota) {
    return "語音額度載入後，只有接近上限時才會提醒。";
  }
  if (isVoiceQuotaLow(quota)) {
    return `今日錄音剩餘 ${formatVoiceMinutes(quota.remaining_seconds_today)}，請分段記錄或改用文字輸入。`;
  }
  return "今日錄音額度正常；接近上限 2 分鐘內才會顯示剩餘時間。";
}

export function quotaUsedDisplayValue(quota: VoiceQuotaUsageDisplaySource | null) {
  return boundDisplayText(quota ? `已用 ${formatVoiceMinutes(quota.used_seconds_today)}` : "已用 尚未載入", 80);
}

export function quotaRemainingDisplayValue(quota: VoiceQuotaUsageDisplaySource | null) {
  return boundDisplayText(quota ? `剩餘 ${formatVoiceMinutes(quota.remaining_seconds_today)}` : "剩餘 尚未載入", 80);
}

export function settingsQuotaHelperText(quota: VoiceQuotaDisplaySource | null) {
  return boundDisplayText(
    quota ? `今日錄音剩餘 ${formatVoiceMinutes(quota.remaining_seconds_today)}` : "錄音額度尚未載入",
    maxDisplayDetailTextLength
  );
}

export function quotaDisplayTexts(quota: VoiceQuotaUsageDisplaySource | null) {
  return {
    used: quotaUsedDisplayValue(quota),
    remaining: quotaRemainingDisplayValue(quota),
    dailyLimit: boundDisplayText(
      quota
        ? `每日上限 ${formatVoiceMinutes(quota.daily_limit_seconds)}；剩餘 2 分鐘內才提醒使用者。`
        : "連線 backend 後會顯示試用或會員的每日上限。",
      maxDisplayDetailTextLength
    ),
    subscriptionDailyLimit: boundDisplayText(
      quota
        ? `每日上限 ${formatVoiceMinutes(quota.daily_limit_seconds)}；剩餘 2 分鐘內才需要提醒使用者。`
        : "每日上限會在額度同步後顯示。",
      maxDisplayDetailTextLength
    ),
    settingsHelper: settingsQuotaHelperText(quota)
  };
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

export function settingsSubpageStatusDisplayTexts(value: {
  profileActionStatus: string;
  recordingQuotaActionStatus: string;
  reminderActionStatus: string;
  privacyActionStatus: string;
  backendUnavailableMessage: string;
}) {
  return {
    profileAction: boundUiMessage(value.profileActionStatus),
    recordingQuotaAction: boundUiMessage(value.recordingQuotaActionStatus),
    reminderAction: boundUiMessage(value.reminderActionStatus),
    privacyAction: boundUiMessage(value.privacyActionStatus),
    profileEditIntegration: boundUiMessage(
      "個人資料編輯尚未啟用；需完成 production auth、profile update API、權限檢查與 rollback 流程。"
    ),
    recordingQuotaSyncing: boundUiMessage("正在同步 backend 語音額度。"),
    recordingQuotaUnavailable: boundUiMessage(
      `${value.backendUnavailableMessage || "backend account 尚未 ready"}；目前不讀取語音額度。`
    ),
    reminderIntegration: boundUiMessage(
      "提醒設定目前是 UI 預覽；需完成通知權限、背景排程、時區與後端 reminder schema 後才會啟用。"
    ),
    privacyIntegration: boundUiMessage(
      "隱私控制目前是 UI 預覽；正式啟用需要 permission service、export/delete workflow、share revoke 與 PHI-safe audit。"
    )
  };
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

export function selectedModelDisplayLabel(model: { label: string } | null | undefined, fallbackId: string) {
  return model?.label ?? fallbackId;
}

export function selectedModelRuntimeDisplayLabel(
  model: { runtime?: Parameters<typeof modelRuntimeLabel>[0] } | null | undefined
) {
  return modelRuntimeLabel(model?.runtime);
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

export function quotaReadinessChecklistDisplayItems() {
  return [
    "quota API 必須由 production auth 驗證 account / profile，不信任前端傳入的使用量。",
    "錄音開始時先檢查剩餘額度；parser 成功或失敗都要有一致的 usage rollback / commit 規則。",
    "試用版每日 5 分鐘、付費版每日 10 分鐘；價格與優惠資格由 entitlement 決定。",
    "接近剩餘 2 分鐘才提醒；避免首頁長期顯示倒數造成壓力。"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
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

export function recordingQuotaControlDisplayBundle(isSyncing: boolean) {
  return {
    intro: recordingQuotaIntroCopy(),
    control: recordingQuotaControlCopy(),
    syncButton: recordingQuotaSyncButtonLabel(isSyncing),
    syncAccessibility: recordingQuotaSyncAccessibilityLabel(isSyncing)
  };
}

export function reminderSettingsIntroCopy() {
  return boundDisplayText("先規劃提醒 UI；正式通知與背景排程尚未啟用。", maxDisplayDetailTextLength);
}

export function reminderPreviewDisplayItems() {
  return [
    ["晨間空腹血糖", "每天 07:30", "提醒記錄起床後或早餐前血糖。", "建議"],
    ["晚餐後兩小時", "每天 20:30", "協助建立飯後血糖紀錄習慣。", "可選"],
    ["回診前整理", "回診前 3 天", "提醒查看歷史紀錄與基本分析。", "未啟用"]
  ].map(([title, time, copy, statusLabel]) => ({
    title: boundDisplayText(title, maxDisplayTextLength),
    time: boundDisplayText(time, 60),
    copy: boundDisplayText(copy, maxDisplayDetailTextLength),
    statusLabel: boundDisplayText(statusLabel, 40)
  }));
}

export function reminderIntegrationButtonLabel() {
  return boundDisplayText("查看通知整合狀態", maxDisplayTextLength);
}

export function reminderIntegrationAccessibilityLabel() {
  return boundDisplayText("查看通知整合狀態，不建立通知或背景排程", maxDisplayDetailTextLength);
}

export function reminderReadinessChecklistDisplayItems() {
  return [
    "系統通知權限請求與拒絕後的替代說明。",
    "安靜時段、時區與語言設定。",
    "後端 reminder schema、idempotent 排程與取消流程。",
    "通知內容不得包含敏感健康數值或完整紀錄。"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
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

export function privacyBoundaryDisplayRows() {
  return [
    ["健康紀錄", "預設私密"],
    ["通知內容", "不含數值"],
    ["外部分享", "需明確授權"],
    ["AI 成本", "0 次呼叫"]
  ].map(([label, value]) => ({
    label: boundDisplayText(label, 60),
    value: boundDisplayText(value, 80)
  }));
}

export function privacyReadinessChecklistDisplayItems() {
  return [
    "通知內容最小化：推播不可包含血糖數值、完整餐點或用藥內容。",
    "資料分享 opt-in / opt-out：醫師、照護者、社群與排行榜都必須分開授權。",
    "資料匯出與刪除請求：需有狀態追蹤、身份驗證與 audit trail。",
    "撤銷與到期：任何 share token、grant、公開顯示都必須可撤回。"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}
