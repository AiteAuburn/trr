# 糖錄錄安全、同步與 HIPAA 導向架構草案

文件定位：本文件描述安全、同步與 HIPAA 導向細節。通用 AI / engineering 執行規範以根目錄 `skills.md` 為準。

## 1. 合規定位

糖錄錄第一版定位是健康紀錄工具。若未來支援醫院、診所、醫師或美國市場的受監管工作流，就必須以 HIPAA 導向方式設計。

HIPAA 方向的核心要求：

- 保護 PHI / ePHI。
- 確保 confidentiality、integrity、availability。
- 落實 administrative、physical、technical safeguards。
- 若使用 AWS 處理 PHI，需簽 AWS BAA 並只使用 HIPAA eligible services。
- 若使用 OpenAI 處理 PHI，需先與 OpenAI 簽 BAA，且只能走符合條件的 API / endpoint 與資料處理設定。

此文件是工程設計草案，不是法律意見。正式進入醫療機構或美國 HIPAA 場景前，需要法務與合規顧問審查。

## 2. PHI 資料原則

資料分類：

- PHI / ePHI：血糖、飲食、運動、用藥、報告、使用者身份資料、醫師授權存取紀錄。
- Sensitive app data：access token、refresh token、device key、local encryption key。
- Operational data：匿名 crash log、性能統計、模型失敗率。

原則：

- 預設不把 PHI 傳給第三方。
- 雲端 fallback 前要明確符合使用者同意、會員方案、合規條件。
- 不把 PHI 寫入一般 analytics、crash reporting、prompt log。
- log 預設做 redaction。
- 開發、測試、demo 使用假資料。
- Profile / grant / shared-profile response 必須限制公開文字長度、grant type 與 scopes 數量/枚舉，避免分享與醫師合作資料面無界擴張。
- Report / export response 必須限制 record count、section count 與數值範圍，避免聚合健康資料 response 無界成長或輸出超出 schema 的數值。
- Rate-limit public retry metadata 必須在 response detail 與 `Retry-After` header 前限制合理範圍，避免異常 window 設定或 future caller 回傳無界數值。
- Subscription / quota public metadata 必須在 API response 前限制 plan code、status、referral code 與秒數範圍，避免商業 metadata 無界流出。
- AI model/provider metadata response 必須有 id、label、description 與清單數量上限，避免 runtime/provider 狀態把過長 metadata 傳給前端。
- AI runtime model discovery 必須在 caching 或 availability 比對前限制外部 model id 長度與數量，避免本地 provider 回傳異常 metadata。
- AI parse preview response 必須有明確文字長度、候選紀錄數、segment 數、rejected event 數與 top-level JSON key 上限，避免 parser-derived 結構無界回傳。
- AI progress stream relay / wrapper 必須先檢查 event line 大小再做 JSON parsing；過大 event 回固定低資訊錯誤，不回送原始內容。
- AI debug/local model stream 必須先檢查 upstream stream line 大小再做 JSON parsing；debug tool 也不可回送過大的 raw model line。
- AI command proposal / action response payload 必須有明確長度、數量與 top-level key 上限，避免 parser-derived 結構無界傳給 UI 或 agent client。

## 3. App 端安全

### Local DB 加密

SQLite 必須使用 encrypted SQLite。

建議：

- iOS / Android 都使用支援 SQLCipher 或等效加密能力的 SQLite 層。
- 每個使用者 / 裝置有獨立 DB encryption key。
- key 不硬編碼在 App。
- key 存在 iOS Keychain / Android Keystore。
- 使用者登出時可選擇刪除本機資料。
- 遠端登出或裝置撤銷時，讓 sync token 失效。

### Biometric Auth

敏感頁面支援 FaceID / 指紋。

需要保護的頁面：

- 歷史紀錄
- 血糖趨勢
- 報告
- 匯出 / 分享
- 醫院授權
- 個人資料

策略：

- 預設建議開啟。
- 使用系統 biometric，不自行保存生物特徵。
- biometric 失敗時走裝置 passcode 或重新登入。

### Token 不存 plaintext

token 儲存規則：

