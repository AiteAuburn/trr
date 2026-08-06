# Production Readiness Review

Review date: 2026-08-05 (America/New_York)

Scope: backend, database and migrations, web, mobile, configuration, CI,
containers, minimal Compose, Kubernetes manifests, security, observability,
performance, testing, deployment, recovery, and operational support.

## 1. Executive summary

The repository is materially safer and more reproducible than at the start of
this review. Backend lint, strict typing, 317 tests, migrations, deployment
verifiers, web checks, mobile checks, dependency audits, production builds, and
release-image scans pass. CI now runs automatically on `main` pushes and pull
requests, uses read-only repository permissions, scans mobile dependencies, and
builds and scans the actual release images. Known high/critical dependency and
container findings discovered during this review were remediated.

The release decision is still **Not ready for production**. The backend has
production-grade token validation and session primitives, but actual Apple,
Google, or Email native callback integration and the complete end-user
permission/session flow are not finished or tested end to end. There is also no
selected and operated cloud target with required branch protection, managed
database backup/PITR evidence, secret-manager integration, or a practiced
deployment rollback. Those are release controls, not optional polish, for a
system handling health data.

The current artifacts are appropriate for local development, internal testing
with synthetic data, and continued staging hardening. They must not be exposed
to real users or real health data.

## 2. Prioritized issues

### Critical

1. **End-user production authentication is incomplete.** Backend HS256/JWKS
   validation, OIDC exchange, refresh rotation, revocation, and SecureStore
   boundaries exist and fail closed. Actual native provider callbacks and the
   complete permission/session UX do not. Impact: users cannot be safely
   onboarded and production login/logout/recovery cannot be validated.
2. **No operated production data platform or recovery evidence exists.** The
   repository documents managed PostgreSQL, secrets, backups, and PITR, but no
   cloud target is selected and no managed backup/restore drill has been
   recorded. Impact: real health data could be unavailable or unrecoverable
   after an operator, release, or provider failure.

### High

1. **Release governance is not enforced outside the repository.** CI now runs
   automatically, but `main` branch protection, required checks, protected
   environments, workload identity, immutable release tags, and deploy approval
   policy require repository/cloud administration and were not verified here.
2. **No production mobile artifact has passed a real-device end-to-end release
   test.** Production signing, provider login, token refresh/revoke, record
   create/read/update, offline/retry behavior, and upgrade/rollback must be
   exercised against staging before release.
3. **Expo SDK 52 is overdue for a breaking upgrade.** Reviewed overrides remove
   all high/critical audit findings, but 16 moderate build-tool advisories remain
   and upstream remediation requires Expo SDK 57. Treat the migration as an
   isolated compatibility project with native-device regression testing.
4. **Cloud deployment is descriptive, not operated.** Provider-neutral
   Kubernetes and minimal Compose artifacts exist, but there is no reviewed
   Terraform/Helm/IAM implementation, production DNS/TLS setup, alert routing,
   capacity baseline, or canary/rollback automation.

### Medium

1. The web speech build emits a 23.6 MB WASM asset and a 559 kB minified
   Transformers chunk. First-use latency and memory need measurement on target
   phones and constrained networks before enabling this path by default.
2. Starlette reports that its `httpx` TestClient path is deprecated in favor of
   `httpx2`. This is not a current correctness failure; migrate only after the
   replacement is compatibility-tested.
3. Signed/allowlisted model distribution with checksum and size verification is
   not implemented. Native model controls remain debug-gated and must stay so.
4. Metrics and PHI-safe structured logs exist, but production dashboards,
   alerts, trace exporting, retention, and incident-response ownership are not
   configured.

### Low

1. Client security overrides should be removed after upstream package ranges
   adopt fixed releases; keep the audit gate to prevent regression.
2. The production web build reports a chunk-size warning. It is currently
   code-split and correct, but should be tracked with real performance budgets.

## 3. Changes made and reasons

