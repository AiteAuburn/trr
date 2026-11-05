# 部署與發版

糖錄錄目前只有一個部署目標：`infra/lightsail/`。一台 AWS Lightsail 主機用 Docker Compose 跑 Caddy、網頁、後端、PostgreSQL。這份文件取代舊的 CLOUD_DEPLOYMENT_GUIDE、MINIMAL_PRODUCTION_STACK、PRODUCTION_DEPLOYMENT_ARCHITECTURE、ZERO_DOWNTIME_RELEASE_RUNBOOK。Kubernetes、AWS Terraform（ECS/RDS）、`infra/minimal/` 從沒正式部署過，已在 2026-11-05 移除；要找舊內容請看 git 歷史 `efca25f` 之前。

> 這是 **staging**，給內部 APK 測試用，不是高可用架構。用真實使用者資料之前，請先處理文末「上線前缺口」。

## 1. 架構

```text
手機 APK / 瀏覽器
        │ HTTPS 443
        ▼
  Caddy（自動 TLS） ── /api/*、舊版 API 路徑 ──► backend:8000（FastAPI，不對外開 port）
        │                                          │  private 網路（internal）
        └─ 其他路徑、/admin ──► web:8080（靜態網頁）  ▼
                                               db:5432（PostgreSQL 16）
backend 另接 public 網路，只為了連出 api.deepseek.com
```

| 服務 | 映像 | 重點設定 |
|---|---|---|
| caddy | `caddy:2.10-alpine` | 唯一對外：80/443。加 HSTS、nosniff、DENY frame。 |
| backend | `backend/Dockerfile.prod` | 非 root、`read_only`、`cap_drop: ALL`、健康檢查打 `/readyz`。`APP_ENV=staging`。 |
| web | `web/Dockerfile.prod` | 建置時 `VITE_API_BASE_URL=/api`、debug 工具關閉。 |
| db | `postgres:16-alpine` | 只在 internal 網路，資料在 `postgres_data` volume。 |

主機：Ubuntu 24.04、1 GB 方案加 2 GB swap、固定 IPv4。防火牆只開 22（限操作者 IP）、80、443。AWS Budget 每月 USD 10，實際 80%、預測 100% 寄信（`create-budget.ps1`）。

### 路由（`infra/lightsail/Caddyfile`）

- `/api/*`：去掉 `/api` 前綴後轉給後端。新版網頁和 APK 都走這裡。
- 舊版路徑（`/auth/*`、`/records/*`、`/ai/*`…）：為了已安裝的舊 APK 暫時保留。所有使用者都換成新版 APK 後再刪。
- `/admin*`：回傳網頁 SPA，後台登入用 HttpOnly cookie。

### 後端環境變數（`compose.yml` 固定值）

| 變數 | 值 | 原因 |
|---|---|---|
| `ALLOW_DEV_AUTH` | `${ALLOW_DEV_AUTH:-false}` | dev 登入不用密碼，staging 一定要 false（config 也會拒絕非 local/test/development 開啟）。 |
| `AUTH_JWT_REQUIRE_JTI` | `true` | JWT 必須有 jti，才能撤銷。 |
| `DEEPSEEK_PARSER_URL` | `https://api.deepseek.com/v1/chat/completions` | 目前的 AI 解析。**逐字稿原文會送出去**，見文末缺口。 |
| `LOCAL_LLM_TIMEOUT_SECONDS` / `LOCAL_LLM_MAX_TOKENS` | `45` / `900` | 成本與延遲上限，`verify_deployment_config.py` 檢查上限。 |
| `LOCAL_LLM_REPAIR_FALLBACK_ENABLED` | `true` | 模型失敗時改用規則解析，不會再打第二次 AI。 |
| `MAX_REQUEST_BODY_BYTES` | `1048576` | 請求最大 1 MiB。 |
| `RELEASE_ID` / `GIT_SHA` | 部署時傳入 | `/version` 用來確認跑的是哪一版。 |

秘密值只放在伺服器上的 `infra/lightsail/.env`（權限 600，不進 git）：資料庫密碼、`AUTH_JWT_SECRET`、`DEEPSEEK_API_KEY`、`ADMIN_PASSWORD_HASH`、`ADMIN_SESSION_SECRET`。

## 2. 第一次部署

在伺服器上依序執行：

1. 建立主機、固定 IP、防火牆、Budget（已登入的 AWS CLI）。
2. 以 root 跑 `bootstrap.sh`：安裝 Docker、建立 swap、建立 `/opt/bloodsugar`。
3. 把 repo 上傳到 `/opt/bloodsugar`，**不要**帶 `.git`、`.env`、快取、金鑰。
4. 產生 `.env`，再用互動方式填入秘密（輸入不會顯示，明文不落地）：
   ```bash
   bash infra/lightsail/initialize-env.sh DOMAIN
   bash infra/lightsail/set-deepseek-key.sh
   bash infra/lightsail/set-admin-credentials.sh
   ```
5. 跑 migration，再啟動（見下節的指令）。
6. 檢查 `https://DOMAIN/`、`/admin`、`/healthz`、`/readyz`、`/version`，再用假資料做一次解析測試。
7. 用 `EXPO_PUBLIC_API_BASE_URL=https://DOMAIN/api` 建 APK（`docs/ANDROID_RELEASE_SHARING.md`）。

測試用網域可以先用 IP 萬用 DNS 服務；給真實使用者前要換成專案自己的網域。

## 3. 每次發版

以下指令都在 `/opt/bloodsugar` 執行，先設定：

```bash
export RELEASE_ID=2026-11-05.1 GIT_SHA=<完整 commit SHA>
dc() { docker compose --env-file infra/lightsail/.env -f infra/lightsail/compose.yml "$@"; }
```

