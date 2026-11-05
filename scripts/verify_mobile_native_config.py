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
    network_security_config_path = MOBILE / "android/app/src/main/res/xml/network_security_config.xml"
    app_gradle_path = MOBILE / "android/app/build.gradle"
    proguard_path = MOBILE / "android/app/proguard-rules.pro"
    main_application_path = MOBILE / "android/app/src/main/java/app/bloodsugar/mobile/MainApplication.kt"
    settings_path = MOBILE / "android/settings.gradle"
    wrapper_path = MOBILE / "android/gradle/wrapper/gradle-wrapper.properties"
    mobile_package_path = MOBILE / "package.json"
    native_models_path = MOBILE / "nativeLocalModels.ts"
    pcm_capture_path = MOBILE / "whisperPcmCapture.ts"
    pcm_patch_path = ROOT / "scripts/patch_mobile_pcm_recorder.cjs"

    manifest = manifest_path.read_text(encoding="utf-8")
    network_security_config = network_security_config_path.read_text(encoding="utf-8")
    app_gradle = app_gradle_path.read_text(encoding="utf-8")
    proguard = proguard_path.read_text(encoding="utf-8")
    main_application = main_application_path.read_text(encoding="utf-8")
    settings = settings_path.read_text(encoding="utf-8")
    wrapper = wrapper_path.read_text(encoding="utf-8")
    mobile_package = json.loads(mobile_package_path.read_text(encoding="utf-8"))
    native_models = native_models_path.read_text(encoding="utf-8")
    pcm_capture = pcm_capture_path.read_text(encoding="utf-8")
    pcm_patch = pcm_patch_path.read_text(encoding="utf-8")
    require(pcm_capture, "await LiveAudioStream.init({", pcm_capture_path)

    package_name = expo["android"]["package"]
    require(app_gradle, f"namespace '{package_name}'", app_gradle_path)
    require(app_gradle, f"applicationId '{package_name}'", app_gradle_path)
    require(manifest, f'android:scheme="{expo["scheme"]}"', manifest_path)
    if expo.get("orientation") == "portrait":
        require(manifest, 'android:screenOrientation="portrait"', manifest_path)
    if "expo-audio" in expo.get("plugins", []):
        require(manifest, "expo.modules.audio.service.AudioControlsService", manifest_path)
    require(manifest, 'android:name="android.permission.RECORD_AUDIO"', manifest_path)
    for package_name in ("whisper.rn", "@fugood/react-native-audio-pcm-stream"):
        if package_name not in mobile_package.get("dependencies", {}):
            raise SystemExit(f"Native config drift: mobile/package.json is missing {package_name!r}")
    require(proguard, "-keep class com.rnwhisper.** { *; }", proguard_path)
    require(native_models, "audioData: ArrayBuffer;", native_models_path)
    require(native_models, "context.transcribeData(audioData, {", native_models_path)
    require(pcm_capture, "return pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength);", pcm_capture_path)
    if mobile_package.get("scripts", {}).get("postinstall") != "node ../scripts/patch_mobile_pcm_recorder.cjs":
        raise SystemExit("Native config drift: the awaitable PCM recorder stop patch must run after mobile dependencies install")
    require(pcm_patch, "public void stop(Promise promise)", pcm_patch_path)
    require(pcm_patch, "thread.join();", pcm_patch_path)
    require(manifest, 'android:networkSecurityConfig="@xml/network_security_config"', manifest_path)
    require(network_security_config, '<base-config cleartextTrafficPermitted="false"', network_security_config_path)
    require(network_security_config, '<domain includeSubdomains="false">10.0.2.2</domain>', network_security_config_path)
    require(network_security_config, '<domain includeSubdomains="false">127.0.0.1</domain>', network_security_config_path)
    require(network_security_config, '<domain includeSubdomains="false">localhost</domain>', network_security_config_path)

    require(settings, 'id("expo-autolinking-settings")', settings_path)
    require(main_application, "ExpoReactHostFactory", main_application_path)
    require(main_application, "loadReactNative(this)", main_application_path)
    require(wrapper, "gradle-9.3.1-bin.zip", wrapper_path)
    print("Mobile native config verified: app identity, microphone permission, Whisper PCM dependency, keep rule, scoped emulator cleartext, Expo audio, autolinking, and SDK 57 bootstrap are aligned.")


if __name__ == "__main__":
    main()
