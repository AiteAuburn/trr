# AI 解析流程與模型

文件定位：transcript → 候選紀錄的解析流程、模型選擇與限制（取代 transcript_processing_pipeline、production_parser_ir_design、local_model_adapter_contract、local_model_playbook、ollama_local_parser_models、gemma4_local_parser_adapter、model_distribution_policy、MOBILE_NATIVE_AI_SPIKE、efficiency_cost_strategy 的 AI 部分）。規則以 `skills.md` 為準。主要程式：`backend/app/services/ai_pipeline.py`、`backend/app/api/ai.py`、`backend/app/schemas/ai.py`。

## 1. 現況一句話

App 把文字 transcript 送到後端；後端預設把**分段後的逐字稿**送 DeepSeek（雲端）產生 compact IR，再由後端驗證、對回完整候選紀錄，交給使用者確認。這取代了舊的「本地優先」目標。依 2026-11-05 決定（`PRODUCT_ROADMAP.md` D1），App 內不設 AI 同意步驟，使用者介面也不顯示供應商名稱：`/ai/models` 的 `deepseek-chat` 選項標籤是「AI 智慧整理」，說明文字與錯誤 hint（`server_parser_not_configured`）都不含廠商名。模型 id 維持 `deepseek-chat`，以相容已安裝的 APK。

## 2. 端點

| 端點 | 用途 |
|---|---|
| `GET /ai/models` | 列出 STT 與 LLM 選項及是否可用 |
| `POST /ai/parse-preview` | 一般解析；App 使用這個 |
| `POST /ai/parse-preview/progress-stream` | NDJSON 進度串流（web 模擬器使用） |
| `POST /ai/parse-preview/debug-stream` | 只在 `ENABLE_DEBUG_TOOLS=true` 時可用，只支援 Ollama，會串流 raw model 內容 |
| `POST /ai/command-proposal` | 關鍵字式語音指令提案，不呼叫 LLM（見 `VOICE_INPUT.md`） |

Request 主要欄位：`profile_id`、`transcript`（最多 4000 字）、`stt_model_id`、`llm_model_id`、`occurred_at`、`voice_seconds`。

`/ai/parse-preview` 處理順序：驗 STT 模型 → `occurred_at` → 複雜度上限 → LLM 模型 → profile 權限 → `ai_parse` rate limit → 語音額度 → 解析。失敗時 rollback（不扣語音秒數），回 503 `local_parser_unavailable` 或 502 `local_parser_failed`。每次都寫一筆 `ai_parse_audits`。

## 3. 流程

```text
transcript
 -> normalize
 -> 切成原子 segment（量測、飲食、運動、用藥、vital、身體量測、檢驗、生活、備註、negative_event、unknown）
 -> 複雜度與密度檢查
 -> 每批最多 10 segment 送 LLM，輸出 compact IR
 -> 後端對回完整 record（record_type、occurred_at、payload_json、metadata_json、source、confidence、decision_trace、needs_confirmation=true）
 -> record_validation / schema registry 驗證
 -> preview（segments、records、rejected_events）
 -> 使用者確認 -> POST /daily-records/save
```

進度串流事件：`received`、`normalized`、`segments_ready`、`llm_batch_active`、`llm_fallback`（選用）、`llm_batch_done`、`segment_active`、`segment_done`、`validated`、`final`。語音秒數只在 `final` 才扣。

### Compact IR（模型輸出）

- 頂層：`records`、`rejected`、`needs_confirmation`（後端強制為 true）。
- record：`type`（glucose / meal / exercise / medication / note）、`segment_id`、`value`、`unit`、`meal_timing`（fasting / before_meal / after_meal / bedtime / unknown）、`time_hint`（am / noon / pm / eve / night / unknown）、`items`、`duration_min`、`confidence`、`flags`、`evidence`。
- rejected：`type="negative_event"`、`segment_id`、`evidence`。
- 只輸出 JSON。DeepSeek request 使用 `response_format: json_object`、temperature 0、關閉 thinking。

### decision_trace

後端產生的固定短字串（例如「LLM IR extracted glucose measurement.」），最多 240 字，不是模型輸出，也不保存 chain-of-thought。

### 確定性規則（後端）

- 否定事件（例如「沒量血糖」）進 `rejected_events`，不建立紀錄。
- 「不確定是不是空腹」等語句降低確定性，要使用者確認。
- 解析失敗不靠規則系統硬補；`LOCAL_LLM_REPAIR_FALLBACK_ENABLED` 預設 false。

## 4. 模型

