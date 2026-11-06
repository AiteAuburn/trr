# Voice Input, Quota, and Voice Commands

Purpose: how voice recording works in the mobile app and web simulator, how voice quota is enforced, and how voice command proposals work. This replaces voice_command_interface, VOICE_COMMAND_EXECUTION_POLICY, and VOICE_RECORDING_QUOTA_CONTRACT. Screen-level UI rules live in `UI_UX_SPEC.md`.

## 1. Mobile recording flow (voice-first redesign, 2026-11)

```text
Home (big mic)
 -> tap: start  (blocked if remaining daily quota <= 0)
 -> live transcript, timer, 取消
 -> tap again, 3 s of silence after first speech, recognizer end, or limit reached: stop
 -> transcribe (Whisper second pass if available, else phone transcript)
 -> straight to POST /ai/parse-preview (loading view has 取消)
 -> aiReview: single confirm page ("整理成 N 筆，對嗎？"; edit / remove per card; 改文字; 重新說一次)
 -> 存起來（N 筆） -> POST /daily-records/save
 -> saveSuccess: 存好了 / 今天一共 N 筆紀錄 / 再說一筆 / 看今天的紀錄
```

| Rule | Value | Source |
|---|---|---|
| Start / stop | tap to start, tap again to stop | `mobile/App.tsx` (`toggleRecordingPreview`) |
| Silence auto-stop | 3 s without a new transcript event, counted only after the first speech | `recordingSilenceAutoStopMs = 3000` in `App.tsx` |
| Single recording cap | 60 s, or the remaining daily quota if lower | `mobileSingleRecordingLimitSeconds` in `subscriptionTransforms.ts` |
| Too short | recordings of 1 s or less are discarded | `App.tsx` |
| Recognizer stop timeout | 8 s | `phoneSpeechCapture.ts` |
| Parse cancel | ignores the late response and keeps the text; the HTTP request is not aborted | `cancelParserPreview` in `App.tsx` |
| Today timeline | second home view: summary stats plus today's records | `todayTimeline.tsx`, `todayTimelineTransforms.ts` |

If a parse preflight check fails, the user stays on the transcript page with the reason. Nothing is saved until the user taps save. Manual entry uses `POST /records`.

## 2. Speech-to-text

| Engine | When | Privacy |
|---|---|---|
| Phone system recognizer, via `expo-speech-recognition` (`mobile/phoneSpeechCapture.ts`) | Always; gives live text | `lang: "zh-TW"`. On-device when the phone can (`canRecognizeOnDevice`): iOS whenever the recognizer supports it; Android 13+ only when the Taiwan Mandarin offline pack is installed (Android 14+ requests the pack download once in the background). Otherwise the phone's normal recognizer, which may use the cloud (free, no app cost). |
| Whisper via `whisper.rn` (`nativeLocalModels.ts`) | Only if the user downloaded the Whisper model **and** the recognizer saved an audio file (`recordingOptions.persist`, Android 13 / API 33+) | On-device. Runs on the saved file as a second pass. |

Fallback order: Whisper on the saved file, then the phone transcript if Whisper fails or returns empty, then an "empty" message. The temporary audio file is deleted in every case. Raw audio is never uploaded or kept.

Web simulator (`web/src/App.tsx`): Browser Web Speech, or MediaRecorder plus in-browser Whisper (`transformersSpeech.ts`). It is not the product path.

Decided (`PRODUCT_ROADMAP.md` D3, 2026-11-06): on-device first, the normal recognizer only on phones that cannot recognize on-device.

## 3. Voice quota

| Item | Value |
|---|---|
| Entitlement key | `voice.daily_seconds` (`plan_entitlements.value_json.seconds`) |
| Defaults | `trial` 300 s/day, `annual` 600 s/day (seeded by `ensure_default_plans`) |
| Counter | `usage_counters`, key `voice.seconds`, UTC day window |
| Read | `GET /subscriptions/voice-quota` (plan, status, trial dates, limit, used, remaining) |
| Enforced on | `/ai/parse-preview`, progress stream, debug stream, `/ai/command-proposal` |
| Over limit | 429 `voice_quota_exceeded` |

Behavior:

- `voice_seconds` is **reported by the client** (0–3600). The server does not measure audio. `0` means text input and skips consumption. Open decision D5.
- Mobile sends elapsed seconds (rounded up, clamped to the limit). Editing the text resets it to 0.
- Consumption is an atomic Postgres upsert guarded by `used + requested <= limit`.
- Non-stream parse and the progress stream only consume seconds after the parser succeeds. Rate-limit counters still count failed attempts.
- Quota display and `voice_seconds = 0` checks do not create counter rows.
- Limits come from entitlements, not plan-name branches.

Web simulator only: `VITE_VOICE_PLAN`, `VITE_TRIAL_DAILY_VOICE_SECONDS`, `VITE_PAID_DAILY_VOICE_SECONDS`, `VITE_SINGLE_RECORDING_LIMIT_SECONDS`, `VITE_VOICE_QUOTA_WARNING_SECONDS`, `VITE_SILENT_AUDIO_MIN_BYTES`.

Not done: idempotency keys for usage increments, per-account time zone for the daily window.

## 4. Voice command proposals

`POST /ai/command-proposal` is keyword-based and calls no LLM. It returns a proposal only and never writes data. Only the web simulator calls it today; the mobile app does not.

Intents (`CommandIntent` in `backend/app/schemas/ai.py`): `NAVIGATE`, `CREATE_RECORD`, `QUERY_DATA`, `GENERATE_REPORT`, `SWITCH_PROFILE`, `SET_REMINDER`, `UNKNOWN`.

| Intent | Client behavior |
|---|---|
| `NAVIGATE` | Only known safe routes (`home`, `today`, `history`, `trend` / `report` → Basic Analysis) |
| `GENERATE_REPORT` | Opens Basic Analysis with the requested range |
| `CREATE_RECORD` | Candidate records with `requires_confirmation = true`; saving still needs the normal confirm step |
| `QUERY_DATA` | Placeholder that opens History |
| Others / unknown | Status message only, no action |

Audit: client-only navigation writes no audit event. Reports write `report.basic_viewed`, and saves write `record.created`. Any future `voice_command.executed` event may hold intent, action, and target only, never transcript or command text.
