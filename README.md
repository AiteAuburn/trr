# 糖錄錄

Docker-first development skeleton for the blood sugar recording app.

## Run Locally

Backend:

```bash
docker compose up backend
```

Web simulator:

```bash
docker compose up web
```

All services:

```bash
make dev
```

Backend health:

```text
http://localhost:8000/health
```

Web:

```text
http://localhost:5173
```

Local defaults are intentionally developer-friendly:

- `APP_ENV=local`
- `ALLOW_DEV_AUTH=true`
- `ENABLE_DEBUG_TOOLS=false`
- local PostgreSQL in Docker
- local web API endpoint at `http://localhost:8000`

Do not reuse local credentials in staging or production.

## Docker Compose

Development Compose:

```bash
docker compose up -d db backend web
docker compose run --rm backend alembic upgrade head
```

Minimal production-style Compose:

```bash
cp infra/minimal/.env.example infra/minimal/.env
# edit every change-me value before first boot
docker compose --env-file infra/minimal/.env -f infra/minimal/docker-compose.yml up -d
```

Production-style defaults disable dev auth and debug tools:

```text
APP_ENV=production
ALLOW_DEV_AUTH=false
ENABLE_DEBUG_TOOLS=false
VITE_ENABLE_DEBUG_TOOLS=false
```

If `AUTH_JWT_SECRET` is configured for the bootstrap HS256 auth path in production,
also set `AUTH_JWT_ISSUER` and `AUTH_JWT_AUDIENCE`; production config rejects
issuerless or audienceless JWT validation.
Production also requires `AUTH_JWT_REQUIRE_JTI=true` so accepted access tokens
can be checked against the revocation denylist.

The production backend image runs as a non-root `app` user. The production web image uses `nginxinc/nginx-unprivileged`.

## Cloud Deployment

The backend is designed to run as a stateless container. Use managed services for durable state and secrets.

Required production posture:

- managed PostgreSQL: Cloud SQL, RDS, or Aurora
- cloud secret manager: Google Secret Manager, AWS Secrets Manager, or SSM Parameter Store
- private database networking
- no long-lived cloud keys in repo, images, or app config
- workload identity / GitHub Actions OIDC / task roles for cloud access
- `ALLOW_DEV_AUTH=false`
- `ENABLE_DEBUG_TOOLS=false`

GCP options:

- Cloud Run for the simplest backend deployment.
- GKE when Kubernetes HPA, ingress policy, workers, or network policy are needed.
- Cloud SQL for PostgreSQL.
- Secret Manager for `DATABASE_URL` and future auth/payment/API secrets.
- Artifact Registry for container images.

AWS options:

- ECS Fargate for the simplest backend container deployment.
- EKS when Kubernetes HPA, ingress policy, workers, or network policy are needed.
- RDS or Aurora PostgreSQL for database.
- Secrets Manager or SSM Parameter Store for secrets.
- ECR for container images.

Detailed runbooks:

- `ai_context/CLOUD_DEPLOYMENT_GUIDE.md`
- `ai_context/PRODUCTION_DEPLOYMENT_ARCHITECTURE.md`
- `ai_context/REPO_QUALITY_WORKFLOW.md`

Production blocker: real auth is not implemented yet. Do not expose the current API to real users until JWT/OIDC validation and profile permission scopes replace local development auth.

## Mobile Preview

The `mobile/` app is a React Native + Expo preview shell. It connects to the same backend and lets you test the mobile-first flow without using the web simulator.

Mobile env defaults are documented in `mobile/.env.example`.
For local Expo or Android Studio work, copy it first:

```bash
cd mobile
cp .env.example .env
```

On Windows WSL, start the backend:

```bash
docker compose up -d db backend ollama
```

On Mac, connect to the Windows LAN IP:

```bash
cd mobile
EXPO_PUBLIC_API_BASE_URL=http://WINDOWS_LAN_IP:8000 npm run start
```

