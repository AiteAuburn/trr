# 糖錄錄

Voice-first blood-sugar recording app. The user speaks (or types), the backend parses the transcript into candidate records, and nothing is saved until the user confirms.

- `backend/`: FastAPI + PostgreSQL 16
- `web/`: web simulator of the mobile flow, plus the admin console at `/admin`
- `mobile/`: React Native + Expo Android app (the product)

Rules and docs: start with `skills.md`. Planning and design docs are in `ai_context/` (see the table at the end).

## Run Locally

```bash
cp .env.example .env          # never commit .env
docker compose up -d db backend web
docker compose run --rm backend alembic upgrade head
```

Or `make dev`.

- Backend health: `http://localhost:8000/health`
- Web: `http://localhost:5173`

Local defaults (`docker-compose.yml`, `.env.example`):

- `APP_ENV=local`
- `ALLOW_DEV_AUTH=false`. Set it to `true` in `.env` to use `/auth/dev-login`. Config only allows that in local/test/development and refuses to start with it in staging or production.
- `ENABLE_DEBUG_TOOLS=false`
- local PostgreSQL in Docker
- web API endpoint `http://localhost:8000`

Email/password login needs `AUTH_JWT_SECRET`. Do not reuse local credentials anywhere else.

Production config also rejects debug tools, wildcard CORS, and weak JWT settings. If `AUTH_JWT_SECRET` is used in production, `AUTH_JWT_ISSUER`, `AUTH_JWT_AUDIENCE`, and `AUTH_JWT_REQUIRE_JTI=true` are required.

Quality gate before merging (from WSL/Linux): `make check`. Details: `ai_context/REPO_QUALITY_WORKFLOW.md`.

## Deployment

The only deployment target is `infra/lightsail/`: a single AWS Lightsail host running Docker Compose (Caddy, web, backend, PostgreSQL) with hosted DeepSeek parsing. It is **staging for internal APK testing**. It is not highly available and must not hold real user data yet.

Runbook (first deploy, release, rollback, backup/restore): `ai_context/DEPLOYMENT.md`. Open release blockers: `ai_context/PRODUCTION_READINESS.md`.

## Mobile

The mobile app is the primary product. Env defaults are in `mobile/.env.example`:

```bash
cd mobile
cp .env.example .env
npm run start            # Expo; EXPO_PUBLIC_API_BASE_URL points at the backend
```

Current mobile scope:

- email/password login (Apple / Google not wired yet); dev login only with `EXPO_PUBLIC_ALLOW_DEV_AUTH=true`
- profile loading and first-profile creation
- voice-first home: tap the mic to start and tap again to stop; auto-stop after 3 s of silence; 60 s cap
- speech-to-text through the phone's speech recognizer (`expo-speech-recognition`, which may use Google's cloud service), plus an optional on-device Whisper pass after the user downloads the model in Settings (Android 13+)
- transcript goes straight to `/ai/parse-preview`, with cancel
- single confirm page, then save, then 存好了
- Today timeline, history, basic analysis, year review

Native modules (`whisper.rn`, `llama.rn`, PCM recorder) need a dev client or release build, not Expo Go:

```bash
cd mobile
npm run prebuild
npm run start:dev
```

`llama.rn` is used only in debug tools (`EXPO_PUBLIC_ENABLE_DEBUG_TOOLS=true`). Model files are never committed.

Before and after mobile UI or navigation changes:

```bash
cd mobile
npm run quality
```

This runs TypeScript checking, the source-level verifiers, and the node flow tests, without starting Expo, the backend, AI, or a database. After major layout changes, also run the visual smoke checklist in `ai_context/MOBILE_VISUAL_SMOKE_WORKFLOW.md`, using seeded/demo data only.

If a phone cannot reach WSL services over LAN, run these in an Administrator PowerShell on Windows:

```powershell
New-NetFirewallRule -DisplayName "BloodSugar Backend 8000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000
New-NetFirewallRule -DisplayName "BloodSugar Expo Metro 8081" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8081
```

### Android APK Export

For a step-by-step Chinese release sharing runbook, see
`docs/ANDROID_RELEASE_SHARING.md`.

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

To make a release APK that can be shared with another Android phone:

1. Choose the release type.
   - Internal install smoke: trusted testers only. May use a local API URL and
     may temporarily use debug signing.
   - Production-like distribution: must use an HTTPS API URL (for Lightsail
     staging, `https://DOMAIN/api`), dev auth disabled, debug tools disabled,
     and a real release signing config.
2. Run the matching preflight from `mobile/` before building:

```bash
cd mobile
npm run preflight:android-apk:internal
# or, for production-like distribution:
npm run preflight:android-apk:production
```

3. Build the standalone release APK from `mobile/android/`:

```bash
cd mobile/android
./gradlew assembleRelease
```

4. Share `mobile/android/app/build/outputs/apk/release/app-release.apk` with the tester.

The tester can install it by opening the APK on Android and allowing installs
from that file source when prompted, or by using `adb install app-release.apk`.
This release APK embeds the Expo JavaScript bundle and assets, so the tester
does not need `npm run start`, `npx expo start`, Metro, or a development
server. Do not share `assembleDebug` APKs for standalone testing, because debug
APKs still expect Metro.

Check the local Android environment with `npm run apk:android-prereqs`. For
production-like APKs, `npm run verify:release-env` and
`npm run verify:android-release-signing` fail if the build would include dev
auth, debug tools, visual-smoke route shortcuts, localhost, emulator, LAN, or
non-HTTPS API URLs, or if release is debug-signed.

