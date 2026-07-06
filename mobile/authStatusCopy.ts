import type { AuthProviderChallengeFailure } from "./authProviderChallenge";

const maxUiMessageLength = 300;
const maxDisplayTextLength = 120;
const maxMobileCountValue = 1_000_000;

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

function boundUiMessage(value: string) {
  return value.slice(0, maxUiMessageLength);
}

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function safeUiError(error: unknown, fallback: string) {
  if (error instanceof Error && /^\S+ failed: \d{3}$/.test(error.message)) {
    return boundUiMessage(error.message);
  }
  return boundUiMessage(fallback);
}

export function bootFailureDisplayMessages(message: string) {
  return {
    status: boundUiMessage(`${message}；已清除未完成連線狀態，請確認 backend 後重新連線。`),
    authStatus: boundUiMessage("連線未完成；已清除可能不完整的帳號、模型、額度與紀錄狀態。")
  };
}

export function backendUrlChangedDisplayMessages() {
  return {
    status: boundUiMessage("Backend URL 已變更，請重新連線。"),
    authStatus: boundUiMessage(
      "已清除舊 backend 的本機帳號、紀錄與模型清單狀態，避免跨環境沿用 dev auth 或 parser model。"
    )
  };
}

export function devLoginDisabledDisplayMessages() {
  return {
    status: boundUiMessage("dev login 未啟用；本機預覽請確認 mobile/.env。"),
    authStatus: boundUiMessage(
      "Mobile dev auth is opt-in. For local preview set EXPO_PUBLIC_ALLOW_DEV_AUTH=true in mobile/.env; production builds should connect JWT/OIDC login before protected endpoints."
    )
  };
}

export function backendReconnectProgressStatusMessage() {
  return boundUiMessage("連線 backend...");
}

export function backendReconnectSuccessStatusMessage() {
  return boundUiMessage("已連線，可開始整理文字");
}

export function mainInitialStatusMessage() {
  return boundUiMessage("尚未連線");
}

export function backendReconnectFailureDisplayMessages(error: unknown) {
  return bootFailureDisplayMessages(safeUiError(error, "連線失敗"));
}

export function devResetFailureDisplayMessages(message: string) {
  return {
    devResetStatus: boundUiMessage(`${message}；已保守清除本機狀態，請重新連線確認 backend 資料。`),
    status: boundUiMessage("Dev reset 未確認完成；已清除本機狀態，請重新連線 backend。")
  };
}

export function devResetUnavailableStatusMessage() {
  return boundUiMessage("Dev reset 只在 EXPO_PUBLIC_ALLOW_DEV_AUTH=true 的本機開發環境顯示。");
}

export function devResetBusyStatusMessage() {
  return boundUiMessage("目前仍有請求處理中，請稍後再重置測試資料。");
}

export function devResetProgressStatusMessage() {
  return boundUiMessage("正在呼叫 backend dev reset...");
}

export function devResetSuccessDisplayMessages(recordsCount: number) {
  return {
    devResetStatus: boundUiMessage(
      `已重置 backend 測試資料；records ${clampNumber(recordsCount, 0, maxMobileCountValue)} 筆。請重新連線。`
    ),
    status: boundUiMessage("Dev reset 已完成，請重新連線 backend。")
  };
}

export function devResetFailureMessages(error: unknown) {
  return devResetFailureDisplayMessages(
    safeUiError(error, "Dev reset 失敗；請確認 backend /dev/reset-data 是否在本機開發環境啟用。")
  );
}

export function localClearDisplayMessages() {
  return {
    authStatus: boundUiMessage(
      "已清除本機帳號、照護對象、模型清單、語音額度、紀錄、報表與候選狀態。正式登出仍需 refresh token revoke、session list 更新與安全儲存清除。"
    ),
    status: boundUiMessage("已清除本機 session 狀態")
  };
}

export function authOperationBusyStatusMessage() {
  return boundUiMessage("Auth 操作仍在處理中，請稍後再試。");
}

export function authRefreshUnavailableStatusMessage() {
  return boundUiMessage("沒有可用 refresh token；請先完成正式登入或重新登入。");
}

export function authRefreshProgressStatusMessage() {
  return boundUiMessage("正在安全刷新 session...");
}

