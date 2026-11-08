#!/usr/bin/env python3
"""Verify deployment example configs keep production-safe defaults."""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
LOCAL_ENV = REPO_ROOT / ".env.example"
BACKEND_PROJECT = REPO_ROOT / "backend" / "pyproject.toml"
BACKEND_PROD_DOCKERFILE = REPO_ROOT / "backend" / "Dockerfile.prod"
LIGHTSAIL_COMPOSE = REPO_ROOT / "infra" / "lightsail" / "compose.yml"
LIGHTSAIL_ENV = REPO_ROOT / "infra" / "lightsail" / ".env.example"
LIGHTSAIL_CADDY = REPO_ROOT / "infra" / "lightsail" / "Caddyfile"
LIGHTSAIL_BUDGET = REPO_ROOT / "infra" / "lightsail" / "create-budget.ps1"
LIGHTSAIL_INITIALIZE_ENV = REPO_ROOT / "infra" / "lightsail" / "initialize-env.sh"
LIGHTSAIL_SET_DEEPSEEK_KEY = REPO_ROOT / "infra" / "lightsail" / "set-deepseek-key.sh"
LIGHTSAIL_SET_ADMIN_CREDENTIALS = REPO_ROOT / "infra" / "lightsail" / "set-admin-credentials.sh"
MOBILE_ENV_EXAMPLE = REPO_ROOT / "mobile" / ".env.example"


def _parse_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", maxsplit=1)
        values[key] = value
    return values


def _parse_compose_service_env(path: Path, service: str) -> dict[str, str]:
    """Read `KEY: value` pairs from one service's `environment:` block in a compose file."""
    values: dict[str, str] = {}
    in_service = False
    in_environment = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if re.match(r"^  [a-z]", line):
            in_service = line.strip() == f"{service}:"
            in_environment = False
            continue
        if not in_service:
            continue
        if re.match(r"^    [a-z_]+:", line):
            in_environment = line.strip() == "environment:"
            continue
        if in_environment:
            match = re.match(r"^      ([A-Z0-9_]+):\s*\"?([^\"#]*)\"?\s*$", line)
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


def _verify_backend_production_dependencies(errors: list[str]) -> None:
    project = BACKEND_PROJECT.read_text(encoding="utf-8")
    dockerfile = BACKEND_PROD_DOCKERFILE.read_text(encoding="utf-8")
    required_runtime_packages = (
        "alembic",
        "email-validator",
        "fastapi",
        "httpx",
        "psycopg",
        "PyJWT",
        "pydantic-settings",
        "sqlalchemy",
        "uvicorn",
    )
    for package in required_runtime_packages:
        if package.lower() not in project.lower():
            errors.append(f"backend/pyproject.toml: missing required runtime package {package}")
        if package.lower() not in dockerfile.lower():
            errors.append(f"backend/Dockerfile.prod: missing required runtime package {package}")


def _verify_lightsail_staging(errors: list[str]) -> None:
    paths = (
        LIGHTSAIL_COMPOSE,
        LIGHTSAIL_ENV,
        LIGHTSAIL_CADDY,
        LIGHTSAIL_BUDGET,
        LIGHTSAIL_INITIALIZE_ENV,
        LIGHTSAIL_SET_DEEPSEEK_KEY,
        LIGHTSAIL_SET_ADMIN_CREDENTIALS,
    )
    for path in paths:
        if not path.is_file():
            errors.append(f"{path.relative_to(REPO_ROOT)}: required Lightsail file is missing")
            return

    compose = LIGHTSAIL_COMPOSE.read_text(encoding="utf-8")
    env_example = LIGHTSAIL_ENV.read_text(encoding="utf-8")
    caddy = LIGHTSAIL_CADDY.read_text(encoding="utf-8")
    budget = LIGHTSAIL_BUDGET.read_text(encoding="utf-8")
    required_compose_markers = (
        "APP_ENV: staging",
        'DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}',
        "https://api.deepseek.com/v1/chat/completions",
        'read_only: true',
        'no-new-privileges:true',
        'internal: true',
        'VITE_API_BASE_URL: /api',
        'ADMIN_PASSWORD_HASH: ${ADMIN_PASSWORD_HASH:-}',
        'LOCAL_LLM_REPAIR_FALLBACK_ENABLED: "true"',
        'FORWARDED_ALLOW_IPS: "*"',
    )
    for marker in required_compose_markers:
        if marker not in compose:
            errors.append(f"infra/lightsail/compose.yml: missing guard {marker!r}")
    backend_block = compose.split("  backend:", maxsplit=1)[-1].split("\n  web:", maxsplit=1)[0]
    if "networks: [public, private]" not in backend_block:
        errors.append(
            "Lightsail backend must retain private database access and public outbound DeepSeek access"
        )
    if "REPLACE_ON_SERVER_ONLY" not in env_example:
        errors.append("Lightsail env example must use a non-secret DeepSeek placeholder")
    if re.search(r"DEEPSEEK_API_KEY=(sk-|[A-Za-z0-9]{24,})", env_example):
        errors.append("Lightsail env example must not contain a plausible DeepSeek secret")
    if (
        "{$DOMAIN}" not in caddy
        or "handle_path /api/*" not in caddy
        or "reverse_proxy backend:8000" not in caddy
        or "reverse_proxy web:8080" not in caddy
    ):
        errors.append("Lightsail Caddyfile must terminate HTTPS and proxy to backend")
    legacy_paths = re.search(r"@legacy_api path ([^\n]+)", caddy)
    if legacy_paths and "/metrics" in legacy_paths.group(1).split():
        errors.append("Lightsail Caddyfile must not expose /metrics on the legacy unprefixed path")
    if "ports:" in backend_block:
        errors.append("Lightsail backend must not publish ports; FORWARDED_ALLOW_IPS trusts every peer")
    for marker in ('Amount = "10"', 'NotificationType = "ACTUAL"', 'Threshold = 80', 'NotificationType = "FORECASTED"'):
        if marker not in budget:
            errors.append(f"Lightsail budget script: missing guard {marker!r}")
    initialize_env = LIGHTSAIL_INITIALIZE_ENV.read_text(encoding="utf-8")
    set_deepseek_key = LIGHTSAIL_SET_DEEPSEEK_KEY.read_text(encoding="utf-8")
    set_admin_credentials = LIGHTSAIL_SET_ADMIN_CREDENTIALS.read_text(encoding="utf-8")
    if "openssl rand -hex 24" not in initialize_env or "chmod 600" not in initialize_env:
        errors.append("Lightsail environment initializer must generate and restrict server secrets")
    if "read -r -s deepseek_key" not in set_deepseek_key or "DEEPSEEK_API_KEY=%s" not in set_deepseek_key:
        errors.append("Lightsail DeepSeek helper must accept the key without echoing it")
    if (
        "read -r -s admin_password" not in set_admin_credentials
        or "hash_admin_password" not in set_admin_credentials
        or "ADMIN_PASSWORD_HASH=" not in set_admin_credentials
    ):
        errors.append("Lightsail admin helper must hash a no-echo password before storage")
    plaintext_admin_assignment = re.compile(
        r"(?im)^\s*ADMIN_PASSWORD(?!_HASH)\s*[:=]\s*[\"']?[^$\s][^\n]*$"
    )
    for label, content in (
        ("infra/lightsail/compose.yml", compose),
        ("infra/lightsail/.env.example", env_example),
        ("infra/lightsail/set-admin-credentials.sh", set_admin_credentials),
    ):
        if plaintext_admin_assignment.search(content):
            errors.append(f"{label}: must never store a plaintext admin password assignment")