On Windows, prefer PowerShell for APK export because `mobile/android/local.properties`
must use the Windows Android SDK path:

```powershell
# mobile\android\local.properties should contain:
# sdk.dir=C:/Users/robin/AppData/Local/Android/Sdk
cd D:\bloodsugar\mobile\android
.\gradlew.bat assembleRelease
```

Do not run Linux Gradle in WSL against the Windows SDK path from
`local.properties`, including `/mnt/c/.../Android/Sdk`. Linux Gradle expects
Linux tool binaries such as `aapt`, while the Windows SDK contains `aapt.exe`,
so Gradle can report the build-tools as corrupted. For WSL-only APK builds,
install a Linux Android SDK and point `sdk.dir` at it.

The current release build is still signed with the debug keystore in
`mobile/android/app/build.gradle`. That is acceptable for internal install
tests only; production distribution needs a real release keystore (open item).

## AI Parsing (DeepSeek)

The backend uses DeepSeek as the default parser (`llm_model_id` `deepseek-chat`)
when `DEEPSEEK_PARSER_URL` and `DEEPSEEK_API_KEY` are set:

```bash
# in .env
DEEPSEEK_PARSER_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_API_KEY=sk-...
docker compose up -d backend
```

- `DEEPSEEK_MODEL_ID` selects the upstream model. The config default is
  `deepseek-chat`; `.env.example` and Lightsail use `deepseek-v4-flash`.
- The prompts come from `DEEPSEEK_SYSTEM_PROMPT` / `DEEPSEEK_ANALYSIS_ADDENDUM`
  when set, otherwise from the constants in `backend/app/services/ai_pipeline.py`.
  The model must return only the compact IR (`records`, `rejected`,
  `needs_confirmation`). The backend validates it and the user confirms.
- Requests carry the segmented transcript text, with per-batch `max_tokens`
  bounded by `LOCAL_LLM_MAX_TOKENS`.
- **Privacy:** this sends the user's own words to a third-party API. By decision
  (2026-11-05) there is no in-app consent step and the app never shows the
  vendor name; users see 「AI 智慧整理」. See `ai_context/PRODUCT_ROADMAP.md` D1.
- Local alternatives for development: Ollama (`docker compose up -d ollama`,
  then `make qwen25` / `make gemma3` / `make llama32`) or a Gemma4 endpoint
  (`GEMMA4_PARSER_URL`).

Full pipeline, models, and limits: `ai_context/AI_PARSING_AND_MODELS.md`.

### Year Review

Year Review also uses DeepSeek when the same endpoint/key are configured. This prompt is fixed in backend code because it only accepts precomputed yearly aggregates, not transcripts or records:

```text
你是糖錄錄年度回顧摘要助手。只根據使用者提供的年度聚合統計撰寫繁體中文回顧，不可要求更多資料、不可編造、不可提供診療建議或療效宣稱。只輸出 JSON object，欄位必須是 important_observation 與 encouragement，每個欄位都要是 120 字以內的字串。
```

Year Review prompt 分析：

1. 角色被限制為「年度回顧摘要助手」，輸入只允許 backend 已算好的 `annual_stats` 與 `health_outcomes`。
2. System prompt 要求 JSON object 且只允許 `important_observation` / `encouragement`，backend 會再次驗證並做長度 bounding。
3. User payload 的 instructions 明確限制「只能使用上述聚合統計」，所以 DeepSeek 不會收到 raw records、food items、profile id、occurred_at、raw transcript、raw prompt 或 raw model output。
4. DeepSeek 未設定、HTTP 失敗、回應過大、JSON 無效或缺欄位時，backend 會回到 deterministic fallback，不阻斷年度回顧產生。

## Rules

- Do not commit real `.env` files, keys, or model files.
- Do not use production data locally or in staging.
- Do not log PHI or sensitive health data.

## Docs

| File | Content |
|---|---|
| `skills.md` | Top-level rules (wins over everything else) |
| `ai_context/TASK_QUEUE.md` | Current task queue |
| `ai_context/PRODUCT_ROADMAP.md` | Product direction, phases, open decisions |
| `ai_context/PRODUCTION_READINESS.md` | Release blockers and gaps |
| `ai_context/architecture.md` | Technical architecture |
| `ai_context/AI_PARSING_AND_MODELS.md` | AI parsing pipeline, models, limits |
| `ai_context/VOICE_INPUT.md` | Recording flow, voice quota, voice commands |
| `ai_context/SECURITY_AND_PRIVACY.md` | PHI rules, logging, data flows |
| `ai_context/PERMISSIONS_AND_RECORD_SCHEMA.md` | Permission service, grants, record types |
| `ai_context/SUBSCRIPTIONS_AND_FAMILY.md` | Plans, entitlements, family model |
| `ai_context/REPO_QUALITY_WORKFLOW.md` | Local stack and quality gates |
| `ai_context/DEPLOYMENT.md` | Lightsail deploy, release, rollback, backup |
| `ai_context/UI_UX_SPEC.md` | UI/UX spec |
| `ai_context/MOBILE_VISUAL_SMOKE_WORKFLOW.md` | Mobile visual smoke checks |
| `ai_context/IMPLEMENTATION_LOG.md` | Dated PHI-safe change log |
| `docs/ANDROID_RELEASE_SHARING.md` | Android release APK runbook (Chinese) |
