const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxEmailTextLength = 160;

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

export type AccountDisplaySource = {
  display_name?: string | null;
  email?: string | null;
};

export function accountDisplayNameDisplayText(account: AccountDisplaySource | null) {
  return boundDisplayText(account?.display_name ?? "尚未連線帳號");
}

export function accountEmailDisplayValue(account: AccountDisplaySource | null) {
  return boundDisplayText(account?.email ?? "尚未取得登入識別", maxEmailTextLength);
}

export function accountLoginDisplayValue(account: AccountDisplaySource | null) {
  return account?.email
    ? boundDisplayText(`Email 登入・${account.email}`, maxDisplayDetailTextLength)
    : boundDisplayText("尚未連線帳號");
}

export function accountPublicDisplayNameText(account: AccountDisplaySource | null) {
  return account ? accountDisplayNameDisplayText(account) : boundDisplayText("尚未設定");
}

export function accountPublicDisplayNameForSettings(
  publicSettings: { display_name?: string | null } | null,
  account: AccountDisplaySource | null
) {
  return publicSettings?.display_name ?? accountPublicDisplayNameText(account);
}

export function doctorShareAccountBoundaryText(account: AccountDisplaySource | null) {
  return boundDisplayText(
    account
      ? "已連線帳號；正式分享仍需 production auth、權限與授權碼流程。"
      : "尚未連線帳號；不可建立任何外部分享。",
    maxDisplayDetailTextLength
  );
}

export function accountSecurityAuthModeDisplayTexts(value: {
  allowMobileDevAuth: boolean;
  accountDisplayName: string;
  accountLoginDisplayText: string;
}) {
  const label = value.allowMobileDevAuth ? "Dev Auth" : "Production Auth Required";
  const copy = value.allowMobileDevAuth
    ? "目前使用本機開發登入；正式 build 應關閉 dev auth 並接 JWT/OIDC。"
    : "dev login 已停用；本機預覽請先複製 mobile/.env.example 到 .env，正式版需接 JWT/OIDC 與安全 token 儲存。";
  const displayLabel = boundDisplayText(label, 40);
  return {
    label: displayLabel,
    copy: boundDisplayText(copy, maxDisplayDetailTextLength),
    cardAccessibilityLabel: boundDisplayText(
      `前往帳號安全設定：${value.accountDisplayName}，${value.accountLoginDisplayText}，${displayLabel}`,
      maxDisplayDetailTextLength
    )
  };
}

export function doctorShareBoundaryDisplayRows() {
  return [
    ["授權碼", "未產生"],
    ["醫師權限", "唯讀預留"],
    ["報表來源", "/reports/basic 預留"],
    ["AI 成本", "0 次呼叫"]
  ].map(([label, value]) => ({
    label: boundDisplayText(label, 60),
    value: boundDisplayText(value, 80)
  }));
}

export function profileSettingsBoundaryDisplayRows(
  account: AccountDisplaySource | null,
  activeProfile: unknown | null,
  activeProfileLabel: string,
  activeProfileRelationshipDisplayText: string
) {
  return [
    ["帳號資料", account ? "已同步" : "未連線"],
    ["照護對象", activeProfile ? activeProfileLabel : "未選擇"],
    ["relationship", activeProfileRelationshipDisplayText],
    ["本機編輯", "停用"]
  ].map(([label, value]) => ({
    label: boundDisplayText(label, 60),
    value: boundDisplayText(value, 80)
  }));
}

export function profileSettingsBoundaryDisplayRowsForState(value: {
  account: AccountDisplaySource | null;
  activeProfile: unknown | null;
  activeProfileLabel: string;
  activeProfileRelationshipDisplayText: string;
}) {
  return profileSettingsBoundaryDisplayRows(
    value.account,
    value.activeProfile,
    value.activeProfileLabel,
    value.activeProfileRelationshipDisplayText
  );
}

export function profileReadinessChecklistDisplayItems() {
  return [
    "production auth / OIDC 或 JWT 邊界，避免 dev account 被當成正式個資。",
    "profile update API、欄位驗證、錯誤狀態與 optimistic update rollback。",
    "帳號與照護對象權限檢查：只能編輯自己有權限的 profile。",
    "敏感欄位需定義最小化策略；目前不收集生日、身分證或醫療診斷資料。"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}

export function doctorShareReadinessChecklistDisplayItems() {
  return [
    "share token / authorization grant 產生、到期與撤銷",
    "doctor grant 僅允許 profile:read / profile:export 的明確授權範圍",
    "回診摘要報表需使用 bounded report query，不載入無上限歷史資料",
    "所有分享、查看、匯出與撤銷都必須寫入 audit log"
  ].map((item) => boundDisplayText(item, maxDisplayDetailTextLength));
}
