# Production Readiness Status

Status date: 2026-11-05. This is the single readiness doc. It replaces PRODUCTION_READINESS_REVIEW, PRODUCTION_HARDENING_AUDIT, PRODUCTION_GRADE_DESIGN_AUDIT, IMPLEMENTATION_PLAN, and REFACTOR_ROADMAP; for the old detail see git history before `efca25f`. Deployment steps are in `DEPLOYMENT.md`. Decision ids (D1–D7) refer to `PRODUCT_ROADMAP.md` §4.

## 1. Verdict

**Not ready for real users or real health data.** The only environment is the Lightsail single-host staging used for internal APK testing with synthetic data.

## 2. Release blockers

| # | Item | Current state | Needed |
|---|---|---|---|
| B2 | Raw transcript retention (D2) | `ai_parse_audits.transcript_text` and `daily_records.transcript_entries_json` keep raw text with no expiry. Admins can read parse audits in `/admin/users/{id}`. | Set a retention period with a scheduled purge, or stop storing raw text; limit admin access |
| B4 | Release signing (D4) | `mobile/android/app/build.gradle` signs release with the debug keystore | Real keystore plus custody process; `verify:android-release-signing` passes |
| B5 | Staging dev auth (D6) | Config refuses `ALLOW_DEV_AUTH=true` outside local/test/development; the server `.env` still has to be changed by hand | Set `ALLOW_DEV_AUTH=false` on the host, redeploy, confirm `/auth/dev-login` returns 404 |
| B6 | Backup and restore evidence | `infra/lightsail/backup.sh` / `restore.sh` exist (checked by `scripts/verify_backup_restore.py`); no restore drill recorded | Run and record a restore drill with RPO/RTO; back up before every migration |
| B7 | Real-device end-to-end test | The voice-first flow (recording, 3 s auto-stop, Whisper/phone fallback, cancel, save) is tested only with mocks and an emulator | Install the release APK on a real Android phone and run the full flow against staging |

## 3. Important gaps (not blockers for a closed beta)

| Area | Gap |
|---|---|
| Voice quota (D5) | `voice_seconds` is client-reported; the server does not measure audio |
| Subscriptions (D7) | Trial expiry is not enforced; there is no payment provider |
| Auth | Email/password only. Apple / Google provider callbacks are not wired in the app (backend `/auth/oidc-login` exists). Refresh rotation has no reuse detection or family revoke. No password reset. |
| Mobile security | No biometric lock and no screenshot protection (old `skills.md` must-haves). Decide whether they are required. |
| Retention jobs | `prune_*` helpers (auth sessions, JWT denylist, rate-limit counters, grants) exist but nothing schedules them |
| Parse cancel | The client ignores late results, but the HTTP request is not aborted, so the server still spends tokens |
| Model download | The Whisper download checks file size only, not a checksum |
| Observability | Metrics, PHI-safe JSON logs, and admin usage/event pages exist. No alerting, dashboards, or trace export. |
| Security scans | No CI. gitleaks, dependency audits, and image scans are manual. |
| Removed features | Store/community/achievements/ranking removal is in progress. `scripts/verify_mobile_navigation.py` and `verify_mobile_ui_spec_coverage.py` still expect them and must be updated before `npm run quality` passes again. |
| `App.tsx` size | Very large root component. Split further only in small, test-backed slices, with no large unrelated refactors. |

## 4. In place

- Every route requires auth unless listed in `PUBLIC_ROUTE_REASONS`, enforced by a test.
- Central permission service, scoped and revocable profile grants, 404 on unauthorized access.
- Production and staging config validation (see `architecture.md` §3).
- Bounded request bodies, record JSON, AI responses, list endpoints, and stream events.
- Audit events for writes, auth, and admin views, without PHI. PHI-safe structured logging and redaction.
- DB-backed rate limits on auth, admin login, and AI parse.
- Atomic voice-quota consumption, charged only after a successful parse.
- Expand-only migration policy and API contract version, verified by scripts.
- Fail-closed feature flags with parity across backend, web, and mobile.
- Mobile tokens in SecureStore only; release env verifier.
- Lightsail: DB on an internal network, backend not exposed, Caddy TLS with HSTS, non-root read-only backend container, USD 10/month budget alert.
- Local merge gate `make check`.

Cloud parsing (D1) was decided on 2026-11-05: no in-app consent step, and the vendor is not named in the UI. Still needed before a store release: the privacy policy and the Google Play Data safety form must say that health text is processed by a third-party AI service (the vendor does not have to be named).

## 5. Order of work

1. B2 privacy decision (product owner), then implement retention.
2. B5 server config, B4 signing, B6 restore drill.
3. Fix the mobile verifiers after the feature removal so `npm run quality` passes.
4. B7 real-device run.
5. Section 3 gaps, by priority: quota trust, trial expiry, retention jobs, auth hardening, biometric and screenshot decision.

The queue for this is in `TASK_QUEUE.md`.
