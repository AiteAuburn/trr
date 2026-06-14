# 糖錄錄 Production-Grade Design Audit

Scope: this audit revisits the current overall design assuming a production-grade system, not an MVP. It focuses on bugs, security risks, extensibility, scalability, flexibility, longevity, and reliability.

## 1. Executive Summary

Current direction is coherent:

- Docker Compose remains the lowest-complexity self-hosted path.
- Kubernetes remains a later migration path, not the default.
- Backend is already stateless enough for future horizontal scaling.
- Generic `records` is the right long-lived data abstraction.
- PHI minimization and user-confirm-before-save are the right safety primitives.

This pass fixed four production-readiness gaps:

- Record reads are now bounded with `limit` and `before` pagination.
- Records now support update and soft delete with audit events.
- `note` records no longer require raw text that would be stripped by PHI minimization.
- Raw LLM debug streaming is now disabled by default in backend, web, and mobile unless explicitly enabled.

## 2. Concrete Issues Found And Fixed

### R001: Unbounded record listing

Risk:

- `GET /records` returned the full profile history.
- This does not scale for long-term users and increases API memory/latency.

Fix:

- Added `limit` query parameter with bounds `1..500`.
- Added `before` cursor based on `occurred_at`.
- Added active-record filtering with `deleted_at IS NULL`.

Files:

- `backend/app/api/records.py`
- `backend/tests/test_records.py`

### R002: No record lifecycle beyond create/list

Risk:

- Product and security docs require edit/delete/audit behavior.
- Hard delete is risky for sync, auditability, and future conflict resolution.

Fix:

- Added record detail endpoint.
- Added update endpoint.
- Added soft delete endpoint.
- Added `record.updated` and `record.deleted` audit events without PHI payloads.
- Added `deleted_at` column and active-record partial index.

Files:

- `backend/app/api/records.py`
- `backend/app/models/record.py`
- `backend/app/schemas/record.py`
- `backend/alembic/versions/20260430_0005_record_soft_delete_indexes.py`
- `backend/tests/test_records.py`

### R003: `note` schema conflicted with PHI minimization

Risk:

- Validator accepted only `text` / `transcript`.
- Sanitizer strips those fields before storage.
- Result: `note` records could not be safely saved after minimization.

Fix:

- `note` now requires structured `kind` or `tags`.
- `tags` must be a list.
- Free text is still stripped before storage.

Files:

- `backend/app/services/record_validation.py`
- `backend/tests/test_records.py`

### R004: Raw LLM debug stream exposed in normal app flow

Risk:

- Debug stream can expose raw model output and user transcript-derived PHI.
- Web UI rendered debug panels by default.

Fix:

- Added backend `ENABLE_DEBUG_TOOLS=false` default.
- `/ai/parse-preview/debug-stream` now returns 404 unless debug is explicitly enabled.
- Added frontend `VITE_ENABLE_DEBUG_TOOLS=false` default.
- Hidden raw debug stream button, command debug panel, LLM debug panel, and pipeline source-text debug table unless enabled.
- Added mobile `EXPO_PUBLIC_ENABLE_DEBUG_TOOLS=false` default.
- Hidden the Expo native local-model dev panel and raw llama output unless explicitly enabled.

Files:

- `backend/app/core/config.py`
- `backend/app/api/ai.py`
- `backend/tests/test_ai_pipeline.py`
- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `mobile/App.tsx`
- `mobile/tsconfig.json`
- `.env.example`
- `infra/minimal/.env.example`

## 3. Current Design Strengths

- Generic record abstraction allows new health event types without immediate schema churn.
- `payload_json` plus type-specific validation supports future event types.
- `metadata_json` keeps parser provenance separate from clinical payload.
- Audit logs already avoid health payloads.
- Local model path is cost-conscious and avoids default cloud PHI handling.
- Minimal production stack has a clean Compose-to-Kubernetes migration line.
- `/healthz` and `/readyz` now support container lifecycle and readiness checks.

## 4. Remaining Production Risks

### P1: Authentication is still dev-oriented

Current state:

- `X-Account-Id` and dev login are acceptable for local development only.

Production requirement:

- Add real auth token validation.
- Separate dev auth from production auth.
- Add session/token revocation model.
- Store refresh tokens securely if used.

### P2: Authorization model is still account-owner only

Current state:

- Records are checked through profile ownership.

Production requirement:

- Add `profile_memberships` and `care_permissions`.
- Support caregiver, family, doctor read-only, and export scopes.
- Ensure every endpoint goes through the same permission service.

