# Generic Health Record Abstraction

## Goal

糖錄錄第一版不要為每一種健康資料都寫死專用資料表。核心資料模型先用一個 generic `records` abstraction 承接血糖、飲食、運動、用藥、生命徵象、身體量測、檢驗、生活型態與備註。

Flow:

```text
voice / text / photo
-> parser
-> action proposal
-> record abstraction
-> user confirmation
-> save
```

Parser must not directly mutate persistent data. It only returns candidate records or action proposals. The scheduler / action executor validates type, payload schema, profile permission, and confirmation state before saving.

## Canonical Record Shape

```json
{
  "profile_id": "user_123",
  "record_type": "glucose",
  "occurred_at": "2026-04-30T08:30:00Z",
  "source": "voice",
  "payload_json": {},
  "metadata_json": {}
}
```

Rules:

- `record_type` decides the health event type.
- `payload_json` stores health data details for that type.
- `metadata_json` stores parser provenance and non-primary operational metadata.
- `occurred_at` means when the health event happened.
- `created_at` / `updated_at` mean when the app saved or changed the record.

## MVP Record Types

- `glucose`
- `meal`
- `exercise`
- `medication`
- `vital`
- `body_measurement`
- `lab_result`
- `lifestyle`
- `note`

## Payload Examples

Glucose:

```json
{
  "record_type": "glucose",
  "payload_json": {
    "value": 138,
    "unit": "mg/dL",
    "meal_timing": "after_meal",
    "context": "breakfast"
  }
}
```

Meal:

```json
{
  "record_type": "meal",
  "payload_json": {
    "meal_type": "breakfast",
    "food_items": [
      {
        "name": "白飯",
        "amount": "1 bowl"
      }
    ],
    "description": "早餐吃白飯一碗"
  }
}
```

Vital:

```json
{
  "record_type": "vital",
  "payload_json": {
    "kind": "blood_pressure",
    "systolic": 128,
    "diastolic": 82,
    "unit": "mmHg"
  }
}
```

Body measurement:

```json
{
  "record_type": "body_measurement",
  "payload_json": {
    "kind": "weight",
    "value": 72.5,
    "unit": "kg"
  }
}
```

## Parser Output Contract

Parser preview returns candidate records only:

```json
{
  "records": [
    {
      "profile_id": "profile_123",
      "record_type": "glucose",
      "occurred_at": "2026-04-30T08:30:00Z",
      "payload_json": {
        "value": 138,
        "unit": "mg/dL"
      },
      "metadata_json": {
        "source_text": "今天早餐後血糖 138",
        "time_hint": "morning",
        "transcript": "今天早餐後血糖 138",
        "stt_model_id": "browser-web-speech",
        "parser_model_id": "local-llm-schema-stub"
      },
      "source": "ai_parse_preview",
      "confidence": 0.82,
      "decision_trace": "偵測到血糖情境與數值，建立 glucose 候選紀錄。",
      "needs_confirmation": true
    }
  ]
}
```

Command proposal returns executable proposals, not DB writes:

```json
{
  "intent": "CREATE_RECORD",
  "action": "create_record_candidates",
  "actions": [
    {
      "action_type": "create_record",
      "record_type": "glucose",
      "payload": {
        "value": 138,
        "unit": "mg/dL"
      },
      "metadata_json": {
        "source_text": "今天早餐後血糖 138",
        "time_hint": "morning",
        "stt_model_id": "browser-web-speech",
        "parser_model_id": "local-llm-schema-stub"
      }
    }
  ],
  "requires_confirmation": true
}
```

## Scheduler Responsibilities

The scheduler / action executor must:

- validate `record_type`
- validate `payload_json` by schema
- check profile ownership and access control
- require user confirmation for all write actions
- write to `records` only after confirmation
- write audit events without PHI payloads
- display `metadata_json.source_text` so users can compare each record with the original phrase

## Database Policy

MVP table:

```text
records
- id
- profile_id
- record_type
- occurred_at
- source
- payload_json
- metadata_json
- created_at
- updated_at
- deleted_at
```

Future split-table policy:

- Keep generic `records` as the source of truth until a type has proven high query volume or strict reporting needs.
- Add dedicated read-optimized tables only for hot paths such as glucose trend charts, medication adherence, or hospital-grade reports.
- Dedicated tables must be derived from or synchronized with the generic record event to avoid early schema lock-in.
- Use soft delete for user deletes so sync, audit, restore, and conflict resolution can reason about deleted records without losing history immediately.
