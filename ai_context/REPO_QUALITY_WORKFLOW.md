# 糖錄錄 Dev Environment and Quality Workflow

Purpose: how to run the stack locally and which quality gates to run before merging or deploying. This merges the old DOCKER_DEV_PLAN. There is no hosted CI: the GitHub Actions workflow was removed in 2026-11. `make check` is the merge gate.

## 1. Ground rules

- Development is Docker-first for backend and web. Mobile runs on the host.
- Use fake or seeded data only. No production data, real PHI, or real payment keys locally or in staging.
- Never commit real `.env` files, credentials, model files, generated native builds, or exported health data.
- Keep debug tools off by default.
- Treat migrations as deploy steps. Every schema change needs an expand-only Alembic migration.
- Every change adds an entry to `ai_context/IMPLEMENTATION_LOG.md` (rules in section 7).

## 2. Local stack

`docker-compose.yml` services:

| Service | Image / build | Host port |
|---|---|---|
| `db` | `postgres:16-alpine` | 5432 |
| `backend` | `backend/` (FastAPI, bind-mounts `app/`, `tests/`, `alembic/`) | 8000 |
| `web` | `web/` (Vite) | 5173 |
| `ollama` | optional, GPU | 11434 |

```bash
cp .env.example .env                      # never commit .env
docker compose up -d db backend web
docker compose run --rm backend alembic upgrade head
docker compose up -d ollama && make qwen25   # optional local LLM
```

Notes:

- Compose defaults `ALLOW_DEV_AUTH=false`. To use `/auth/dev-login` plus `X-Account-Id`, set `ALLOW_DEV_AUTH=true` in `.env` (allowed only in local/test/development). Otherwise use email/password, which needs `AUTH_JWT_SECRET`.
- DeepSeek parsing needs `DEEPSEEK_PARSER_URL` and `DEEPSEEK_API_KEY` in `.env`. Without them only the stub parsers and any running Ollama models are available.
- Rebuild the backend image (`docker compose build backend`) after changing `pyproject.toml` or `constraints.txt`.
- Makefile targets: `backend`, `web`, `dev`, `mobile`, `mobile-quality`, `test`, `check`, `build`, `down`, `ollama`, `qwen25`, `gemma3`, `llama32`.
- Avoid `make test` when local data matters. It uses the `make dev` database, and the backend suite clears every table.

## 3. `make check` (merge gate)

Run from WSL/Linux. It runs `scripts/check.sh`:

1. Contract scripts: `verify_backend_constraints`, `verify_backend_ai_cost_boundaries`, `verify_backup_restore`, `verify_deployment_config`, `verify_release_contract`, `verify_feature_flags`, `verify_api_migration_compatibility`.
2. In the isolated compose project `bloodsugar_check` (`compose.check.yml`, no host ports, no root `.env`): build images, run `alembic upgrade head`.
3. Backend: `ruff check .`, `mypy .`, `pytest -q`.
4. Web: `npm run lint`, `npm run typecheck`, `npm test -- --run`.
5. Mobile: `npm run quality`, only if `node` is on PATH; otherwise it prints SKIPPED. In that case run it on Windows.
6. Tears everything down with `down -v`.

There are no automatic secret, dependency, or image scans anymore. Run gitleaks, `pip-audit`, `npm audit`, or Trivy by hand before a release.

## 4. Per-area gates

### Backend

```bash
docker compose run --rm backend ruff check .
docker compose run --rm backend mypy .            # strict
docker compose run --rm backend pytest -q
docker compose run --rm backend pytest tests/test_records.py::test_name -q
```

Pass criteria:

- Migrations reach head from a clean DB.
- `backend/tests/conftest.py` pins dev auth on and clears auth, admin, and hosted-model settings, so tests never call DeepSeek.
- New routes have auth or permission tests. `tests/test_route_auth_policy.py` fails on unlisted public routes.
- Writes emit audit events without PHI.
- Direct dependencies are pinned in `backend/constraints.txt` (`verify_backend_constraints.py`).
- AI token, segment, and density caps are unchanged unless deliberately updated (`verify_backend_ai_cost_boundaries.py`).

### Web

```bash
docker compose run --rm web npm run lint
docker compose run --rm web npm run typecheck
docker compose run --rm web npm test -- --run
docker compose run --rm web npm run build
```

Debug panels stay hidden unless `VITE_ENABLE_DEBUG_TOOLS=true`. The API base comes from `VITE_API_BASE_URL`.

### Mobile

```bash
cd mobile && npm run quality
```

`quality` runs `typecheck`, the source verifiers (`verify:navigation`, `verify:ui-spec-coverage`, `verify:visual-smoke-routes`, `verify:visual-smoke-harness`, `verify:secure-auth-storage`, `verify:android-apk-scripts`, `verify:native-config`, `verify:design-tokens`), and the node tests (`test:recording-flow`, `test:phone-speech`, `test:whisper-pcm`, `test:model-storage`, `test:today-timeline`).

- Run it before and after UI or navigation changes. Several verifiers read `App.tsx`, `navigationConfig.ts`, and `ai_context/UI_UX_SPEC.md` statically.
- After major layout changes, also run `ai_context/MOBILE_VISUAL_SMOKE_WORKFLOW.md`.
- Release APKs: `npm run preflight:android-apk:internal` or `:production`, then build per `docs/ANDROID_RELEASE_SHARING.md`.

### Deployment config

```bash
python scripts/verify_deployment_config.py
python scripts/verify_release_contract.py   # reads ai_context/DEPLOYMENT.md markers
python scripts/verify_backup_restore.py     # infra/lightsail/backup.sh and restore.sh
python scripts/verify_feature_flags.py
python scripts/verify_api_migration_compatibility.py
```

Deployment steps and rollback: `ai_context/DEPLOYMENT.md`.

## 5. Release checklist

- `make check` passes, and mobile `npm run quality` passes.
- Migrations are expand-only and compatible with the previous app version.
- `ENABLE_DEBUG_TOOLS`, `VITE_ENABLE_DEBUG_TOOLS`, and `EXPO_PUBLIC_ENABLE_DEBUG_TOOLS` are false. `ALLOW_DEV_AUTH` is false on the server.
- A backup was taken before migrating (`infra/lightsail/backup.sh`).
- Open readiness items were reviewed (`ai_context/PRODUCTION_READINESS.md`).
- `IMPLEMENTATION_LOG.md` covers the release with PHI-safe verification.

## 6. Debug incident workflow

Debug tools can expose transcript-derived health data. Enable them only in a short-lived non-production environment, limit access to authorized developers, never persist raw debug output, then clear temporary artifacts and turn the flags off again.

## 7. Implementation log rules

Each entry in `ai_context/IMPLEMENTATION_LOG.md` (newest date first) has: date, type (`bugfix` | `feature` | `docs` | `infra` | `test`), files changed, summary, verification, follow-up.

Keep it PHI-safe: no real transcripts, health values, meal photos, payloads, request bodies, prompts, model output, secrets, or tokens.
