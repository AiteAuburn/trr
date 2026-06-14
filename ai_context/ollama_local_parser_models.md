# Ollama Local Parser Models

Purpose: local desktop benchmark path for small LLM parsers before mobile `llama.rn` integration.

The first practical model to try is:

- UI model id: `ollama-qwen2.5-1.5b`
- Ollama model id: `qwen2.5:1.5b`
- Reason: best first candidate among the current 1B to 1.5B options for Chinese / mixed Chinese-English structured parsing.

Alternative benchmark models:

- UI model id: `ollama-gemma3-1b`
- Ollama model id: `gemma3:1b`
- UI model id: `ollama-llama3.2-1b`
- Ollama model id: `llama3.2:1b`

## Run Locally

Start Ollama:

```bash
docker compose up -d ollama
```

Pull the recommended first model:

```bash
docker compose exec ollama ollama pull qwen2.5:1.5b
```

Or use the Makefile shortcut:

```bash
make qwen25
```

Then run the app:

```bash
docker compose up -d backend web
```

Open the web simulator and choose:

- STT: `Browser Web Speech` or `Web Transformers Whisper Tiny`
- LLM: `Ollama Qwen2.5 1.5B`

## Backend Contract

The backend calls Ollama through the OpenAI-compatible endpoint:

```text
http://ollama:11434/v1/chat/completions
```

Environment variables:

```text
LOCAL_LLM_PARSER_URL=http://ollama:11434/v1/chat/completions
OLLAMA_QWEN25_MODEL_ID=qwen2.5:1.5b
OLLAMA_GEMMA3_MODEL_ID=gemma3:1b
OLLAMA_LLAMA32_MODEL_ID=llama3.2:1b
```

The model should return compact parser IR, not full database records.

See `ai_context/production_parser_ir_design.md`.

Important parser rules:

- Each segment contains only one atomic event.
- The parser must not group meal, glucose, exercise, and medication into one segment.
- Negative events such as "沒量血糖" must go to `rejected_events`, not `records`.
- Uncertain medical context must stay uncertain. Do not invent fasting / meal timing.
- All write actions still require user confirmation before saving.

## Schema Repair

Small local models may return JSON with invalid field names, invalid enum values, missing records, or grouped events.

The backend validates model output against the compact IR schema. It then maps IR into `ParsePreviewResponse` for confirmation cards.

If validation fails, the current local adapter returns a deterministic repair fallback instead of crashing. Repaired records include:

```text
metadata_json.parser_repair = ir_schema_validation_fallback
```

This keeps the UI usable while preserving the fact that the selected local model did not directly satisfy the schema.

## Production Notes

This Docker/Ollama path is for local benchmarking only.

Production mobile still needs:

- GGUF/mobile-compatible artifact decision.
- license review.
- checksum and model manifest update.
- `llama.rn` integration.
- 2022-era phone latency, memory, battery, and thermal benchmarks.
- grammar or schema-constrained JSON output if supported.
