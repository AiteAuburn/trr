# Production Hardening Audit

Scope: module-by-module review for production security, maintainability, and cloud deployment readiness. This document records risks found in the live codebase and the incremental fixes made in this pass.

## Executive Summary

The project is still a local-first MVP, but the deployment shape is improving. Docker Compose works for local and minimal self-hosted runs, production Dockerfiles already use non-root runtime images, and CI includes tests plus dependency/container scans. The largest remaining production blocker is real authentication: current APIs still use local development auth semantics and must not be exposed to real users until token validation and permission scopes are implemented.

## Module Findings

| Module | Current State | Risk | Change Made | Remaining Work |
| --- | --- | --- | --- | --- |
| Backend config | Environment-driven settings exist, but production safety checks were thin. | Insecure defaults could reach production, especially debug tools, wildcard CORS, or unbounded auth-related env values. | Added typed `APP_ENV`, log-level validation, timeout/token bounds, production rejection for debug tools and wildcard CORS. JWT secret/issuer/audience config values are bounded, and issuer/audience values are whitespace-normalized. `DATABASE_URL` is parsed and restricted to supported PostgreSQL drivers at startup. CORS origin lists, parser/runtime URLs, local model ids, and local LLM keep-alive settings are bounded and normalized at startup. CI now verifies deployment examples keep dev auth/debug disabled, bounded LLM caps, explicit CORS, and managed-service placeholders. | Keep adding target-specific validators as cloud deployment artifacts are introduced. |
| Backend auth | `/auth/dev-login` and `X-Account-Id` are local development shortcuts. | Header-based account impersonation is unsafe for production. | Added `ALLOW_DEV_AUTH`; dev login and header auth are disabled by default when `APP_ENV=production`, and production config rejects `ALLOW_DEV_AUTH=true`. Protected endpoints fail closed while auth is absent, can authenticate dependency-free HS256 Bearer JWTs when a strong `AUTH_JWT_SECRET` is configured, and can validate provider-issued RS256 Bearer JWTs through a bounded `AUTH_JWKS_URL`. Production JWT/JWKS auth requires issuer, audience, and `jti` enforcement, so accepted tokens are issuer-bound, audience-bound, and revocation-checkable. JWT `jti` denylist revocation exists with hashed ids only, logout and logout-all can add a provided valid Bearer token to that denylist, expired denylist rows can be pruned, hash-only refresh session persistence/rotation plus `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, and `/auth/sessions` exist, refresh-token request shape is bounded before rate-limit hashing, refresh/session response schemas are bounded, refresh attempts have token-key plus client-key DB rate limits, and logout has client-key rate limiting before session lookup. Added provider-neutral `/auth/oidc-login` exchange: bounded compact ID token request, bounded nonce requirement, client-key login rate limit before JWKS/crypto work, configured OIDC JWKS/issuer/audience validation, matching nonce requirement, verified email requirement, account create/reuse, hash-only refresh session creation, and short-lived app access token issuance. Mobile now creates provider nonce/state challenges with crypto-secure random, ref-only pending storage, bounded TTL, and callback state validation before calling the OIDC exchange helper. | Connect actual Apple / Google / Email native SDK callbacks, then add scoped profile permissions. |
| Backend API validation | Pydantic schemas, record validators, schema registry, request content-type/body-size guards, and permission service cover core inputs/access checks. | Some parser payloads remain flexible because AI output is semi-structured; grant UI and share-token flow are not exposed yet. | Existing record validation retained; config values now have stricter bounds. Added app-level JSON content-type and `MAX_REQUEST_BODY_BYTES` guards before route parsing, including bounded pre-read for protected JSON API bodies without `Content-Length`. Added explicit profile/record permission decision helpers with owner access, account-to-profile grant support, 404 hiding for unowned resources, and audited grant create/list/revoke APIs. Profile and grant response schemas now bound public text, grant types, and grant scopes. Public rate-limit retry metadata is bounded before error details or `Retry-After` headers are emitted. Voice quota public plan metadata and quota response counters are bounded before API responses. Ollama model discovery now bounds extracted runtime model ids and max retained ids before caching or availability comparison. AI model option responses now bound model ids, labels, descriptions, and list sizes. Progress-stream event lines are bounded before NDJSON parsing in the voice-quota wrapper. Parse preview responses now bound text fields, segment/record/rejected-event counts, top-level payload/metadata keys, source strings, decision traces, and confidence values. Command proposal responses now bound UI/action strings, action count, top-level payload/metadata keys, and confidence values before clients consume proposed actions. | Add share-token issuance, doctor portal scopes, and frontend grant-management UX before expanding collaborative or clinic flows. |
| Backend logging / metrics | Docker logs, health endpoints, and `/metrics` exist. | Logs and metrics must not include PHI, raw transcripts, secrets, request bodies, raw model output, query strings, headers, SQL text, SQL params, or noisy third-party HTTP internals. | Added PHI-safe structured JSON request logs with method/path/status/duration/request_id/trace_id only. Inbound request ids are bounded and sanitized before response/log use. Bounded W3C `traceparent` trace-id propagation returns `X-Trace-ID` without logging full headers. Added Prometheus text metrics with method/route pattern/status, parser model/outcome/reason, and DB operation type only. Shared sensitive-data redaction is bounded by depth, width, and string length. `httpx` and `httpcore` debug logs are suppressed to WARNING even when app log level is DEBUG. Local parser debug-stream HTTP failures and oversized stream lines return fixed low-information errors instead of raw exception text or raw model output. | Add OpenTelemetry exporter integration only after provider and redaction policy are selected. |
| Database | PostgreSQL, Alembic, soft delete, and active-record indexes exist. | Local Compose DB is not production-grade. | No DB rewrite in this pass. Existing docs already prefer managed PostgreSQL for production. | Use Cloud SQL/RDS/Aurora with private networking, PgBouncer, backups, PITR, migrations as release steps. |
| Reports / exports | Basic report endpoint aggregates glucose, meal, exercise, medication, lifestyle, and note counts from report-eligible record fields. | Report/export responses can become user-visible PHI surfaces; response contracts must stay bounded as report sections grow. | Basic report response schema now bounds record counts, summary sub-counts, and glucose summary values using the same glucose range as record validation. | Add bounded richer export/report sections only after doctor/share/export scopes are finalized. |
| File handling | Mobile model download stores files in app document storage using sanitized names. | Remote model URLs and local model paths are dev-only; unsafe if exposed broadly. | Mobile native model panel remains hidden unless debug tools are enabled. | Add checksum verification, allowlisted model manifest, size limits, and signed model distribution before production. |
| Frontend web | Vite API endpoint and debug flag are environment-driven. | Debug panels can expose transcript-derived data if enabled accidentally. | Prior pass already hid web debug tools unless `VITE_ENABLE_DEBUG_TOOLS=true`. | Add production UX auth flow once backend auth is real. |
| Mobile | Expo preview talks to backend and has local native model test paths. | Dev client model controls are not end-user production UI. | Prior pass hid native dev panel unless `EXPO_PUBLIC_ENABLE_DEBUG_TOOLS=true`; CI now runs mobile typecheck. | Add secure token storage, biometric/local DB encryption, and production build profiles. |
| Docker Compose | Local compose is easy to run; minimal production compose exists. | Local defaults use simple credentials and dev auth. | Added `ALLOW_DEV_AUTH` to local and minimal production envs; production example disables it. OIDC login, logout, and auth rate-limit settings are exposed in local, minimal production, and Kubernetes examples. | Add cloud-managed DB/Redis variants and secret injection examples per target. |
| Dockerfiles | Backend prod runs as non-root app user; web prod uses nginx unprivileged. | Dependency pinning is version-ranged, not fully locked for backend prod. | No broad image rewrite needed. | Generate lockfile or constraints for backend production builds. |
| CI/CD | Tests, lint, mypy, secret scan, pip-audit, npm audit, Trivy are present. | Mobile was not covered by CI quality gates. | Added mobile `npm ci && npm run typecheck`. | Add cloud deploy workflows with OIDC/workload identity and protected environments. |
| Cloud deployment | Architecture docs discuss GCP/AWS/Kubernetes. | README lacked concise operator instructions for Cloud Run/GKE/ECS/EKS. | Added cloud deployment guide and README links. | Add actual Terraform/Helm modules after cloud target is chosen. |

## Prioritized Implementation Plan

1. Complete real production auth.
   - Connect actual Apple / Google / Email native SDK callbacks to the existing nonce/state challenge and `/auth/oidc-login` exchange boundaries.
   - Keep `ALLOW_DEV_AUTH=true` only for local and test.
   - Add permission service for owner/caregiver/doctor/export scopes.

2. Finalize production database and secret path.
   - Use Cloud SQL or RDS/Aurora.
   - Keep DB private-network only.
   - Store secrets in Google Secret Manager or AWS Secrets Manager.
   - Use workload identity / task role instead of static cloud keys.

3. Add structured observability.
   - Add request ID middleware.
   - Emit JSON logs without bodies, headers, transcripts, or payloads.
   - Add Prometheus/OpenTelemetry only after redaction boundaries are enforced.

4. Harden model/file distribution.
   - Add manifest-driven model downloads.
   - Verify checksum and size before activation.
   - Keep model downloads behind explicit debug or signed production manifests.

5. Add cloud deployment artifacts.
   - Choose Cloud Run/GKE or ECS/EKS as first target.
   - Add minimal Terraform or Helm for that target.
   - Add CI deploy workflow using OIDC and least-privilege IAM.

## Verification Added

- `backend/tests/test_config.py`: validates safe production config behavior.
- `backend/tests/test_profiles.py`: verifies dev login and header auth are disabled under production config.
- `.github/workflows/ci.yml`: adds mobile typecheck to the quality job.

## Residual Production Blockers

- Minimal production Bearer JWT authentication exists for HS256 tokens with `sub=account_id` and `exp`.
- Provider-issued RS256 Bearer JWT authentication exists through `AUTH_JWKS_URL`, with bounded JWKS URL/timeout config and bounded JWT part/claim validation before crypto/JWKS work.
- Provider-neutral OIDC login exchange exists through `/auth/oidc-login`, with bounded request schema, required matching nonce claim, client-key login rate limiting before JWKS/crypto work, configured OIDC JWKS/issuer/audience validation, verified email requirement, account create/reuse, hash-only refresh session creation, and short-lived app access token issuance.
- Mobile provider-login buttons create bounded nonce/state challenges with crypto-secure random, ref-only pending storage, TTL expiry, and callback state validation before calling `/auth/oidc-login`.
- Production rejects `AUTH_JWT_SECRET` shorter than 32 characters.
- JWT secret, issuer, and audience configuration values are bounded; issuer/audience values are whitespace-normalized before token validation.
- `DATABASE_URL` is normalized, parsed as a SQLAlchemy URL, restricted to supported PostgreSQL drivers, and required to include a database name before engine creation.
- CORS origin lists, parser/runtime URLs, local model ids, and local LLM keep-alive settings are bounded and normalized at startup before downstream HTTP/model/runtime use.
- Production rejects `AUTH_JWT_SECRET` without `AUTH_JWT_ISSUER` and `AUTH_JWT_AUDIENCE`.
- Production rejects `AUTH_JWT_SECRET` unless `AUTH_JWT_REQUIRE_JTI=true`.
- Production rejects `AUTH_JWKS_URL` unless it uses HTTPS and has `AUTH_JWT_ISSUER`, `AUTH_JWT_AUDIENCE`, and `AUTH_JWT_REQUIRE_JTI=true`.
- Production rejects `AUTH_OIDC_JWKS_URL` unless it uses HTTPS and has `AUTH_OIDC_ISSUER`, `AUTH_OIDC_AUDIENCE`, and `AUTH_JWT_SECRET`.
- Production config fails fast if `ALLOW_DEV_AUTH=true` is set.
- App-level JSON content-type guard rejects non-JSON API bodies with `415` before route parsing.
- App-level request body size guard rejects oversized requests with `413` before route parsing and preserves PHI-safe error responses.
- `Content-Length` parsing is bounded before integer conversion; malformed, negative, signed, whitespace-padded, or oversized header values are rejected with `400` before route parsing or body reads.
- Protected JSON API requests without `Content-Length` are bounded by pre-reading at most `MAX_REQUEST_BODY_BYTES + 1`; accepted bodies are replayed to downstream routes, while oversized bodies fail before route parsing.
- Record `payload_json` and `metadata_json` have bounded depth, node count, container width, and string length before sanitizer recursion, schema validation, permission lookup, or DB write work.
- Protected endpoints fail closed with `production_auth_not_configured` when no HS256 secret or JWKS URL is configured.
- Oversized production `Authorization` headers, oversized JWT header/payload/signature parts, too-wide decoded claim objects, oversized claim strings, wide audience lists, and nested claim objects are rejected before account lookup.
- JWT `jti` denylist revocation exists for access-token invalidation, and `jti` values are bounded before token issuance, denylist lookup, or account lookup; the revocation service also normalizes and bounds `jti` values before hashing or storage.
- JWT denylist expiration datetimes are rejected when timezone-naive before `jti` hashing or storage work.
- `AUTH_JWT_REQUIRE_JTI=true` can enforce revocable access tokens when the token issuer supports `jti`.
- Expired revoked JWT hash rows can be pruned in hard-capped bounded batches without retaining raw tokens or raw token ids.
- Hash-only refresh session persistence, rotation, bulk revoke-all, single-session revoke, hard-capped bounded expired-session pruning helpers, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/sessions`, and `DELETE /auth/sessions/{session_id}` exist.
- Auth-session token hash inputs are whitespace-normalized and length-bounded before hashing or refresh-session lookup/storage.
- Device fingerprints are whitespace-normalized and length-bounded before hashing or refresh-session storage.
- Refresh-session expiration datetimes are rejected when timezone-naive before hashing, comparison, or storage work.
- Refresh-token request schema is bounded and rejects malformed tokens before auth rate-limit hashing or session lookup.
- Auth refresh responses bound access/refresh token strings, token type, and expiry metadata before serialization.
- `/auth/refresh` has DB-backed fixed-window rate limiting before session lookup, with hash-only rate-limit keys.
- `/auth/refresh` also has client-key DB-backed rate limiting before token-key lookup, so distinct invalid refresh-token attempts share an endpoint-level boundary.
- `/auth/logout` has client-key DB-backed rate limiting before refresh-session lookup and commits rate-limit counters for unknown-token attempts.
- Rate-limit service keys are whitespace-normalized and length-bounded before hashing or counter upsert, and invalid limits/windows are rejected before DB work.
- `/auth/logout` and `/auth/logout-all` can revoke a provided valid Bearer access token by storing only a bounded `jti` hash and expiry in the denylist.
- Local and minimal production Compose examples expose the logout client rate-limit count/window settings.
- AI parse routes have account-scoped DB-backed fixed-window rate limiting before voice quota usage and parser / LLM execution.
- DB-backed rate-limit consumption uses PostgreSQL atomic upsert increment instead of read-then-write counters.
- Old rate-limit counter rows can be pruned by timezone-aware retention cutoff in hard-capped bounded batches.
- Rate-limit counter retention pruning has a `window_start` query index.
- Session listing is bounded, exposes only current-account session metadata, and omits raw tokens, token hashes, raw device fingerprints, and fingerprint hashes.
- Session listing response validation also hard-caps returned session metadata list size while preserving the public JSON list shape.
- Logout-all response validation bounds the public revoked-session count.
- Session listing has a composite query index for account-scoped active-session retrieval.
- Single-session revoke is account-scoped, idempotent for unknown or other-account session ids, and uses a bounded database `UPDATE` instead of loading the session row.
- Profile and record permissions route through a central decision service with bounded non-PHI reason codes; owner access and active account-to-profile grants are supported, while unowned/unauthorized resources remain hidden as `404`.
- Owned profile listing is bounded and rejects timezone-naive cursors before query work.
- Owned profile listing has a composite `account_id + created_at` query index.
- Account/profile display text is whitespace-normalized and rejects blank values before storage, keeping UI/shared-profile metadata bounded and clean.
- `profile_access_grants` stores scoped, expirable, revocable account grants for future caregiver, doctor, export, and share flows.
- Profile grant query indexes support profile grant history and shared-profile discovery cursor queries.
- Grant create/list/revoke APIs require `profile:share` permission and write audit events with bounded non-PHI metadata. Grant creation rejects timezone-naive expiration values before permission/query work.
- Audit metadata is centrally redacted and bounded by depth, node count, container width, and string length before DB storage; redaction occurs inside the bounded sanitizer so deep metadata is not fully traversed first.
- Inactive profile access grants can be pruned in hard-capped bounded batches.
- Profile grant retention pruning has revoked/expired timestamp query indexes.
- Profile grant permission checks filter active grants in SQL and use a JSONB GIN index for scope containment.
- Record create/update rejects clearly future `occurred_at` values and oversized record JSON before permission and DB write work. Record payload/metadata storage sanitizers are also bounded by depth, container width, and string length, and remove raw transcript/source/free text before DB storage. Meal `food_items` and note `tags` have schema-level count and shape bounds before DB write. Core numeric payloads have schema-level range checks for glucose, exercise minutes, blood pressure, weight, and body-fat percentage. Core record units, short text fields, and selected category values are bounded before DB write so arbitrary parser/client strings cannot pollute analytics. Record listing rejects incomplete or timezone-naive cursor parameters before permission/query work, is bounded, and supports an `(occurred_at, created_at)` tie-breaker cursor for stable pagination when multiple records share the same event time.
- Basic report generation rejects invalid or timezone-naive date windows before permission/query work, selects only summary fields, filters by schema-registry report eligibility, supports explicit date windows, streams rows instead of materializing full record ORM objects, and aggregates glucose summaries without per-record lists.
- Local LLM parser output token caps scale by segment count and remain bounded by configured and hard maximums; config validation rejects `LOCAL_LLM_MAX_TOKENS` above the 960-token batch hard cap. Prompt segment text stays bounded and preserves both beginning and ending context for long segments. Ollama model-list response text and local parser HTTP response text are bounded before JSON materialization, parser response content is hard-capped before JSON extraction/parsing, and oversized-output failures omit PHI. Compact IR arrays and short text fields are bounded before parser output is mapped into confirmation candidates. Deterministic parser preview output is capped by total candidate records and per-meal food item count before confirmation or command-proposal response construction.
- Blank AI transcripts are rejected at request-schema validation before route-level profile lookup, quota work, parser execution, or LLM work. Invalid STT model selections are rejected from the static model list before transcript segmentation / complexity counting, profile ownership lookup, quota consumption, parser execution, or LLM work. Clearly future AI parse `occurred_at` values are rejected before profile ownership lookup, quota consumption, parser execution, or LLM work. Over-budget AI transcripts are rejected before LLM model availability lookup, profile ownership lookup, quota consumption, or parser execution; the complexity guard stops counting after `max_segments + 1` to avoid constructing every segment for clearly over-budget input, and the numeric-density guard stops counting after `max_numeric_values + 1` to avoid processing transcripts with excessive candidate numbers. Unknown or statically disabled LLM model IDs are rejected before runtime model availability lookup, and static non-runtime LLM models avoid Ollama availability checks. Runtime-unavailable LLM model selections are rejected before profile ownership lookup, quota consumption, parser execution, or LLM work.
- Non-stream parse and user-visible progress stream commit voice quota only after parser success while preserving rate-limit accounting for failed parser attempts.
- Voice quota consumption uses a PostgreSQL atomic upsert guard so concurrent workers cannot increment beyond the daily entitlement limit.
- Voice quota service code rejects negative or oversized requested voice seconds before subscription lookup, usage-counter lookup, quota upsert, parser execution, or LLM work.
- Voice usage-counter day windows require timezone-aware datetimes before period derivation.
- Voice entitlement daily limits and stored usage counters are normalized to bounded service caps before quota display, quota decisions, or atomic usage updates.
- Active subscription lookup is bounded and backed by an account/status/created-at composite index.
- Quota display and zero-second checks read current usage without creating unnecessary usage counter rows.
- Non-owner grant delegation is least-privilege and cannot create grants for scopes the actor does not currently hold.
- Profile grant listing has bounded `limit` pagination to avoid unbounded grant-history responses.
- Shared-profile listing returns only active readable grants and omits owner account ids from the response.
- Shared-profile listing filters active/readable grants in the database before applying `limit`.
- Profile grant and shared-profile listing reject timezone-naive cursors before permission/query work and support `before` cursor pagination with grant `created_at`.
- Grantee self-revoke for received grants is supported, idempotent, and audited once with bounded non-PHI metadata.
- Inactive profile grants can be pruned by timezone-aware retention cutoff in hard-capped batches without touching health record payloads.
- Logout and logout-all access-token invalidation depend on clients sending the current Bearer token; otherwise already-issued access tokens remain bounded by short expiry and `jti` denylist checks.
- Real login issuance, OIDC/JWKS, and device/session management UI are not implemented yet.
- Provider-neutral Kubernetes manifests exist for backend, web, ingress, HPA, PDB, NetworkPolicy, service account, secrets, and migration job; CI statically verifies required production guardrails. Cloud IAM/Terraform/Helm artifacts still do not exist yet.
- Backend Docker builds use a pinned `backend/constraints.txt` constraints file to reduce resolver drift between reviewed dependency updates.
- CI verifies backend direct dependencies are constrained and both backend Dockerfiles use `constraints.txt`.
- CI verifies deployment config examples keep production debug/dev-auth disabled, bounded local LLM caps, explicit CORS, and managed database/Redis placeholders.
- Request ID exists in structured request logs and response headers.
- Inbound `X-Request-ID` is bounded and sanitized before structured logs or response headers use it.
- Bounded W3C `traceparent` trace ids propagate through `X-Trace-ID` and PHI-safe request logs without echoing full headers.
- Structured JSON log string fields are length-bounded before serialization, including message, logger, and allowlisted extra fields.
- Shared sensitive-data redaction is bounded by depth, container width, and string length before returning redacted structures.
- Minimal production Compose backend healthcheck uses `/readyz` so the proxy waits for DB-backed readiness instead of process-only liveness.
- `/metrics` exposes route-pattern request counters and duration sums without query strings, request bodies, headers, transcript, or payload values.
- Parser metrics expose only normalized bounded model id, outcome, and reason labels; unsafe label values collapse to `unknown`, while exception messages, prompts, transcripts, and raw model output are omitted.
- Local parser debug-stream HTTP failures return fixed low-information errors without parser URLs, connection details, transcript fragments, numeric health values, or secret-like query text.
- DB timing metrics expose only normalized bounded operation type, for example `select` or `insert`; SQL text, SQL params, record ids, and payload values are omitted.
- Request validation errors omit raw `input` values from `422` responses and serialize validator context values through a bounded JSON-safe sanitizer.
- Minimal self-host backup/restore scripts require an env file, produce custom-format dumps through `pg_dump -Fc`, avoid partial backup artifacts, validate restore input readability, and are covered by a CI/static verifier.
- No operated backup/restore evidence for a managed database target yet.
