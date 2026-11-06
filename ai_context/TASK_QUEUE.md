# 糖錄錄 Task Queue

> The full old queue (T001–T2346, 53,631 lines) lives in git history before this change, at commit `efca25f`.

## Rules

- Only one task is `active` at a time. Pick the next one from Next Up.
- When a task is done, move it to Recently done as one line. Cancelled tasks are deleted, with the reason noted in the log.
- New task ids continue from T2347. Never reuse an id.
- Every change is logged in `ai_context/IMPLEMENTATION_LOG.md` (PHI-safe).
- Readiness context: `ai_context/PRODUCTION_READINESS.md`. Open decisions: `ai_context/PRODUCT_ROADMAP.md` §4.

## Active

None. Pick the next task from Next Up.

## Next Up

### T2349: Raw transcript retention (D2)

Decide the retention period for `ai_parse_audits.transcript_text` and `daily_records.transcript_entries_json`. Add a scheduled purge (or stop storing raw text), restrict admin visibility, and add tests. If the schema changes, use an expand-only migration.

### T2350: Staging hardening (D6, backups)

Set `ALLOW_DEV_AUTH=false` in the Lightsail `.env`, redeploy, and confirm `/auth/dev-login` returns 404. Run and record a backup/restore drill with `infra/lightsail/backup.sh` / `restore.sh`.

### T2351: Release signing (D4)

Create a real Android release keystore with a custody plan, wire the signing config, and make `npm run verify:android-release-signing` pass. Update `docs/ANDROID_RELEASE_SHARING.md`.

### T2352: Real-device voice flow acceptance

Install a release APK on a real Android phone against staging. Verify microphone permission, tap start/stop, 3 s auto-stop, 60 s cap, Whisper-first with phone fallback, phone recognition staying on-device when the Taiwan Mandarin offline pack is installed (try airplane mode) and working without the pack, temp-audio deletion, parse cancel, confirm, save, and the Today timeline. Do not mark done on mocks or emulator alone.

### T2353: Server-side voice quota trust (D5)

Decide whether client-reported `voice_seconds` is acceptable. If not, add server-side bounds, for example comparing against transcript length or request timing, or require audio duration metadata. Add idempotency keys for usage increments.

### T2354: Schedule retention jobs

Run the existing `prune_*` helpers (auth sessions, revoked JWTs, rate-limit counters, inactive grants) on a schedule on Lightsail, plus the purge from T2349.

### T2355: Trial expiry and subscription state (D7)

Enforce `trial_ends_at`, define post-trial behavior, and choose the payment provider.

### T2356: Abort parse on cancel

Use `AbortController` in mobile so cancel actually stops the request, and make sure the backend does not charge quota for aborted requests.

## Recently done (summary)

| When | What |
|---|---|
| 2026-11 | D3 decided: phone speech recognition runs on-device when the phone can, otherwise the normal recognizer; Whisper failures fall back to it |
| 2026-11 | T2348: cloud parsing decided (D1). No in-app consent step; the AI vendor is never named in the UI (「AI 智慧整理」) |
| 2026-11 | T2347: cut scope to the voice-first MVP. Removed store, community, ranking and achievements (tables kept), deleted k8s/aws/minimal infra, moved backup/restore to Lightsail, consolidated `ai_context/` from 42 to 14 docs |
| 2026-11 | Voice-first mobile redesign: big mic home, tap start/stop, 3 s silence auto-stop, 60 s cap, straight to AI parsing with cancel, single confirm page, 存好了, Today timeline |
| 2026-11 | `make check` local gate replaces the removed GitHub Actions CI; security fixes after a full review (dev auth refused outside local/test/development) |
| 2026-10 | T2346: phone speech recognition (`mobile/phoneSpeechCapture.ts`, `expo-speech-recognition`) with Whisper-first fallback and temp-audio cleanup. The redesign completed it; real-device acceptance moved to T2352 |
| 2026-10 | `whisper.rn` model download and PCM capture spike; internal arm64 test APK |
| 2026-10 | Email/password sign-in for app and web (migration `20261003_0034`) |
| 2026-09 | Admin console: usage analytics, AI parse audits, operational events (migrations 0031–0033) |
| 2026-09 | Lightsail single-host staging with DeepSeek hosted parsing; shared web/APK API base |
| 2026-08 | T2337–T2345: strict typing, dependency and image hardening, Expo SDK 57 upgrade, release/rollback contract, fail-closed feature flags, auth/session hardening, API and migration compatibility guardrails |
| 2026-04 → 2026-08 | Backend core (records, profiles, grants, reports, subscriptions, voice quota, year review), AI pipeline, web simulator, and about 1,260 small `App.tsx` extraction slices |
