# Transcript Processing Pipeline

## Decision

糖錄錄 v1 should not send raw transcript directly into a single flat record parser.

The product contract is:

```text
raw transcript
-> normalized_text
-> segments[]
-> record_candidates[]
-> rejected_events[]
-> code validation
-> confidence / safety gates
-> user confirmation
-> DB save
```

Implementation note: v1 should keep this as one local LLM call when real local LLM is wired. The schema exposes multiple layers, but the app should avoid multiple sequential LLM calls on mobile unless benchmarks prove the latency is acceptable.

## Response Shape

```json
{
  "transcript": "raw transcript from STT",
  "normalized_text": "cleaned transcript",
  "segments": [
    {
      "segment_id": "seg_001",
      "segment_type": "measurement",
      "source_text": "早上量血糖好像是 110 左右，忘記是不是空腹",
      "normalized_text": "早上血糖約 110，餐別不確定",
      "time_hint": "morning",
      "certainty": "uncertain",
      "is_negative_event": false,
      "confidence": 0.55
    }
  ],
  "records": [
    {
      "profile_id": "uuid",
      "record_type": "glucose",
      "occurred_at": "2026-04-30T08:00:00Z",
      "payload_json": {
        "value": 110,
        "unit": "mg/dL",
        "meal_timing": "unknown"
      },
      "metadata_json": {
        "source_text": "早上量血糖好像是 110 左右，忘記是不是空腹",
        "time_hint": "morning"
      },
      "source": "ai_parse_preview",
      "confidence": 0.56,
      "decision_trace": "偵測到血糖情境與數值，建立 glucose 候選紀錄。",
      "needs_confirmation": true
    }
  ],
  "rejected_events": [
    {
      "segment_id": "seg_003",
      "source_text": "中午沒量血糖",
      "reason": "negative measurement event",
      "time_hint": "noon"
    }
  ]
}
```

## Responsibilities

LLM or local parser adapter:

- normalize transcript without inventing facts
- split transcript into atomic segments
- each segment must contain only one atomic event
- do not group multiple actions such as meal + glucose + exercise into one segment
- modifiers for the same event stay with that event, for example "忘記是不是空腹" belongs to the same glucose segment and "大概 20 分鐘" belongs to the same exercise segment
- identify negative events
- produce record candidates
- attach short `decision_trace`

Code:

- validate JSON schema
- validate `record_type`
- validate `payload_json`
- hard block negative measurement events from becoming records
- apply confidence threshold
- avoid logging PHI

UI:

- show raw transcript
- show normalized text
- show segment table
- show rejected events
- show final confirmation cards

DB:

- save only user-confirmed records
- do not save raw audio by default
- treat transcript and source text as PHI

## Testing

Golden tests should verify semantics, not exact output equality.

Required checks:

- `segments` is an array
- `records` is an array
- `rejected_events` is an array
- count by `record_type`
- key values extracted
- uncertain facts stay uncertain
- negative events are rejected and not converted into records
