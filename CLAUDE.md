# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

糖錄錄 (Tang Lu Lu) — a blood-sugar / chronic-health recording app. Users speak or type a transcript, an LLM parses it into structured candidate records, and the user must confirm before anything is saved. All health data is treated as sensitive (PHI).

Three apps share one backend:

- `backend/` — FastAPI + SQLAlchemy 2 + Alembic on PostgreSQL 16 (Python 3.12, mypy strict, ruff line-length 100).
- `web/` — Vite + React 19 web simulator of the mobile flow, plus the web admin console (`AdminApp.tsx`, usage analytics).
- `mobile/` — React Native + Expo app (the primary product, voice-first). Speech-to-text uses the phone's system recognizer (`expo-speech-recognition`), with an optional on-device `whisper.rn` pass if the user downloaded the model; parsing always goes through the backend. Native modules (`whisper.rn`, `llama.rn` (debug tools only)) only work in an Expo dev-client or release build, not Expo Go. There is no on-device database.

## Governing docs

`skills.md` at the repo root is the top-level rules document and wins over everything in `ai_context/` and `agents/`; its §1 maps every doc in `ai_context/`. Read it, `ai_context/architecture.md`, and `ai_context/TASK_QUEUE.md` before starting non-trivial work. Open product decisions (DeepSeek PHI consent, transcript retention, release keystore, voice-quota trust, ...) are listed in `ai_context/PRODUCT_ROADMAP.md` §4 and tracked in `ai_context/PRODUCTION_READINESS.md`; do not treat them as resolved. Key rules from it:

- Work on one active task from `ai_context/TASK_QUEUE.md` at a time; update its status when done.
- Every change (bugfix, feature, infra, docs, test) adds a dated entry to `ai_context/IMPLEMENTATION_LOG.md` with: date, type, files changed, summary, verification, follow-up. The log must stay PHI-safe (no real transcripts, health values, prompts, model output, tokens).
- Schema changes need an Alembic migration; new features need tests; no large unrelated refactors.
- Generated docs go in `ai_context/`; external/user-provided references go in `references/`. `agents/*.md` only hold role prompts and pointers.
- AI output is fixed JSON only; every AI result requires user confirmation before save. Do not store chain-of-thought; at most a short `decision_trace`.
- Never log transcripts, glucose values, meals, medications, prompts, or model output. Log redaction lives in `backend/app/core/redaction.py` / `logging.py`.

The per-area quality gates are in `ai_context/REPO_QUALITY_WORKFLOW.md`.

## Commands

Development is Docker-first. Run from the repo root unless noted.

```bash
docker compose up -d db backend web          # Postgres :5432, API :8000, web :5173
docker compose up -d ollama                  # optional local LLM (GPU); `make qwen25` etc. pull models
docker compose run --rm backend alembic upgrade head
```

Backend (tests hit the real Postgres from compose, so `db` must be up and migrated; `backend/tests/conftest.py` pins dev auth on and clears auth/admin/hosted-model settings, so the root `.env` does not leak into tests):

```bash
docker compose run --rm backend ruff check .
docker compose run --rm backend mypy .
docker compose run --rm backend pytest -q
docker compose run --rm backend pytest tests/test_records.py -q
docker compose run --rm backend pytest tests/test_records.py::test_name -q
docker compose run --rm backend alembic revision -m "describe change"
```

`backend/app`, `backend/tests`, and `backend/alembic` are bind-mounted into the container, so edits take effect without rebuilding. Rebuild (`docker compose build backend`) after changing `pyproject.toml` / `constraints.txt`.

Web:

```bash
docker compose run --rm web npm run lint
docker compose run --rm web npm run typecheck
docker compose run --rm web npm test -- --run
docker compose run --rm web npm test -- --run src/App.test.tsx
```

Mobile (runs on the host, not Docker):

```bash
cd mobile && npm run quality      # typecheck + all source verifiers + node flow tests; run before/after UI or navigation changes
cd mobile && npm run typecheck
cd mobile && npm run start        # Expo; EXPO_PUBLIC_API_BASE_URL points at the backend
```