For production-like mobile builds, disable dev login explicitly:

```bash
cd mobile
EXPO_PUBLIC_API_BASE_URL=https://api.example.com \
EXPO_PUBLIC_ALLOW_DEV_AUTH=false \
EXPO_PUBLIC_ENABLE_DEBUG_TOOLS=false \
npm run start
```

With `EXPO_PUBLIC_ALLOW_DEV_AUTH=false`, the mobile app will not call
`/auth/dev-login`; protected actions remain unavailable until production
JWT/OIDC login and secure token storage are connected.
Mobile dev auth is opt-in, so omitting `EXPO_PUBLIC_ALLOW_DEV_AUTH=true` has
the same fail-closed behavior.

Then open the Expo app in an iOS simulator or scan the QR code from a phone. The app also has an editable Backend URL field, so you can change the IP without rebuilding.

Before and after mobile UI/navigation changes, run the local quality gate:

```bash
cd mobile
npm run quality
```

This runs TypeScript checking and the source-level navigation verifier without starting Expo, backend, AI, auth, payment, or database services.

After major mobile layout changes, also run the visual smoke checklist in `ai_context/MOBILE_VISUAL_SMOKE_WORKFLOW.md`. Keep screenshots local, use seeded/sample/demo content only, and do not use backend writes, AI, LLM, Vision, STT, payments, production credentials, or real health data for evidence.

### Android APK Export

Debug APKs load JavaScript from Metro, so they still require `npm run start` /
`npx expo start` while testing:

```bash
cd mobile/android
./gradlew assembleDebug
```

For a standalone APK that does not require Metro, build release:

```bash
cd mobile/android
./gradlew assembleRelease
```

The APK is written to:

```text
mobile/android/app/build/outputs/apk/release/app-release.apk
```

Before building, check the local Android environment:

```bash
cd mobile
npm run apk:android-prereqs
```

For production-like APKs, also verify the bundled Expo public env before
building and confirm the Android release signing is not debug-signed:

```bash
cd mobile
npm run verify:release-env
npm run verify:android-release-signing
```

This fails if the build would include dev auth, debug tools, visual-smoke route
shortcuts, localhost, emulator, LAN, or non-HTTPS API URLs. For internal release
APK smoke tests against a local backend, local API URLs can be allowed while
still blocking dev auth and debug tools:

```bash
cd mobile
python3 ../scripts/verify_mobile_release_env.py --allow-local-api
```

On Windows, prefer PowerShell for APK export because `mobile/android/local.properties`
uses the Windows Android SDK path:

```powershell
cd D:\bloodsugar\mobile\android
.\gradlew.bat assembleRelease
```

Do not run Linux Gradle in WSL against the Windows SDK path from
`local.properties`, including `/mnt/c/.../Android/Sdk`; Linux Gradle expects
Linux tool binaries such as `aapt`, while the Windows SDK contains `aapt.exe`,
and Gradle can report the build-tools as corrupted. For WSL-only APK builds,
install a Linux Android SDK and set `sdk.dir` to that Linux SDK path, such as
`/home/aite/Android/Sdk`.

The current release build is still signed with the debug keystore in
`mobile/android/app/build.gradle`. That is acceptable for internal install
tests only; production distribution needs a real release keystore and signing
config.

For that internal install smoke path, make the exception explicit:

```bash
cd mobile
python3 ../scripts/verify_android_release_signing.py --allow-debug-signing
```

Current mobile scope:

- dev login for local development only
- profile loading / first profile creation
- LLM model selection
- text transcript input
- parse preview
- confirmation cards
- save records
- recent records

### DeepSeek Parser Connection

Backend can run DeepSeek as the parser model (`deepseek-chat`) when `DEEPSEEK_PARSER_URL`
and `DEEPSEEK_API_KEY` are configured.

1. Copy env and set keys:

```bash
cp .env.example .env
# set these values
DEEPSEEK_PARSER_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_API_KEY=sk-...
```

2. Restart backend:

