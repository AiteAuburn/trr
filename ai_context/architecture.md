# 糖錄錄技術架構

文件定位：目前程式碼的實際架構（2026-11）。規則以根目錄 `skills.md` 為準。AI 解析細節見 `AI_PARSING_AND_MODELS.md`；語音見 `VOICE_INPUT.md`；權限與紀錄格式見 `PERMISSIONS_AND_RECORD_SCHEMA.md`；安全見 `SECURITY_AND_PRIVACY.md`；部署見 `DEPLOYMENT.md`。

## 1. 總覽

```text
Android App (Expo)            Web 模擬器 / 管理後台 (Vite + React 19)
  │ 手機語音辨識 / Whisper        │ Browser Web Speech / transformers.js Whisper
  │ 文字 transcript               │
  └──────── HTTPS JSON ──────────┘
                 ▼
        FastAPI backend (Python 3.12, 無狀態)
          ├─ /ai/parse-preview ──► DeepSeek（雲端，預設）或 Ollama / Gemma4（開發）
          └─ SQLAlchemy 2 ──► PostgreSQL 16（所有健康資料）
```

- 健康資料只存在伺服器 PostgreSQL。手機沒有本機資料庫，也沒有離線模式。
- AI 只產生候選紀錄；使用者在確認頁按「存起來」才寫入。
- 部署目標只有 `infra/lightsail/`（單機 Docker Compose staging）。

## 2. Repo 結構

| 路徑 | 內容 |
|---|---|
| `backend/app/main.py` | 建立 app、掛 router、middleware（body 大小、request id、metrics、usage analytics、operational events） |
| `backend/app/api/` | routers：`auth`、`admin`、`ai`、`daily_records`、`dev`、`profiles`、`records`、`reports`、`subscriptions`、`year_reviews` |
| `backend/app/services/` | 商業邏輯：`ai_pipeline`、`permissions`、`entitlements`、`rate_limits`、`audit`、`reporting`、`year_review_snapshots`、`usage_analytics`、`operational_events`、`auth_sessions`、`password_auth`、`admin_auth`、`token_revocation`、`feature_flags`、`route_auth_policy`、record 驗證系列 |
| `backend/app/core/` | `config.py`（Settings）、`auth.py`、`logging.py`、`redaction.py`、`metrics.py` |
| `backend/app/jobs/` | `generate_year_review_snapshots.py` |
| `backend/alembic/versions/` | migration，命名 `YYYYMMDD_NNNN_description.py` |
| `web/src/` | `App.tsx`（手機流程模擬器）、`AdminApp.tsx`（`/admin*` 管理後台） |
| `mobile/` | Expo App，扁平結構，沒有 `src/` |
| `infra/` | `lightsail/`、`api-migration-compatibility.json`、`release-contract.json` |
| `scripts/` | repo 合約檢查與 mobile 驗證腳本（見 `REPO_QUALITY_WORKFLOW.md`） |

## 3. Backend

### API

| Router | 路徑 |
|---|---|
| main | `GET /health`、`/healthz`、`/readyz`、`/version`、`/feature-flags`（公開）；`GET /metrics`（需要後台管理員 session cookie） |
| auth | `POST /auth/register`、`/login`、`/dev-login`、`/oidc-login`、`/refresh`、`/logout`（公開）；`GET /auth/me`、`POST /auth/logout-all`、`GET /auth/sessions`、`DELETE /auth/sessions/{id}` |
| ai | `GET /ai/models`；`POST /ai/parse-preview`、`/ai/parse-preview/progress-stream`、`/ai/parse-preview/debug-stream`（僅 debug tools）、`/ai/command-proposal` |
| records | `GET/POST /records`、`GET/PATCH/DELETE /records/{id}`（軟刪除） |
| daily_records | `GET /daily-records`、`POST /daily-records/save`（App 確認後的儲存路徑） |
| profiles | `GET/POST /profiles`、`GET /profiles/shared`、`DELETE /profiles/shared/{grant_id}`、`GET/POST /profiles/{id}/grants`、`DELETE /profiles/{id}/grants/{grant_id}` |
| reports | `GET /reports/basic` |
| subscriptions | `GET /subscriptions/voice-quota` |
| year_reviews | `GET /year-reviews/{year}`、share card、share package（confirm / result / revoke） |
| admin | `POST /admin/login`、`/admin/logout`（公開）；`GET /admin/session`、`/admin/usage`、`/admin/events`、`/admin/users`、`/admin/users/{id}` |
| dev | `POST /dev/reset-data`（僅 local/test/development 且 dev auth 開啟） |