Android release APKs: run `npm run preflight:android-apk:internal` (or `:production`) in `mobile/`, then `.\gradlew.bat assembleRelease` in `mobile\android` from PowerShell on Windows. Do not run Linux Gradle in WSL against the Windows SDK path. Full runbook: `docs/ANDROID_RELEASE_SHARING.md`.

Repo-level contract checks (pure Python, run from root):

```bash
python scripts/verify_backend_constraints.py         # direct deps pinned in backend/constraints.txt
python scripts/verify_feature_flags.py               # flag parity across backend/web/mobile, default off
python scripts/verify_api_migration_compatibility.py # API contract version + migration policy
python scripts/verify_backend_ai_cost_boundaries.py # parser token/segment caps
python scripts/verify_deployment_config.py           # production-safe env/Dockerfile/Lightsail defaults
python scripts/verify_release_contract.py            # Lightsail release/rollback contract + ai_context/DEPLOYMENT.md markers
python scripts/verify_backup_restore.py              # infra/lightsail/backup.sh + restore.sh guards
```

There is no hosted CI (the GitHub Actions workflow was removed in 2026-11). Run `make check` (from WSL/Linux) before merging: it runs the contract scripts, then backend migrations/ruff/mypy/pytest and web lint/typecheck/tests in a separate compose project (`COMPOSE_PROJECT_NAME=bloodsugar_check`, `compose.check.yml`, no host ports, no root `.env`), then mobile `npm run quality` if `node` is on PATH. Plain `make test` uses the `make dev` database, and the backend suite clears every table, so avoid it when local dev data matters.

## Architecture

### Backend request path

`app/main.py` builds the FastAPI app, mounts one router per module in `app/api/`, and adds middleware that enforces a bounded JSON body size, validates/propagates `X-Request-Id` and `traceparent`, truncates validation-error details, records metrics, and writes PHI-free usage analytics and operational events. Layers:

- `app/api/*` — routers. Thin; delegate to services.
- `app/services/*` — business logic (AI pipeline, permissions, entitlements, rate limits, audit, reporting, year review, analytics).
- `app/models/*` / `app/schemas/*` — SQLAlchemy models and Pydantic request/response schemas.
- `app/core/config.py` — `Settings` (pydantic-settings) with strict production validation: production rejects dev auth, debug tools, non-Postgres `DATABASE_URL`, issuerless/audienceless JWT, and requires `AUTH_JWT_REQUIRE_JTI`.

### Auth and permissions

- Every route must depend on `get_current_account` (`app/api/deps.py`) unless it is listed with a reason in `PUBLIC_ROUTE_REASONS` in `app/services/route_auth_policy.py`. `tests/test_route_auth_policy.py` fails on any new unlisted unauthenticated route.
- In local/test/development with dev auth on, the caller can be identified by the `X-Account-Id` header after `POST /auth/dev-login` (dev auth defaults on when `ALLOW_DEV_AUTH` is unset, but `docker-compose.yml` sets it to `false`; set `ALLOW_DEV_AUTH=true` in `.env` to use it). Config refuses to start with `ALLOW_DEV_AUTH=true` in any other `APP_ENV` (staging included). Otherwise a Bearer JWT is validated (HS256 secret or JWKS) and checked against the revocation denylist. Email/password, OIDC exchange, and rotating refresh sessions are in `api/auth.py` + `services/auth_sessions.py`.
- Data is owned by `UserProfile`s under an `Account` (an account can manage family profiles). Access checks go through `app/services/permissions.py` (`assert_can_read_profile`, `assert_can_write_profile`, `assert_can_read_record`, ...), which also resolves `ProfileAccessGrant` scopes. Writes must emit audit events (`services/audit.py`) without PHI.
- The admin console uses a separate username/password-hash login with an HttpOnly session cookie (`services/admin_auth.py`, `api/admin.py`).

### Records

`Record` rows have `record_type`, timezone-aware `occurred_at`, `payload_json`, `metadata_json`, `source`. Allowed types and payload shapes are validated by `services/record_validation.py`, exposed via `services/record_schema_registry.py` (schema version, report eligibility), and bounded/sanitized by `record_json_bounds.py` / `record_sanitization.py` / `record_time_validation.py`. Adding a record type means touching the validator, the registry, and the clients' display code.

