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
