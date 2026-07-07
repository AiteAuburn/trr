import {
  authAccessTokenMaxLength,
  authRefreshTokenMaxLength
} from "./authTokenStorage";

const maxOidcProviderLength = 32;
const maxOidcIdTokenLength = 4096;
const maxOidcNonceLength = 128;
const maxDeviceFingerprintLength = 256;

export type AuthTokenResponseTransformSource = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in: number;
};

export type OidcLoginProvider = "apple" | "google" | "email";

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

export function boundAuthTokenResponse<T extends AuthTokenResponseTransformSource>(value: T): T | null {
  const accessToken = value.access_token.trim();
  const refreshToken = value.refresh_token.trim();
  const expiresIn = clampNumber(value.expires_in, 1, 86_400);
  if (
    !accessToken ||
    !refreshToken ||
    accessToken.length > authAccessTokenMaxLength ||
    refreshToken.length > authRefreshTokenMaxLength
  ) {
    return null;
  }
  return {
    ...value,
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: value.token_type === "bearer" ? "bearer" : undefined,
    expires_in: expiresIn
  };
}

export function boundRefreshTokenForRequest(value: string) {
  const token = value.trim();
  if (!token || token.length > authRefreshTokenMaxLength) {
    return "";
  }
  return token;
}

export function boundOidcProviderForRequest(value: string): OidcLoginProvider | "" {
  const provider = value.trim().toLowerCase().slice(0, maxOidcProviderLength);
  if (provider === "apple" || provider === "google" || provider === "email") {
    return provider;
  }
  return "";
}

export function boundOidcIdTokenForRequest(value: string) {
  const token = value.trim();
  if (!token || token.length > maxOidcIdTokenLength || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    return "";
  }
  return token;
}

export function boundOidcNonceForRequest(value: string) {
  const nonce = value.trim();
  if (!nonce || nonce.length < 16 || nonce.length > maxOidcNonceLength || !/^[A-Za-z0-9._~+-]+$/.test(nonce)) {
    return "";
  }
  return nonce;
}

export function boundDeviceFingerprintForRequest(value: string | null | undefined) {
  const fingerprint = (value ?? "").trim();
  if (!fingerprint) {
    return undefined;
  }
  return fingerprint.slice(0, maxDeviceFingerprintLength);
}
