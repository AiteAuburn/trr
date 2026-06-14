import * as SecureStore from "expo-secure-store";

export const authAccessTokenMaxLength = 4096;
export const authRefreshTokenMaxLength = 512;

const accessTokenKey = "bloodsugar.auth.accessToken";
const refreshTokenKey = "bloodsugar.auth.refreshToken";

export type StoredAuthSession = {
  accessToken: string;
  refreshToken: string;
};

export type AuthTokenStorageResult =
  | { ok: true; session: StoredAuthSession | null }
  | { ok: false; reason: "secure_store_unavailable" | "token_too_large" | "storage_error" };

export async function readStoredAuthSession(): Promise<AuthTokenStorageResult> {
  if (!(await secureStoreAvailable())) {
    return { ok: false, reason: "secure_store_unavailable" };
  }
  try {
    const accessToken = normalizeToken(
      await SecureStore.getItemAsync(accessTokenKey),
      authAccessTokenMaxLength
    );
    const refreshToken = normalizeToken(
      await SecureStore.getItemAsync(refreshTokenKey),
      authRefreshTokenMaxLength
    );
    if (!accessToken && !refreshToken) {
      return { ok: true, session: null };
    }
    if (!accessToken || !refreshToken) {
      await clearStoredAuthSession();
      return { ok: false, reason: "storage_error" };
    }
    return { ok: true, session: { accessToken, refreshToken } };
  } catch {
    return { ok: false, reason: "storage_error" };
  }
}

export async function writeStoredAuthSession(session: StoredAuthSession): Promise<AuthTokenStorageResult> {
  const accessToken = normalizeToken(session.accessToken, authAccessTokenMaxLength);
  const refreshToken = normalizeToken(session.refreshToken, authRefreshTokenMaxLength);
  if (!accessToken || !refreshToken) {
    return { ok: false, reason: "token_too_large" };
  }
  if (!(await secureStoreAvailable())) {
    return { ok: false, reason: "secure_store_unavailable" };
  }
  try {
    await SecureStore.setItemAsync(accessTokenKey, accessToken, secureStoreOptions);
    await SecureStore.setItemAsync(refreshTokenKey, refreshToken, secureStoreOptions);
    return { ok: true, session: { accessToken, refreshToken } };
  } catch {
    return { ok: false, reason: "storage_error" };
  }
}

export async function clearStoredAuthSession(): Promise<void> {
  if (!(await secureStoreAvailable())) {
    return;
  }
  try {
    await SecureStore.deleteItemAsync(accessTokenKey);
    await SecureStore.deleteItemAsync(refreshTokenKey);
  } catch {
    // Fail closed; callers only need to know the in-memory session was cleared.
  }
}

async function secureStoreAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

function normalizeToken(value: string | null, maxLength: number): string {
  const token = (value ?? "").trim();
  if (!token || token.length > maxLength) {
    return "";
  }
  return token;
}

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
};
