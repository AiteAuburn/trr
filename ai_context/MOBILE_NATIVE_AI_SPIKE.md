# Mobile Native AI Spike

Purpose: document the dev-client spike for local mobile STT and local mobile LLM parsing.

## Dev Client Setup

Expo Go cannot load `whisper.rn` or `llama.rn`. Use:

```bash
cd mobile
npm run prebuild
npm run ios
npm run start:dev
```

The native panel is hidden unless:

```text
EXPO_PUBLIC_ENABLE_DEBUG_TOOLS=true
```

## Implemented Spike Surface

Files:

- `mobile/nativeLocalModels.ts`
- `mobile/modelStorage.ts`
- `mobile/App.tsx`

Implemented:

- native module availability check for `whisper.rn` and `llama.rn`
- `whisper.rn` transcription wrapper
- `llama.rn` JSON-schema completion wrapper
- benchmark wrappers for Whisper and Llama duration/output size
- app debug button to run local benchmarks from the dev-client panel
- model download into Expo document storage
- safe filename handling
- file size inspection
- MD5 checksum validation proof through Expo FileSystem metadata

## Benchmark Evidence To Capture

For every candidate device:

- device model and OS version
- app build type
- model file name and size
- checksum
- Whisper transcription duration
- Llama JSON parse duration
- output character count
- success/failure
- crash, thermal, memory, and battery notes

## Production Gaps

- Production model distribution still needs SHA-256 or signed manifest verification.
- MD5 is only the Expo FileSystem spike proof available without adding a crypto dependency.
- Model URLs must come from an allowlisted manifest before production.
- Model files must not be committed.
- Benchmarks must include 2022-ish Android and iPhone devices before enabling this for users.