- access token 短效。
- refresh token 存 Keychain / Keystore。
- 不存 AsyncStorage plaintext。
- 不寫入 log。
- 不出現在 crash report。
- refresh token rotation。
- 偵測 token 重放或異常裝置時撤銷。
- Mobile has a `SecureStore` storage boundary for future production access/refresh tokens.
- Mobile fails closed when native secure storage is unavailable and does not fallback to AsyncStorage or ordinary file storage.
- Stored token values are length-bounded before persistence; UI status messages never display raw tokens.
- Mobile refresh-session operation calls `/auth/refresh` only when a bounded refresh token is already present, persists rotated tokens only through `SecureStore`, and clears local tokens if secure persistence fails.
- Mobile logout operations call `/auth/logout` or `/auth/logout-all` when possible, then clear local token state and bounded session metadata; failure paths still clear local tokens conservatively.
- Mobile session-list operation calls `/auth/sessions?limit=20` and displays only bounded metadata such as created/expiry/last-used timestamps and device-fingerprint presence. It must not display raw refresh tokens, token hashes, raw device fingerprints, raw claims, request bodies, or full token values.
- Mobile provider-login buttons create only bounded nonce/state challenges with crypto-secure random and a short TTL; if secure random is unavailable, mobile fails closed.
- Pending provider nonce/state challenges stay in memory through a ref-only boundary and are not written to React state, AsyncStorage, ordinary files, logs, alerts, or visual-smoke artifacts.
- Mobile provider callbacks must validate bounded state and challenge expiry before sending a bounded nonce and compact ID token to `/auth/oidc-login`; rejected callbacks clear the pending challenge without storing provider tokens.

Backend bootstrap status：

