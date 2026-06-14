#!/usr/bin/env python3
"""Verify that Android release builds are not accidentally debug-signed."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
APP_BUILD_GRADLE = REPO_ROOT / "mobile" / "android" / "app" / "build.gradle"


def strip_comments(source: str) -> str:
    source = re.sub(r"/\*.*?\*/", "", source, flags=re.DOTALL)
    return re.sub(r"//.*", "", source)


def extract_named_block(source: str, name: str) -> str | None:
    match = re.search(rf"\b{name}\s*\{{", source)
    if not match:
        return None

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
    return None


def find_release_signing_config(build_gradle: str) -> str | None:
    uncommented = strip_comments(build_gradle)
    build_types = extract_named_block(uncommented, "buildTypes")
    if build_types is None:
        return None

    release = extract_named_block(build_types, "release")
    if release is None:
        return None

    match = re.search(r"\bsigningConfig\s+([^\n\r]+)", release)
    if not match:
        return None
    return match.group(1).strip()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fail production Android release builds that still use debug signing."
    )
    parser.add_argument(
        "--allow-debug-signing",
        action="store_true",
        help="Allow the current debug-signed release APK path for internal install smoke tests only.",
    )
    args = parser.parse_args()

    if not APP_BUILD_GRADLE.exists():
        print(f"ERROR: Missing Android Gradle file: {APP_BUILD_GRADLE}")
        return 1

    signing_config = find_release_signing_config(APP_BUILD_GRADLE.read_text())
    if signing_config is None:
        print("ERROR: Could not find release.signingConfig in mobile/android/app/build.gradle.")
        print("Add an explicit production release signing config before distributing APK/AAB builds.")
        return 1

    normalized = re.sub(r"\s+", "", signing_config).lower()
    uses_debug = "signingconfigs.debug" in normalized

    if uses_debug and not args.allow_debug_signing:
        print("ERROR: Android release build is signed with signingConfigs.debug.")
        print("This APK is only suitable for internal install smoke tests.")
        print("For production distribution, create a real release keystore and use a non-debug signingConfig.")
        print("For an internal release smoke APK, rerun with --allow-debug-signing.")
        return 1

    if uses_debug:
        print("Android release signing verified for internal smoke use: debug signing explicitly allowed.")
        return 0

    if "debug" in normalized:
        print(f"ERROR: Android release signing config still looks debug-related: {signing_config}")
        print("Use a clearly named non-debug release signingConfig for production distribution.")
        return 1

    print(f"Android release signing verified: release uses {signing_config}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
