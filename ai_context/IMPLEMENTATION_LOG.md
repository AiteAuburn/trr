# 糖錄錄 Implementation Log

文件定位：每次 bug fix 或功能實作都要在這裡追加一筆紀錄。此 log 只記錄工程變更摘要與驗證結果，不記錄 PHI、真實健康資料、request body、raw transcript、raw prompt、raw model output、secret 或 token。

排序：日期新的在最上面；同一天內新的在上。

## Log Format

```text
日期:
類型: bugfix | feature | docs | infra | test
檔案:
摘要:
驗證:
後續:
```

## 2026-11-07

### 內部測試 APK，修正 Windows SDK 路徑檢查

類型：bugfix / infra

檔案：`scripts/check_android_apk_build_prereqs.py`、`ai_context/IMPLEMENTATION_LOG.md`。

摘要：

- `check_android_apk_build_prereqs.py` 在原生 Windows 上也把 `sdk.dir=C:/...` 轉成 `/mnt/c/...`，導致照手冊設定 Windows 路徑後，`preflight:android-apk:internal` 仍回報 SDK 不存在。改成只有 Linux/WSL 才轉換。
- 本機 `mobile/android/local.properties`（不進 git）改成 `sdk.dir=C:/Users/robin/AppData/Local/Android/Sdk`。
- 用 PowerShell 建置 internal release APK，指向 Lightsail staging；建置時用環境變數關閉 dev 登入、伺服器切換器、debug 工具，沒有改開發用的 `mobile/.env`。Windows 上的 `cmd` 不會在目前資料夾找執行檔，所以要用 `.\gradlew.bat`。

驗證：

- `npm run preflight:android-apk:internal` 通過（release env、debug signing 允許、`apk_build_ready: true`）；`python scripts/verify_android_apk_scripts.py` 通過。
- `assembleRelease` 成功，`createBundleReleaseJsAndAssets` 有重跑；`@expo/env` 在相同環境下讀到三個開關都是 false；bundle 內含 staging API 網址。

後續：

- 仍是 debug keystore 簽章，只能給可信任的內部測試者（T2351 / B4）。
- APK 約 187 MB（包含所有 CPU 架構與原生模型套件），之後可考慮只打 arm64-v8a。

### Lightsail staging 部署 `2026-11-07.1`

類型：infra / docs

檔案：`ai_context/DEPLOYMENT.md`、`ai_context/IMPLEMENTATION_LOG.md`（伺服器上：`/opt/bloodsugar` 的 `backend/`、`web/`、`infra/lightsail/`）。

摘要：

- 伺服器原本跑 2026-09-12 的程式（`/version` 顯示 `release_id: local`），舊版 `compose.yml` 的 `ALLOW_DEV_AUTH` 預設 true，dev 登入對外開著。操作者已在伺服器 `.env` 改成 `ALLOW_DEV_AUTH=false`。
- 依 `DEPLOYMENT.md` 第 3 節部署 commit `4cbcd98`：先把伺服器舊程式打包成 `backups/code-pre-20261107.tgz`、舊映像加上 `rollback-20261107` 標籤；用 `git archive` 匯出後 rsync（不碰 `.env`、`backups/`）；`backup.sh` 備份資料庫；建置後端與網頁映像；migration `20260912_0031` → `20261003_0034`；重啟服務，Caddy 重新建立以讀到新的 `Caddyfile`。
- 從開發機用 SSH（WSL `~/.ssh/config` 的 `bloodsugar`）連線。

驗證：

- `/api/version` 顯示 `release_id 2026-11-07.1`、`git_sha 4cbcd98…`；`/api/readyz`、`/api/healthz`、`/`、`/admin` 都是 200。
- `POST /api/auth/dev-login` 回 404；未登入的 `/api/ai/models` 回 401；已移除的 `/api/achievements` 回 404。
- 部署後 10 分鐘內後端與 Caddy log 沒有 error。

後續：

- 用內部測試帳號在手機跑一次 錄音 → 解析 → 確認 → 存（本次沒有在伺服器上建立測試帳號）。
- 回滾：`docker tag lightsail-backend:rollback-20261107 lightsail-backend` 和 `lightsail-web` 同樣做，再 `dc up -d`；或解開 `code-pre-20261107.tgz` 重新建置。資料庫 schema 只加不刪，不需要降版。

## 2026-11-06