- Protected endpoints can validate short-lived HS256 Bearer JWTs when `AUTH_JWT_SECRET` is configured.
- Protected endpoints can validate provider-issued RS256 Bearer JWTs when `AUTH_JWKS_URL` is configured.
- In production, `AUTH_JWT_SECRET` must be at least 32 characters.
- JWT secret, issuer, and audience settings are length-bounded; issuer/audience values are whitespace-normalized before validation.
- JWKS URL and timeout settings are bounded; production requires an HTTPS JWKS URL.
- `DATABASE_URL` is normalized, parsed as a SQLAlchemy URL, restricted to supported PostgreSQL drivers, and required to include a database name before engine creation.
- CORS origin lists, parser/runtime URLs, local model ids, and local LLM keep-alive settings are length/shape-bounded and normalized at startup before downstream HTTP, parser, model-runtime, or metrics use.
- In production, configuring `AUTH_JWT_SECRET` also requires `AUTH_JWT_ISSUER` and `AUTH_JWT_AUDIENCE`, so bootstrap JWTs are issuer- and audience-bound.
- In production, configuring `AUTH_JWT_SECRET` also requires `AUTH_JWT_REQUIRE_JTI=true`, so accepted bootstrap access tokens can be checked against the revocation denylist.
- In production, configuring `AUTH_JWKS_URL` also requires `AUTH_JWT_ISSUER`, `AUTH_JWT_AUDIENCE`, and `AUTH_JWT_REQUIRE_JTI=true`, so provider-issued tokens are issuer-bound, audience-bound, and revocation-checkable.
- Provider-neutral OIDC login exchange is available through `/auth/oidc-login` when `AUTH_OIDC_JWKS_URL`, `AUTH_OIDC_ISSUER`, `AUTH_OIDC_AUDIENCE`, and `AUTH_JWT_SECRET` are configured.
- In production, configuring `AUTH_OIDC_JWKS_URL` requires HTTPS, OIDC issuer/audience, and a strong app JWT secret so verified provider ID tokens can be exchanged for short-lived app access tokens and hash-only refresh sessions.
- OIDC login request schema bounds provider id, compact ID token length/shape, nonce, and optional device fingerprint before rate limiting, JWKS lookup, crypto verification, account lookup, or session creation.
- `/auth/oidc-login` applies client-key hash rate limiting before ID token verification, so many distinct invalid ID tokens cannot bypass the endpoint boundary.
- OIDC login requires a matching verified nonce claim, a valid email claim, and rejects `email_verified=false`; account creation uses bounded display name fallback and never stores raw ID tokens, raw nonce values, or raw provider claims.
- Token `sub` must be the account id and `exp` must be valid.
- Access token lifetime is limited by `AUTH_JWT_MAX_AGE_SECONDS`, default 900 seconds.
- Optional token `iat` and `nbf` claims are rejected when they are too far in the future.
- Optional token `jti` can be denied through the `revoked_jwts` table, where only a SHA-256 jti hash is stored.
- JWT denylist expiration datetimes must include a timezone before `jti` hashing or storage work.
- Oversized `Authorization` headers and oversized JWT header/payload/signature parts are rejected before JWT decoding, JWKS key lookup, crypto verification, or account lookup to reduce memory/CPU abuse and avoid token echoing.
- Decoded JWT header/payload objects are shape-bounded before claim validation or account lookup, including maximum claim count, claim string length, audience list width, and rejection of nested claim objects.
- `AUTH_JWT_REQUIRE_JTI=true` can require every production access token to include `jti`.
- JWT `jti` values must be non-empty and at most 128 characters before token issuance, revocation denylist lookup, or account lookup; the revocation service also normalizes and bounds `jti` values before hashing or storage.
- Expired revoked JWT hash rows can be pruned through a hard-capped bounded-batch maintenance helper without storing raw tokens or raw token ids.
- Refresh-session persistence now has a hash-only foundation through `auth_sessions`; refresh tokens and device fingerprints must never be stored raw.
- Auth-session token hash inputs are whitespace-normalized and length-bounded before hashing or refresh-session lookup/storage.
- Device fingerprints are whitespace-normalized and length-bounded before hashing or refresh-session storage.
- Refresh-session expiration datetimes must include a timezone before hashing, comparison, or storage work.
- Refresh-session rotation updates the stored token hash and rejects wrong, expired, or revoked sessions.
- All active refresh sessions for an account can be revoked for logout-all or account-risk handling through a database bulk update without loading every session into memory.
- Expired refresh-session rows can be pruned through a hard-capped bounded-batch maintenance helper.
- Refresh-token request shape is bounded and validated before rate-limit hashing or session lookup, and validation errors do not echo raw token input.
- `/auth/refresh` can rotate a valid refresh token and issue a short-lived HS256 Bearer access token when `AUTH_JWT_SECRET` is configured.
- Refresh endpoint responses return a new raw refresh token only to the caller; storage remains hash-only.
- Refresh endpoint response schema bounds access/refresh token strings, constrains `token_type` to `bearer`, and bounds `expires_in`.
- `/auth/refresh` is protected by DB-backed fixed-window rate limiting before session lookup.
- Refresh rate-limit counters store only SHA-256 hashes of rate-limit keys and do not store raw refresh tokens.
- Rate-limit service keys are whitespace-normalized and length-bounded before hashing or counter upsert.
- `AUTH_REFRESH_RATE_LIMIT_COUNT` and `AUTH_REFRESH_RATE_LIMIT_WINDOW_SECONDS` control refresh attempt limits.
- `/auth/refresh` also applies client-key hash rate limiting before token-key rate limiting, so many distinct invalid refresh tokens cannot bypass the endpoint boundary.
- `AUTH_REFRESH_CLIENT_RATE_LIMIT_COUNT` and `AUTH_REFRESH_CLIENT_RATE_LIMIT_WINDOW_SECONDS` control the client-key refresh attempt limit.
- `/auth/logout` applies client-key hash rate limiting before refresh-session lookup, and unknown-token attempts still commit the rate-limit counter.
- `AUTH_LOGOUT_CLIENT_RATE_LIMIT_COUNT` and `AUTH_LOGOUT_CLIENT_RATE_LIMIT_WINDOW_SECONDS` control logout attempt limits.
- Local and minimal production Compose examples pass the logout client rate-limit settings into the backend service.
- AI parse routes are protected by account-scoped DB-backed fixed-window rate limiting before voice quota usage and before parser / LLM execution.
- AI parse rate-limit counters store only SHA-256 account-key hashes.
- `AI_PARSE_RATE_LIMIT_COUNT` and `AI_PARSE_RATE_LIMIT_WINDOW_SECONDS` control AI parse attempt limits.
- Ollama model-list response text is bounded before JSON materialization so model availability checks cannot parse oversized local-runtime payloads into memory.
- Local parser HTTP response text is bounded before JSON materialization to avoid parsing oversized local-model responses into memory.
- Local parser response content is size-bounded before JSON extraction/parsing, and oversized-output errors omit raw model output and transcript content.
- Local parser debug-stream HTTP failures return fixed low-information errors and do not echo parser URLs, connection details, transcript fragments, numeric health values, or secret-like query text.
- Compact IR records, rejected events, item lists, flags, and short text fields are bounded before parser output is mapped into confirmation candidates.
- Deterministic parser candidate records and per-meal food items are capped before confirmation or command-proposal responses are built.
- Blank AI transcripts are rejected at request-schema validation before route-level quota work, parser execution, or LLM work.
- AI transcripts with too many candidate numeric values are rejected before model availability lookup, profile lookup, quota work, parser execution, or LLM work.
- Request validation error details are JSON-safe and bounded after sanitization, including validator context values, and continue to omit raw `input`.
- Structured JSON log string fields are length-bounded before serialization.
- Shared sensitive-data redaction is bounded by depth, container width, and string length before returning redacted structures.
- Record payload and metadata JSON are bounded by depth, node count, container width, and string length before permission lookup, sanitizer recursion, schema validation, or DB write work.
- Record payload/metadata storage sanitizers are bounded by depth, container width, and string length, and remove raw transcript/source/free text before DB storage.
- Meal `food_items` and note `tags` have schema-level count and shape bounds before DB write.
- Core numeric health payloads have schema-level range checks before DB write so outlier values cannot pollute analysis.
- Core record units, short text fields, and selected category values are schema-bounded before DB write so arbitrary parser/client strings cannot pollute analysis or grow persisted payload cost.
- Voice quota service code rejects negative or oversized requested voice seconds before subscription lookup, usage-counter lookup, quota upsert, parser execution, or LLM work.
- Voice usage-counter day windows require timezone-aware datetimes before period derivation.
- Voice entitlement limits and stored usage counters are normalized to bounded service caps before quota display, quota decisions, or atomic usage updates.
- DB-backed rate-limit consumption uses PostgreSQL atomic upsert increment to avoid read-then-write races across workers.
- Old rate-limit counter rows can be pruned by timezone-aware retention cutoff without raw key material, using hard-capped batches to avoid loading all expired counters into memory.
- Protected JSON API requests are rejected with `413` before route parsing when body size exceeds `MAX_REQUEST_BODY_BYTES`, including requests without `Content-Length` via bounded pre-read and replay.
- `Content-Length` parsing is bounded before integer conversion; malformed, negative, signed, whitespace-padded, or oversized header values are rejected with `400` before route parsing or body reads.
- `/auth/logout` revokes the matching active refresh session and is idempotent for missing or already-invalid refresh tokens.
- `/auth/logout` also denies a provided valid Bearer access token by writing only the bounded `jti` hash and expiry to the JWT denylist.
- `/auth/logout-all` requires current account authentication, revokes all active refresh sessions for that account only, and denies the current Bearer access token through the JWT `jti` denylist when provided.
- `/auth/logout-all` response schema bounds the public revoked-session count.
- `/auth/sessions` requires current account authentication and lists active refresh-session metadata for that account only with bounded `limit` pagination controls.
- `/auth/sessions` response schema hard-caps the returned session metadata list while preserving the public JSON list shape.
- Session listing does not expose raw refresh tokens, refresh-token hashes, raw device fingerprints, or device-fingerprint hashes.
- `DELETE /auth/sessions/{session_id}` requires current account authentication and revokes only matching active sessions owned by that account.
- Single-session revoke is idempotent for unknown, expired, already-revoked, or other-account session ids, and uses a bounded database `UPDATE` without loading the auth-session row.
- Inactive profile access grants can be pruned in hard-capped bounded batches after a timezone-aware retention cutoff.
- Logout and logout-all access-token invalidation depend on clients sending the current Bearer token; otherwise access-token exposure is still bounded by short expiry and the optional `jti` denylist.
- `AUTH_JWT_ISSUER` and `AUTH_JWT_AUDIENCE` can be configured for issuer/audience checks.
- This is a bootstrap boundary, not the final Apple / Google / OIDC solution.
- Future production auth should move to OIDC / JWKS validation plus real login issuance and device/session management UI.

