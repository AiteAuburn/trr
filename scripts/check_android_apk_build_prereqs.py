#!/usr/bin/env python3
"""Check Android APK build prerequisites without modifying local SDK state."""

from __future__ import annotations

import argparse
import json
import os
import platform
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
ANDROID_ROOT = REPO_ROOT / "mobile" / "android"
LOCAL_PROPERTIES = ANDROID_ROOT / "local.properties"
ROOT_BUILD_GRADLE = ANDROID_ROOT / "build.gradle"


def _read_properties(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if not line or line.lstrip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def _is_wsl() -> bool:
    release = platform.release().lower()
    if "microsoft" in release or "wsl" in release:
        return True
    proc_version = Path("/proc/version")
    if proc_version.exists():
        return "microsoft" in proc_version.read_text(encoding="utf-8", errors="replace").lower()
    return False


def _windows_path_to_wsl(value: str) -> Path | None:
    if len(value) < 3 or value[1:3] != ":/":
        return None
    drive = value[0].lower()
    rest = value[3:]
    return Path("/mnt") / drive / rest


def _mounted_windows_path_to_windows(value: str) -> str:
    normalized = value.replace("\\", "/")
    parts = normalized.split("/")
    if len(parts) < 4 or parts[1] != "mnt" or len(parts[2]) != 1:
        return ""
    drive = parts[2].upper()
    return f"{drive}:/" + "/".join(parts[3:])


def _is_mounted_windows_sdk_path(value: str) -> bool:
    normalized = value.replace("\\", "/").lower()
    return normalized.startswith("/mnt/") and "/appdata/local/android/sdk" in normalized


def _sdk_path(value: str) -> Path | None:
    if not value:
        return None
    windows_as_wsl = _windows_path_to_wsl(value)
    if windows_as_wsl is not None:
        return windows_as_wsl
    return Path(value)


def _configured_build_tools_version() -> str:
    if not ROOT_BUILD_GRADLE.exists():
        return ""
    content = ROOT_BUILD_GRADLE.read_text(encoding="utf-8", errors="replace")
    match = re.search(r"buildToolsVersion\s*=\s*findProperty\('android\.buildToolsVersion'\)\s*\?:\s*'([^']+)'", content)
    return match.group(1) if match else ""


def _run_text(command: list[str], cwd: Path | None = None) -> str:
    try:
        result = subprocess.run(command, cwd=cwd, check=False, text=True, capture_output=True, timeout=20)
    except (OSError, subprocess.SubprocessError):
        return ""
    return (result.stdout + "\n" + result.stderr).strip()


def inspect() -> dict[str, Any]:
    props = _read_properties(LOCAL_PROPERTIES)
    sdk_dir_value = props.get("sdk.dir", "")
    sdk_path = _sdk_path(sdk_dir_value)
    running_wsl = _is_wsl()
    windows_sdk_path = _windows_path_to_wsl(sdk_dir_value) is not None or _is_mounted_windows_sdk_path(sdk_dir_value)
    java_path = shutil.which("java")
    gradle_wrapper = ANDROID_ROOT / ("gradlew.bat" if os.name == "nt" else "gradlew")
    configured_build_tools_version = _configured_build_tools_version()
    build_tools_root = sdk_path / "build-tools" if sdk_path is not None else None
    build_tools = (
        sorted(path.name for path in build_tools_root.iterdir() if path.is_dir())
        if build_tools_root is not None and build_tools_root.exists()
        else []
    )

    blockers: list[str] = []
    warnings: list[str] = []
    recommendations: list[str] = []

    if not java_path:
        blockers.append("java is not available on PATH; install JDK 17 and set JAVA_HOME")
    if not gradle_wrapper.exists():
        blockers.append(f"missing Gradle wrapper: {gradle_wrapper}")
    if not sdk_dir_value:
        blockers.append("mobile/android/local.properties is missing sdk.dir")
    elif running_wsl and windows_sdk_path:
        blockers.append(
            "WSL Gradle is configured with a Windows Android SDK path; build with gradlew.bat in PowerShell or install a Linux Android SDK"
        )
    elif sdk_path is None or not sdk_path.exists():
        blockers.append(f"sdk.dir does not exist from this environment: {sdk_dir_value}")
    if sdk_path is not None and sdk_path.exists() and not build_tools:
        blockers.append("Android SDK build-tools are missing")
    if configured_build_tools_version:
        configured_build_tools_dir = build_tools_root / configured_build_tools_version if build_tools_root is not None else None
        if configured_build_tools_dir is None or not configured_build_tools_dir.exists():
            blockers.append(f"configured Android build-tools {configured_build_tools_version} are missing")
        else:
            required_tool = "aapt.exe" if os.name == "nt" else "aapt"
            alternate_tool = "aapt" if os.name == "nt" else "aapt.exe"
            if not (configured_build_tools_dir / required_tool).exists():
                blockers.append(
                    f"configured Android build-tools {configured_build_tools_version} are not usable from this environment; "
                    f"missing {required_tool}"
                )
                if (configured_build_tools_dir / alternate_tool).exists():
                    warnings.append(
                        f"configured build-tools {configured_build_tools_version} only has {alternate_tool}; "
                        "use Windows Gradle/PowerShell or install a Linux Android SDK for WSL builds"
                    )

    if "35.0.0" in build_tools and running_wsl and windows_sdk_path:
        warnings.append("Windows build-tools 35.0.0 under /mnt/c can be reported as corrupted by Linux Gradle")
    if running_wsl and str(ANDROID_ROOT).startswith("/mnt/"):
        warnings.append("building Android projects directly under /mnt/* can trigger Gradle I/O errors; prefer PowerShell or copy to Linux storage")

    if running_wsl and windows_sdk_path:
        windows_sdk_dir = _mounted_windows_path_to_windows(sdk_dir_value)
        if windows_sdk_dir:
            recommendations.append(
                f"for Windows PowerShell builds, set mobile/android/local.properties sdk.dir={windows_sdk_dir} first"
            )
        recommendations.append("then run from Windows PowerShell: cd D:\\bloodsugar\\mobile\\android; .\\gradlew.bat assembleRelease")
    if running_wsl:
        recommendations.append("for WSL-only builds, install Linux Android SDK and set sdk.dir=/home/aite/Android/Sdk")
        recommendations.append("set GRADLE_USER_HOME=/tmp/bloodsugar-gradle if ~/.gradle is unavailable or read-only")
    recommendations.append("debug APKs need Metro; use assembleRelease for a standalone APK")

    return {
        "environment": {
            "os_name": os.name,
            "platform": platform.platform(),
            "wsl": running_wsl,
            "cwd": str(Path.cwd()),
        },
        "java": {
            "path": java_path,
            "version": _run_text(["java", "-version"]) if java_path else "",
            "JAVA_HOME": os.environ.get("JAVA_HOME", ""),
        },
        "android": {
            "local_properties": str(LOCAL_PROPERTIES),
            "sdk_dir": sdk_dir_value,
            "resolved_sdk_dir": str(sdk_path) if sdk_path is not None else "",
            "windows_sdk_path": windows_sdk_path,
            "sdk_exists": bool(sdk_path and sdk_path.exists()),
            "build_tools": build_tools,
            "configured_build_tools_version": configured_build_tools_version,
            "gradle_wrapper": str(gradle_wrapper),
            "gradle_wrapper_exists": gradle_wrapper.exists(),
        },
        "apk_build_ready": not blockers,
        "blockers": blockers,
        "warnings": warnings,
        "recommendations": recommendations,
        "safety": {
            "read_only": True,
            "phi_safe": True,
            "backend_calls": False,
            "database_writes": False,
            "ai_llm_stt_vision_calls": False,
            "payment_calls": False,
            "production_credentials": False,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--evidence", type=Path)
    args = parser.parse_args()
    evidence = inspect()
    if args.evidence is not None:
        args.evidence.parent.mkdir(parents=True, exist_ok=True)
        args.evidence.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(evidence, ensure_ascii=False, indent=2))
    return 0 if evidence["apk_build_ready"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
