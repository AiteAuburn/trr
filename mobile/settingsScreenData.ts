import type { AppScreen } from "./navigationConfig";

const maxDisplayTextLength = 160;
const maxIdentifierTextLength = 128;
const maxDisplayDetailTextLength = 240;

export type SettingsRow = {
  id: string;
  label: string;
  icon: string;
  helper?: string;
  target?: AppScreen;
};

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string) {
  return boundDisplayText(value, maxIdentifierTextLength);
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
