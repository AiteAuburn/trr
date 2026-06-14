# Voice Recording Quota Contract

Purpose: define the MVP voice recording limits before subscription entitlements are fully implemented.

## MVP Limits

| Plan | Daily Voice Limit | Warning Behavior |
| --- | --- | --- |
| Trial | 5 minutes per day | Show remaining time only when remaining time is at or below 2 minutes. |
| Paid | 10 minutes per day | Show remaining time only when remaining time is at or below 2 minutes. |

Current web simulator defaults:

```text
VITE_VOICE_PLAN=trial
VITE_TRIAL_DAILY_VOICE_SECONDS=300
VITE_PAID_DAILY_VOICE_SECONDS=600
VITE_SINGLE_RECORDING_LIMIT_SECONDS=60
VITE_VOICE_QUOTA_WARNING_SECONDS=120
VITE_SILENT_AUDIO_MIN_BYTES=1024
```

## UI State Machine

```text
idle
  -> requesting_microphone
  -> recording
  -> stopping
  -> transcribing
  -> transcript_ready
  -> parse_preview
  -> confirmation
  -> saved
```

Failure states:

- microphone denied
- unsupported browser
- quota exhausted
- single-recording limit reached
- silent / nearly empty audio
- transcription failed
- parser failed

## Current Implementation

- File: `web/src/App.tsx`
- The browser simulator blocks voice start when daily quota is exhausted.
- The browser simulator tracks same-session voice seconds used today.
- The browser simulator auto-stops after `VITE_SINGLE_RECORDING_LIMIT_SECONDS`.
- The browser simulator rejects nearly silent MediaRecorder captures before STT using `VITE_SILENT_AUDIO_MIN_BYTES`.
- Voice and text still share the same parse preview path.

## Future Backend Entitlement Contract

When `T034` adds entitlements, the frontend quota state should become server-backed:

- Backend owns daily usage counters.
- Backend returns active plan and remaining voice seconds.
- Backend enforces parse/transcription limits before expensive work starts.
- Quota display and `voice_seconds=0` checks must not create usage counter rows; they report zero when no counter exists.
- For non-stream parse requests and the user-visible progress stream, backend commits voice usage only after parser success; parser failure does not consume voice seconds.
- Debug-only parser streams remain gated by debug tools and use the simpler pre-stream quota path.
- AI rate-limit accounting may still be consumed by failed parser attempts to protect backend capacity.
- Positive voice usage consumption must be atomic across backend workers; the current backend uses PostgreSQL upsert with a `used_units + requested_seconds <= limit_seconds` guard.
- Backend service code rejects negative or oversized requested voice seconds before subscription lookup, usage-counter lookup, quota upsert, parser execution, or LLM work.
- Usage-counter day windows require timezone-aware datetimes so quota periods are not derived from ambiguous local time.
- Entitlement daily-second values and stored voice usage counters are normalized to bounded service limits before quota display or decisions, and atomic upsert uses bounded existing usage so corrupt counters cannot expand quota.
- Usage increments should be idempotent for retry-safe client behavior.
- Trial / paid limits must come from entitlement configuration, not hard-coded plan names.

## Non-Goals

- No treatment advice.
- No persistent raw audio storage.
- No always-visible countdown while quota is healthy.
- No backend subscription enforcement in this task.