def _verify_authentication_defaults(local_env: dict[str, str], errors: list[str]) -> None:
    _require(local_env, "ALLOW_DEV_AUTH", "false", label=".env.example", errors=errors)
    _require(local_env, "EXPO_PUBLIC_ALLOW_DEV_AUTH", "false", label=".env.example", errors=errors)


def main() -> int:
    errors: list[str] = []
    local_env = _parse_env_file(LOCAL_ENV)

    _require(local_env, "APP_ENV", "local", label=".env.example", errors=errors)
    _require(local_env, "ENABLE_DEBUG_TOOLS", "false", label=".env.example", errors=errors)
    _require(local_env, "VITE_ENABLE_DEBUG_TOOLS", "false", label=".env.example", errors=errors)
    _require(local_env, "EXPO_PUBLIC_ENABLE_DEBUG_TOOLS", "false", label=".env.example", errors=errors)
    _require(
        _parse_env_file(MOBILE_ENV_EXAMPLE),
        "EXPO_PUBLIC_ENABLE_DEV_SERVER_SWITCHER",
        "false",
        label="mobile/.env.example",
        errors=errors,
    )
    _require_int_at_most(
        local_env,
        "LOCAL_LLM_MAX_TOKENS",
        960,
        label=".env.example",
        errors=errors,
    )

    # The Lightsail stack is the only deployment target; hold its backend to the
    # same safety limits a production deployment needs.
    label = "infra/lightsail/compose.yml (backend)"
    backend_env = _parse_compose_service_env(LIGHTSAIL_COMPOSE, "backend")
    _require(backend_env, "LOG_LEVEL", "info", label=label, errors=errors)
    _require(backend_env, "ENABLE_DEBUG_TOOLS", "false", label=label, errors=errors)
    _require(backend_env, "ALLOW_DEV_AUTH", "${ALLOW_DEV_AUTH:-false}", label=label, errors=errors)
    _require(backend_env, "AUTH_JWT_REQUIRE_JTI", "true", label=label, errors=errors)
    _require(backend_env, "AUTH_JWT_ISSUER", "${AUTH_JWT_ISSUER}", label=label, errors=errors)
    _require(backend_env, "AUTH_JWT_AUDIENCE", "${AUTH_JWT_AUDIENCE}", label=label, errors=errors)
    _require_int_at_most(backend_env, "LOCAL_LLM_MAX_TOKENS", 900, label=label, errors=errors)
    _require_int_at_most(backend_env, "LOCAL_LLM_TIMEOUT_SECONDS", 45, label=label, errors=errors)
    _require_int_at_most(backend_env, "MAX_REQUEST_BODY_BYTES", 1048576, label=label, errors=errors)
    _require_int_at_most(backend_env, "AUTH_LOGIN_CLIENT_RATE_LIMIT_COUNT", 100, label=label, errors=errors)
    _require_not_contains(backend_env, "BACKEND_CORS_ORIGINS", "*", label=label, errors=errors)
    lightsail_env = _parse_env_file(LIGHTSAIL_ENV)
    _require(lightsail_env, "ALLOW_DEV_AUTH", "false", label="infra/lightsail/.env.example", errors=errors)
    _require_not_contains(
        lightsail_env, "BACKEND_CORS_ORIGINS", "*", label="infra/lightsail/.env.example", errors=errors
    )
    if r"printf 'ALLOW_DEV_AUTH=false\n'" not in LIGHTSAIL_INITIALIZE_ENV.read_text(encoding="utf-8"):
        errors.append("infra/lightsail/initialize-env.sh must write ALLOW_DEV_AUTH=false")

    _verify_backend_production_dependencies(errors)
    _verify_lightsail_staging(errors)
    _verify_authentication_defaults(local_env, errors)

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    print("Deployment config examples verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