```bash
docker compose up -d backend
```

3. In app settings, choose `DeepSeek Chat` (if not defaulted automatically).

DeepSeek system prompts used by backend (these values come from `.env` and can be hot-swapped):

```text
你是中文健康記錄轉錄解析器（只做結構化抽取，不做醫療建議或判斷）。你僅能根據 transcript 內容抽取 compact IR 欄位：records、rejected、needs_confirmation；不得編造任何欄位。請只輸出精簡、合法、可直接 parse 的 JSON：
1) records: 每筆紀錄需具備 schema 規定欄位；2) rejected: 無法確認或可能有歧義的內容；3) needs_confirmation 必須為 true。

分析規則：
1. 先判斷可驗證性，能對應到 transcript 的片段才進入 records；無法確認者放入 rejected。
2. 只保留逐字明確、可追溯的數值/時間/單位；缺值或可疑內容一律拒絕。
3. 不輸出醫療建議、不輸出 raw transcript、不輸出額外說明文字，只回傳最小 schema JSON。

You are a health record parser. Return compact JSON only. Use segment_id. Do not repeat transcript text. Do not provide medical advice. Do not guess missing values.
```

Prompt 分析（你可以直接改 `DEEPSEEK_SYSTEM_PROMPT` / `DEEPSEEK_ANALYSIS_ADDENDUM`）：

分析邏輯：  
1. 這段 prompt 先限制角色為「純抽取器」：不處理建議、不編故事，只保留結構化輸出。  
2. `DEEPSEEK_SYSTEM_PROMPT` 強制只輸出 backend compact IR：`records`、`rejected`、`needs_confirmation`，避免 DeepSeek 回傳 API response schema 或自創欄位。  
3. `DEEPSEEK_ANALYSIS_ADDENDUM` 再加上可驗證性、拒絕策略與確認閘門，讓模型在不確定時偏向保守。  
4. 實務上可用結果：  
   - 低確信片段會進入 `rejected`，降低錯錄。  
   - 只要 transcript 有精準片段，才會進入 `records`，並留在 schema gate 之後再寫入。  
   - `records` 與 `rejected` 都不含 PHI 外洩文字，後端與前端只做有限長度回傳。

若要微調精度，可以先調 `DEEPSEEK_ANALYSIS_ADDENDUM`（偏嚴可增加保守詞句、偏鬆可放寬「可接受不確定」條件）。  

Year Review also uses DeepSeek when the same endpoint/key are configured. This prompt is fixed in backend code because it only accepts precomputed yearly aggregates, not transcripts or records:

```text
你是糖錄錄年度回顧摘要助手。只根據使用者提供的年度聚合統計撰寫繁體中文回顧，不可要求更多資料、不可編造、不可提供診療建議或療效宣稱。只輸出 JSON object，欄位必須是 important_observation 與 encouragement，每個欄位都要是 120 字以內的字串。
```

Year Review prompt 分析：

1. 角色被限制為「年度回顧摘要助手」，輸入只允許 backend 已算好的 `annual_stats` 與 `health_outcomes`。
2. System prompt 要求 JSON object 且只允許 `important_observation` / `encouragement`，backend 會再次驗證並做長度 bounding。
3. User payload 的 instructions 明確限制「只能使用上述聚合統計」，所以 DeepSeek 不會收到 raw records、food items、profile id、occurred_at、raw transcript、raw prompt 或 raw model output。
4. DeepSeek 未設定、HTTP 失敗、回應過大、JSON 無效或缺欄位時，backend 會回到 deterministic fallback，不阻斷年度回顧產生。

Native voice, `whisper.rn`, encrypted SQLite, biometrics, and `llama.rn` require Expo prebuild / dev client and are planned after the shell is stable.

### iPhone Dev Client For Local Models

Expo Go cannot load `whisper.rn` or `llama.rn` because they are native modules. Use a development build:

```bash
cd mobile
npm run prebuild
npm run ios
npm run start:dev
```