| Change | Reason |
| --- | --- |
| CI triggers on pushes and pull requests to `main`; permissions reduced to `contents: read` | Prevent manual-only release gates and remove unused token privilege. |
| CI now builds explicit backend, web, and proxy release images and scans those instead of development images | Container findings must represent deployed artifacts, not tool-heavy dev environments. |
| Added mobile high-severity dependency audit | Close an unscanned client dependency surface. |
| Removed unnecessary setuptools from the production backend runtime; pinned/updated reviewed backend dependencies | Eliminate fixed high-severity package findings and resolver drift. |
| Upgraded nginx-unprivileged runtime from 1.27 to 1.29 and upgrades Alpine packages at build time; added a hardened proxy Dockerfile | Remove critical/high base-image findings from both web and proxy runtimes. |
| Added bounded pip retries to the production backend build | A real package-host timeout proved the production build lacked its development build's resilience. |
| Refreshed client locks and added fixed transitive overrides | Remove all web findings and all mobile high/critical findings without an unreviewed Expo major upgrade. |
| Restored strict mypy across 118 backend source/test files, fixed Ruff, and isolated tests from local network credentials | Make CI deterministic and restore meaningful static gates. |
| Added explicit web plain-object narrowing and normalized React SSR hydration comments in the copy test | Fix clean-install typing and test serialization compatibility without changing visible behavior. |
| Corrected stale README authentication claims | Keep operator guidance aligned with the live implementation and actual blocker. |

Detailed module history remains in `PRODUCTION_HARDENING_AUDIT.md` and
`IMPLEMENTATION_LOG.md`.

## 4. Compatibility and intentional changes

- No intentional public API, response format, database schema, health-data
  semantics, or user-workflow changes were made in this review.
- No new database migration was introduced.
- CI behavior intentionally changed: pushes and pull requests targeting `main`
  now run quality/security gates; mobile dependencies and production proxy
  images are included.
- Build behavior intentionally changed: production images require current fixed
  packages and the web/proxy runtime base is nginx-unprivileged 1.29 Alpine.
- Client lockfiles changed. Clean `npm ci` is required; do not reuse an older
  `node_modules` tree.
- The eventual Expo 52 to 57 migration is expected to be breaking and is not
  included in this review.

## 5. Remaining risks and follow-up

Release-blocking order:

1. Implement Apple / Google / Email native callbacks and complete production
   login, refresh, logout, logout-all, session management, recovery, and scoped
   profile UX. Run abuse, replay, expiry, revocation, and provider-outage tests.
2. Select the first cloud target; provision private managed PostgreSQL, managed
   secrets, ingress/TLS, workload identity, logging/metrics/alerts, and image
   registry with reviewed IaC.
3. Enable `main` branch protection with both CI jobs required and protect the
   production environment with approvals and immutable image digests.
4. Perform and record a managed database backup/PITR restore drill with RPO/RTO,
   ownership, escalation, and data-integrity checks.
5. Build a production-signed mobile artifact and run staging end-to-end tests on
   supported real devices and upgrade paths.
6. Migrate Expo SDK 52 to 57, remove obsolete overrides, and repeat native,
   dependency, and release validation.
7. Establish capacity and performance budgets for API latency, database load,
   parser concurrency, speech model download, browser memory, and mobile startup.

## 6. Deployment, migration, rollback, and operations

### Deployment

1. Require green quality and security jobs on the exact release commit.
2. Build backend, web, proxy, migration, and mobile artifacts once; tag and
   deploy by immutable digest/version. Scan the produced artifacts.
3. Populate secrets from a managed secret store. Never deploy example values.
   Production startup must keep dev auth/debug disabled, explicit HTTPS origins,
   issuer/audience/JTI enforcement, and a managed PostgreSQL URL.
4. Take/verify a database backup, run `alembic upgrade head` as a one-shot release
   job, then deploy backend and web through a canary or rolling update.
5. Gate traffic on `/readyz`; monitor error rate, latency, auth failures, DB pool,
   rate limits, and parser outcomes. Keep logs free of PHI, tokens, bodies, and
   transcripts.

### Migration

- This review adds no schema migration. The current head was applied
  successfully in validation.
- Future migrations should be expand/contract, backward compatible with the
  previous app during rollout, bounded in lock time, and tested against a
  production-sized staging snapshot containing synthetic/de-identified data.

### Rollback

- Roll application containers back by immutable digest; do not rebuild an old
  tag during an incident.
- Do not automatically downgrade database migrations. Roll back application
  code only while schema compatibility is preserved. For destructive/data
  failures, stop writes and execute the practiced PITR/restore runbook.
- Mobile rollback requires a previously signed store build or a reviewed update
  channel; server APIs must remain compatible across supported client versions.

### Operations

- Use `/livez` for process liveness and `/readyz` for dependency readiness.
- Scrape `/metrics` and alert on availability, latency, 5xx, auth/rate-limit
  anomalies, DB saturation, backup failure, and restore-test age.
- Rotate JWT/OIDC, database, and provider secrets through the managed secret
  system; document emergency revocation and session invalidation.
- Run dependency, secret, and container scans on every release and on a schedule
  so newly published advisories are caught without waiting for feature work.

## 7. Validation commands and results

Commands were run from the repository root unless a working directory is shown.
All listed results were actually observed.