規則：每個 route 必須依賴 `get_current_account`（admin 用 `get_current_admin`），除非列在 `services/route_auth_policy.py` 的 `PUBLIC_ROUTE_REASONS`；`tests/test_route_auth_policy.py` 會擋未列出的公開 route。

### Middleware

- JSON body：POST/PATCH 超過 `MAX_REQUEST_BODY_BYTES`（預設 1 MiB）回 413，非 JSON 回 415，Content-Length 不合法回 400。
- `X-Request-ID` 與 `traceparent` 驗證後傳遞；422 錯誤移除 `input` 欄位。
- `/admin*` 回應加 `Cache-Control: no-store`。
- 5xx 記 `api_server_error`、≥5000 ms 記 `slow_api_request`（operational events，不含 PHI）。
- 每日 API 用量彙總寫 `api_usage_daily`。

### 設定（`core/config.py`）

- `APP_ENV`：local / test / development / staging / production。
- `ALLOW_DEV_AUTH=true` 只允許 local/test/development，其他環境（含 staging）啟動失敗。未設定時 local/test/development 預設開啟；dev compose 明確設為 false。
- production 另外拒絕：debug tools、wildcard CORS、短於 32 字元或缺 issuer/audience 的 JWT secret、未設 `AUTH_JWT_REQUIRE_JTI=true`、非 https 的 JWKS。staging 只套用 dev auth 規則。
- 只接受 PostgreSQL（`postgresql` / `postgresql+psycopg`）的 `DATABASE_URL`。
- API contract version `api_contract_version="1"`，必須與 `infra/api-migration-compatibility.json`、`infra/release-contract.json` 一致。

### 資料表

| 範圍 | 資料表 |
|---|---|
| 帳號 | `accounts`（含 nullable `password_hash`）、`user_profiles` |
| 健康資料 | `records`（`deleted_at` 軟刪除）、`daily_records`（確認後的每日彙整，含 transcript entries） |
| 登入 | `auth_sessions`（refresh token hash）、`revoked_jwts`（jti denylist）、`rate_limit_counters` |
| 分享 | `profile_access_grants` |
| 訂閱 | `plans`、`plan_entitlements`、`subscriptions`、`usage_counters` |
| 稽核與營運 | `audit_logs`、`operational_events`、`api_usage_daily`、`ai_token_usage_daily`、`ai_parse_audits` |
| 年度回顧 | `year_review_snapshots`、`year_review_share_packages` |
| 已停用功能（只為 migration 相容保留） | `achievement_unlocks`、`food_items`、`food_shares`、`community_point_ledger`、`community_public_profiles`、`store_redemptions` |

### Migration 政策

`infra/api-migration-compatibility.json`：Alembic 只能有單一 head；legacy baseline `20260430_0030` 之後的每個 migration 都要宣告 `migration_phase = "expand"`，並與前一版 App 相容（不允許 contract / 破壞性 migration）。目前最新為 `20261003_0034_email_password_auth.py`。由 `scripts/verify_api_migration_compatibility.py` 檢查。

## 4. 認證

| 方式 | 說明 |
|---|---|
| Dev login | `POST /auth/dev-login` 後以 `X-Account-Id` header 識別；只限 local/test/development |
| Email / 密碼 | PBKDF2-HMAC-SHA256（310,000 次）；需 `AUTH_JWT_SECRET`；App 與網站目前唯一的正式登入方式 |
| OIDC 交換 | `POST /auth/oidc-login` 驗證 provider id_token（RS256 JWKS、nonce），發自家 HS256 access token；App 端尚未接 Apple / Google |
| Bearer JWT | HS256 secret 或 `AUTH_JWKS_URL`（RS256），並查 `revoked_jwts` denylist |
| Refresh | `token_urlsafe(48)`，只存 SHA-256 hash，每次 refresh 輪替，期限 30 天 |
| 管理後台 | 獨立帳密（`ADMIN_USERNAME`、`ADMIN_PASSWORD_HASH`、`ADMIN_SESSION_SECRET`），HttpOnly cookie `bloodsugar_admin_session` |