1. **記錄**：這次的 `RELEASE_ID`、`GIT_SHA`，以及上一版的 `GIT_SHA`（回滾要用）。
2. **合併前檢查**：在開發機跑 `make check` 全部通過。
3. **建置一次**：`dc build backend web`。migration 和後端用同一個映像。
4. **先備份**：`sh infra/lightsail/backup.sh`，確認 `backups/` 裡有新的 `.dump`。
5. **migration**：`dc run --rm backend alembic upgrade head`。只允許 expand/contract 的 expand 階段（只加不刪），舊版程式要能繼續用新 schema。規則在 `infra/api-migration-compatibility.json`。
6. **重啟**：`dc up -d`。Caddy 等後端的 `/readyz` 通過才轉流量。單機重建會有幾秒中斷，這是已知取捨。
7. **確認**：`/readyz` 是 ready、`/version` 的 `release_id` / `git_sha` 是這一版，再用假資料跑一次 錄音 → 解析 → 確認 → 存。
8. **觀察 15 分鐘**：看 5xx、登入失敗、解析失敗、回應時間（後台用量頁、`dc logs backend`）。

## 4. 回滾

1. 程式先退：把伺服器上的程式換回上一版 `GIT_SHA`，`dc build backend web && dc up -d`。
2. **不自動降版資料庫**。因為 migration 只加不刪，上一版程式應該能直接用現在的 schema。
3. 確認 `/readyz` 通過、`/version` 顯示上一版、錯誤率恢復。
4. 只有資料本身壞掉才還原備份：先 `dc stop backend`，再 `sh infra/lightsail/restore.sh backups/<檔名>.dump`，再 `dc start backend`。還原會覆蓋備份之後的所有寫入。
5. 留下紀錄，修好再重新發版。破壞性（contract）migration 必須是獨立的一次發版，不能放進回滾。

## 5. 備份與還原

- `infra/lightsail/backup.sh`：在 db 容器裡 `pg_dump -Fc`，先寫暫存檔再改名，成品權限 600，預設保留 14 天（`BACKUP_RETENTION_DAYS`）。
- `infra/lightsail/restore.sh`：`pg_restore --clean --if-exists`，檔案不可讀就停止。
- `backups/` 已在 `.gitignore`。**備份裡有健康資料**，不可以 commit、不可以傳到私人雲端硬碟。
- 目前沒有排程，也沒有異地備份；至少每次發版前手動跑一次。`scripts/verify_backup_restore.py` 檢查這兩支腳本的保護措施還在。

## 6. 定期工作

目前主機上沒有任何排程，以下都要手動跑：

| 時間 | 指令 | 說明 |
|---|---|---|
| 每次發版前 | `sh infra/lightsail/backup.sh` | 見第 5 節。 |
| 每年 1 月 1 日 | `dc run --rm backend python -m app.jobs.generate_year_review_snapshots` | 產生前一年度的年度回顧；只補缺漏的 snapshot，重跑不會改已存在的。 |

## 7. 手機版相容性

- 手機 APK 不會跟伺服器同時更新。伺服器回應只能**新增**選填欄位，不能刪除或改變已發出 APK 在用的欄位。
- API 支援範圍在 `infra/api-migration-compatibility.json`。不相容的改動要升 contract 版本，並給舊版 App 過渡期。
- 原生套件改動需要重新簽章的新 APK。功能要能由伺服器的 feature flag 單獨關掉，不必逼使用者回退 App。
- 回滾 App 等於重新發一個舊版的簽章 APK，所以後端 API 相容性才是不中斷的主要保護。

## 8. 上線前缺口（給真實使用者之前要處理）

| 項目 | 現況 | 要做的事 |
|---|---|---|
| dev 登入 | `compose.yml` 預設 false，但伺服器上的 `.env` 要自己確認 | 登入伺服器確認 `ALLOW_DEV_AUTH=false`。 |
| 隱私揭露 | 依 D1 決定，App 內不設 AI 同意、介面不顯示廠商名 | 隱私權政策與 Google Play 資料安全表單揭露「由第三方 AI 服務處理」。 |
| 原始逐字稿保存 | `ai_parse_audit` 永久保存逐字稿 | 改存長度/雜湊，或加保存期限。 |
| APK 簽章 | 正式版仍用 debug keystore | 建立正式 keystore（`docs/ANDROID_RELEASE_SHARING.md`）。 |
| 頻率限制 | uvicorn 只信任 127.0.0.1 的 proxy header，後端看到的 IP 都是 Caddy | 設定 `FORWARDED_ALLOW_IPS`，否則登入限制是全站共用。 |
| `/metrics` | 經 Caddy 對外公開 | 從 `@legacy_api` 移除，或加認證。 |
| 備份 | 只有手動、只在同一台主機 | 加排程和異地加密備份，並實際演練一次還原。 |
| 監控 | 只有 log 和後台用量頁 | 至少加外部 uptime 檢查和磁碟空間告警。 |

## 9. 相關檢查

| 腳本 | 檢查內容 |
|---|---|
| `scripts/verify_deployment_config.py` | Lightsail compose / env 範本的安全預設值與上限、秘密不進範本、Caddy 路由。 |
| `scripts/verify_release_contract.py` | `infra/release-contract.json`、後端健康檢查與 `/version`、本文件的關鍵步驟。 |
| `scripts/verify_backup_restore.py` | 備份/還原腳本的保護措施、`backups/` 被 git 忽略。 |
| `scripts/verify_api_migration_compatibility.py` | migration 只有一個 head、新 migration 都是 expand。 |

這些都包含在 `make check`（`scripts/check.sh`）。
