# Local Model Adapter Contract

文件定位：定義糖錄錄後續接入本地 STT 與本地 LLM 的穩定介面。根目錄 `skills.md` 仍是最高規範。

## 1. Goal

第一版產品目標是 local-first：

```text
audio -> local STT -> transcript -> local LLM -> structured record previews -> user confirm -> save
```

目前 web simulator 已先建立相同 API contract：

- `GET /ai/models`
- `POST /ai/parse-preview`

未來 mobile 接入 whisper.rn / llama.rn 時，應保持同一個資料形狀，不改 record confirmation 與 save flow。

## 2. STT Adapter

### Input

```json
{
  "audio_uri": "local app sandbox uri",
  "language": "zh-TW",
  "model_id": "local-whisper-tiny-q5",
  "max_duration_seconds": 60,
  "profile_id": "uuid"
}
```

### Output

```json
{
  "transcript": "今天早上空腹血糖 138，早餐吃蛋餅",
  "model_id": "local-whisper-tiny-q5",
  "language": "zh-TW",
  "duration_ms": 4200,
  "confidence": 0.78,
  "segments": []
}
```

### Rules

- Raw audio is not persisted by default.
- Do not send audio to cloud in v1.
- Do not log transcript.
- Return transcript to the confirmation flow before parsing.
- If confidence is low, ask user to edit transcript before parse.

## 3. LLM Parser Adapter

### Input

```json
{
  "profile_id": "uuid",
  "transcript": "今天早上空腹血糖 138，早餐吃蛋餅",
  "occurred_at": "2026-04-30T08:00:00Z",
  "timezone": "Asia/Taipei",
  "language": "zh-TW",
  "model_id": "local-llm-schema-q4",
  "schema_version": "record-preview-v1"
}
```

### Output

```json
{
  "records": [
    {
      "profile_id": "uuid",
      "record_type": "glucose",
      "occurred_at": "2026-04-30T08:00:00Z",
      "payload_json": {
        "value": 138,
        "unit": "mg/dL",
        "meal_timing": "fasting"
      },
      "metadata_json": {
        "source_text": "今天早上空腹血糖 138",
        "time_hint": "morning",
        "stt_model_id": "local-whisper-tiny",
        "parser_model_id": "local-llm-schema-q4"
      },
      "source": "local_llm",
      "confidence": 0.82,
      "decision_trace": "偵測到空腹與血糖數值，建立 glucose 候選紀錄。",
      "needs_confirmation": true
    }
  ]
}
```

### Rules

- Use JSON schema or grammar constrained output.
- Do not request, show, or store full chain-of-thought.
- `decision_trace` must be short and auditable.
- Every record must include `profile_id`.
- Every record must require user confirmation before save.
- Do not provide diagnosis, medication adjustment, insulin dosing, or personalized medical treatment.

## 4. Model Selection

Model selection must be explicit:

- User/dev can see selected STT model.
- User/dev can see selected LLM parser model.
- Disabled models are visible as unavailable only if useful for roadmap clarity.
- OpenAI fallback remains disabled in v1.

## 5. Error Handling

STT errors:

- `audio_too_long`
- `no_speech_detected`
- `model_not_available`
- `device_too_slow`
- `transcription_failed`

LLM errors:

- `model_not_available`
- `schema_validation_failed`
- `low_confidence`
- `parse_failed`

User flow:

- Never save automatically after failure.
- Show editable transcript or manual input fallback.
- Let user retry with a different available model when supported.

## 6. Mobile Integration Notes

React Native + Expo Prebuild:

- STT adapter wraps whisper.rn.
- LLM adapter wraps llama.rn.
- Model files are app assets or downloaded into app-controlled storage.
- Model checksum must be verified before use.
- Device capability decides which models are available.
- Local encrypted SQLite remains source of truth before sync.

## 7. PHI Rules

- Audio, transcript, parser prompt, parser output, and record payload are sensitive health data.
- Do not write them to general logs.
- Do not upload them to analytics or crash reports.
- Do not send them to non-compliant APIs.
- Audit logs store metadata only, not payloads.