### 手機語音辨識優先在本機（D3）

類型：feature / test / docs

檔案：`mobile/phoneSpeechCapture.ts`、`scripts/test_mobile_phone_speech_capture.cjs`、`skills.md`、`README.md`、`ai_context/{VOICE_INPUT,PRODUCT_ROADMAP,PRODUCTION_READINESS,SECURITY_AND_PRIVACY,TASK_QUEUE}.md`。

摘要：

- 錄音流程不變：有 Whisper 模型時先用 Whisper 在本機轉文字，失敗或空白時用同一段錄音的手機系統辨識結果。
- 手機系統辨識改成能在本機就在本機（`requiresOnDeviceRecognition`）：iOS 由系統判斷；Android 13+ 只在已安裝台灣中文離線語音包時開啟（沒裝語音包時強制本機會辨識失敗）。Android 14+ 沒有語音包時，背景要求下載一次；Android 13 會跳對話框，所以不要求。
- 做不到本機辨識的手機（Android 12 以下、沒有語音包、系統不支援）照舊用手機一般的辨識（可能上雲，免費），每支手機都能用語音。
- 產品決定 D3 定案，從未決清單移除。

驗證：

- `node scripts/test_mobile_phone_speech_capture.cjs` 通過：語音包已裝時開啟本機、沒裝時關閉並只要求下載一次、Android 13 不下載、Android 12 不開啟、系統不支援或查詢失敗時關閉、iOS 開啟、各種台灣中文 locale 名稱。
- 手機 `npm run quality` 全部通過（typecheck、所有 verifier、錄音流程 17/17、phone speech、Whisper PCM、model storage、今天時間軸）。

後續：

- 真機驗收（T2352）：裝好離線語音包後開飛航模式測試，以及沒有語音包的手機。

## 2026-11-05

### 雲端解析定案：不設 App 內同意、介面不顯示 AI 供應商（T2348）

類型：feature / docs / test

檔案：`backend/app/services/ai_pipeline.py`、`backend/app/api/ai.py`、`backend/tests/test_ai_pipeline.py`、`mobile/settingsCopy.ts`、`scripts/verify_mobile_navigation.py`、`skills.md`、`CLAUDE.md`、`README.md`、`ai_context/{PRODUCT_ROADMAP,PRODUCTION_READINESS,AI_PARSING_AND_MODELS,SECURITY_AND_PRIVACY,SUBSCRIPTIONS_AND_FAMILY,DEPLOYMENT,TASK_QUEUE}.md`。

摘要：

- 產品決定（D1）：維持後端雲端解析，App 內不另設 AI 同意步驟，移除 T2348。
- `/ai/models` 的 `deepseek-chat` 選項標籤改為「AI 智慧整理」，說明文字改為中性、不含廠商名與環境變數名；未設定時的錯誤 hint 從 `set_deepseek_parser_url_and_key` 改為 `server_parser_not_configured`。模型 id 不變，相容已安裝 APK。
- 手機設定頁「雲端 fallback 在 v1 預設停用」與實際不符，改為「AI 智慧整理需要網路連線」。
- 測試新增：模型標籤與說明不可包含供應商名稱。
- 文件記錄此決定；廠商名稱只留在後端設定、內部文件與管理後台。

驗證：

- 手機 `npm run quality` 通過。`make check` 的合約腳本、ruff、mypy、web 全過；pytest 第一次 3 筆 `tests/test_auth_refresh.py` 失敗（refresh 頻率限制與登出撤銷，與本次改動無關），單獨重跑兩次 30/30、完整重跑 317 passed，判定為機器變慢時的時間相關 flaky。

後續：

- 隱私權政策與 Google Play 資料安全表單仍需揭露「由第三方 AI 服務處理」（可不寫廠商名）。
- D3（手機語音辨識是否要求 on-device）仍未決定。
- `tests/test_auth_refresh.py` 在機器忙碌時偶發失敗，之後值得改成不依賴實際時間。

### 收斂到語音記錄 MVP：移除範圍外功能、未部署的 infra，整理文件（T2347）

類型：feature / infra / docs / test

檔案（依區域）：

