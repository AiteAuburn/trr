export type AuthChallengeProvider = "apple" | "google" | "email";

export type AuthProviderChallenge = {
  provider: AuthChallengeProvider;
  nonce: string;
  state: string;
  createdAtMs: number;
  expiresAtMs: number;
};

export type AuthProviderChallengeFailure =
  | "invalid_provider"
  | "invalid_challenge"
  | "state_mismatch"
  | "challenge_expired"
  | "secure_random_unavailable";

export type AuthProviderChallengeCreateResult =
  | { ok: true; challenge: AuthProviderChallenge }
  | { ok: false; reason: AuthProviderChallengeFailure };

export type AuthProviderChallengeValidateResult =
  | { ok: true; nonce: string }
  | { ok: false; reason: AuthProviderChallengeFailure };

export const authChallengeTtlMs = 10 * 60 * 1000;
export const authChallengeNonceMaxLength = 128;
export const authChallengeStateMaxLength = 128;

const authChallengeValueLength = 43;
const authChallengeAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._~+-";
const maxRandomByteForAlphabet = Math.floor(256 / authChallengeAlphabet.length) * authChallengeAlphabet.length;

function boundProvider(value: string): AuthChallengeProvider | "" {
  const provider = value.trim().toLowerCase();
  if (provider === "apple" || provider === "google" || provider === "email") {
    return provider;
  }
  return "";
}

function getSecureRandomValues(bytes: Uint8Array) {
  const cryptoLike = globalThis.crypto;
  if (!cryptoLike || typeof cryptoLike.getRandomValues !== "function") {
    return false;
  }
  cryptoLike.getRandomValues(bytes);
  return true;
}

function createSecureChallengeValue() {
  let value = "";
  while (value.length < authChallengeValueLength) {
    const bytes = new Uint8Array(authChallengeValueLength);
    if (!getSecureRandomValues(bytes)) {
      return "";
    }
    for (const byte of bytes) {
      if (byte >= maxRandomByteForAlphabet) {
        continue;
      }
      value += authChallengeAlphabet[byte % authChallengeAlphabet.length] ?? "";
      if (value.length >= authChallengeValueLength) {
        break;
      }
    }
  }
  return value.slice(0, authChallengeValueLength);
}

function isChallengeValue(value: string, maxLength: number) {
  return (
    value.length >= 16 &&
    value.length <= maxLength &&
    /^[A-Za-z0-9._~+-]+$/.test(value)
  );
}

export function createAuthProviderChallenge(providerValue: string, nowMs = Date.now()): AuthProviderChallengeCreateResult {
  const provider = boundProvider(providerValue);
  if (!provider) {
    return { ok: false, reason: "invalid_provider" };
  }
  const nonce = createSecureChallengeValue();
  const state = createSecureChallengeValue();
  if (
    !isChallengeValue(nonce, authChallengeNonceMaxLength) ||
    !isChallengeValue(state, authChallengeStateMaxLength)
  ) {
    return { ok: false, reason: "secure_random_unavailable" };
  }
  const createdAtMs = Number.isFinite(nowMs) && nowMs > 0 ? nowMs : Date.now();
  return {
    ok: true,
    challenge: {
      provider,
      nonce,
      state,
      createdAtMs,
      expiresAtMs: createdAtMs + authChallengeTtlMs
    }
  };
}

export function validateAuthProviderChallenge(
  challenge: AuthProviderChallenge | null,
  providerValue: string,
  stateValue: string,
  nowMs = Date.now()
): AuthProviderChallengeValidateResult {
  if (!challenge || !isChallengeValue(challenge.nonce, authChallengeNonceMaxLength)) {
    return { ok: false, reason: "invalid_challenge" };
  }
  const provider = boundProvider(providerValue);
  if (!provider || provider !== challenge.provider) {
    return { ok: false, reason: "invalid_provider" };
  }
  const state = stateValue.trim();
  if (!isChallengeValue(state, authChallengeStateMaxLength) || state !== challenge.state) {
    return { ok: false, reason: "state_mismatch" };
  }
  const checkedAtMs = Number.isFinite(nowMs) && nowMs > 0 ? nowMs : Date.now();
  if (checkedAtMs > challenge.expiresAtMs) {
    return { ok: false, reason: "challenge_expired" };
  }
  return { ok: true, nonce: challenge.nonce };
}