### 防止截圖

敏感頁面應啟用防截圖。

Android：

- 使用 FLAG_SECURE。

iOS：

- iOS 無完全等價的全域防截圖保證。
- 可在 app switcher / background 時遮罩敏感畫面。
- 可偵測截圖事件後提示使用者注意隱私，但不能完全阻止。

敏感頁面：

- 報告
- 歷史紀錄
- 醫院分享連結
- 個人資料
- 授權管理

## 4. 傳輸與伺服器加密

傳輸：

- 全部 HTTPS / TLS。
- 禁止明文 HTTP。
- 可評估 certificate pinning，但要有輪替策略，避免憑證更新造成 App 斷線。

伺服器端：

- S3 SSE-KMS。
- DynamoDB / Aurora encryption at rest。
- Secrets Manager 儲存 secret。
- KMS key rotation。
- 每個大客戶可選獨立 KMS key。
- 備份同樣加密。

## 5. Access Control

權限模型：

- user
- caregiver
- doctor_viewer
- clinic_admin
- tenant_admin
- support_operator
- system_service

預設最小權限：

- 使用者只可存取自己的資料。
- 醫師只能存取使用者明確授權的資料範圍。
- support_operator 預設不能看 PHI。
- admin 操作需 audit log。

可用方案：

- Cognito 做 authentication。
- 後端用 RBAC + ABAC。
- 大客戶或醫療場景可用 Amazon Verified Permissions / Cedar policy 管理細粒度授權。

