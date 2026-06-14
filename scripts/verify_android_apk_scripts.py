#!/usr/bin/env python3
"""Verify Android APK preflight npm scripts keep release guardrails wired."""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
PACKAGE_JSON = REPO_ROOT / "mobile" / "package.json"

REQUIRED_SCRIPTS = {
    "verify:release-env": "python3 ../scripts/verify_mobile_release_env.py",
    "verify:android-release-signing": "python3 ../scripts/verify_android_release_signing.py",
    "apk:android-prereqs": "python3 ../scripts/check_android_apk_build_prereqs.py",
    "preflight:android-apk:production": (
        "npm run verify:release-env && npm run verify:android-release-signing && npm run apk:android-prereqs"
    ),
    "preflight:android-apk:internal": (
        "npm run verify:release-env -- --allow-local-api && "
        "npm run verify:android-release-signing -- --allow-debug-signing && "
        "npm run apk:android-prereqs"
    ),
}

FORBIDDEN_PRODUCTION_FLAGS = {
    "--allow-local-api",
    "--allow-debug-signing",
}


def main() -> int:
    package = json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))
    scripts = package.get("scripts", {})
    errors: list[str] = []

    for name, expected in REQUIRED_SCRIPTS.items():
        actual = scripts.get(name)
        if actual != expected:
            errors.append(f"{name} must be {expected!r}; found {actual!r}")

    production = scripts.get("preflight:android-apk:production", "")
    for flag in FORBIDDEN_PRODUCTION_FLAGS:
        if flag in production:
            errors.append(f"preflight:android-apk:production must not include {flag}")

    internal = scripts.get("preflight:android-apk:internal", "")
    for marker in ("--allow-local-api", "--allow-debug-signing", "apk:android-prereqs"):
        if marker not in internal:
            errors.append(f"preflight:android-apk:internal must include {marker}")

    quality = scripts.get("quality", "")
    if "npm run verify:android-apk-scripts" not in quality:
        errors.append("quality must include npm run verify:android-apk-scripts")

    if errors:
        for error in errors:
            print(f"Android APK script verification failed: {error}", file=sys.stderr)
        return 1

    print("Android APK scripts verified: production/internal preflight guardrails are wired.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
