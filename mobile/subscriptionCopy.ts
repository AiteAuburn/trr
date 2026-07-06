const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxUiMessageLength = 300;

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundUiMessage(value: string) {
  return value.slice(0, maxUiMessageLength);
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
