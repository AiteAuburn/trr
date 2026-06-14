#!/usr/bin/env python3
"""Verify mobile release-style environment does not ship local dev auth."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
MOBILE_ENV_PATH = REPO_ROOT / "mobile" / ".env"
LOCAL_API_HOST_MARKERS = (
    "localhost",
    "127.0.0.1",
    "10.0.2.2",
    "192.168.",
    "172.16.",
    "172.17.",
    "172.18.",
    "172.19.",
    "172.20.",
    "172.21.",
    "172.22.",
    "172.23.",
    "172.24.",
    "172.25.",
    "172.26.",
    "172.27.",
    "172.28.",
    "172.29.",
    "172.30.",
    "172.31.",
)


def _read_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        values[key.strip()] = value.strip().strip("'\"")
    return values


def _effective_env() -> dict[str, str]:
    values = _read_env_file(MOBILE_ENV_PATH)
    for key in (
        "EXPO_PUBLIC_API_BASE_URL",
        "EXPO_PUBLIC_ALLOW_DEV_AUTH",
        "EXPO_PUBLIC_ENABLE_DEBUG_TOOLS",
        "EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE",
    ):
        if key in os.environ:
            values[key] = os.environ[key]
    return values


def _is_true(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


def verify(allow_local_api: bool) -> list[str]:
    env = _effective_env()
    errors: list[str] = []
    api_base_url = env.get("EXPO_PUBLIC_API_BASE_URL", "").strip()
    if not api_base_url:
        errors.append("EXPO_PUBLIC_API_BASE_URL must be set for release-style mobile builds")
    elif not (api_base_url.startswith("https://") or allow_local_api):
        errors.append("EXPO_PUBLIC_API_BASE_URL must use https:// for release-style mobile builds")
    if api_base_url and not allow_local_api and any(marker in api_base_url for marker in LOCAL_API_HOST_MARKERS):
        errors.append("EXPO_PUBLIC_API_BASE_URL must not point at localhost, emulator, LAN, or private-network hosts")
    if _is_true(env.get("EXPO_PUBLIC_ALLOW_DEV_AUTH", "")):
        errors.append("EXPO_PUBLIC_ALLOW_DEV_AUTH must be false or omitted for release-style mobile builds")
    if _is_true(env.get("EXPO_PUBLIC_ENABLE_DEBUG_TOOLS", "")):
        errors.append("EXPO_PUBLIC_ENABLE_DEBUG_TOOLS must be false or omitted for release-style mobile builds")
    if env.get("EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE", "").strip():
        errors.append("EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE must be unset for release-style mobile builds")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--allow-local-api",
        action="store_true",
        help="Allow local/private API URLs for internal release APK smoke builds.",
    )
    args = parser.parse_args()
    errors = verify(allow_local_api=args.allow_local_api)
    if errors:
        for error in errors:
            print(f"Mobile release env verification failed: {error}", file=sys.stderr)
        return 1
    print("Mobile release env verified: dev auth disabled, debug tools disabled, release API boundary set.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