- 後端：刪除 `app/api/{achievements,community,store}.py`、`app/schemas/{achievement,community,store}.py`、`app/services/achievement_catalog.py`、`tests/test_community_store_year_review.py`；修改 `app/main.py`、`app/core/config.py`、`app/services/feature_flags.py`、`app/services/year_review_snapshots.py`、`app/schemas/year_review.py`、`app/api/dev.py`、`app/models/{achievement,community}.py`；新增 `tests/test_year_review.py`。
- 網頁：`web/src/App.tsx`、`styles.css`、`featureFlags.ts`（+ test）。
- 手機：刪除 14 個只給成就／商城／社群／排行榜用的元件；修改 `App.tsx`（13,127 → 11,361 行）、`futureModuleDisplay.ts`、`navigationConfig.ts` 等；`featureFlags.ts`。
- Infra：刪除 `infra/k8s/`、`infra/aws/`、`infra/minimal/`、`docs/imgs/`；新增 `infra/lightsail/backup.sh`、`restore.sh`；修改 `infra/lightsail/{compose.yml,Caddyfile,README.md}`、`infra/release-contract.json`（schema v2）、`.gitignore`。
- Scripts：刪除 `verify_k8s_manifests.py`、`ui_smoke_web.cjs`；`verify_minimal_backup_restore.py` 改名 `verify_backup_restore.py`；修改 `verify_deployment_config.py`、`verify_release_contract.py`、`verify_feature_flags.py`、`check.sh`、`verify_mobile_*`、visual smoke 產生器。
- 文件：`ai_context/` 42 份合併成 14 份（新增 `DEPLOYMENT.md`、`PRODUCT_ROADMAP.md`、`PRODUCTION_READINESS.md`、`AI_PARSING_AND_MODELS.md`、`VOICE_INPUT.md`、`SECURITY_AND_PRIVACY.md`、`SUBSCRIPTIONS_AND_FAMILY.md`、`PERMISSIONS_AND_RECORD_SCHEMA.md`）；重寫 `TASK_QUEUE.md`（53,631 → 76 行）與本 log（舊紀錄見 git `efca25f`）；更新 `skills.md`、`README.md`、`CLAUDE.md`、`agents/*.md`、`docs/ANDROID_RELEASE_SHARING.md`、`UI_UX_SPEC.md`。

摘要：

- 移除商城、社群（含食物社群）、排行榜、成就：後端路由與服務、網頁畫面、手機 5 個畫面（AppScreen 41 → 36），以及 `community_sharing` / `store_redemptions` 旗標。資料表與 ORM model 保留（migration 只允許 expand），沒有新增或修改 migration。
- 年度回顧保留：新產生的 snapshot 為 5 項統計（去掉兩個徽章統計），分享卡改顯示紀錄天數、最長連續、飲食與運動次數；舊的 7 項 snapshot 仍可讀取，手機依 key 過濾。
- 部署只剩 Lightsail。備份還原改到 `infra/lightsail/`，成品權限 600、`backups/` 加入 gitignore；release contract 改成單機重建流程；`compose.yml` 加 `RELEASE_ID` / `GIT_SHA` 供 `/version` 確認版本；Caddy 移除已刪路由。
- 文件依程式碼更正：AI 解析實際走 DeepSeek（逐字稿原文外送、尚無同意流程）、語音辨識走手機系統（可能是 Google 雲端）、`ai_parse_audits` 保存原始逐字稿無期限、進度串流是 NDJSON、`/ai/command-proposal` 不呼叫 LLM。這些未決事項列在 `PRODUCT_ROADMAP.md` §4 與 `PRODUCTION_READINESS.md`，不視為已解決。
- 本機清掉 Android / web 建置輸出（約 4 GB，未進 git）。

驗證：

- `make check`（隔離 compose 專案）全部通過：7 支 repo 合約腳本、alembic upgrade、ruff、mypy（131 檔）、pytest 317 passed、web lint / typecheck / vitest 11 passed。
- 手機 `npm run quality` 全部通過（navigation 36 畫面、UI spec 覆蓋、visual smoke、錄音流程 17/17、今天時間軸 5/5 等）。
- 刪除檔案的路徑引用檢查：除本 log 外無殘留。

後續：

- T2348–T2356（同意流程、逐字稿保存期限、staging dev 登入、正式簽章、真機驗收、語音額度、排程、試用到期、取消時中止請求）。
- `verify_mobile_visual_smoke_harness_artifact.py`（不在 quality 內）在本機有 3 張截圖過小，改動前就失敗。
- 保留的 6 張資料表與 model 等未來允許 contract migration 時再刪。

