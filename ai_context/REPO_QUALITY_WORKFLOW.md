# 糖錄錄 Repo Quality Workflow

Purpose: this is the repeatable quality gate for code cleanup, release preparation, and production hardening. Run the relevant section before merging or deploying.

## 1. Ground Rules

- Keep backend stateless; store durable state in PostgreSQL and shared transient state in Redis when added.
- Keep PHI out of application logs, debug logs, CI logs, analytics, crash reports, prompts, and audit metadata.
- Update `ai_context/IMPLEMENTATION_LOG.md` for every bug fix or implementation change before considering the task done.
- Keep debug tools disabled by default.
- Prefer bounded APIs over unbounded reads.
- Treat migrations as deploy steps, not background cleanup.
- Do not commit local model files, real `.env` files, credentials, or exported health data.

## 2. Implementation Log Gate

Every bug fix, feature, infrastructure change, test-only change, or production-hardening update must add a dated entry to `ai_context/IMPLEMENTATION_LOG.md`.

Required fields:

- date
- type: `bugfix`, `feature`, `docs`, `infra`, or `test`
- files changed
- summary
- verification
- follow-up

The implementation log must remain PHI-safe. Do not include real transcripts, glucose values from a real user, meal photos, health payloads, request bodies, raw prompts, raw model output, secrets, tokens, or credentials. Use behavior summaries and command results instead.

## 3. Backend Gate

Run from repo root:

```bash
python scripts/verify_backend_constraints.py
python scripts/verify_backend_ai_cost_boundaries.py
python scripts/verify_minimal_backup_restore.py
python scripts/verify_k8s_manifests.py
python scripts/verify_deployment_config.py
docker compose run --rm backend alembic upgrade head
docker compose run --rm backend ruff check .
docker compose run --rm backend mypy .
docker compose run --rm backend pytest -q
```

Pass criteria:

- backend direct dependencies are pinned in `backend/constraints.txt`
- backend Dockerfiles install with `-c constraints.txt`
- backend AI parser keeps local token caps, cloud fallback disabled in v1, and deterministic repair fallback only
- minimal backup/restore scripts require an env file, use custom-format dumps, avoid partial backup artifacts, and validate restore input
- Kubernetes manifests keep required production guardrails: probes, resources, HPA, PDB, NetworkPolicy, TLS ingress, and migration job
- deployment examples keep production debug/dev-auth disabled, bounded local LLM caps, explicit CORS, and managed service placeholders
- migrations reach head from a clean database
- no lint errors
- no type errors
- all backend tests pass
- new routes have ownership or permission tests
- write/update/delete routes emit audit events without PHI payloads
- `ai_context/IMPLEMENTATION_LOG.md` records the backend change and verification

## 4. Web Gate

Run from `web/`:

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

Pass criteria:

- no lint errors
- no TypeScript errors
- Vitest passes
- production build succeeds
- debug panels are hidden unless `VITE_ENABLE_DEBUG_TOOLS=true`
- API endpoint is configurable through `VITE_API_BASE_URL`
- `ai_context/IMPLEMENTATION_LOG.md` records the web change and verification

## 5. Mobile Gate

Run from `mobile/`:

```bash
npm run quality
```

Pass criteria:

- `App.tsx` and local helper modules are typechecked
- source-level navigation verifier passes for `AppScreen`, `screenChrome`, menu destinations, future-module targets, and menu return behavior
- Expo preview still connects through `EXPO_PUBLIC_API_BASE_URL`
- native local-model test panel is hidden unless `EXPO_PUBLIC_ENABLE_DEBUG_TOOLS=true`
- no local model files or generated native build artifacts are committed
- `ai_context/IMPLEMENTATION_LOG.md` records the mobile change and verification

For major mobile layout changes, also run the developer-triggered visual smoke evidence workflow in `ai_context/MOBILE_VISUAL_SMOKE_WORKFLOW.md`. This is intentionally not a default CI gate because it requires an Expo preview, simulator, emulator, or physical device. It must use seeded/sample/demo data only and must not require backend writes, AI, LLM, Vision, STT, payments, production credentials, or real health data.

## 6. Infra Gate

Run from repo root:

```bash
docker compose --env-file infra/minimal/.env.example -f infra/minimal/docker-compose.yml config --quiet
```

Pass criteria:

- minimal production Compose file renders successfully
- frontend routes `/` to web and `/api` to backend
- backend exposes `/healthz` and `/readyz`
- default debug flags remain false
- database backup and restore scripts stay documented and pass `python scripts/verify_minimal_backup_restore.py`
- `ai_context/IMPLEMENTATION_LOG.md` records the infra change and verification

## 7. Release Checklist

Before production deploy:

- run backend, web, mobile, and infra gates
- review migrations for backward compatibility
- run dependency and image scans in CI
- confirm secrets come from the deployment secret manager
- confirm database is private-network only
- confirm backups are encrypted and restore has been tested
- confirm `ENABLE_DEBUG_TOOLS`, `VITE_ENABLE_DEBUG_TOOLS`, and `EXPO_PUBLIC_ENABLE_DEBUG_TOOLS` are false
- prepare rollback image tags and database migration rollback notes
- confirm `ai_context/IMPLEMENTATION_LOG.md` covers the release changes with PHI-safe verification

## 8. Debug Incident Workflow

Debug tools may expose transcript-derived health data. If debug tools are needed:

- enable them only in a short-lived non-production incident environment
- limit access to authorized developers
- do not persist raw debug output
- clear temporary logs and local artifacts after the incident
- disable all debug flags before returning the environment to normal use
