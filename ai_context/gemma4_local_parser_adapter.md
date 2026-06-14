# Gemma 4 Local Parser Adapter

## Current Status

`gemma-4-e2b-local-pending` is now wired as a real local parser adapter slot.

It no longer silently falls back to the deterministic stub. When selected, backend calls `GEMMA4_PARSER_URL`.

If `GEMMA4_PARSER_URL` is not configured, `/ai/parse-preview` returns `503` so local testing does not accidentally pretend it is running Gemma.

## Expected Endpoint

The endpoint must be OpenAI-compatible chat completions:

```text
POST /v1/chat/completions
```

Example environment:

```bash
GEMMA4_PARSER_URL=http://host.docker.internal:11434/v1/chat/completions
GEMMA4_MODEL_ID=gemma-4-e2b-local-pending
GEMMA4_TIMEOUT_SECONDS=60
```

The endpoint must return either:

```json
{
  "choices": [
    {
      "message": {
        "content": "{...valid parse-preview JSON...}"
      }
    }
  ]
}
```

or:

```json
{
  "content": "{...valid parse-preview JSON...}"
}
```

## Required Model Output

Gemma must return one JSON object with:

- `transcript`
- `normalized_text`
- `stt_model_id`
- `llm_model_id`
- `segments`
- `records`
- `rejected_events`

Rules:

- Each segment must contain exactly one atomic event.
- Do not group meal + glucose + exercise into one segment.
- Event modifiers stay with their event.
- Negative measurement events must become `rejected_events`.
- Negative measurement events must not create glucose records.
- All write candidates must still require user confirmation.

## Runtime Behavior

Backend flow:

```text
selected llm_model_id == gemma-4-e2b-local-pending
-> require GEMMA4_PARSER_URL
-> send OpenAI-compatible chat completion request
-> parse JSON content
-> validate with ParsePreviewResponse schema
-> return to UI
```

If the model returns malformed JSON or wrong schema, backend returns `502`.

If the endpoint is missing, backend returns `503`.
