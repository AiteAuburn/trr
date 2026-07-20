import {
  boundDisplayText,
  boundIdentifier,
  recordDateTimeDisplay
} from "./recordDisplay";

const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxMobileCountValue = 1_000_000;

export type AuthSessionDisplaySource = {
  id: string;
  created_at: string;
  expires_at: string;
  last_used_at?: string | null;
  has_device_fingerprint: boolean;
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

export function authSessionDisplayItem(value: AuthSessionDisplaySource, index: number) {
  const id = boundIdentifier(value.id);
  const boundedIndex = clampNumber(index + 1, 1, maxMobileCountValue);
  return {
    key: `auth-session-${boundedIndex}-${id.slice(0, 12)}`,
    title: boundDisplayText(`Session ${boundedIndex}`, maxDisplayTextLength),
    copy: boundDisplayText(
      `建立 ${recordDateTimeDisplay(value.created_at)} · 到期 ${recordDateTimeDisplay(value.expires_at)}`,
      maxDisplayDetailTextLength
    ),
    statusLabel: boundDisplayText(value.has_device_fingerprint ? "裝置已識別" : "無裝置指紋", 40),
    lastUsed: boundDisplayText(
      value.last_used_at ? `最後使用 ${recordDateTimeDisplay(value.last_used_at)}` : "尚無最後使用時間",
      maxDisplayDetailTextLength
    )
  };
}

export function authSessionDisplayListItems(values: AuthSessionDisplaySource[]) {
  return values.slice(0, 20).map(authSessionDisplayItem);
}

export function authSessionManagementActionStatus(item: { actionStatus: string }) {
  return item.actionStatus;
}

export function boundAuthSessionItems(values: AuthSessionDisplaySource[]): AuthSessionDisplaySource[] {
  return values.slice(0, 20).map((session) => ({
    id: boundIdentifier(session.id),
    created_at: boundDisplayText(session.created_at, 80),
    expires_at: boundDisplayText(session.expires_at, 80),
    last_used_at: session.last_used_at ? boundDisplayText(session.last_used_at, 80) : null,
    has_device_fingerprint: Boolean(session.has_device_fingerprint)
  }));
}
