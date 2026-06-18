#!/usr/bin/env python3
"""Verify Android APK preflight npm scripts keep release guardrails wired."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
PACKAGE_JSON = REPO_ROOT / "mobile" / "package.json"
README = REPO_ROOT / "README.md"
ANDROID_APP_BUILD_GRADLE = REPO_ROOT / "mobile" / "android" / "app" / "build.gradle"
APK_PREREQ_SCRIPT = REPO_ROOT / "scripts" / "check_android_apk_build_prereqs.py"

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
    package_text = PACKAGE_JSON.read_text(encoding="utf-8")
    package = json.loads(package_text)
    readme = README.read_text(encoding="utf-8")
    build_gradle = ANDROID_APP_BUILD_GRADLE.read_text(encoding="utf-8")
    prereq_script = APK_PREREQ_SCRIPT.read_text(encoding="utf-8")
    scripts = package.get("scripts", {})
    errors: list[str] = []

    dependency_key_counts = Counter(
        match.group(1)
        for match in re.finditer(r'^\s{4}"([^"]+)":\s*"[^"]+"[,}]?$', package_text, flags=re.MULTILINE)
    )
    for key, count in sorted(dependency_key_counts.items()):
        if count > 1:
            errors.append(f"mobile/package.json dependency key {key!r} is duplicated {count} times")

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

    required_readme_markers = {
        "debug APKs require Metro": "Debug APKs load JavaScript from Metro",
        "release APK is standalone": "For a standalone APK that does not require Metro, build release:",
        "release command": "./gradlew assembleRelease",
        "release output path": "mobile/android/app/build/outputs/apk/release/app-release.apk",
        "Windows PowerShell release command": ".\\gradlew.bat assembleRelease",
        "Windows local.properties SDK path": "sdk.dir=C:/Users/robin/AppData/Local/Android/Sdk",
        "WSL Windows SDK mismatch warning": "Do not run Linux Gradle in WSL against the Windows SDK path",
    }
    for label, marker in required_readme_markers.items():
        if marker not in readme:
            errors.append(f"README must document {label}: missing {marker!r}")

    required_gradle_markers = {
        "Expo embedded release bundle": 'bundleCommand = "export:embed"',
        "Expo CLI bundle path": "require.resolve('@expo/cli'",
        "release build type": "release {",
    }
    for label, marker in required_gradle_markers.items():
        if marker not in build_gradle:
            errors.append(f"Android Gradle config must keep {label}: missing {marker!r}")

    required_prereq_markers = {
        "configured build-tools version": "def _configured_build_tools_version()",
        "mounted Windows SDK path detection": "def _is_mounted_windows_sdk_path(value: str) -> bool:",
        "mounted path PowerShell conversion": "def _mounted_windows_path_to_windows(value: str) -> str:",
        "PowerShell sdk.dir recommendation": "for Windows PowerShell builds, set mobile/android/local.properties sdk.dir=",
        "Linux aapt requirement": 'required_tool = "aapt.exe" if os.name == "nt" else "aapt"',
        "Windows SDK alternate aapt warning": 'alternate_tool = "aapt" if os.name == "nt" else "aapt.exe"',
        "corrupted build-tools blocker": "are not usable from this environment",
    }
    for label, marker in required_prereq_markers.items():
        if marker not in prereq_script:
            errors.append(f"Android APK prereq checker must keep {label}: missing {marker!r}")

    if errors:
        for error in errors:
            print(f"Android APK script verification failed: {error}", file=sys.stderr)
        return 1

    print(
        "Android APK scripts verified: production/internal preflight guardrails are wired, "
        "README documents standalone release APK export, and Gradle embeds the Expo JS bundle."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