### Backend and database

- `rtk docker compose build backend` — passed after dependency rebuild.
- `rtk docker compose run --rm backend alembic upgrade head` — passed.
- `rtk docker compose run --rm backend ruff check .` — passed.
- `rtk docker compose run --rm backend mypy .` — passed, 118 source files.
- `rtk docker compose run --rm backend pytest -q` — passed, 317 tests; one
  upstream Starlette/httpx deprecation warning remains.
- Backend `pip-audit` in the rebuilt image — zero known vulnerabilities.
- `rtk python3 scripts/verify_backend_constraints.py` — passed, 13 direct
  dependencies constrained and both Dockerfiles wired.

### Web

- `rtk npm --prefix web ci` — passed; zero audit findings.
- `rtk npm --prefix web run lint` — passed.
- `rtk npm --prefix web run typecheck` — passed.
- `rtk npm --prefix web test -- --run` — passed, 6 tests.
- `rtk npm --prefix web run build` — passed; 52 modules transformed. Build
  reported the documented asset/chunk size warning.
- `rtk npm --prefix web audit --audit-level=high` — passed, zero vulnerabilities.

### Mobile

- `rtk npm --prefix mobile ci` — passed.
- `rtk npm --prefix mobile run quality` — passed: typecheck plus navigation, UI
  coverage, visual-smoke route/harness, secure-storage, and APK-script verifiers.
- From `mobile/`, `rtk node_modules/.bin/expo config --type public` — passed and
  resolved SDK 52 configuration.
- `rtk npm --prefix mobile audit --audit-level=high` — passed; zero
  high/critical and 16 moderate Expo build-tool findings remain.

### Deployment and containers

- `rtk python3 scripts/verify_deployment_config.py` — passed.
- `rtk python3 scripts/verify_minimal_backup_restore.py` — passed.
- `rtk python3 scripts/verify_k8s_manifests.py` — passed.
- `rtk docker compose --env-file infra/minimal/.env.example -f infra/minimal/docker-compose.yml config --quiet` — passed.
- `rtk docker build -f backend/Dockerfile.prod -t bloodsugar-backend-release backend` — passed; a first attempt timed out downloading from PyPI, then the new bounded retries handled transient connection resets successfully.
- `rtk docker build -f web/Dockerfile.prod -t bloodsugar-web-release web` — passed.
- `rtk docker build -f infra/minimal/Dockerfile.proxy -t bloodsugar-proxy-release infra/minimal` — passed.
- Trivy `--ignore-unfixed --severity CRITICAL,HIGH` scans against backend, web,
  and proxy release images using the fresh database and final-filesystem package
  inventory — passed, 0 findings for each image.
- Runtime `id` checks — backend `uid=100(app)`; web and proxy `uid=101(nginx)`.
- `rtk git diff --check` — passed.

### Not executed or not claimable

- GitHub-hosted gitleaks and Actions jobs were not executed locally; their
  workflow configuration was inspected and the local verifiers passed.
- No real identity-provider, signed mobile, cloud deployment, production data,
  managed backup/PITR, load, chaos, or disaster-recovery test was performed.
- Branch-protection and cloud/IAM state were not accessible from this checkout.

## 8. Release-readiness checklist

- [x] Backend lint, strict typing, tests, and migration-to-head pass.
- [x] Web lint, typing, tests, and production build pass.
- [x] Mobile typecheck and repository quality verifiers pass.
- [x] Backend and web dependency audits have no known findings.
- [x] Mobile dependency audit has no high/critical findings.
- [x] Backend, web, and proxy release images have no fixed high/critical Trivy findings.
- [x] Production images run as non-root users.
- [x] Production configuration, Kubernetes, Compose, and backup-script static verifiers pass.
- [x] CI runs automatically and includes quality, dependency, secret, and release-image gates.
- [ ] Real provider callbacks and production auth/session/profile UX pass end to end.
- [ ] Production-signed mobile artifacts pass real-device staging tests.
- [ ] Managed database, secrets, TLS, IAM, registry, and alerting are provisioned from reviewed IaC.
- [ ] Managed backup/PITR restore drill meets approved RPO/RTO.
- [ ] Required branch checks, protected environment, approvals, and immutable release promotion are enforced.
- [ ] Load/capacity and failure-recovery tests meet approved service objectives.
- [ ] Expo SDK migration removes remaining moderate build-tool advisories.

## 9. Final status

**Not ready for production.** Engineering gates and deployable-image security are
green, but production identity, operated data recovery, release governance, and
real deployment/device evidence remain unresolved critical/high requirements.
