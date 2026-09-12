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
CI_WORKFLOW = REPO_ROOT / ".github" / "workflows" / "ci.yml"
BACKEND_PROJECT = REPO_ROOT / "backend" / "pyproject.toml"
BACKEND_PROD_DOCKERFILE = REPO_ROOT / "backend" / "Dockerfile.prod"
AWS_TERRAFORM_MAIN = REPO_ROOT / "infra" / "aws" / "terraform" / "main.tf"
AWS_TERRAFORM_VARIABLES = REPO_ROOT / "infra" / "aws" / "terraform" / "variables.tf"
AWS_TERRAFORM_EXAMPLE = REPO_ROOT / "infra" / "aws" / "terraform" / "terraform.tfvars.example"
LIGHTSAIL_COMPOSE = REPO_ROOT / "infra" / "lightsail" / "compose.yml"
LIGHTSAIL_ENV = REPO_ROOT / "infra" / "lightsail" / ".env.example"
LIGHTSAIL_CADDY = REPO_ROOT / "infra" / "lightsail" / "Caddyfile"
LIGHTSAIL_BUDGET = REPO_ROOT / "infra" / "lightsail" / "create-budget.ps1"
LIGHTSAIL_INITIALIZE_ENV = REPO_ROOT / "infra" / "lightsail" / "initialize-env.sh"
LIGHTSAIL_SET_DEEPSEEK_KEY = REPO_ROOT / "infra" / "lightsail" / "set-deepseek-key.sh"


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


def _verify_ci_workflow(errors: list[str]) -> None:
    workflow = CI_WORKFLOW.read_text(encoding="utf-8")
    required_markers = (
        "\n  push:\n    branches:\n      - main\n",
        "\n  pull_request:\n    branches:\n      - main\n",
        "\n  workflow_dispatch:\n",
        "\npermissions:\n  contents: read\n",
        "npm audit --audit-level=high",
        "bloodsugar-backend-release",
        "bloodsugar-web-release",
        "bloodsugar-proxy-release",
        "TRIVY_SBOM_SOURCES: rekor",
        "python scripts/verify_release_contract.py",
        "python scripts/verify_feature_flags.py",
        "python scripts/verify_api_migration_compatibility.py",
    )
    for marker in required_markers:
        if marker not in workflow:
            errors.append(f".github/workflows/ci.yml: missing required CI guard {marker.strip()!r}")
    if "security-events: write" in workflow:
        errors.append(
            ".github/workflows/ci.yml: security-events write permission is unused and must remain disabled"
        )


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


def _verify_aws_terraform(errors: list[str]) -> None:
    paths = (AWS_TERRAFORM_MAIN, AWS_TERRAFORM_VARIABLES, AWS_TERRAFORM_EXAMPLE)
    for path in paths:
        if not path.is_file():
            errors.append(f"{path.relative_to(REPO_ROOT)}: required AWS Terraform file is missing")
            return

    main = AWS_TERRAFORM_MAIN.read_text(encoding="utf-8")
    variables = AWS_TERRAFORM_VARIABLES.read_text(encoding="utf-8")
    example = AWS_TERRAFORM_EXAMPLE.read_text(encoding="utf-8")
    required_main_markers = (
        'manage_master_user_password = true',
        'publicly_accessible         = false',
        'storage_encrypted           = true',
        'image_tag_mutability = "IMMUTABLE"',
        'scan_on_push = true',
        'valueFrom = "${aws_secretsmanager_secret.runtime.arn}:${key}::"',
        'value = "https://api.deepseek.com/v1/chat/completions"',
        'var.desired_count == 0 || var.certificate_arn != ""',
        'assign_public_ip = false',
    )
    for marker in required_main_markers:
        if marker not in main:
            errors.append(f"infra/aws/terraform/main.tf: missing security marker {marker!r}")

    if "DEEPSEEK_API_KEY" not in main:
        errors.append("infra/aws/terraform/main.tf: DeepSeek secret injection is missing")
    if re.search(r'name\s*=\s*"DEEPSEEK_API_KEY"\s*,?\s*value\s*=', main):
        errors.append("infra/aws/terraform/main.tf: DeepSeek key must not be a plaintext environment value")
    if "DEEPSEEK_API_KEY" in variables or "DEEPSEEK_API_KEY" in example:
        errors.append("AWS Terraform inputs must not accept the DeepSeek API key as Terraform state")
    if 'desired_count          = 0' not in example:
        errors.append("terraform.tfvars.example must bootstrap with desired_count=0")


def _verify_lightsail_staging(errors: list[str]) -> None:
    paths = (
        LIGHTSAIL_COMPOSE,
        LIGHTSAIL_ENV,
        LIGHTSAIL_CADDY,
        LIGHTSAIL_BUDGET,
        LIGHTSAIL_INITIALIZE_ENV,
        LIGHTSAIL_SET_DEEPSEEK_KEY,
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
    )
    for marker in required_compose_markers:
        if marker not in compose:
            errors.append(f"infra/lightsail/compose.yml: missing guard {marker!r}")
    if "REPLACE_ON_SERVER_ONLY" not in env_example:
        errors.append("Lightsail env example must use a non-secret DeepSeek placeholder")
    if re.search(r"DEEPSEEK_API_KEY=(sk-|[A-Za-z0-9]{24,})", env_example):
        errors.append("Lightsail env example must not contain a plausible DeepSeek secret")
    if "{$DOMAIN}" not in caddy or "reverse_proxy backend:8000" not in caddy:
        errors.append("Lightsail Caddyfile must terminate HTTPS and proxy to backend")
    for marker in ('Amount = "10"', 'NotificationType = "ACTUAL"', 'Threshold = 80', 'NotificationType = "FORECASTED"'):
        if marker not in budget:
            errors.append(f"Lightsail budget script: missing guard {marker!r}")
    initialize_env = LIGHTSAIL_INITIALIZE_ENV.read_text(encoding="utf-8")
    set_deepseek_key = LIGHTSAIL_SET_DEEPSEEK_KEY.read_text(encoding="utf-8")
    if "openssl rand -hex 24" not in initialize_env or "chmod 600" not in initialize_env:
        errors.append("Lightsail environment initializer must generate and restrict server secrets")
    if "read -r -s deepseek_key" not in set_deepseek_key or "DEEPSEEK_API_KEY=%s" not in set_deepseek_key:
        errors.append("Lightsail DeepSeek helper must accept the key without echoing it")


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

    _verify_ci_workflow(errors)
    _verify_backend_production_dependencies(errors)
    _verify_aws_terraform(errors)
    _verify_lightsail_staging(errors)

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    print("Deployment config examples verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