### 手機版新增今天時間軸、整理中取消

類型：feature / test / docs

檔案：`mobile/App.tsx`、`mobile/todayTimeline.tsx`（新增）、`mobile/todayTimelineTransforms.ts`（新增）、`mobile/parserLoadingView.tsx`、`mobile/recordDisplay.ts`、`mobile/aiReviewActionRow.tsx`（刪除）、`mobile/package.json`、`scripts/test_mobile_today_timeline.cjs`（新增）、`scripts/verify_mobile_navigation.py`、`ai_context/UI_UX_SPEC.md`。

摘要：

- 依設計稿新增「今天」時間軸：首頁「今天 N 筆」chip 與存好頁「看今天的紀錄」改開時間軸（首頁的第二個檢視，不新增 AppScreen），含三格摘要、24 小時制時間軸、「說話記一筆」與「看全部歷史」。
- 整理中畫面新增「取消」：以 request generation 計數讓晚到的 parser 回應與錯誤被忽略，解除鎖定並保留文字。後端請求本身不會中止。
- 飲食紀錄沒有食物項目時顯示「飲食：早餐」等餐別，不再顯示原始 JSON（歷史頁同樣受益）。
- 刪除已不使用的 `AiReviewActionRow` 元件與對應驗證。

驗證：

- `npm run quality` 全部通過，新增 today timeline 測試 5 項。Android 模擬器（visual smoke 示範資料）確認時間軸、摘要與「說話記一筆」進入錄音。

後續：

- 整理中取消尚未在模擬器上實際觸發（visual smoke 模式下不會送 parser）；真機語音流程仍待驗證。

### 手機版改為「點一下說話、一頁確認」的語音記錄流程

類型：feature / test / docs

檔案：`mobile/App.tsx`、`mobile/phoneSpeechCapture.ts`、`mobile/aiCandidateList.tsx`、`mobile/parserLoadingView.tsx`、`mobile/recordingCopy.ts`、`mobile/recordWorkflowCopy.ts`、`mobile/firstVersionFlowCopy.ts`、`mobile/settingsScreenData.ts`、`mobile/homeGuidanceCard.tsx`（刪除）、`scripts/verify_mobile_navigation.py`、`scripts/verify_mobile_visual_smoke_routes.py`、`scripts/verify_mobile_visual_smoke_harness.py`、`scripts/generate_mobile_visual_smoke_harness.py`、`scripts/test_mobile_recording_flow.cjs`、`scripts/test_mobile_phone_speech_capture.cjs`、`ai_context/UI_UX_SPEC.md`。

摘要：

- 依 Claude Design 稿調整首頁：日期、「今天 N 筆」chip、「想記什麼，直接說出來」、200px 麥克風；按住改為點一下開始／再點一下結束，停頓 3 秒或語音服務自行結束時自動停止；錄音中顯示即時辨識文字、計時與取消；新增「不方便說話？改用打字」。
- 語音辨識成功後直接交給 AI 整理（effect 等轉寫結束才送出，使用者離開頁面即放棄）；整理中畫面顯示「你說的」文字。前置檢查未通過時停在文字確認頁並顯示原因。
- AI 整理確認頁改為唯一確認頁：顯示「你說：…」與「改文字」、較大的候選卡、低信心卡片改琥珀色提示；「存起來（N 筆）」直接儲存，「重新說一次」放棄結果回首頁。存檔仍只在使用者按下後發生。
- 存好頁（一般 AI 儲存）改為「存好了」「今天一共 N 筆紀錄」，主按鈕「再說一筆」、次按鈕「看今天的紀錄」；部分儲存與手動儲存保留原本動作列。
- 全面替換「按住／放開」文案；移除不再使用的首頁引導卡元件。
- 驗證腳本與 UI 規格同步更新為新行為（首頁只允許一個錄音麥克風控制，允許取消、今天 chip、打字連結與錄音計時）。

驗證：

- `npm run quality` 全部通過（含 TypeScript；本機補裝 `expo-speech-recognition`，lockfile 未變更）。recording flow 17 項（新增點一下開始／結束、啟動中再點、取消 3 項），phone speech 測試新增即時文字與自行結束回呼。

後續：

- 今天時間軸與整理中取消已於同日後續實作（見上一筆）。
- 真機上的語音辨識、自動停止與整段流程仍待 Android 裝置驗證。

### 新增 make check 本機品質檢查

