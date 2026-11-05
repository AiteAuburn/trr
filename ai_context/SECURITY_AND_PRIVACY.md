# 安全與隱私

文件定位：PHI 規則、no-PHI logging、audit、資料流向與目前的違反項目（取代 security_compliance、no_phi_logging）。最高規則在 `skills.md`；上線缺口追蹤在 `PRODUCTION_READINESS.md`。本文件是工程設計，不是法律意見；進入醫療機構或美國 HIPAA 場景前需要法務與合規審查。

## 1. 資料分類

| 類別 | 例子 | 規則 |
|---|---|---|
| PHI / 健康資料 | 血糖、飲食、運動、用藥、備註、逐字稿、報告、profile 身分、授權紀錄 | 不進一般 log、analytics、error report、prompt log；開發與測試只用假資料 |
| 敏感 App 資料 | access / refresh token、密碼、API key、JWT secret、admin session secret | 不進 repo、log；App token 只存 SecureStore |
| 營運資料 | request id、route pattern、status、latency、model id、錯誤代碼、匿名計數 | 可以記錄 |

## 2. 資料流向（目前實際狀況）

| 流向 | 送出內容 | 狀態 |
|---|---|---|
| App → 後端（HTTPS） | transcript、候選紀錄、確認後紀錄 | 預期行為 |
| 後端 → DeepSeek（`api.deepseek.com`） | 分段後的使用者原話（每段 ≤160 字） | 依 D1 決定不設 App 內同意，介面不顯示廠商名；DeepSeek 沒有 BAA。隱私權政策需揭露第三方 AI 處理 |
| 後端 → DeepSeek（年度回顧） | 只有年度聚合統計 | 符合最小化 |
| 手機 → 系統語音服務（通常 Google） | 錄音 | 未要求 on-device，可能上雲（D3） |
| 手機 → Hugging Face | 下載 Whisper 模型（不送使用者資料） | 只檢查檔案大小，無 checksum |
| 原始音檔 | 不上傳；暫存檔在每種結束情況都刪除 | 符合 |

## 3. 保存

| 資料 | 位置 | 期限 |
|---|---|---|
| 結構化紀錄 | `records`、`daily_records` | 使用者資料，軟刪除 |
| 原始逐字稿 | `ai_parse_audits.transcript_text`（前 4000 字）、`daily_records.transcript_entries_json` | **無期限、無清除 job**；管理後台看得到（D2） |
| Refresh session、JWT denylist、rate limit counter、過期授權 | 各自資料表 | 有 `prune_*` 函式，但沒有排程呼叫 |
| Operational events、每日用量 | `operational_events`、`api_usage_daily`、`ai_token_usage_daily` | 後台只查 30 天，資料不刪 |

## 4. 伺服器端控制（已實作）

- 每個 route 都要認證，除非列在 `PUBLIC_ROUTE_REASONS`（測試會擋）。
- Profile / record 權限集中在 `services/permissions.py`；看不到的資源一律回 404，不透露是否存在。
- 寫入動作寫 audit event（`services/audit.py`），metadata 經 `sanitize_audit_metadata` 去敏並限制大小。
- Request body、payload JSON、回應欄位都有大小與數量上限；422 不回傳 `input`。
- 密碼 PBKDF2-HMAC-SHA256；refresh token 只存 hash 並輪替；JWT 可用 jti denylist 撤銷。
- Rate limit 存 DB（`rate_limit_counters`，key 為 hash）：登入、註冊、refresh、logout、admin 登入、AI 解析。
- Production config 拒絕 dev auth、debug tools、wildcard CORS、弱 JWT 設定；staging 拒絕 dev auth。
- Lightsail：DB 只在 internal 網路、backend 不對外開 port、Caddy 自動 TLS 與 HSTS（見 `DEPLOYMENT.md`）。

## 5. App 端控制

| 項目 | 狀態 |
|---|---|
| Token 存 Keychain / Keystore | 已實作：`expo-secure-store`，`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`，不可用時 fail closed（`verify_mobile_secure_auth_storage.py` 檢查） |
| Release 不含 dev auth、debug tools、本機 API | 已實作：`verify:release-env` |
| 本機加密資料庫 | 不適用：App 沒有本機資料庫，所有資料在伺服器 |
| Biometric lock | **未實作** |
| 防截圖 / 背景遮罩 | **未實作** |
| Release 簽章 | **仍用 debug keystore**（D4） |

Biometric 與防截圖是否為上線必要條件，列入 `PRODUCTION_READINESS.md` 決定。

## 6. No-PHI logging

禁止寫入一般 log、debug log、CI 輸出、error report、analytics、audit metadata：

- 血糖值、逐字稿、飲食內容或照片、用藥名稱與劑量、備註、報告內容
- LLM prompt 與 model output
- token、密碼、API key、DB password

可以記錄：request id、trace id、route pattern、method、HTTP status、latency、版本、非 PHI 錯誤代碼、feature flag 狀態、model id、匿名計數。

實作：

- `core/logging.py` 的 `PhiSafeJsonFormatter` 只輸出 allowlist 欄位，字串截到 256 字。
- `core/redaction.py` 定義敏感 key（transcript、prompt、token、password、payload、glucose_value、medication、note、audio、photo、api_key…）；audit metadata 經它去敏。
- API handler 不 log request body；parser 不 log transcript、prompt、model output。
- Metrics 只用正規化後的 route、model id、結果代碼。

Audit log 可記：actor、profile_id、action、resource_type、resource_id、時間、非 PHI metadata。不可記：`payload_json`、逐字稿、血糖值、飲食、用藥、報告內容。

## 7. Debug tools

`ENABLE_DEBUG_TOOLS`、`VITE_ENABLE_DEBUG_TOOLS`、`EXPO_PUBLIC_ENABLE_DEBUG_TOOLS` 預設 false，production 拒絕開啟。Debug stream 會顯示 raw model 內容：只能在短期、非 production 環境開，限授權開發者，不保存輸出，結束後關閉並清理暫存。

## 8. 事件應變（尚未演練）

要預先決定負責人與步驟：撤銷 token（`/auth/logout-all`、denylist）、撤銷分享授權、停用 DeepSeek（移除 `DEEPSEEK_API_KEY`）、清除被寫入 log 的 PHI、通知受影響使用者、保全 audit log。

事件類型：token 外洩、分享連結外洩、PHI 進 log、第三方 API 誤傳 PHI、權限檢查錯誤、DB 或備份設定錯誤。