export function authRefreshSuccessStatusMessage(expiresIn: number) {
  return boundUiMessage(
    `session 已刷新；access token 仍只短暫放在記憶體，約 ${clampNumber(expiresIn, 1, 86_400)} 秒後到期。`
  );
}

export function authRefreshStorageFailureStatusMessage() {
  return boundUiMessage("刷新成功但安全儲存失敗；已 fail closed 並清除本機 token，請重新登入。");
}

export function authRefreshFailureStatusMessage(error: unknown) {
  return safeUiError(error, "session refresh 失敗；請重新登入。");
}

export function oidcExchangeUnavailableStatusMessage() {
  return boundUiMessage("Provider callback 尚未提供可交換的 id_token 與 nonce；請先完成 Apple / Google / Email 原生登入。");
}

export function authProviderChallengeCreatedStatusMessage(provider: string) {
  return boundUiMessage(
    `${boundDisplayText(provider, 40)} nonce/state challenge 已建立；等待原生 provider SDK callback 回傳 id_token 與 state。`
  );
}

export function authProviderChallengeFailureStatusMessage(reason: AuthProviderChallengeFailure) {
  const copyByReason: Record<AuthProviderChallengeFailure, string> = {
    invalid_provider: "Provider 不在允許清單內；不會啟動登入流程。",
    invalid_challenge: "登入 challenge 不完整；請重新開始 provider 登入。",
    state_mismatch: "Provider state 驗證不一致；已拒絕 callback。",
    challenge_expired: "Provider challenge 已過期；請重新開始登入。",
    secure_random_unavailable: "安全亂數不可用；正式登入 fail closed。"
  };
  return boundUiMessage(copyByReason[reason]);
}

export function authProviderCallbackRejectedStatusMessage(reason: AuthProviderChallengeFailure) {
  return boundUiMessage(`Provider callback 已拒絕：${authProviderChallengeFailureStatusMessage(reason)}`);
}

export function oidcExchangeProgressStatusMessage(provider: string) {
  return boundUiMessage(`正在交換 ${boundDisplayText(provider, 40)} provider token...`);
}

export function oidcExchangeSuccessStatusMessage(expiresIn: number) {
  return boundUiMessage(
    `正式登入完成；token 已寫入 SecureStore，access token 約 ${clampNumber(expiresIn, 1, 86_400)} 秒後到期。`
  );
}

export function oidcExchangeStorageFailureStatusMessage() {
  return boundUiMessage("OIDC exchange 成功但 SecureStore 寫入失敗；已 fail closed 並清除本機 token。");
}

export function oidcExchangeFailureStatusMessage(error: unknown) {
  return safeUiError(error, "OIDC exchange 失敗；不會保存 provider token，請重新登入。");
}

export function authLogoutProgressStatusMessage() {
  return boundUiMessage("正在呼叫 backend revoke 並清除本機 token...");
}

export function authLogoutSuccessStatusMessage() {
  return boundUiMessage("已登出並清除本機安全 token；若 backend 無法找到 session 也會視為本機登出完成。");
}

export function authLogoutFailureStatusMessage(error: unknown) {
  return safeUiError(error, "logout revoke 失敗；已保守清除本機 token，請稍後重新確認 session。");
}

export function authLogoutAllProgressStatusMessage() {
  return boundUiMessage("正在撤銷全部 session...");
}

export function authLogoutAllSuccessStatusMessage(revokedSessions: number) {
  return boundUiMessage(
    `已送出全部裝置登出；backend 回報撤銷 ${clampNumber(revokedSessions, 0, maxMobileCountValue)} 個 session。`
  );
}

export function authSessionsProgressStatusMessage() {
  return boundUiMessage("正在載入 session list...");
}

export function authSessionsSuccessStatusMessage(count: number) {
  return boundUiMessage(`已載入 ${clampNumber(count, 0, maxMobileCountValue)} 個 active session metadata。`);
}

export function authSessionsUnavailableStatusMessage(message: string) {
  return boundUiMessage(`${message || "保護 API 尚未 ready"}；目前不讀取 session list。`);
}

export function authSessionsFailureStatusMessage(error: unknown) {
  return safeUiError(error, "session list 載入失敗；mobile 不會保留舊 session metadata。");
}