### P3: JSON payload validation is hand-written

Current state:

- Validation is centralized but manually implemented.
- Records now carry backend-owned `record_schema_version` metadata from the registry on create and update.

Production requirement:

- Move each `record_type` to versioned schema definitions.
- Add migration policy for payload schema evolution.

### P4: Report aggregation still needs production retention windows

Current state:

- Basic report supports `start_at` / `end_at`, bounded `limit`, summary-field selection, streamed row iteration, and constant-memory glucose aggregation.

Production requirement:

- Require explicit product-level default windows before exposing long-range reports in production UI.
- Add SQL aggregation queries for large profiles.
- Add read-optimized report tables only after query volume proves need.

### P5: Observability is minimal

Current state:

- Health endpoints and Docker logs exist.

Production requirement:

- Add request id.
- Add structured JSON logs.
- Add metrics for latency, errors, DB timings, parser failures.
- Add PHI-safe tracing only after redaction policy is enforced.

### P6: Backup is a script, not an operated system

Current state:

- `backup.sh` and `restore.sh` exist for minimal self-hosting.

Production requirement:

- Add cron/systemd timer.
- Encrypt off-host backup copies.
- Add restore drill runbook and evidence log.

## 5. Extensibility Recommendations

### Permission service

Create one backend module:

```text
app/services/permissions.py
```

It should answer:

- Can account read profile?
- Can account write profile?
- Can account export profile?
- Can account share profile?

Do not copy ownership checks across routers as product scope expands.

### Record schema registry

Create:

```text
app/services/record_schema_registry.py
```

Responsibilities:

- List supported record types.
- Validate payload by type and schema version.
- Normalize payload.
- Strip unsafe fields.
- Define report provider eligibility.

### Report provider interface

Keep report expansion behind interfaces:

```text
ReportProvider
MetricsCalculator
ReportTemplate
Renderer
```

Do not let report pages directly know table internals.

### Integration source registry

Create a registry for:

- voice
- text
- manual
- photo
- healthkit
- health_connect
- meter
- import

This prevents source-specific behavior from scattering through endpoints.

## 6. Scalability Recommendations

Immediate:

- Keep API list endpoints paginated.
- Add indexes for active profile time-series reads.
- Keep backend stateless.
- Add PgBouncer before increasing backend replicas.

Later:

- Move PostgreSQL to managed service when uptime/restore requirements increase.
- Add read replicas only for read-heavy reporting after read/write consistency rules are explicit.
- Add queue workers when reports, sync, or imports become slow.
- Add Kubernetes only after Compose operational limits are real.

## 7. Security Recommendations

- Replace dev auth before production.
- Keep PHI out of logs, prompts, crash reports, analytics, and audit metadata.
- Add endpoint-level permission tests for every new route.
- Keep AI output proposal-only.
- Keep request content-type and body-size limits at proxy and app level.
- Add rate limits for parse, auth, and write endpoints.
- Keep debug tools disabled in staging/production unless a short-lived incident workflow explicitly enables them.
- Keep Docker internal networks default-private.
- Validate backup encryption and restore access controls.

## 8. Reliability Recommendations

- Treat migrations as first-class deploy steps.
- Use backward-compatible migrations.
- Add restore drill automation.
- Add health checks for backend, DB, Redis, and local model adapter.
- Add idempotency keys for future sync/import endpoints.
- Add outbox pattern before cross-service writes become common.
- Add soft-delete sync policy before multi-device sync is enabled.

## 9. Verification Evidence

Commands run after this audit:

```text
docker compose run --rm backend alembic upgrade head
docker compose run --rm backend pytest -q tests/test_records.py tests/test_reports.py tests/test_security_baseline.py tests/test_health.py
docker compose run --rm backend pytest -q
docker compose run --rm backend ruff check .
docker compose run --rm backend mypy .
cd web && npm run lint
cd web && npm run typecheck
cd web && npm test -- --run
cd web && npm run build
cd mobile && npm run typecheck
docker compose --env-file infra/minimal/.env.example -f infra/minimal/docker-compose.yml config --quiet
```

Results:

- Migration to `20260430_0005` succeeded.
- Focused backend suite passed: 17 tests.
- Full backend suite passed: 38 tests.
- Ruff passed.
- Mypy passed.
- Web lint passed.
- Web typecheck passed.
- Web tests passed.
- Web production build passed.
- Mobile typecheck passed.
- Minimal production Compose config check passed.
