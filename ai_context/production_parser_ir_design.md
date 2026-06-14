# Production Parser IR Design

Purpose: keep local LLM parsing fast, compact, validateable, and safe for health-record UX.

## Principle

The LLM does not produce database records directly.

Flow:

```text
transcript
-> local LLM compact IR
-> backend schema validation
-> backend IR mapper
-> storage-compatible preview gate
-> confirmation cards
-> sanitized DB save
```

The compact IR may contain `evidence` for confirmation/debug only. `evidence`, transcript, source text, and raw text are not stored in `records`.
Backend validation keeps compact IR bounded: per-batch `records`, `rejected`,
per-record `items`, `flags`, short text fields, and `evidence` all have hard
limits. Normalization slices oversized arrays before deeper repair or schema
validation work.

## Prompt Contract

The LLM receives a short instruction:

```text
You are a health record parser.
Convert user text into compact health-record IR.
Do not give medical advice.
Do not hallucinate missing values.
Do not guess uncertain fields.
Each record must be atomic.
If uncertain, lower confidence and add flags.
If user says did not measure, put it in rejected and do not create a record.
Output JSON only.
```

Output shape:

```json
{
  "records": [
    {
      "type": "glucose",
      "value": 110,
      "unit": "mg/dL",
      "meal_timing": "unknown",
      "time_hint": "am",
      "confidence": 0.6,
      "flags": ["approx"],
      "evidence": "早上血糖大概一百一"
    }
  ],
  "rejected": [
    {
      "type": "negative_event",
      "evidence": "中午沒量血糖"
    }
  ],
  "needs_confirmation": true
}
```

Exercise records must include the explicit activity in `items`, for example:

```json
{
  "type": "exercise",
  "items": ["走路"],
  "duration_min": 20,
  "evidence": "走路20分鐘"
}
```

`duration_min` alone is not enough because storage records require a structured
`activity` field after PHI-minimizing sanitization.

## Why Compact IR

- Lower prompt and output token cost.
- Easier for 1B to 1.5B local models.
- Backend owns timestamps, profile IDs, metadata, and database shape.
- Backend can validate and repair before UI confirmation.
- UI can stream raw IR for debug without treating it as trusted data.

## Backend Mapping

Backend maps IR into `ParsePreviewResponse`:

- `type=glucose` -> `record_type=glucose`
- `type=meal` -> `record_type=meal`
- `type=exercise` -> `record_type=exercise`
- `rejected` -> `rejected_events`

If IR schema validation fails, backend falls back to deterministic local repair and marks records:

```text
metadata_json.parser_repair = ir_schema_validation_fallback
```

Before returning confirmation candidates, backend sanitizes each candidate
payload with the same storage minimization rules used by `/records`, then
validates the sanitized payload through the record schema registry. Invalid
candidates become `rejected_events` with a generic reason instead of reaching
the save flow.

## UX Processing States

The UI must show processing state, not chain-of-thought:

- 文字已收到
- 清理文字
- 送入本地 LLM
- 切成原子事件
- Schema 驗證
- 安全與負面事件檢查
- 產生確認卡片
- 等待使用者確認

For long voice input, the UI should expose an atomic event queue:

```text
received
-> normalized
-> segments_ready(count)
-> segment_active(index, total, source_text)
-> segment_done(index, total, record_count, rejected_count)
-> validated
-> final preview
```

This lets a 3 minute transcript show which atomic event is currently being processed without exposing chain-of-thought. `source_text` is confirmation/debug display data only and must not be stored in records.

Never show hidden reasoning. Debug mode may show raw model output locally, but it must not be stored or logged.

## Storage Rule

Database records store structured facts only:

- glucose: `value`, `unit`, `meal_timing`, `context`
- meal: `meal_type`, `food_items`
- exercise: `activity`, `minutes`
- medication: `name`, `taken`

Do not store transcript, evidence, source_text, description, raw_text, or free text in `records`.