醫師單次授權資料模型：

- grant_id
- patient_user_id
- viewer_identity
- tenant_id
- scope
- date_range
- expires_at
- revoked_at
- allow_pdf_download
- allow_structured_export
- created_at
- created_device_id

每次讀取都要檢查：

- grant 是否存在。
- grant 是否過期。
- grant 是否撤銷。
- viewer 是否符合。
- scope 是否包含請求資料。

Backend bootstrap status：

- Profile and record access flows route through `backend/app/services/permissions.py`.
- Permission resolution returns explicit non-PHI decisions with scope and bounded reason codes.
- Current default behavior is owner-only: owned profiles and active owned records are allowed; missing or unowned resources are hidden behind `404`.
- Owned profile listing is bounded and supports timezone-aware `before` cursor pagination.
- Account/profile display text is whitespace-normalized and rejects blank values before storage, keeping UI/shared-profile metadata bounded and clean.
- Record listing rejects incomplete or timezone-naive cursor parameters before permission/query work.
- `profile_access_grants` provides the first persistent account-to-profile grant foundation for caregiver/doctor/share expansion.
- Grants are scope-based and can expire or be revoked; expired/revoked grants are ignored by permission checks.
- Grant create/list/revoke APIs require `profile:share` permission and write audit events with bounded non-PHI metadata.
- Audit metadata is centrally redacted and bounded by depth, node count, container width, and string length before DB storage; redaction occurs inside the bounded sanitizer so deep metadata is not fully traversed first.
- Non-owner grant delegation is constrained to the actor's currently effective profile scopes.
- Grant creation rejects timezone-naive or already-expired `expires_at` values before permission/query work.
- Profile grant listing is bounded to avoid unbounded grant history responses.
- Shared-profile listing returns only active readable grants and does not expose owner account ids.
- Shared-profile listing applies active/readable filters before response limiting, avoiding inactive grants consuming page slots.
- Profile grant and shared-profile listing support timezone-aware `before` cursor pagination using bounded grant metadata.
- Basic report requests reject invalid or timezone-naive date windows before permission/query work.
- Grantees can self-revoke received grants; self-revoke is idempotent and audited with bounded non-PHI metadata.
- Inactive profile grants can be pruned by timezone-aware retention cutoff in hard-capped batches without reading health record payloads.
- Record read/write assertions are centralized so future caregiver, doctor, export, and share scopes can be added without duplicating ownership joins across routers.

## 6. Authentication

使用者：

- Email / phone / social login。
- MFA 可選，醫療 / 企業版建議強制。
- 裝置綁定與裝置列表。

醫師 / 診所：

- 強制 MFA。
- 可支援 SSO / SAML / OIDC。
- 可支援診所 tenant。
- session timeout 較短。

系統：

- service-to-service 使用 IAM role。
- 不使用長期靜態 key。
- CI/CD 使用 OIDC federation 到 AWS。

## 7. Audit Log

所有 PHI 存取都要有 audit log。

記錄：

- actor_id
- actor_type
- tenant_id
- patient_user_id
- action
- resource_type
- resource_id
- scope
- ip
- user_agent
- device_id
- request_id
- trace_id
- result
- created_at

需要記錄的事件：

- 登入 / 登出
- token refresh
- 查看紀錄
- 匯出報告
- 建立分享連結
- 醫師查看資料
- 撤銷授權
- 同步資料
- 刪除資料
- admin 存取
- fallback 到第三方 AI

audit log 原則：

- append-only。
- 防竄改。
- 保留期間依合規與商業需求設定。
- 一般客服不可修改。

可用服務：

