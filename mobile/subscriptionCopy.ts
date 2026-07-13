import { comparisonDisplayItem } from "./sharedDisplayItems";

const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxUiMessageLength = 300;
const maxMobileCountValue = 1_000_000;

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundUiMessage(value: string) {
  return value.slice(0, maxUiMessageLength);
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

type SubscriptionPlanDisplaySource = {
  plan_code?: string | null;
};

type SubscriptionStatusSummarySource = {
  status?: string | null;
};

type RecordingQuotaBoundarySource = SubscriptionPlanDisplaySource & SubscriptionStatusSummarySource;

export const subscriptionComparisonRows = [
  ["語音記錄", "每日 5 分鐘", "每日 10 分鐘"],
  ["AI 整理", "每日 5 次", "✓ 完整使用"],
  ["基本分析", "部分功能", "✓ 完整趨勢"],
  ["歷史紀錄", "最近 7 天", "✓ 完整保存"]
] as const;

export function subscriptionComparisonDisplayRows() {
  return subscriptionComparisonRows.map(comparisonDisplayItem);
}

export function planDisplayName(planCode?: string) {
  if (planCode === "trial") {
    return "試用版";
  }
  if (planCode === "annual" || planCode === "founder_annual") {
    return "年費會員";
  }
  return "會員方案";
}

export function subscriptionStatusLabel(status?: string) {
  if (status === "trialing") {
    return "試用中";
  }
  if (status === "active") {
    return "有效";
  }
  if (status === "cancelled" || status === "canceled") {
    return "已取消";
  }
  if (status === "expired") {
    return "已到期";
  }
  return "尚未載入";
}

export function quotaPlanDisplayText(quota: SubscriptionPlanDisplaySource | null, fallback = "額度尚未載入") {
  return boundDisplayText(quota ? planDisplayName(quota.plan_code ?? undefined) : fallback, 80);
}

export function membershipTrialDaysText(trialDays: number | null) {
  return boundDisplayText(
    trialDays === null ? "試用天數尚未載入" : `還剩 ${clampNumber(trialDays, 0, maxMobileCountValue)} 天`,
    80
  );
}

export function subscriptionStatusSummaryText(
  quota: SubscriptionStatusSummarySource | null,
  trialDays: number | null,
  fallback: string
) {
  if (!quota) {
    return boundDisplayText(fallback, maxDisplayDetailTextLength);
  }
  const trialCopy = trialDays === null ? "" : ` · 試用剩 ${clampNumber(trialDays, 0, maxMobileCountValue)} 天`;
  return boundDisplayText(`${subscriptionStatusLabel(quota.status ?? undefined)}${trialCopy}`, maxDisplayDetailTextLength);
}

export function subscriptionMembershipDisplayTexts(
  quota: (SubscriptionPlanDisplaySource & SubscriptionStatusSummarySource) | null,
  trialDays: number | null,
  quotaStatusDisplayText: string
) {
  return {
    subscriptionPlan: quotaPlanDisplayText(quota),
    subscriptionStatus: subscriptionStatusSummaryText(quota, trialDays, quotaStatusDisplayText),
    managementPlan: quotaPlanDisplayText(quota, "尚未同步"),
    managementStatus: subscriptionStatusSummaryText(quota, trialDays, "請先同步 backend quota / entitlement。"),
    trialHeroLabel: boundDisplayText(quota?.status === "trialing" ? "7 天免費試用即將結束" : "會員狀態", 80),
    trialDays: membershipTrialDaysText(trialDays),
    planStatus: boundDisplayText(
      quota ? `${planDisplayName(quota.plan_code ?? undefined)} · ${subscriptionStatusLabel(quota.status ?? undefined)}` : "請先同步會員與錄音額度。",
      maxDisplayDetailTextLength
    )
  };
}

export function membershipFeatureDisplayRows() {
  return [
    ["語音記錄", "輕鬆說，隨時記"],
    ["AI 整理", "自動歸納重點，儲存前仍需確認"],
    ["基本分析", "趨勢與摘要一目了然"],
    ["歷史回顧", "完整保存並支援查詢"]
  ].map(([label, value]) => ({
    label: boundDisplayText(label, 60),
    value: boundDisplayText(value, maxDisplayDetailTextLength)
  }));
}

export function recordingQuotaBoundaryDisplayRows(
  quota: RecordingQuotaBoundarySource | null,
  quotaRemainingLow: boolean
) {
  return [
    ["目前方案", quotaPlanDisplayText(quota, "尚未載入")],
    ["會員狀態", quota ? subscriptionStatusLabel(quota.status ?? undefined) : "尚未同步"],
    ["提醒規則", quotaRemainingLow ? "立即提醒" : "低干擾"],
    ["AI 成本", "0 次呼叫"]
  ].map(([label, value]) => ({
    label: boundDisplayText(label, 60),
    value: boundDisplayText(value, 80)
  }));
}

export function accountSecurityProviderBoundaryCopy() {
  return boundDisplayText(
    "原生 Apple / Google / Email provider SDK 尚未接入；provider callback 拿到 id_token 後，mobile 已有 /auth/oidc-login exchange 與 SecureStore 寫入邊界。",
    maxDisplayDetailTextLength
  );
}

export function accountSecuritySessionBoundaryCopy() {
  return boundDisplayText(
    "Session refresh、session list、logout 與 logout-all 已接 backend；所有 token persistence 只走 SecureStore，不顯示 raw token。",
    maxDisplayDetailTextLength
  );
}

export function accountSecurityReadinessBoundaryCopy() {
  return boundDisplayText(
    "後端 OIDC exchange、mobile SecureStore 與 session 維護已建立；下一步是接原生 provider SDK、nonce/state 與 callback UI。",
    maxDisplayDetailTextLength
  );
}

export function accountSecurityNoActionBoundaryCopy() {
  return boundDisplayText(
    "此頁不呼叫 AI、不輸出 PHI、不顯示 raw token；provider buttons 不會假造登入，只有真實 callback token 才會交換 session。",
    maxDisplayDetailTextLength
  );
}

export function accountSecurityBoundaryDisplayRows(
  hasAccount: boolean,
  hasActiveProfile: boolean,
  allowMobileDevAuth: boolean,
  protectedHeaderMode: string,
  tokenStorageMode: string,
  accessTokenTooLarge: boolean,
  authSessionCount: number,
  protectedBackendReady: boolean
) {
  return [
    ["帳號", hasAccount ? "已載入" : "未連線"],
    ["照護對象", hasActiveProfile ? "已選擇" : "未選擇"],
    ["dev auth", allowMobileDevAuth ? "允許" : "停用"],
    ["API header", protectedHeaderMode],
    ["Token storage", tokenStorageMode],
    ["Token guard", accessTokenTooLarge ? "過長拒用" : "通過"],
    ["Session list", authSessionCount > 0 ? `${authSessionCount} 筆` : "未載入"],
    ["保護 API", protectedBackendReady ? "可操作" : "需登入"]
  ].map(([label, value]) => ({
    label: boundDisplayText(label, 60),
    value: boundDisplayText(value, 80)
  }));
}

export function accountSecurityBoundaryDisplayRowsForState(value: {
  account: unknown | null;
  activeProfile: unknown | null;
  allowMobileDevAuth: boolean;
  protectedHeaderMode: string;
  tokenStorageMode: string;
  accessTokenTooLarge: boolean;
  authSessionCount: number;
  protectedBackendReady: boolean;
}) {
  return accountSecurityBoundaryDisplayRows(
    Boolean(value.account),
    Boolean(value.activeProfile),
    value.allowMobileDevAuth,
    value.protectedHeaderMode,
    value.tokenStorageMode,
    value.accessTokenTooLarge,
    value.authSessionCount,
    value.protectedBackendReady
  );
}

export function profileNoActionBoundaryCopy() {
  return boundDisplayText(
    "此頁不寫入個人資料、不建立本機草稿、不呼叫 profile update API、不呼叫 AI，也不保存測試姓名或聯絡方式。",
    maxDisplayDetailTextLength
  );
}

export function subscriptionTrialBoundaryCopy() {
  return boundDisplayText("7天免費試用，正式付款串接前不會啟動試用或自動轉年費。", maxDisplayDetailTextLength);
}

export function subscriptionPaymentUnwiredCopy() {
  return boundDisplayText(
    "目前只顯示會員與額度 UI；不會啟動試用、不會收款，也不會改變 entitlements。",
    maxDisplayDetailTextLength
  );
}

export function subscriptionCtaBoundaryCopy() {
  return boundDisplayText(
    "目前 CTA 只顯示整合狀態，不會建立訂閱、不會收款，也不會改變會員權益。",
    maxDisplayDetailTextLength
  );
}

export function subscriptionReadinessChecklistDisplayItems() {
  return [
    "App Store / Play Store 或正式付款後台",
    "receipt validation 與訂閱狀態 webhook",
    "trial start/end、取消、續訂與優惠價保留規則",
    "entitlement 與 voice quota 的 server-side enforcement"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function subscriptionManagementReadinessChecklistDisplayItems() {
  return [
    "商店付款或正式會員後台深連結，讓使用者可以管理續訂與取消。",
    "receipt validation、訂閱 webhook、idempotent entitlement update。",
    "trial start/end、grace period、退款與取消狀態需回寫 backend。",
    "voice quota、AI 額度與歷史存取權限必須只依 server-side entitlement 判斷。"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function subscriptionSyncButtonLabel(isSyncing: boolean) {
  return boundDisplayText(isSyncing ? "同步中..." : "同步", maxDisplayTextLength);
}

export function subscriptionManagementIntroCopy() {
  return boundDisplayText("查看付款、receipt 驗證與會員權益同步的正式整合邊界。", maxDisplayDetailTextLength);
}

export function subscriptionManagementNoActionCopy() {
  return boundDisplayText(
    "此頁不開啟付款、不建立試用、不改變會員權益、不寫入 entitlement，也不呼叫 AI 或 LLM。",
    maxDisplayDetailTextLength
  );
}

export function subscriptionManagementSyncButtonLabel(isSyncing: boolean) {
  return boundDisplayText(isSyncing ? "同步中..." : "同步狀態", maxDisplayTextLength);
}

export function subscriptionManagementOpenStatusMessage() {
  return boundUiMessage("已前往訂閱管理；目前只顯示付款與 entitlement 同步邊界，不會建立訂閱。");
}

export function subscriptionMembershipStatusOpenStatusMessage() {
  return boundUiMessage("已前往會員狀態；只顯示目前已同步狀態，不會收款或改變 entitlement。");
}

export function subscriptionManagementReturnSettingsStatusMessage() {
  return boundUiMessage("已返回設定；訂閱管理頁不會建立試用、收款或改變會員權益。");
}

export function subscriptionActionStatusDisplayTexts(value: {
  subscriptionActionStatus: string;
  subscriptionManagementActionStatus: string;
  backendUnavailableMessage: string;
}) {
  return {
    subscriptionAction: boundUiMessage(value.subscriptionActionStatus),
    subscriptionManagementAction: boundUiMessage(value.subscriptionManagementActionStatus),
    trialIntegration: boundUiMessage(
      "試用啟動需要正式付款/商店串接；目前不會建立訂閱，也不會變更會員狀態。"
    ),
    renewalIntegration: boundUiMessage(
      "續訂啟用需要正式付款/商店串接與 receipt validation；目前不會建立訂閱。"
    ),
    managementSyncing: boundUiMessage("正在同步 backend entitlement 與語音額度。"),
    managementUnavailable: boundUiMessage(
      `${value.backendUnavailableMessage || "backend account 尚未 ready"}；目前不讀取訂閱或 entitlement。`
    ),
    managementPayment: boundUiMessage(
      "訂閱管理目前是 UI 預覽；正式啟用需要付款深連結、receipt validation、webhook 與 entitlement policy。"
    )
  };
}

export function settingsSubscriptionSectionLabels() {
  const syncQuota = boundDisplayText("同步", maxDisplayTextLength);
  const trialIntegrationButton = boundDisplayText("查看試用整合狀態", maxDisplayTextLength);
  const manageSubscribedPlan = boundDisplayText("已訂閱？管理方案", maxDisplayTextLength);
  const memberStatusButton = boundDisplayText("查看會員狀態", maxDisplayTextLength);
  const returnSettings = boundDisplayText("返回設定", maxDisplayTextLength);
  const paymentIntegrationButton = boundDisplayText("查看付款整合狀態", maxDisplayTextLength);
  const renewalIntegrationButton = boundDisplayText("查看續訂整合狀態", maxDisplayTextLength);
  const managePlan = boundDisplayText("管理方案", maxDisplayTextLength);
  return {
    trialPaymentBoundary: boundDisplayText("試用付款邊界", maxDisplayTextLength),
    paymentUnwired: boundDisplayText("付款未串接", maxDisplayTextLength),
    currentStatus: boundDisplayText("目前狀態", maxDisplayTextLength),
    todayRecordingQuota: boundDisplayText("今日錄音額度", maxDisplayTextLength),
    trialPlan: boundDisplayText("試用版", maxDisplayTextLength),
    annualPlan: boundDisplayText("年費會員", maxDisplayTextLength),
    featureComparison: boundDisplayText("功能比較", maxDisplayTextLength),
    formalReadiness: boundDisplayText("正式啟用前需要完成", maxDisplayTextLength),
    syncQuotaAccessibility: boundDisplayText(`${syncQuota}會員額度狀態，不建立訂閱或收款`, maxDisplayDetailTextLength),
    trialIntegrationButton,
    trialIntegrationAccessibility: boundDisplayText(`${trialIntegrationButton}，只顯示付款與 entitlement 邊界`, maxDisplayDetailTextLength),
    trialIntegrationStatus: boundDisplayText("試用整合狀態", maxDisplayTextLength),
    manageSubscribedPlan,
    manageSubscribedPlanAccessibility: boundDisplayText(`${manageSubscribedPlan}，前往訂閱管理預覽`, maxDisplayDetailTextLength),
    memberStatusButton,
    memberStatusAccessibility: boundDisplayText(`${memberStatusButton}，查看目前同步會員資料`, maxDisplayDetailTextLength),
    currentMemberStatus: boundDisplayText("目前會員狀態", maxDisplayTextLength),
    noAction: boundDisplayText("目前不做的事", maxDisplayTextLength),
    returnSettings,
    returnSettingsAccessibility: boundDisplayText(`${returnSettings}，不改變會員權益`, maxDisplayDetailTextLength),
    paymentIntegrationButton,
    paymentIntegrationAccessibility: boundDisplayText(`${paymentIntegrationButton}，只顯示付款串接狀態`, maxDisplayDetailTextLength),
    paymentIntegrationStatus: boundDisplayText("付款整合狀態", maxDisplayTextLength),
    memberFeatures: boundDisplayText("會員專屬功能", maxDisplayTextLength),
    founderAnnualPrice: boundDisplayText("創始會員年費", maxDisplayTextLength),
    renewalUnwired: boundDisplayText("續訂未串接", maxDisplayTextLength),
    renewalIntegrationButton,
    renewalIntegrationAccessibility: boundDisplayText(`${renewalIntegrationButton}，前往訂閱管理預覽`, maxDisplayDetailTextLength),
    managePlan,
    managePlanAccessibility: boundDisplayText(`${managePlan}，前往訂閱管理預覽`, maxDisplayDetailTextLength),
    authProviderPreview: boundDisplayText("正式登入方式預覽", maxDisplayTextLength),
    sessionPreview: boundDisplayText("裝置與 Session 管理預覽", maxDisplayTextLength),
    authReadiness: boundDisplayText("正式 auth readiness", maxDisplayTextLength),
    authBoundary: boundDisplayText("正式 auth 必備邊界", maxDisplayTextLength),
    localStateResult: boundDisplayText("本機狀態結果", maxDisplayTextLength),
    localClearButton: boundDisplayText("清除本機狀態", maxDisplayTextLength),
    localClearAccessibility: boundDisplayText("清除本機 session 與預覽狀態，不刪除 backend 紀錄", maxDisplayDetailTextLength),
    advancedSettingsToggleAccessibility: boundDisplayText("展開或收合進階設定，不連線 backend 或啟動模型", maxDisplayDetailTextLength),
    backendReconnectAccessibility: boundDisplayText("重新連線 backend，會清除 stale session/model/record state", maxDisplayDetailTextLength),
    refreshSession: boundDisplayText("刷新 session", maxDisplayTextLength),
    refreshSessionAccessibility: boundDisplayText("刷新 session，使用 SecureStore refresh token rotation", maxDisplayDetailTextLength),
    loadSessions: boundDisplayText("載入 sessions", maxDisplayTextLength),
    loadSessionsAccessibility: boundDisplayText("載入 sessions，只顯示 bounded session metadata", maxDisplayDetailTextLength),
    logoutLocal: boundDisplayText("登出本機", maxDisplayTextLength),
    logoutLocalAccessibility: boundDisplayText("登出本機，revoke session 並清除本機安全 token", maxDisplayDetailTextLength),
    logoutAll: boundDisplayText("登出全部", maxDisplayTextLength),
    logoutAllAccessibility: boundDisplayText("登出全部裝置，revoke backend sessions 並清除本機 token", maxDisplayDetailTextLength),
    profileEditReadiness: boundDisplayText("正式編輯前需要完成", maxDisplayTextLength),
    editIntegrationButton: boundDisplayText("查看編輯整合狀態", maxDisplayTextLength),
    editIntegrationAccessibility: boundDisplayText("查看個人資料編輯整合狀態，不寫入個資或照護對象", maxDisplayDetailTextLength),
    editIntegrationStatus: boundDisplayText("編輯整合狀態", maxDisplayTextLength),
    voiceUsageStatus: boundDisplayText("今日語音使用狀態", maxDisplayTextLength),
    dataCostBoundary: boundDisplayText("資料與成本邊界", maxDisplayTextLength),
    quotaSyncStatus: boundDisplayText("額度同步狀態", maxDisplayTextLength),
    notificationStatus: boundDisplayText("通知整合狀態", maxDisplayTextLength),
    privacyStatus: boundDisplayText("隱私整合狀態", maxDisplayTextLength)
  };
}
