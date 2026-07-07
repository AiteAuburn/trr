const maxMobileVoiceSeconds = 86_400;
const mobileSingleRecordingLimitSeconds = 60;

export type VoiceQuotaTransformSource = {
  plan_code: string;
  status: string;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  referral_code?: string | null;
  preserves_intro_price: boolean;
  daily_limit_seconds: number;
  used_seconds_today: number;
  remaining_seconds_today: number;
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

function boundDisplayText(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string) {
  return boundDisplayText(value, 80);
}

function boundOptionalDateTime(value?: string | null) {
  return typeof value === "string" ? boundDisplayText(value, 40) : null;
}

export function boundVoiceQuota<T extends VoiceQuotaTransformSource>(value: T): T {
  const dailyLimit = clampNumber(value.daily_limit_seconds, 0, maxMobileVoiceSeconds);
  const used = clampNumber(value.used_seconds_today, 0, maxMobileVoiceSeconds);
  const remaining = clampNumber(value.remaining_seconds_today, 0, maxMobileVoiceSeconds);
  return {
    ...value,
    plan_code: boundIdentifier(value.plan_code),
    status: boundDisplayText(value.status, 40),
    trial_started_at: boundOptionalDateTime(value.trial_started_at),
    trial_ends_at: boundOptionalDateTime(value.trial_ends_at),
    referral_code: value.referral_code ? boundDisplayText(value.referral_code, 80) : null,
    preserves_intro_price: Boolean(value.preserves_intro_price),
    daily_limit_seconds: dailyLimit,
    used_seconds_today: Math.min(used, dailyLimit || used),
    remaining_seconds_today: Math.min(remaining, dailyLimit || remaining)
  };
}

export function recordingEffectiveLimitSeconds(quota: VoiceQuotaTransformSource | null) {
  if (quota && quota.remaining_seconds_today > 0) {
    return clampNumber(
      Math.min(mobileSingleRecordingLimitSeconds, quota.remaining_seconds_today),
      1,
      mobileSingleRecordingLimitSeconds
    );
  }
  return mobileSingleRecordingLimitSeconds;
}

export function trialDaysLeft(trialEndsAt?: string | null) {
  if (!trialEndsAt) {
    return null;
  }
  const end = new Date(trialEndsAt).getTime();
  if (Number.isNaN(end)) {
    return null;
  }
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}