類型：infra

檔案：`Makefile`、`scripts/check.sh`（新增）、`compose.check.yml`（新增）、`.gitattributes`（新增）、`CLAUDE.md`。

摘要：

- `make check` 取代已移除的 CI：依序跑 8 個 repo 合約腳本、建置 backend/web image、migration、ruff、mypy、pytest、web lint/typecheck/test；有 `node` 時再跑 mobile `npm run quality`，沒有則明確顯示略過。
- 使用獨立 compose 專案 `bloodsugar_check`（獨立資料庫 volume、不綁 host port、不載入根目錄 `.env`），結束時自動 `down -v`，不會清掉 `make dev` 的資料。`make test` 加註會使用開發資料庫且測試會清空所有資料表。
- `.gitattributes` 讓 `*.sh` 與 Makefile 在 Windows checkout 時維持 LF，避免 WSL 執行失敗。

驗證：

- WSL 執行 `make check`：合約腳本通過、backend 337 tests 通過、web 11 tests 通過；mobile 因 WSL 無 node 略過。執行後無殘留容器。

後續：

- WSL 若要涵蓋 mobile，需安裝 Linux 版 Node；或在 Windows 端另跑 `cd mobile && npm run quality`。

### 移除 GitHub Actions CI

類型：infra

檔案：`.github/workflows/ci.yml`（刪除）、`scripts/verify_deployment_config.py`、`CLAUDE.md`。

摘要：

- 依需求移除 GitHub Actions workflow；GitHub 帳號因付款問題被鎖，job 也未曾啟動。
- `verify_deployment_config.py` 移除要求 `ci.yml` 存在與內容的檢查，其餘部署設定檢查不變。
- CLAUDE.md 改為說明沒有雲端 CI，合併前在本機執行品質檢查（見 `ai_context/REPO_QUALITY_WORKFLOW.md`）。

驗證：

- 8 個 repo 合約腳本在本機通過。

後續：

- 之後沒有自動的 gitleaks、Trivy、`pip-audit`／`npm audit` 掃描；需要時在本機手動跑。

### 全專案審查後的安全修正、測試修復與 repo 清理

類型：bugfix / test / infra / docs

檔案：`backend/app/core/config.py`、`backend/app/services/usage_analytics.py`、`backend/app/services/operational_events.py`、`backend/app/api/admin.py`、`backend/app/api/ai.py`、`backend/tests/conftest.py`（新增）、`backend/tests/test_config.py`、`backend/tests/test_auth_password.py`、`backend/tests/test_admin_analytics.py`、`backend/tests/test_ai_pipeline.py`、`backend/tests/test_ai_token_usage.py`、`infra/lightsail/initialize-env.sh`、`.gitignore`、`agents/PRODUCTION_AI_INSTRUCTIONS.md`、`ai_context/architecture.md`、`ai_context/MINIMAL_PRODUCTION_STACK.md`；刪除或取消追蹤的檔案列於摘要。

摘要：

- 安全：`ALLOW_DEV_AUTH=true` 只允許在 `APP_ENV` 為 local/test/development，其他環境（含 staging）啟動即失敗；`dev_auth_enabled` 在這些環境一律為 false。Lightsail `initialize-env.sh` 改寫入 `ALLOW_DEV_AUTH=false`。注意：已部署的 staging 若 `.env` 仍為 true，部署新版後端會拒絕啟動，需先手動改成 false；依賴 dev 登入的舊 APK 需改用 Email／密碼登入。
- Bug：`capture_ai_token_usage` 在串流回應中於不同 context 重設 ContextVar 會丟 `ValueError`，導致 `/ai/parse-preview/progress-stream` 出錯；改為重設失敗時清空目前 context 的值。
- 測試環境：新增 `tests/conftest.py` 固定測試所需設定（開 dev 登入、清空 JWT／admin／DeepSeek／Gemma 設定、關閉 repair fallback），避免 compose 預設 `ALLOW_DEV_AUTH=false` 與開發者本機 `.env` 影響測試，也避免測試誤連真實雲端模型。
- 過期測試：Email 註冊測試的清理改用 SQL DELETE 讓資料庫 cascade（ORM delete 會把 auth session 外鍵設成 null）；Ollama 測試補上新的必填 `model_id`；admin 營運事件測試改用相對時間（API 只回傳 30 天內事件）。
- mypy：修正 `object` 型別收窄與測試檔缺少的型別註記，共 30 個錯誤。
- 清理：刪除根目錄誤建的 `NUL`、9 個 Zone.Identifier、空的 `.codex`、無對應 package.json 的根目錄 `package-lock.json`、空的 `references/`、`tmp_visual_smoke_pull/` 截圖、已被 migration 取代的 `infra/minimal/schema.sql`、`ai_context/skills.md`、過期的 `ai_context/PRODUCTION_AI_INSTRUCTIONS.md`、未使用的 `model_manifest.*.json`、藍圖的 docx 副本；`.idea/`、`mobile/.expo/`、llama.rn 建置時複製的 `ggml-hexagon/*.so` 取消追蹤並加入 `.gitignore`。