| `llm_model_id` | Runtime | 何時可用 |
|---|---|---|
| `deepseek-chat` | server_api（雲端） | 設定 `DEEPSEEK_PARSER_URL` 與 `DEEPSEEK_API_KEY`；request 預設值 |
| `local-llm-schema-stub`、`local-llm-careful-stub` | server_stub | 永遠可用（確定性 parser，測試用） |
| `gemma-4-e2b-local-pending` | local | 設定 `GEMMA4_PARSER_URL`（OpenAI 相容 chat completions） |
| `ollama-qwen2.5-1.5b`、`ollama-gemma3-1b`、`ollama-llama3.2-1b` | local | Ollama `/api/tags` 有對應模型（快取 15 秒） |
| `openai-fallback-disabled` | cloud_disabled | 永不可用；repo 沒有 OpenAI 整合 |

STT id（只是標記）：`browser-web-speech`（預設）、`local-whisper-tiny-placeholder`、`web-transformers-whisper-tiny`。App 送出的 `stt_model_id` 不代表實際用了手機辨識或 Whisper。

DeepSeek：

- `DEEPSEEK_MODEL_ID` 是上游模型名稱（config 預設 `deepseek-chat`；`.env.example` 與 Lightsail 用 `deepseek-v4-flash`）。
- Prompt 來自 `DEEPSEEK_SYSTEM_PROMPT`、`DEEPSEEK_ANALYSIS_ADDENDUM`（env 有值優先，否則用程式常數），只用在 `deepseek-chat`。
- 送出的內容是 segment 文字行（每段截到 160 字、每批總共 1600 字），仍是使用者的原話。
- 只記錄 DeepSeek / Gemma4 的 token 用量（`ai_token_usage_daily`）。

本機開發用 Ollama：`docker compose up -d ollama`，再 `make qwen25` / `make gemma3` / `make llama32` 拉模型。模型 id 由 `OLLAMA_QWEN25_MODEL_ID`（`qwen2.5:1.5b`）、`OLLAMA_GEMMA3_MODEL_ID`（`gemma3:1b`）、`OLLAMA_LLAMA32_MODEL_ID`（`llama3.2:1b`）設定。

## 5. 上限（成本與記憶體）

| 常數 / 設定 | 值 |
|---|---|
| `LOCAL_LLM_MAX_TOKENS`（設定，1–960） | 960 |
| 每批 token | min(設定, 960, 240 + (segment 數 − 1) × 120) |
| `LOCAL_LLM_SEGMENT_BATCH_SIZE` | 10 |
| `LOCAL_LLM_PROMPT_SEGMENT_CHAR_LIMIT` / `..._SEGMENTS_CHAR_BUDGET` | 160 / 1600 |
| `LOCAL_LLM_RESPONSE_CHAR_BUDGET` | 12000 |
| `LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS` | 30（超過回 400 `transcript_too_complex`） |
| `LOCAL_LLM_MAX_TRANSCRIPT_NUMERIC_VALUES` | 90（超過回 400 `transcript_too_dense`） |
| `MAX_PARSE_PREVIEW_RECORDS` | 90 |
| `LOCAL_LLM_TIMEOUT_SECONDS` | 120 |
| `ai_parse` rate limit | 每帳號 120 次 / 60 秒 |

`scripts/verify_backend_ai_cost_boundaries.py` 守住這些值；改上限要同步改腳本並說明理由。

## 6. 手機端本地模型

| 模型 | 用途 | 狀態 |
|---|---|---|
| Whisper `ggml-base-q5_1.bin`（約 57 MiB，Hugging Face 固定 commit，檢查檔案大小 50–65 MiB） | 錄音後在本機重轉文字 | 使用者在設定「離線語音辨識」下載後才會用；只在 Android 13+（有暫存音檔）生效 |
| `llama.rn` GGUF | 本機解析 | 只在 debug tools 的測試／benchmark 區塊，不在主流程 |
| `mobile/whisperPcmCapture.ts`（PCM 直送 Whisper） | 實驗路徑 | 主流程未使用，只有測試與 native config 驗證 |

模型檔不進 git。下載沒有 checksum 驗證（只檢查大小）；正式分發若要用本地模型，需要 manifest、checksum、裝置分級與回滾策略。

## 7. 保存與 PHI

- `records.payload_json` / `metadata_json` 只存結構化欄位，不存 transcript、evidence、source_text。
- **目前違反**：`ai_parse_audits.transcript_text` 保存原始逐字稿（前 4000 字）且無期限，`GET /admin/users/{id}` 看得到；`daily_records.transcript_entries_json` 也保存原文。見 `PRODUCTION_READINESS.md`。
- 不 log transcript、prompt、model output。debug stream 的 raw 內容不可保存。

## 8. 測試

- 解析 fixture：`backend/tests/parser_cases/`。
- 測試環境由 `backend/tests/conftest.py` 清掉 DeepSeek / Gemma 設定並關閉 repair fallback，測試不會打真實雲端模型。
