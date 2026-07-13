import type { AppScreen } from "./navigationConfig";
import { boundOidcProviderForRequest, type OidcLoginProvider } from "./authTransforms";
import { previewTupleDisplayItem, sessionManagementPreviewDisplayItem, tutorialStepDisplayItem } from "./sharedDisplayItems";

const maxDisplayTextLength = 160;
const maxIdentifierTextLength = 128;
const maxDisplayDetailTextLength = 240;
const maxUiMessageLength = 300;

export type SettingsRow = {
  id: string;
  label: string;
  icon: string;
  helper?: string;
  target?: AppScreen;
};

export type AuthProviderPreview = {
  provider: OidcLoginProvider;
  title: string;
  status: string;
  copy: string;
};

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string) {
  return boundDisplayText(value, maxIdentifierTextLength);
}

function boundUiMessage(value: string) {
  return value.slice(0, maxUiMessageLength);
}

export const settingsRows: SettingsRow[] = [
  { id: "auth", label: "登入狀態", icon: "鑰", helper: "dev auth、production auth 與 session 邊界" },
  { id: "profile", label: "個人資料", icon: "人", helper: "姓名、登入方式與基本資料" },
  { id: "reminders", label: "提醒設定", icon: "鈴", helper: "記錄提醒與回診提醒" },
  { id: "quota", label: "錄音額度", icon: "麥", helper: "今日語音使用狀態" },
  { id: "privacy", label: "通知與隱私", icon: "盾", helper: "通知、資料分享與隱私設定" },
  { id: "tutorial", label: "使用教學", icon: "書", helper: "重新查看 4 步驟教學", target: "tutorial" },
  { id: "subscription", label: "訂閱管理", icon: "卡", helper: "試用、年費與方案管理" }
];

export const authProviderPreviews: ReadonlyArray<AuthProviderPreview> = [
  {
    provider: "apple",
    title: "Apple",
    status: "系統登入",
    copy: "需完成 Sign in with Apple、token exchange、refresh token rotation 與 revoke。"
  },
  {
    provider: "google",
    title: "Google",
    status: "OAuth/OIDC",
    copy: "需完成 OIDC callback、nonce/state 驗證、server-side session 建立與撤銷。"
  },
  {
    provider: "email",
    title: "Email",
    status: "密碼或 magic link",
    copy: "需完成 email 驗證、rate limit、裝置/session 管理與安全儲存。"
  }
] as const;

export const sessionManagementPreviews = [
  ["目前裝置", "本機預覽", "正式版需顯示裝置名稱、最後使用時間、IP / 地區粗略資訊與 session id。"],
  ["其他裝置", "需後端列表", "需由後端提供可分頁 session list，mobile 不保存完整 token 或 session 清單。"],
  ["登出全部裝置", "撤銷未啟用", "需完成 refresh token revoke、server-side session invalidation 與安全儲存清除。"]
] as const;

export function sessionManagementDisplayItems() {
  return sessionManagementPreviews.map(sessionManagementPreviewDisplayItem);
}

export const productionAuthReadinessRows = [
  ["Provider", "待串接", "Apple / Google / Email token exchange 尚未接到 mobile。"],
  ["Backend verify", "待串接", "後端需驗證 JWT、issuer、audience、profile scope 與撤銷狀態。"],
  ["Secure storage", "待串接", "access token 只能短暫使用；refresh token 必須走 Keychain / Keystore 與 rotation。"],
  ["Session revoke", "待串接", "logout 與登出全部裝置需呼叫 server-side revoke，不只清除本機狀態。"],
  ["Audit", "待串接", "正式 auth 事件需 PHI-safe audit，不記錄 raw token、健康內容或 request body。"]
] as const;

export function productionAuthReadinessDisplayRows() {
  return productionAuthReadinessRows.map(previewTupleDisplayItem);
}

export const subscriptionManagementRows = [
  ["付款來源", "未串接", "正式版需由 App Store / Play Store 或會員後台開啟管理頁。"],
  ["Receipt validation", "必做", "後端驗證收據並以 webhook 更新 entitlement，不信任前端狀態。"],
  ["優惠資格", "保留欄位", "創始會員價、KOL 導流碼與續訂保價需由 server-side policy 決定。"],
  ["取消 / 到期", "待串接", "取消、到期、退款與 grace period 都需同步到 voice quota。"]
] as const;

export function subscriptionManagementDisplayRows() {
  return subscriptionManagementRows.map(previewTupleDisplayItem);
}

export const privacyControlRows = [
  ["醫師 / 照護者分享", "尚未啟用", "需要授權碼、到期、撤銷與唯讀範圍。"],
  ["社群公開資料", "預設關閉", "任何紀錄公開前都要逐項 opt-in。"],
  ["資料匯出 / 刪除", "待後端流程", "需要身份驗證、批次狀態與稽核紀錄。"]
] as const;

export function privacyControlDisplayRows() {
  return privacyControlRows.map(previewTupleDisplayItem);
}

export const tutorialSteps = [
  ["🎙", "按住說話", "按住首頁或記錄頁的大按鈕開始錄音預覽。"],
  ["✋", "放開結束", "若已選擇本機 Whisper 模型，會先轉成文字並進入確認。"],
  ["✅", "確認內容", "檢查文字與 AI 候選紀錄，確認前不會儲存。"],
  ["💾", "儲存完成", "確認後送出，即可加入今日紀錄。"]
] as const;

export function tutorialDisplaySteps() {
  return tutorialSteps.map(tutorialStepDisplayItem);
}

export function settingsRowDisplayItem(value: SettingsRow) {
  const label = boundDisplayText(value.label || "設定", maxDisplayTextLength);
  const helper = value.helper ? boundDisplayText(value.helper, maxDisplayDetailTextLength) : "";
  return {
    ...value,
    id: boundIdentifier(value.id),
    label,
    icon: boundDisplayText(value.icon || "•", 4),
    helper,
    accessibilityLabel: boundDisplayText(`前往${label}設定：${helper || "查看設定狀態"}`, maxDisplayDetailTextLength)
  };
}

export function settingsDisplayRows() {
  return settingsRows.map(settingsRowDisplayItem);
}

export function settingsRowSubpageTarget(row: Pick<SettingsRow, "id">): AppScreen | null {
  if (row.id === "auth") {
    return "accountSecurity";
  }
  if (row.id === "profile") {
    return "profileSettings";
  }
  if (row.id === "reminders") {
    return "reminderSettings";
  }
  if (row.id === "quota") {
    return "recordingQuotaSettings";
  }
  if (row.id === "privacy") {
    return "privacySettings";
  }
  if (row.id === "subscription") {
    return "subscriptionManagement";
  }
  return null;
}

export function authProviderPreviewDisplayItem(value: AuthProviderPreview) {
  const item = previewTupleDisplayItem([value.title, value.status, value.copy]);
  const provider = boundOidcProviderForRequest(value.provider);
  return {
    ...item,
    provider,
    accessibilityLabel: boundDisplayText(`查看${item.title}登入整合狀態，不保存 provider token`, maxDisplayDetailTextLength),
    actionStatus: boundUiMessage(
      `${item.title} 原生 provider callback 尚未接入；callback 拿到 id_token 後會走 /auth/oidc-login、SecureStore 與 session revoke 流程。`
    )
  };
}

export function authProviderDisplayItems() {
  return authProviderPreviews.map(authProviderPreviewDisplayItem);
}