驗證：

- 隔離的 compose 專案（不載入本機 `.env`、不綁 host port）：migration 到 `20261003_0034`、`ruff check .`、`mypy .`（138 檔無錯誤）、backend pytest 全數通過；8 個 repo 合約腳本與 mobile native-config／android-apk-scripts 驗證通過。

後續：

- 登入 Lightsail 主機將 `.env` 的 `ALLOW_DEV_AUTH` 改為 false 後再部署；確認舊 APK 使用者改走 Email 登入。
- 仍待決定：DeepSeek 是否保留與使用者同意流程、`ai_parse_audit` 原始逐字稿保存期限、正式 release keystore、K8s／infra/minimal／MVP 外功能去留、`TASK_QUEUE.md` 與本 log 封存。
- mobile `expo-speech-recognition` 安裝問題仍在，mobile typecheck 尚未恢復。

## 2026-10-23

### Whisper 失敗時改用手機語音辨識備援

類型：feature / native / test

檔案：`mobile/App.tsx`、`mobile/phoneSpeechCapture.ts`、`mobile/recordingCopy.ts`、`mobile/app.json`、Android manifest、mobile package/lockfile、mobile navigation verifier 與語音流程測試。

摘要：

- 使用 Expo SDK 57 相容的 `expo-speech-recognition` 接上 Android 系統語音辨識；同次錄音先取得手機辨識文字，同時於支援的 Android 版本暫存本機 WAV，若 Whisper 模型與音檔可用便優先以 `whisper.rn` 處理，否則採用手機結果。
- 無 Whisper 模型時不再阻止錄音；Whisper 出錯或結果為空時回退手機文字。文字仍需使用者確認才會進入 AI 整理；錄音檔在轉錄完成、短錄音、取消或離開頁面時盡力刪除。
- UI 說明手機語音服務可能需要網路；Android 12 以下停用不支援的 continuous/persisted audio 選項，仍保留手機辨識文字備援。

驗證：

- 手機語音 capture mock 測試、14 項錄音流程測試、mobile navigation verifier、native config verifier 與本次涉及檔案的 `git diff --check` 通過。
- 本機 `node_modules` 目錄有既存巢狀結構，安裝依賴時遇到 `ENOTEMPTY`；套件已加入 package/lockfile，但未能在本機安裝實際原生模組。TypeScript 檢查因此無法解析 `expo-speech-recognition`，APK 未重建；Android 真機辨識仍未驗證。

後續：

- 以不覆蓋現有依賴資料的方式完成 `expo-speech-recognition` 安裝，重跑 mobile typecheck/quality 並建置 arm64 測試 APK；之後在 Android 手機驗證權限、離線/網路服務、Whisper 成功與失敗備援、音檔清理和實際轉錄。

## 2026-10-08

### Android `whisper.rn` PCM capture and internal test APK

類型：feature / native / test / build

檔案：`mobile/App.tsx`、`mobile/whisperPcmCapture.ts`、`mobile/modelStorage.ts`、`mobile/nativeLocalModels.ts`、`mobile/package.json`、`mobile/package-lock.json`、Android ProGuard/configuration, and `scripts/test_mobile_whisper_pcm.cjs`.

摘要：

