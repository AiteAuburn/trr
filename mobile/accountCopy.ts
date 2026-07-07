const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxEmailTextLength = 160;

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

type AccountDisplaySource = {
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

export function doctorShareAccountBoundaryText(account: AccountDisplaySource | null) {
  return boundDisplayText(
    account
      ? "已連線帳號；正式分享仍需 production auth、權限與授權碼流程。"
      : "尚未連線帳號；不可建立任何外部分享。",
    maxDisplayDetailTextLength
  );
}