App 的 token 只存 `expo-secure-store`（`mobile/authTokenStorage.ts`）。網站 access token 存記憶體、refresh token 存分頁 `sessionStorage`。

## 5. AI 解析（摘要）

`services/ai_pipeline.py`：transcript 正規化 → 切段 → 複雜度／密度上限 → 分批送模型（compact IR：`records`、`rejected`、`needs_confirmation`）→ 對回完整候選紀錄 → schema 驗證 → 回傳 preview。模型由 `runtime_llm_models()` 決定：設定 `DEEPSEEK_PARSER_URL` + `DEEPSEEK_API_KEY` 時 `deepseek-chat` 可用且為預設。細節見 `AI_PARSING_AND_MODELS.md`。

## 6. Mobile

- Expo ~57、React Native 0.86、React 19。原生模組（`whisper.rn`、`llama.rn`、PCM recorder）只能在 dev client / release build 用，不能在 Expo Go。
- `App.tsx` 是很大的根元件，管導覽與畫面狀態。其他邏輯依檔名後綴拆成同層檔案：`*Copy.ts`（文案）、`*Transforms.ts`（純資料轉換）、`*ScreenData.ts` / `*DisplayBundle.ts`（view model）、每個元件一個 `*.tsx`。
- 主要檔案：`apiClient.ts`、`navigationConfig.ts`、`designTokens.ts`、`authTokenStorage.ts`、`phoneSpeechCapture.ts`、`nativeLocalModels.ts`、`modelStorage.ts`、`todayTimeline.tsx`。
- 導覽：主要分頁 今日 / 記錄 / 選單；選單到 今日、歷史、分析、設定。語音流程 `record → transcriptReview → aiReview → saveSuccess`（`aiSaveConfirm` 保留給 fallback）。
- 很多 `scripts/verify_mobile_*.py` 會靜態讀這些檔案（導覽、UI 規格覆蓋、design token、secure storage），改名或重構可能讓 `npm run quality` 失敗。
- 環境變數用 `EXPO_PUBLIC_*`（`mobile/.env.example`）。release build 由 `verify:release-env` 擋 dev auth、debug tools、非 HTTPS 或本機 API URL。

## 7. Web

- `web/src/main.tsx`：`/admin*` → `AdminApp`，其他 → `App`。
- `App.tsx`：手機流程模擬器（登入、Browser Web Speech、MediaRecorder、`transformersSpeech.ts` 瀏覽器 Whisper、parse preview、確認儲存）。
- `AdminApp.tsx`：API 與模型用量、系統與存取事件、使用者與 profile、使用者的 AI 解析紀錄與健康紀錄。
- 設定：`VITE_API_BASE_URL`、`VITE_ENABLE_DEBUG_TOOLS`，以及語音額度相關 `VITE_*`。

## 8. Feature flags

定義在 `backend/app/services/feature_flags.py`（`GET /feature-flags`，`contract_version "1"`），鏡像在 `web/src/featureFlags.ts` 與 `mobile/featureFlags.ts`。目前只有 `food_photo_analysis`、`health_integrations`，預設關閉，client fail-closed。新增 flag 要三處一起加，`scripts/verify_feature_flags.py` 檢查一致性。

## 9. 可觀測性

- `core/logging.py`：JSON log，只輸出 allowlist 欄位（request_id、trace_id、route、method、http_status、event_code、model_id、provider、duration_ms 等）。
- `/metrics`：Prometheus，route pattern 層級，不含 query、body。只有後台管理員能讀（`get_current_admin`），後台「API 與指標」頁會解析顯示。
- 管理後台：每日 API 與 token 用量、operational events（模型錯誤、5xx、慢請求、登入事件）。
- 尚無告警、dashboard 或 trace exporter。
