# Android Release APK 分享手冊

這份文件說明如何做出可以傳給別人安裝的 Android APK。

重點結論：不要分享 `assembleDebug` 產物。Debug APK 需要 Metro / `npx expo start` 才能載入 JavaScript。要分享給別人直接安裝，請用 `assembleRelease`，release APK 會把 Expo JavaScript bundle 和 assets 內嵌進 APK。

## 1. 選擇 release 類型

### Internal install smoke

用途：只給可信任測試者安裝，確認 APK 可以裝、可以開、主要流程可以 smoke test。

允許：

- 暫時使用 local backend API URL。
- 暫時使用 debug signing。

不允許：

- 開啟 dev auth。
- 開啟 debug tools。
- 把這個 APK 當成 production distribution。

### Production-like distribution

用途：準備給正式測試、客戶、商店前測或較廣泛分享。

必須：

- API URL 使用 HTTPS production endpoint。
- `EXPO_PUBLIC_ALLOW_DEV_AUTH=false`。
- `EXPO_PUBLIC_ENABLE_DEBUG_TOOLS=false`。
- 不設定 `EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE`。
- Android release build 不可使用 debug keystore，必須改成正式 release keystore。

## 2. 先跑 preflight

Internal install smoke：

```bash
cd mobile
rtk npm run preflight:android-apk:internal
```

Production-like distribution：

```bash
cd mobile
rtk npm run preflight:android-apk:production
```

如果只想先檢查 Android SDK / Gradle / JDK：

```bash
cd mobile
rtk npm run apk:android-prereqs
```

## 3. 建立 standalone release APK

Linux / WSL 使用 Linux Android SDK 時：

```bash
cd mobile/android
rtk ./gradlew assembleRelease
```

Windows PowerShell 使用 Windows Android SDK 時：

```powershell
cd D:\bloodsugar\mobile\android
.\gradlew.bat assembleRelease
```

輸出檔案：

```text
mobile/android/app/build/outputs/apk/release/app-release.apk
```

把這個 `app-release.apk` 傳給測試者即可。測試者在 Android 手機上開啟 APK，允許該來源安裝；或用 adb：

```bash
adb install app-release.apk
```

## 4. WSL / Windows SDK 注意事項

不要在 WSL/Linux Gradle 裡直接使用 Windows SDK path，例如：

```text
/mnt/c/Users/robin/AppData/Local/Android/Sdk
```

原因是 Linux Gradle 需要 Linux binary，例如 `aapt`；Windows SDK 裡通常是 `aapt.exe`。這會導致 Gradle 報 build-tools corrupted 或 `sdk.dir` 不存在。

目前建議二選一：

- 在 Windows PowerShell 跑 `.\gradlew.bat assembleRelease`，並讓 `mobile/android/local.properties` 使用 `sdk.dir=C:/Users/robin/AppData/Local/Android/Sdk`。
- 或在 WSL/Linux 安裝 Linux Android SDK，並讓 `sdk.dir` 指向 Linux path，例如 `/home/aite/Android/Sdk`。

## 5. 分享前檢查

分享 APK 前至少確認：

- 使用的是 `app-release.apk`，不是 debug APK。
- `npm run preflight:android-apk:internal` 或 `npm run preflight:android-apk:production` 已通過。
- 測試者不需要 `npm run start`、`npx expo start`、Metro 或開發伺服器。
- Internal APK 只給可信任測試者。
- Production-like APK 已使用正式 API、關閉 dev/debug flag，且不是 debug signing。

## 6. 目前限制

目前 `mobile/android/app/build.gradle` 的 release build 仍使用 debug keystore。這只適合 internal install smoke。正式分享前要新增真正的 release keystore 與 signing config，並讓：

```bash
cd mobile
rtk npm run verify:android-release-signing
```

通過。
