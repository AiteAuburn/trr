#!/usr/bin/env python3
"""Verify deployment example configs keep production-safe defaults."""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
LOCAL_ENV = REPO_ROOT / ".env.example"
MINIMAL_ENV = REPO_ROOT / "infra" / "minimal" / ".env.example"
K8S_CONFIGMAP = REPO_ROOT / "infra" / "k8s" / "configmap.yaml"
K8S_SECRET_EXAMPLE = REPO_ROOT / "infra" / "k8s" / "secret.example.yaml"


def _parse_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", maxsplit=1)
        values[key] = value
    return values


def _parse_configmap_data(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    in_data = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip() == "data:":
            in_data = True
            continue
        if not in_data:
            continue
        match = re.match(r"\s{2}([A-Z0-9_]+):\s*\"?([^\"#]+)\"?\s*$", line)
        if match is not None:
            values[match.group(1)] = match.group(2).strip()
    return values


def _require(
    values: dict[str, str],
    key: str,
    expected: str,
    *,
    label: str,
    errors: list[str],
) -> None:
    actual = values.get(key)
    if actual != expected:
        errors.append(f"{label}: expected {key}={expected!r}, got {actual!r}")


def _require_int_at_most(
    values: dict[str, str],
    key: str,
    maximum: int,
    *,
    label: str,
    errors: list[str],
) -> None:
    raw_value = values.get(key)
    try:
        value = int(raw_value or "")
    except ValueError:
        errors.append(f"{label}: expected integer {key}, got {raw_value!r}")
        return
    if value > maximum:
        errors.append(f"{label}: expected {key}<={maximum}, got {value}")


def _require_not_contains(
    values: dict[str, str],
    key: str,
    forbidden: str,
    *,
    label: str,
    errors: list[str],
) -> None:
    value = values.get(key, "")
    if forbidden in value:
        errors.append(f"{label}: {key} must not contain {forbidden!r}")


def main() -> int:
    errors: list[str] = []
    local_env = _parse_env_file(LOCAL_ENV)
    minimal_env = _parse_env_file(MINIMAL_ENV)
    k8s_config = _parse_configmap_data(K8S_CONFIGMAP)
    k8s_secret = K8S_SECRET_EXAMPLE.read_text(encoding="utf-8")

    _require(local_env, "APP_ENV", "local", label=".env.example", errors=errors)
    _require(local_env, "ENABLE_DEBUG_TOOLS", "false", label=".env.example", errors=errors)
    _require(local_env, "VITE_ENABLE_DEBUG_TOOLS", "false", label=".env.example", errors=errors)
    _require(local_env, "EXPO_PUBLIC_ENABLE_DEBUG_TOOLS", "false", label=".env.example", errors=errors)
    _require_int_at_most(
        local_env,
        "LOCAL_LLM_MAX_TOKENS",
        960,
        label=".env.example",
        errors=errors,
    )

    for key in ("APP_ENV", "LOG_LEVEL", "ENABLE_DEBUG_TOOLS", "ALLOW_DEV_AUTH"):
        expected = {
            "APP_ENV": "production",
            "LOG_LEVEL": "info",
            "ENABLE_DEBUG_TOOLS": "false",
            "ALLOW_DEV_AUTH": "false",
        }[key]
        _require(minimal_env, key, expected, label="infra/minimal/.env.example", errors=errors)
        _require(k8s_config, key, expected, label="infra/k8s/configmap.yaml", errors=errors)

    for values, label in (
        (minimal_env, "infra/minimal/.env.example"),
        (k8s_config, "infra/k8s/configmap.yaml"),
    ):
        _require(values, "LOCAL_LLM_REPAIR_FALLBACK_ENABLED", "true", label=label, errors=errors)
        _require_int_at_most(values, "LOCAL_LLM_MAX_TOKENS", 900, label=label, errors=errors)
        _require_int_at_most(values, "LOCAL_LLM_TIMEOUT_SECONDS", 45, label=label, errors=errors)
        _require_not_contains(values, "BACKEND_CORS_ORIGINS", "*", label=label, errors=errors)
        _require(values, "VITE_ENABLE_DEBUG_TOOLS", "false", label=label, errors=errors)
        if not values.get("AUTH_JWT_ISSUER"):
            errors.append(f"{label}: AUTH_JWT_ISSUER must be set for production JWT validation")
        if not values.get("AUTH_JWT_AUDIENCE"):
            errors.append(f"{label}: AUTH_JWT_AUDIENCE must be set for production JWT validation")
        _require(values, "AUTH_JWT_REQUIRE_JTI", "true", label=label, errors=errors)
        if not values.get("AUTH_OIDC_JWKS_URL"):
            errors.append(f"{label}: AUTH_OIDC_JWKS_URL must be set for production OIDC login exchange")
        if values.get("AUTH_OIDC_JWKS_URL", "").startswith("http://"):
            errors.append(f"{label}: AUTH_OIDC_JWKS_URL must use https")
        if not values.get("AUTH_OIDC_ISSUER"):
            errors.append(f"{label}: AUTH_OIDC_ISSUER must be set for production OIDC login exchange")
        if not values.get("AUTH_OIDC_AUDIENCE"):
            errors.append(f"{label}: AUTH_OIDC_AUDIENCE must be set for production OIDC login exchange")
        _require_int_at_most(values, "AUTH_OIDC_MAX_AGE_SECONDS", 3600, label=label, errors=errors)
        _require_int_at_most(values, "AUTH_LOGIN_CLIENT_RATE_LIMIT_COUNT", 100, label=label, errors=errors)

    if "managed-postgres" not in k8s_secret:
        errors.append("infra/k8s/secret.example.yaml should show a managed PostgreSQL endpoint")
    if "managed-redis" not in k8s_secret:
        errors.append("infra/k8s/secret.example.yaml should show a managed Redis endpoint")
    if "AUTH_JWT_SECRET" not in k8s_secret:
        errors.append("infra/k8s/secret.example.yaml should include AUTH_JWT_SECRET")
    if "app:app@db" in k8s_secret:
        errors.append("infra/k8s/secret.example.yaml must not copy local Compose DB credentials")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    print("Deployment config examples verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