The current native model adapter supports:

- `whisper.rn` file transcription from a local Whisper model path and audio file path
- `llama.rn` GGUF completion with JSON schema constrained output
- model download into app document storage from a test URL
- picking a downloaded model path for Whisper or Llama tests

Model files are not committed to the repo. Keep them outside git and load them by local file path during testing.

Expo Go can still run the UI-only mobile shell, but it cannot execute `whisper.rn` or `llama.rn`. The native module buttons are for dev-client builds only and are hidden unless `EXPO_PUBLIC_ENABLE_DEBUG_TOOLS=true`.

If an iPhone cannot reach WSL services over LAN, run these commands in an Administrator PowerShell on Windows:

```powershell
New-NetFirewallRule -DisplayName "BloodSugar Backend 8000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000
New-NetFirewallRule -DisplayName "BloodSugar Expo Metro 8081" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8081
```

## Rules

- Do not commit real `.env` files.
- Do not use production data locally or in staging.
- Do not log PHI or sensitive health data.

## Planning Docs

- `ai_context/ENGINEERING_BLUEPRINT_V1.md`: unified MVP / future architecture, page tree, module notes, and blueprint tasks.
- `ai_context/UI_UX_SPEC.md`: complete UI / UX design system, screen specs, navigation, animation, and implementation guardrails.
- `ai_context/MVP_INFORMATION_ARCHITECTURE.md`: MVP route map for Home, Today, History, Basic Analysis, Subscription, and Settings.
- `ai_context/VOICE_RECORDING_QUOTA_CONTRACT.md`: MVP voice quota, single-recording limit, warning behavior, and silent-audio rejection contract.
- `ai_context/SUBSCRIPTION_ENTITLEMENT_SCHEMA.md`: plans, subscriptions, entitlements, usage counters, and voice quota enforcement contract.
- `ai_context/PERMISSIONS_AND_SCHEMA_REGISTRY.md`: central permission service, record schema registry, report date-window, and request-id logging notes.
- `ai_context/MOBILE_NATIVE_AI_SPIKE.md`: Expo Dev Client local Whisper/Llama spike, benchmark harness, and checksum proof notes.
- `ai_context/VOICE_COMMAND_EXECUTION_POLICY.md`: non-write voice action execution and audit policy.
- `ai_context/MINIMAL_PRODUCTION_STACK.md`: minimal self-hosted Docker Compose production stack, security checklist, backups, token strategy, and Kubernetes migration path.
- `ai_context/CLOUD_DEPLOYMENT_GUIDE.md`: GCP Cloud Run/GKE and AWS ECS/EKS deployment guide with secret and IAM assumptions.
- `ai_context/PRODUCTION_HARDENING_AUDIT.md`: module-by-module production hardening audit, risk list, and prioritized implementation plan.
- `ai_context/PRODUCTION_GRADE_DESIGN_AUDIT.md`: production-grade design audit, fixed risks, remaining risks, and extensibility/scaling recommendations.
- `ai_context/PRODUCTION_DEPLOYMENT_ARCHITECTURE.md`: Kubernetes, autoscaling, managed database, Redis, CI/CD, observability, and security deployment blueprint.
- `infra/k8s/README.md`: initial Kubernetes manifests for namespace, deployment, service, ingress, HPA, PDB, network policy, secret shape, and migration job.
- `ai_context/REPO_QUALITY_WORKFLOW.md`: repeatable backend, web, mobile, infra, release, and debug-incident quality gates.
- `ai_context/IMPLEMENTATION_LOG.md`: dated PHI-safe log for every bug fix or implementation change.
- `ai_context/architecture.md`: technical architecture and local-first product direction.
- `ai_context/MASTER_ROADMAP.md`: long-term product phases.
- `ai_context/IMPLEMENTATION_PLAN.md`: engineering implementation order.
- `ai_context/TASK_QUEUE.md`: current implementation queue and completed task evidence.