- Android 本機語音辨識改用 16 kHz、單聲道、16-bit PCM 錄音，將 PCM 原始 bytes 以 `ArrayBuffer` 傳入 `whisper.rn` 支援的 JSI `transcribeData` 路徑；模型選用約 57 MiB 的 `ggml-base-q5_1.bin`，首次下載前詢問使用者並保存至應用程式私有儲存空間。
- 等待 Android `AudioRecord` 初始化完成才進入錄音，並以可重現的 postinstall patch 讓原生 stop 等錄音執行緒排空最後一個 PCM event 後才完成；之後移除 listener。加入 Whisper release keep rules、PCM/JSI handoff、模型私有儲存/下載、錄音流程測試，以及失敗時的使用者回饋。Whisper 使用 CPU；未包含模型檔於 APK。
- 產生 arm64-v8a Android internal test APK。套件 `app.bloodsugar.mobile`、版本 `0.1.0`、min SDK 24、target SDK 36；以 Android debug key 簽署，不是 Play Store/prod-signed APK。

驗證：

- `npm --prefix mobile run quality` 通過：TypeScript、navigation/UI/native config guards、13 項錄音流程測試，以及 PCM→Whisper JSI handoff、成功/失敗釋放 context、原生 stop drain 和 pinned 模型下載/持久快取/不完整檔清理測試。
- Release Gradle `assembleRelease` 成功；APK signature 驗證通過，package/ABI 檢查為 `app.bloodsugar.mobile` / `arm64-v8a`，且 APK 內含 `librnwhisper` 與 PCM recorder 整合。
- 交付檔：`mobile/android/app/build/outputs/apk/release/app-whisper-arm64-test.apk`；SHA-256 `2ecc48be1aa93de8394488cf292c100d09acd072394b9d4107b3d4927bf627f5`。
- 因目前沒有可連接的 Android 手機，尚未驗證真機麥克風權限、模型下載、實際 Whisper transcription、裝置效能或安裝啟動；此 APK 交付不能視為真機驗收。

後續：

- 將 APK 安裝到 arm64 Android 手機，允許麥克風權限、同意下載模型，測試中英文短句與較長語音、低記憶體/下載失敗處理、辨識延遲與記憶體；依結果調整模型大小及錄音生命週期。

## 2026-10-03

### Required email/password sign-in for the Android app and website

類型：feature / security / migration / test / docs

檔案：`backend/app/api/auth.py`、`backend/app/schemas/auth.py`、`backend/app/services/password_auth.py`、`backend/app/models/account.py`、`backend/alembic/versions/20261003_0034_email_password_auth.py`、`mobile/App.tsx`、`mobile/emailPasswordAuthScreen.tsx`、`web/src/App.tsx`、`web/src/styles.css`、auth configuration, verification scripts, and security/UI documentation.

摘要：

- 新增 Email/password 註冊與登入；密碼保存為隨機 salt 的 PBKDF2-HMAC-SHA256 hash，登入錯誤採通用回覆，登入與註冊皆有限流。Account 可容納無密碼的後續 provider 登入；本次未接 Google SDK / 帳號綁定。
- Android 與網站入口移除自動 dev-login。未登入時只顯示登入／註冊；登入後才載入 profiles、額度、模型與健康紀錄。Android 使用 SecureStore，網站採短效 access token 記憶體暫存與分頁 sessionStorage refresh token。
- 本機及 Lightsail 範例預設停用 header dev auth；本機 `.env` 另使用未提交的隨機 JWT signing key。新增 accounts.password_hash nullable 欄位，不改寫既有帳號或健康資料。

驗證：

- Local Alembic migration `20261003_0034` 已套用；本機 `/health` 回 200、僅帶 `X-Account-Id` 的受保護讀取回 401、`/auth/dev-login` 回 404、未註冊 Email/password login 回 401。
- Backend Email/password、OIDC、route policy、config 測試 31 項通過；website 11 tests、TypeScript + production build 通過；mobile quality gate 通過，包含 typecheck、安全 token storage、navigation/UI guards 與 13 項錄音流程測試；deployment config verifier 通過。
- 未執行 AWS 部署。Android APK / emulator runtime 尚未驗證：目前 WSL 指向 Windows Android SDK，APK prereq verifier 判定不可從此 WSL 建置，且環境沒有 `powershell.exe` / `adb` 命令。

後續：

- 以 Windows PowerShell 的 Android SDK 建立含此登入頁的 APK，在 emulator 實測註冊、登出、重開恢復 session 與錯誤提示；之後再決定是否部署 migration/backend 到 AWS。

## 2026-09-30 以前

2026-10-01 以前的紀錄（2026-04 起）保存在 git 歷史，commit `efca25f` 的 `ai_context/IMPLEMENTATION_LOG.md`。
