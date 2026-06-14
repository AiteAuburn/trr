# No PHI Logging Convention

文件定位：本文件定義糖錄錄的 no-PHI logging convention。通用規範以根目錄 `skills.md` 為準。

## 原則

- 所有健康資料預設視為 sensitive health data。
- application log、debug log、CI log、error report、analytics event 不可包含 PHI。
- audit log 可記錄誰在何時對哪個 resource 做了什麼，但 metadata 不可包含原始健康內容。
- 若需要排查問題，只記錄 resource id、record type、狀態碼、錯誤類型、latency、版本號與匿名統計。

## 禁止寫入一般 log

- blood glucose value
- voice transcript
- food photo or OCR content
- meal detail
- medication name or dosage
- medical note
- report content
- LLM prompt / output containing health data
- token、password、API key、DB password、OpenAI key

## 允許寫入一般 log

- request id
- route pattern
- HTTP status code
- latency
- deployment version
- non-PHI error code
- feature flag state
- anonymous model latency or failure count

## 實作規則

- 使用 `app.core.redaction.redact_sensitive_data` 處理可能進入 log 或 audit metadata 的資料。
- API handler 不可直接 log request body。
- AI parser 不可 log raw transcript、raw prompt、raw model output。
- CI test output 不可印出真實健康資料。
- staging 不可使用 production health data。
- `records` 落庫只保存結構化資料，不保存 transcript、source_text、description、raw_text 等原始文字。
- `payload_json` / `metadata_json` 必須先通過深度、節點數、字串長度上限，再進 sanitizer、schema validation 或 DB write。
- UI 可在確認流程短暫顯示 transcript / segment source_text，但確認儲存後不應把原始文字寫入 record payload 或 metadata。

## Audit Log 規則

Audit log 可以記錄：

- actor_account_id
- profile_id
- action
- resource_type
- resource_id
- created_at
- non-PHI metadata

Audit log 不可記錄：

- `payload_json`
- transcript
- glucose value
- food details
- medication details
- report body
