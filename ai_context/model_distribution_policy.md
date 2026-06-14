# Model Distribution Policy

文件定位：定義糖錄錄本地模型打包、下載、啟用與更新策略。根目錄 `skills.md` 仍是最高規範。

## 1. Default Policy

v1 should use local models first and cloud AI should stay disabled.

Recommended distribution:

- Bundle the smallest usable STT model for first-run offline use.
- Download larger or better models after onboarding when the user/device is suitable.
- Keep OpenAI fallback disabled in v1.
- Never place OpenAI keys in the app.

## 2. Bundled Model

Use for:

- first-run experience
- offline baseline
- low setup friction

Requirements:

- must fit app store size strategy
- checksum verified at runtime
- version tracked in manifest
- benchmarked on 2022-ish phones

Risks:

- app size increase
- slower app updates if model changes
- app review and download friction

## 3. Downloaded Model

Use for:

- better STT accuracy
- better LLM parsing quality
- device-tier specific model selection

Requirements:

- CDN download
- checksum verification
- resumable download if possible
- encrypted app storage where practical
- user-visible storage management later

Risks:

- first-use delay
- network failures
- storage pressure on older phones

## 4. Device Tiering

Initial tiers:

- `2022_mid_android`
- `2022_mid_ios`
- `modern_android`
- `modern_ios`

Selection factors:

- RAM
- CPU/GPU capability
- OS version
- thermal behavior
- measured STT latency
- measured LLM parse latency

Target:

- local processing wait time: 5 to 10 seconds for common entries
- if device is too slow, keep manual text input available

## 5. Model Rollout

Rollout order:

1. internal test devices
2. 2022 mid-range Android benchmark
3. 2022 iPhone benchmark
4. modern Android / iPhone benchmark
5. limited beta
6. public enablement through manifest

Every model update needs:

- checksum
- version
- rollback path
- benchmark result
- parser schema compatibility check

## 6. Gemma Candidate Policy

Gemma-family models can be tested as local LLM parser candidates when they have a usable mobile deployment path.

Current candidate slot:

- `gemma-4-e2b-local-pending`

Rules:

- local test manifests may expose this option for adapter and UI testing
- production release must keep it disabled until license, official artifact, GGUF conversion, and app-store distribution constraints are checked
- benchmark against 2022-ish Android and iPhone devices before enabling
- require JSON schema / grammar constrained output compatibility
- compare against the parser golden tests before rollout

## 7. PHI / Privacy

- Raw audio is not persisted by default.
- Transcript is user health data.
- Parser output is user health data.
- Model operational metrics must not include transcript or payload.
- Crash reports must not include prompts, transcripts, audio, or generated records.
