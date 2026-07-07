#!/usr/bin/env python3
"""Verify mobile auth token persistence uses a secure-storage boundary."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
MOBILE_DIR = REPO_ROOT / "mobile"
STORAGE_PATH = MOBILE_DIR / "authTokenStorage.ts"
AUTH_TRANSFORMS_PATH = MOBILE_DIR / "authTransforms.ts"
CHALLENGE_PATH = MOBILE_DIR / "authProviderChallenge.ts"
APP_PATH = MOBILE_DIR / "App.tsx"
PACKAGE_PATH = MOBILE_DIR / "package.json"


def main() -> int:
    errors: list[str] = []
    storage = STORAGE_PATH.read_text(encoding="utf-8") if STORAGE_PATH.exists() else ""
    auth_transforms = AUTH_TRANSFORMS_PATH.read_text(encoding="utf-8") if AUTH_TRANSFORMS_PATH.exists() else ""
    challenge = CHALLENGE_PATH.read_text(encoding="utf-8") if CHALLENGE_PATH.exists() else ""
    app = APP_PATH.read_text(encoding="utf-8")
    package = json.loads(PACKAGE_PATH.read_text(encoding="utf-8"))

    if "expo-secure-store" not in package.get("dependencies", {}):
        errors.append("mobile/package.json must depend on expo-secure-store")
    for marker in (
        'import * as SecureStore from "expo-secure-store"',
        "authAccessTokenMaxLength = 4096",
        "authRefreshTokenMaxLength = 512",
        "SecureStore.isAvailableAsync()",
        "SecureStore.getItemAsync",
        "SecureStore.setItemAsync",
        "SecureStore.deleteItemAsync",
        "secure_store_unavailable",
        "token_too_large",
        "storage_error",
    ):
        if marker not in storage:
            errors.append(f"mobile/authTokenStorage.ts missing marker: {marker}")
    for forbidden in ("AsyncStorage", "expo-file-system", "FileSystem", "console.", "alert("):
        if forbidden in storage:
            errors.append(f"mobile/authTokenStorage.ts must not use {forbidden}")
    for marker in (
        "boundAuthTokenResponse",
        "authAccessTokenMaxLength",
        "authRefreshTokenMaxLength",
        "boundRefreshTokenForRequest",
        "boundOidcIdTokenForRequest",
        "boundOidcNonceForRequest",
        "boundOidcProviderForRequest",
        "boundDeviceFingerprintForRequest",
        "buildProtectedRequestHeaders",
        "/^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$/.test(token)",
        "/^[A-Za-z0-9._~+-]+$/.test(nonce)",
    ):
        if marker not in auth_transforms:
            errors.append(f"mobile/authTransforms.ts missing marker: {marker}")
    for forbidden in ("AsyncStorage", "expo-file-system", "FileSystem", "console.", "alert("):
        if forbidden in auth_transforms:
            errors.append(f"mobile/authTransforms.ts must not use {forbidden}")
    for marker in (
        "createAuthProviderChallenge",
        "validateAuthProviderChallenge",
        "authChallengeTtlMs = 10 * 60 * 1000",
        "authChallengeNonceMaxLength = 128",
        "authChallengeStateMaxLength = 128",
        "globalThis.crypto",
        "getRandomValues",
        "secure_random_unavailable",
        "state_mismatch",
        "challenge_expired",
    ):
        if marker not in challenge:
            errors.append(f"mobile/authProviderChallenge.ts missing marker: {marker}")
    for forbidden in ("Math.random", "AsyncStorage", "expo-file-system", "FileSystem", "console.", "alert("):
        if forbidden in challenge:
            errors.append(f"mobile/authProviderChallenge.ts must not use {forbidden}")
    for marker in (
        "readStoredAuthSession",
        "writeStoredAuthSession",
        "clearStoredAuthSession",
        "authAccessTokenMaxLength",
        "tokenStorageStatus",
        "clearMobileSessionState({ clearAuthTokens: false })",
        "SecureStore 不可用；正式 token storage fail closed。",
        "refresh token 未顯示",
        "refreshProductionAuthSession",
        'requestJson<AuthTokenResponse>(normalizedApiBaseUrl, "/auth/refresh"',
        "writeStoredAuthSession({",
        "logoutProductionAuthSession",
        'requestJson<{ revoked: boolean }>(normalizedApiBaseUrl, "/auth/logout"',
        "logoutAllProductionAuthSessions",
        'requestJson<{ revoked_sessions: number }>(normalizedApiBaseUrl, "/auth/logout-all"',
        "loadProductionAuthSessions",
        'requestJson<AuthSessionItem[]>(normalizedApiBaseUrl, "/auth/sessions?limit=20"',
        "authSessionDisplayItem",
        "completeOidcLoginFromProviderToken",
        'requestJson<AuthTokenResponse>(bootKey, "/auth/oidc-login"',
        "boundOidcIdTokenForRequest",
        "boundOidcNonceForRequest",
        "boundOidcProviderForRequest",
        "boundDeviceFingerprintForRequest",
        "nonce,",
        "pendingOidcChallenge",
        "createAuthProviderChallenge",
        "validateAuthProviderChallenge",
        "beginOidcProviderChallenge",
        "completeOidcLoginFromProviderCallback",
        "authProviderChallengeFailureStatusMessage",
        "authProviderCallbackRejectedStatusMessage",
        'requestJson<Account>(bootKey, "/auth/me"',
        "bootstrapAuthenticatedAccount",
        "SecureStore 已保存 OIDC session；refresh token 未顯示。",
    ):
        if marker not in app:
            errors.append(f"mobile/App.tsx missing secure auth marker: {marker}")
    if "4096" in app and "authAccessTokenMaxLength" not in app:
        errors.append("mobile/App.tsx must use authAccessTokenMaxLength instead of inline token limits")
    errors.extend(verify_protected_request_header_boundary(app, auth_transforms))

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    print("Mobile secure auth storage verified: SecureStore boundary, token bounds, protected header fallback, no plaintext fallback.")
    return 0


def verify_protected_request_header_boundary(app: str, auth_transforms: str) -> list[str]:
    errors: list[str] = []
    app_helper = extract_function_body(app, "protectedRequestHeaders")
    if not app_helper:
        return ["mobile/App.tsx missing protectedRequestHeaders adapter"]
    if "buildProtectedRequestHeaders(accountId, accessToken, allowMobileDevAuth)" not in app_helper:
        errors.append("protectedRequestHeaders adapter must delegate to buildProtectedRequestHeaders with allowMobileDevAuth")

    helper = extract_function_body(auth_transforms, "buildProtectedRequestHeaders")
    if not helper:
        return errors + ["mobile/authTransforms.ts missing buildProtectedRequestHeaders helper"]

    required_markers = (
        "accessToken.trim()",
        "boundIdentifier(accountId.trim())",
        "token.length > authAccessTokenMaxLength",
        "return {};",
        'return { Authorization: `Bearer ${token}` };',
        "if (allowDevAuth && devAccountId)",
        'return { "X-Account-Id": devAccountId };',
    )
    for marker in required_markers:
        if marker not in helper:
            errors.append(f"protectedRequestHeaders missing marker: {marker}")

    bearer_index = helper.find('return { Authorization: `Bearer ${token}` };')
    dev_index = helper.find('return { "X-Account-Id": devAccountId };')
    oversized_index = helper.find("token.length > authAccessTokenMaxLength")
    if -1 not in (bearer_index, dev_index) and bearer_index > dev_index:
        errors.append("protectedRequestHeaders must prefer Authorization Bearer before dev X-Account-Id fallback")
    if -1 not in (oversized_index, bearer_index) and oversized_index > bearer_index:
        errors.append("protectedRequestHeaders must reject oversized tokens before creating Authorization")

    direct_dev_headers = re.findall(r"headers:\s*\{[^}]*[\"']X-Account-Id[\"']", app, flags=re.DOTALL)
    if direct_dev_headers:
        errors.append("mobile/App.tsx must use protectedRequestHeaders instead of inline X-Account-Id headers")

    direct_auth_headers = re.findall(r"headers:\s*\{[^}]*\bAuthorization\b", app, flags=re.DOTALL)
    if direct_auth_headers:
        errors.append("mobile/App.tsx must use protectedRequestHeaders instead of inline Authorization headers")

    for marker in (
        "protectedHeaderMode",
        'accessTokenTooLarge',
        'normalizedAccessToken',
        'allowMobileDevAuth',
        'protectedAuthReady',
        'protectedAccountBackendReady',
        'protectedBackendReady',
        "空白或超過 4096 字元的 access token 不會組成 Authorization header。",
    ):
        if marker not in app:
            errors.append(f"mobile/App.tsx missing protected auth readiness marker: {marker}")
    return errors


def extract_function_body(source: str, function_name: str) -> str:
    match = re.search(rf"\bfunction\s+{re.escape(function_name)}\b[^\{{]*\{{", source)
    if not match:
        return ""
    start = match.end() - 1
    depth = 0
    for index in range(start, len(source)):
        char = source[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return source[start + 1 : index]
    return ""


if __name__ == "__main__":
    raise SystemExit(main())