### AI parsing pipeline

`app/services/ai_pipeline.py` turns a transcript into candidate records for `/ai/parse-preview` (plus an NDJSON progress stream; `/ai/command-proposal` is keyword-based and calls no LLM). It normalizes and splits the transcript into segments, enforces complexity/density budgets, sends a segmented prompt to the selected model, and parses a compact IR (`records`, `rejected`, `needs_confirmation`) that is mapped back to full records. Model choice comes from `runtime_llm_models()`: DeepSeek (hosted, default when `DEEPSEEK_PARSER_URL` + `DEEPSEEK_API_KEY` are set), Ollama local models (qwen2.5 / gemma3 / llama3.2), or a Gemma4 endpoint. Token caps come from `LOCAL_LLM_MAX_TOKENS`; `scripts/verify_backend_ai_cost_boundaries.py` guards these limits. DeepSeek receives the segmented user transcript text. Token usage is recorded PHI-free, but `ai_parse_audits.transcript_text` (and `daily_records.transcript_entries_json`) store the raw transcript with no expiry, which is a known open item. Details: `ai_context/AI_PARSING_AND_MODELS.md`. Fixture transcripts live in `backend/tests/parser_cases/`. The year review (`services/year_review_snapshots.py`) only sends precomputed aggregates to DeepSeek and falls back to deterministic text on any failure.

### Migrations and API compatibility

`infra/api-migration-compatibility.json` sets the policy: the Alembic history must have a single linear head, and every migration after the legacy baseline (`20260430_0030`) must declare `migration_phase = "expand"` and stay compatible with the previous app version (no destructive "contract" migrations). File naming is `YYYYMMDD_NNNN_description.py`. The API contract version in `core/config.py` must match this file and `infra/release-contract.json`.

### Feature flags

Flags are defined in `backend/app/services/feature_flags.py` (served publicly at `GET /feature-flags`), with mirrors in `web/src/featureFlags.ts` and `mobile/featureFlags.ts`. All default to off and clients parse them fail-closed. `verify_feature_flags.py` enforces parity, so add a flag in all three places.

### Mobile app structure

`mobile/` is flat (no `src/`). `App.tsx` is a very large root component holding navigation and screen state. Logic is split into sibling files by suffix: `*Copy.ts` (UI strings), `*Transforms.ts` (pure data shaping), `*ScreenData.ts` / `*DisplayBundle.ts` (view models), and one `*.tsx` per presentational component. Other key files: `apiClient.ts` (backend calls), `navigationConfig.ts`, `designTokens.ts`, `authTokenStorage.ts` (SecureStore only, never plain storage), `nativeLocalModels.ts` / `modelStorage.ts` (on-device Whisper/Llama). Many `scripts/verify_mobile_*.py` checks read these sources statically (navigation graph, UI-spec coverage against `ai_context/UI_UX_SPEC.md`, design-token usage, secure storage), so renaming or restructuring can break `npm run quality`. `postinstall` patches the PCM recorder package via `scripts/patch_mobile_pcm_recorder.cjs`.

Mobile env is set through `EXPO_PUBLIC_*` variables (`mobile/.env.example`). Dev login is opt-in (`EXPO_PUBLIC_ALLOW_DEV_AUTH=true`); release builds are checked by `verify:release-env` to reject dev auth, debug tools, and non-HTTPS/local API URLs. Visual smoke testing follows `ai_context/MOBILE_VISUAL_SMOKE_WORKFLOW.md` and must use seeded/demo data only.

### Deployment

The backend is a stateless container (`Dockerfile.prod`, runs as non-root). The only deployment target is `infra/lightsail/`: single-host Docker Compose staging (Caddy, web, backend, Postgres) with hosted DeepSeek, for internal APK testing only, not real users. Backup/restore scripts are `infra/lightsail/backup.sh` / `restore.sh`. Runbook: `ai_context/DEPLOYMENT.md`.
