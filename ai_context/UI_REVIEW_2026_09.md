# Android 與網站 UI 統一：2026-09

## 範圍與交付

Android 的 41 個既有路由、網站 12 個 view，以及 `/admin` 登入與用量頁。
未完成的未來功能仍維持預覽/停用，不在一般網站選單中開放。
本輪不更新 AWS、不遷移資料庫、不修改模型或支付服務。

- 原生共用色彩：`mobile/designTokens.ts`；網站共用色彩：`web/src/styles.css`。
- 共用輕量按壓回饋、首頁錄音圖形、進頁淡入、整理呼吸動畫與成功標記。
- 尊重減少動態效果；原生背景狀態停止呼吸動畫。
- 修正 Android 狀態列安全區與月曆七欄/星期對齊，頁面切換回到頂部。
- 窄版標題保留導覽按鈕空間，首頁六項提示穩定維持兩列，流程標籤限制在各自欄位。
- 精簡文字確認、手動紀錄、詳情、刪除及完成頁的工程說明；確認儲存與不可復原提醒仍保留。
- 網站候選/詳情改為結構化表單；處理期間鎖定編輯與導覽，加入防重送、部分儲存失敗恢復與刪除確認。
- admin 保留寬版表格，窄螢幕局部橫向捲動並支援鍵盤聚焦。

## 原生證據

本機 non-16KB Android emulator，1080×2400、420dpi（約 411dp 寬）、字體縮放 1.0。
使用現有 debug-gated visual-smoke route seed，跳過 boot/auth/模型下載；沒有呼叫 AI/STT/Vision、付款或資料寫入。

- 41 個路由均已原生載入、截圖及檢視；不是靜態 HTML 模擬圖。
- 另以 540dpi（320dp 寬）檢查 15 個代表路由：首頁、快速記錄、文字確認、AI 確認、儲存確認、歷史、編輯、手動新增、分析、選單、設定、訂閱、健康串接、商城、食物拍照。
- 窄版補看月曆、表單與確認 CTA 的捲動區；測試後恢復 420dpi。
- 證據：`/tmp/bloodsugar-ui-native/`、`/tmp/bloodsugar-ui-native/narrow-320/`。
- 截圖版啟用 debug，因此工程面板仍會出現在證據中；日常開發 APK 的 `.env` 關閉 debug tools，保留本機/AWS 切換。
- 從截圖版切回日常版時，強制重建 bundle，避免 Gradle 沿用不同環境旗標的快取：`gradlew.bat :app:createBundleReleaseJsAndAssets --rerun assembleRelease --no-daemon`。最後重新安裝日常 APK，不保留 visual-smoke 初始路由。

## 網站證據

Playwright 1.63.0 / Chromium；320、390、1280px。
每一個 API 請求都由測試 fixture 攔截。任何未預期的外部 fetch/XHR 直接失敗，不使用正式憑證或資料。

`scripts/ui_smoke_web.cjs` 產生 53 張截圖與 `report.json`：

- 六個正式 view、六個未來 view、進階設定、admin 登入/用量。
- 文字確認、整理讀取、候選確認、儲存成功、編輯、刪除確認。
- 整理期間無可編輯文字框，不能切換頁面。
- 同步連點整理/儲存/刪除仍只送出一次對應請求。
- 部分儲存失敗時已成功項目不再重送；只有未完成項目可重試。
- parser 失敗保留原文字並恢復操作。
- 文件沒有橫向溢出；瀏覽器執行錯誤及未預期外部請求均為 0。
- 證據：`/tmp/bloodsugar-ui-web/`。全部為合成資料。

另以 `5173` 一般網站驗證本機初始化：health、dev-login、models、voice-quota、profiles、records 回覆 200，畫面狀態為「已連到 API」。此檢查僅記錄路徑與狀態碼，未輸出資料內容、呼叫 AI 或建立健康紀錄；與上方完全攔截 API 的合成測試分開計算。

### 重跑方式

先啟動兩個本機 Vite 程序（一般模式 4173；`VITE_ENABLE_DEBUG_TOOLS=true` 的預覽模式 4174）。
4173/4174 僅供攔截 API 的合成測試；日常操作使用 `http://127.0.0.1:5173`，對應後端既有 CORS 設定，API 指向 `http://127.0.0.1:8000`。
WSL 下專案位於 Windows 掛載磁碟時使用 `CHOKIDAR_USEPOLLING=true`，或重新啟動 Vite；本輪曾遇到檔案事件未傳遞造成舊模組快取，已重新啟動並重跑。

將 Playwright 安裝在臨時目錄，不必修改專案依賴。設定：

```text
PLAYWRIGHT_MODULE=<temporary-directory>/node_modules/playwright
PLAYWRIGHT_BROWSERS_PATH=<temporary-directory>/browsers
UI_SMOKE_URL=http://127.0.0.1:4173
UI_SMOKE_DEBUG_URL=http://127.0.0.1:4174
UI_SMOKE_OUTPUT=/tmp/bloodsugar-ui-web
```

執行 `node scripts/ui_smoke_web.cjs`。受限環境可能需要允許本機監聽與 Chromium 程序。

## 檢查與界線

- `mobile/npm run quality`：型別、41 路由、spec、visual-smoke、storage、APK/native config、共用色彩。
- `web/npm run typecheck`、`npm run lint`、`npm test -- --run`、`npm run build`。
- `python3 scripts/verify_ui_design_tokens.py` 驗證兩端色彩一致；主按鈕白字 5.69:1、內文 9.53:1、輔助文字 4.55:1。不是完整 WCAG 稽核。
- 原生 release task 可建置並安裝；交付是本機開發 APK，不是商店正式簽章或已部署版本。
- 本輪 UI 統一交付時的 APK：`mobile/android/app/build/outputs/apk/release/app-release.apk`；當時 SHA-256 `f866a32c0eca5d6cdb78033573cb6b5f4814a53a2a6e5061d33954182e36ae8d`。此輸出路徑會被後續建置更新；後續空白錄音與測試文字入口的驗證另見 implementation log。
- 尚未驗證 TalkBack/VoiceOver、所有字體縮放級別、真實語音辨識或正式服務寫入；本輪只驗證 UI 與合成操作流程。
- 留存率、任務完成時間与使用者主觀美感仍需實際使用測量；不以截圖或測試通過宣稱已有留存提升。