- CloudTrail：AWS control plane。
- CloudWatch Logs / S3：app audit event。
- S3 Object Lock 或 QLDB：更強防竄改需求。

## 8. Data Integrity

本機與雲端同步要確保正確。

每筆資料應有：

- record_id
- user_id
- tenant_id
- record_type
- local_version
- server_version
- updated_at
- deleted_at
- content_hash
- device_id
- sync_status

同步策略：

- App 端本機先寫入 SQLite。
- 每次寫入產生 local mutation。
- sync worker 將 mutation 傳到 server。
- server 檢查 version 與 content_hash。
- server 接受後回傳 server_version。
- App 更新 local sync_status。

衝突處理：

- 同一筆資料不同裝置修改時，不能靜默覆蓋。
- server 回傳 conflict。
- App 顯示衝突解決 UI。
- 簡單情況可用 last writer wins，但必須保留前版本。
- 醫療紀錄與報告資料建議保留 version history。

刪除策略：

- 使用 soft delete。
- deleted_at 同步到 server。
- server 保留可恢復窗口。
- 真正刪除需符合資料保留政策。

## 9. Backup & Recovery

server side 必須能 sync 與恢復。

備份要求：

- DynamoDB PITR 或 Aurora automated backup。
- S3 versioning。
- S3 lifecycle / Glacier。
- KMS encrypted backup。
- 定期 restore drill。
- 明確 RPO / RTO。

建議目標：

- MVP：RPO 24 小時以內，RTO 24 小時以內。
- 付費成熟版：RPO 1 小時以內，RTO 4 小時以內。
- 大客戶版：可談更嚴格 SLA。

恢復流程：

- 單使用者資料恢復。
- 單 tenant 資料恢復。
- 全環境災難恢復。
- 模型版本回滾。
- migration rollback。

## 10. 不亂傳 PHI

禁止：

- 把 PHI 傳到非 HIPAA compliant API。
- 把 PHI 傳到未簽 BAA 的第三方。
- 把 PHI 寫入一般 analytics。
- 把完整語音、轉錄、報告送到非必要服務。
- 在 prompt log、debug log、crash log 留 PHI。

允許：

- 本地模型處理。
- 使用者同意且合規條件滿足後，透過後端代理送 HIPAA 合規 fallback。
- 去識別化或匿名化後的錯誤統計。

OpenAI fallback 前置條件：

- 已簽 OpenAI BAA。
- 使用符合 BAA 條件的 API / endpoint。
- backend 控制 request。
- redaction / minimization。
- audit log。
- quota 與成本限制。

## 11. Security Testing

通用 CI/CD gate 以根目錄 `skills.md` 為準。本節只保留安全與合規測試細項。

必要檢查：

- DAST：部署後動態掃描。
- IaC scan：CDK / Terraform misconfiguration。
- Mobile security review：token storage、screenshot protection、local DB encryption。
- API authorization test：確認越權存取失敗。
- PHI log leakage test：確認健康資料不進一般 log、error report、analytics。
- Encryption check：確認 local DB、server DB、backup、object storage 加密。
- Data retention test：確認刪除、保留、匯出規則符合設計。

定期測試：

- Penetration testing。
- Threat modeling。
- Backup restore drill。
- Incident response tabletop exercise。
- Access review。
- Audit log review。

## 12. CI/CD Security

CI/CD 通用規則、deployment gate、rollback、feature flag 與環境隔離以根目錄 `skills.md` 為準。

本節只補充健康資料與 HIPAA 導向注意事項。

AI / PHI CI/CD 注意事項：

- 測試 log 不可印出 PHI。
- error report 不可上傳病人資料。
- production data 不可拿去 staging 測試。
- LLM prompt log 不可保存健康資訊。
- voice input、food photo、blood glucose notes 都視為 sensitive health data。
- sensitive health data 不可進第三方服務或 debug log，除非合規、必要且經過明確設計。

## 13. Incident Response

需要預先定義：

- 誰負責處理資安事件。
- 如何封鎖 token。
- 如何撤銷分享連結。
- 如何停用第三方 fallback。
- 如何通知受影響使用者。
- 如何保全 audit log。
- 如何進行資料外洩評估。

資安事件類型：

- token 外洩
- 醫師授權連結外洩
- PHI 被寫入 log
- 第三方 API 誤傳 PHI
- 資料同步錯誤
- 權限檢查錯誤
- 雲端 bucket / database misconfiguration
