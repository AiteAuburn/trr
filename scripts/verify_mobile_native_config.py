#!/usr/bin/env python3
"""Verify app.json values that must stay aligned with committed Android files."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MOBILE = ROOT / "mobile"


def require(text: str, token: str, source: Path) -> None:
    if token not in text:
        raise SystemExit(f"Native config drift: {source.relative_to(ROOT)} is missing {token!r}")


def main() -> None:
    expo = json.loads((MOBILE / "app.json").read_text(encoding="utf-8"))["expo"]
    manifest_path = MOBILE / "android/app/src/main/AndroidManifest.xml"
    app_gradle_path = MOBILE / "android/app/build.gradle"
    main_application_path = MOBILE / "android/app/src/main/java/app/bloodsugar/mobile/MainApplication.kt"
    settings_path = MOBILE / "android/settings.gradle"
    wrapper_path = MOBILE / "android/gradle/wrapper/gradle-wrapper.properties"

    manifest = manifest_path.read_text(encoding="utf-8")
    app_gradle = app_gradle_path.read_text(encoding="utf-8")
    main_application = main_application_path.read_text(encoding="utf-8")
    settings = settings_path.read_text(encoding="utf-8")
    wrapper = wrapper_path.read_text(encoding="utf-8")

    package_name = expo["android"]["package"]
    require(app_gradle, f"namespace '{package_name}'", app_gradle_path)
    require(app_gradle, f"applicationId '{package_name}'", app_gradle_path)
    require(manifest, f'android:scheme="{expo["scheme"]}"', manifest_path)
    if expo.get("orientation") == "portrait":
        require(manifest, 'android:screenOrientation="portrait"', manifest_path)
    if "expo-audio" in expo.get("plugins", []):
        require(manifest, "expo.modules.audio.service.AudioControlsService", manifest_path)

    require(settings, 'id("expo-autolinking-settings")', settings_path)
    require(main_application, "ExpoReactHostFactory", main_application_path)
    require(main_application, "loadReactNative(this)", main_application_path)
    require(wrapper, "gradle-9.3.1-bin.zip", wrapper_path)
    print("Mobile native config verified: app identity, scheme, orientation, Expo audio, autolinking, and SDK 57 bootstrap are aligned.")


if __name__ == "__main__":
    main()
