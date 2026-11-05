# 糖錄錄 AI / Engineering Skills

這是專案最高層的工作規範，給 AI 開發工具與工程師使用。`ai_context/` 與 `agents/` 的文件若與本文件衝突，以本文件為準。

## 1. 文件地圖

| 文件 | 內容 |
|---|---|
| `skills.md` | 本文件：不可違反的規則 |
| `ai_context/TASK_QUEUE.md` | 目前在做什麼（一次一個 active task） |
| `ai_context/PRODUCT_ROADMAP.md` | 產品方向、唯一的 Phase 編號、未決事項 |
| `ai_context/PRODUCTION_READINESS.md` | 上線缺口與目前違反的規則 |
| `ai_context/architecture.md` | 實際技術架構 |
| `ai_context/AI_PARSING_AND_MODELS.md` | AI 解析流程、模型、上限 |
| `ai_context/VOICE_INPUT.md` | 錄音流程、語音額度、語音指令 |
| `ai_context/SECURITY_AND_PRIVACY.md` | PHI、logging、資料流向 |
| `ai_context/PERMISSIONS_AND_RECORD_SCHEMA.md` | 權限服務、授權、紀錄格式 |
| `ai_context/SUBSCRIPTIONS_AND_FAMILY.md` | 訂閱、權益、家庭模型 |
| `ai_context/REPO_QUALITY_WORKFLOW.md` | 本機環境與品質檢查 |
| `ai_context/DEPLOYMENT.md` | Lightsail 部署、發版、回滾、備份 |
| `ai_context/UI_UX_SPEC.md` | 介面規格 |
| `ai_context/MOBILE_VISUAL_SMOKE_WORKFLOW.md` | 手機畫面 smoke 檢查 |
| `ai_context/IMPLEMENTATION_LOG.md` | 每次變更的紀錄 |

## 2. 產品原則

- 語音優先：能語音就語音，能拍照就拍照，能自動就自動，手動輸入只做兜底。
- 操作簡單，讓中老年人與照護者能長期使用。
- **每次 AI 整理結果都必須讓使用者確認後才儲存。** Parser 只產生候選，不可直接寫入。
- 不做診斷、不給治療或藥物劑量建議。
- 家庭方案只共享訂閱權益，不預設共享健康資料。

## 3. AI 架構（目前實況）

- 語音轉文字：手機系統語音辨識（`expo-speech-recognition`，可能使用 Google 雲端）；使用者下載 Whisper 模型後，在 Android 13+ 優先用 `whisper.rn` 在本機處理。
- 解析：後端 `/ai/parse-preview`。設定 DeepSeek 時預設用 DeepSeek（雲端），會送出分段後的使用者原話。Ollama / Gemma 是開發用的本地選項。手機上的 `llama.rn` 只在 debug tools。
- 資料：存在伺服器 PostgreSQL。手機沒有本機資料庫。
- 原始音檔不上傳、不保存。
- 舊規則「第一版全部在本地完成、雲端不做 AI」**已不符合現況**。是否保留雲端解析，以及需要什麼使用者同意，**仍未決定**（`PRODUCT_ROADMAP.md` D1、D3）。在決定之前：
  - 不可新增其他第三方 AI 或分析服務來接收 PHI；
  - 不可擴大送往 DeepSeek 的資料（例如完整紀錄、profile 資料）；
  - 年度回顧只能送聚合統計；
  - 所有新的 PHI 外送都要先有使用者同意與合規評估。

## 4. AI 輸出規範

- 模型只輸出固定 JSON（compact IR：`records`、`rejected`、`needs_confirmation`），不使用自由文字作為儲存來源。
- 後端驗證 schema 後，每筆候選要有 `record_type`、`occurred_at`、`payload_json`、`metadata_json`、`source`、`confidence`、`decision_trace`、`needs_confirmation`。
- 不確定的日期、數值、餐別、用藥要標示，讓使用者確認。
- 不要求、不顯示、不保存 chain-of-thought。最多保留短版 `decision_trace`（可檢查的摘要，不含醫療建議或推測）。

## 5. 資料與安全底線

所有健康資料都視為 PHI。

禁止：

- 把語音轉錄、血糖值、飲食、用藥、報告、prompt 或 model output 寫入一般 log、analytics、error report、audit metadata。
- 在 `records.payload_json` / `metadata_json` 存原始 transcript 或 source text。
- 用 production data 做 staging 或本機測試。
- 把 API key、DB password、JWT secret、signing key 放進 repo、image 或 App。
- 把 token 存在 App 一般 storage（只能用 SecureStore）。
- 在 local / test / development 以外開啟 `ALLOW_DEV_AUTH` 或 debug tools。

必做：

- 每個 route 都要認證，除非列在 `PUBLIC_ROUTE_REASONS` 並寫明理由。
- 讀寫健康資料都經過 `services/permissions.py`。
- 寫入動作寫 audit event（不含 PHI）。
- log redaction 預設開啟（`core/logging.py`、`core/redaction.py`）。
- 新的資料保存要訂保存期限。目前原始逐字稿無期限保存，是已知違反（`PRODUCTION_READINESS.md` B2）。

## 6. 工程規範

- 一次只做 `ai_context/TASK_QUEUE.md` 的一個 active task；完成後更新狀態。
- 每次變更（bugfix、feature、infra、docs、test）都在 `ai_context/IMPLEMENTATION_LOG.md` 加一筆有日期的紀錄：日期、類型、檔案、摘要、驗證、後續。log 必須 PHI-safe。
- 資料庫 schema 變更必須有 Alembic migration。
- Migration 只能 expand（`migration_phase = "expand"`），要與前一版 App 相容；不做破壞性 contract migration（`infra/api-migration-compatibility.json`）。
- 新功能必須有測試。
- 不做與當前 task 無關的大型重構。
- Feature flag 要在 backend、web、mobile 三處同時新增，預設關閉。
- 文件：產生的文件放 `ai_context/`，外部或使用者提供的參考放 `references/`，`agents/*.md` 只放角色提示與指標。
- 不做 Kubernetes、microservices、multi-region、常駐 GPU，除非有明確需求與成本理由。

## 7. 品質檢查與部署

- 沒有雲端 CI。合併前在 WSL/Linux 跑 `make check`；mobile 改動另跑 `cd mobile && npm run quality`。細節見 `ai_context/REPO_QUALITY_WORKFLOW.md`。
- 唯一的部署目標是 `infra/lightsail/`（單機 staging）。部署、回滾、備份見 `ai_context/DEPLOYMENT.md`。
- Migration 前先備份；回滾先回應用程式，不自動降版資料庫。
- staging 與未來 production 要分開 DB、key、logging level。

## 8. Definition of Done

- 程式完成，測試新增或更新。
- 相關檢查通過（`make check` / `npm run quality`）。
- 需要時有 migration，且為 expand-only。
- 已檢查 auth / permission 影響。
- log 不洩漏 PHI。
- API contract 或文件已更新。
- `TASK_QUEUE.md` 狀態與 `IMPLEMENTATION_LOG.md` 已更新。
