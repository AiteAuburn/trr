# 糖錄錄效率與雲端成本策略

## 1. 這類產品是否需要效率

需要，而且效率是核心競爭力之一。

糖錄錄的效率分成五種：

- 使用者操作效率
- 本地推論效率
- 電量與裝置效率
- 同步與資料效率
- 雲端成本效率

如果效率不好，會直接影響：

- 中老年使用者是否願意每天用。
- 2022 左右手機是否跑得動。
- 本地模型是否造成耗電與發熱。
- 試用期與家庭方案是否賠錢。
- 長期 retention 是否能成立。

## 2. 使用者操作效率

最大原則：

```text
能自動就自動
能拍照就拍照
能語音就語音
手動只做兜底
```

產品上要追求：

- 開 App 後 3 秒內知道怎麼記錄。
- 一次語音能拆成多筆紀錄。
- 儲存前只做必要確認。
- 不讓使用者先選分類。
- 不要求使用者理解資料模型。
- 常用動作不超過 1 到 2 次點擊。

衡量指標：

- time_to_first_record
- record_completion_rate
- correction_rate
- daily_active_recorders
- 7_day_retention
- 30_day_retention

## 3. 本地推論效率

第一版必須一般紀錄本地完成，而且不要假設有「簡單句」可以跳過 LLM。使用者輸入通常會混合日期、血糖、飲食、修正語、生活型態與備註，所以第一版主流程統一走本地 STT + 本地 LLM。

流程：

```text
audio
-> VAD trim
-> local STT
-> local LLM
-> schema validation
-> normalization rules
-> user confirm
```

節省本地推論的方法：

- LLM output token 限制很小。
- LLM output token 上限依 transcript segment count 動態縮放；短輸入使用較小 cap，大批次仍受 hard max 限制。
- `LOCAL_LLM_MAX_TOKENS` 設定上限必須小於等於實際 batch hard cap 960，避免部署誤設成高成本輸出。
- `python scripts/verify_backend_ai_cost_boundaries.py` 必須作為 backend gate，檢查 local LLM hard cap、dynamic token formula、v1 cloud fallback disabled，以及 repair fallback 只走 deterministic parser repair、不可再呼叫第二輪 LLM。
- Local parser response content is hard-capped before JSON extraction/parsing, so abnormal model output cannot create unbounded memory work and failure messages omit PHI.
- Compact IR arrays and short text fields are bounded, and normalization slices oversized model arrays before deeper repair/validation work.
- Deterministic parser preview output is capped by total candidate records and per-meal food item count before confirmation or command-proposal response construction.
- Prompt segment text stays bounded, but long segments preserve both beginning and ending context so late glucose values or correction phrases are less likely to be truncated away.
- 使用 JSON schema / grammar 限制輸出。
- 依裝置能力選模型。
- 規則只用於欄位正規化、schema validation、防錯與 confidence 檢查，不作為跳過 LLM 的主要策略。
- 只把必要上下文送進 LLM，不塞完整歷史。
- 無效 STT model ID 必須先用靜態清單拒絕，不進入 transcript segmentation / complexity counting。
- Blank AI transcripts are rejected at the request-schema boundary before route-level profile lookup, quota work, parser execution, or LLM work.
- 明顯超過 transcript complexity budget 的 request 必須在 LLM model availability lookup、quota consumption、parser execution 前拒絕。
- Complexity budget checks stop counting after `max_segments + 1`, so clearly over-budget transcripts are rejected without constructing every possible segment.
- Numeric-density budget checks stop counting after `max_numeric_values + 1`, so transcripts with too many candidate numeric values are rejected before model availability lookup, profile lookup, quota work, parser execution, or LLM work.
- Unknown or statically disabled LLM model IDs must be rejected from the static model list before runtime model availability lookup.
- Statically available non-runtime LLM models, such as the local schema stub, must not call Ollama availability checks.
- AI parse requests with clearly future `occurred_at` values must be rejected before profile ownership lookup, quota consumption, parser execution, or LLM work.
- AI parse endpoints run static STT validation, transcript complexity checks, and LLM model selection checks before profile ownership lookup, quota consumption, or parser execution.
- 非 streaming parse 與使用者可見的 progress stream，voice quota 只在 parser 成功後 commit；parser failure 不消耗使用者秒數。
- 可對固定欄位使用小詞典輔助，例如餐別、日期詞、單位、常見運動，但最終仍由本地 LLM 產生結構化結果。
- 本地處理目標等待時間為 5 到 10 秒。

本地 benchmark 指標：

- STT latency
- parse latency
- total local processing latency, target 5 to 10 seconds
- battery drain
- memory usage
- crash rate
- device temperature
- local failure rate

## 4. 雲端成本總原則

雲端不能成為每次記錄的必要成本。

成本優先級：

```text
local first
-> no cloud fallback in v1
-> future premium cloud access
-> enterprise / clinic paid usage
```

雲端只做：

- auth
- subscription
- sync
- backup
- model versioning
- report sharing
- audit log
- future fallback

不要做：

- 每筆紀錄都送雲端 AI。
- 每次開 App 都打大量 API。
- 把音檔、圖片、完整健康資料丟到一般 analytics。
- 第一版不提供雲端 fallback。

## 5. 降低 AI 雲端成本

策略：

- 第一版一般紀錄全部本地完成。
- 第一版先不要雲端 fallback。
- 高級版 OpenAI access 先擱置，未來再設計。
- 模型失敗時先讓使用者修改文字、重新錄音或手動輸入。
- 對 PHI 做 minimization / redaction。
- 同一段輸入不要重複送多次。
- 用 request hash 做短期去重。

模型分流：

```text
local STT
-> local small LLM
-> local larger downloaded model
-> user correction / manual input
-> future cloud premium access
```

## 6. 降低同步與儲存成本

同步策略：

- 本機 SQLite 為主。
- 只同步 confirmed records。
- draft / temporary parse 不同步。
- 使用 delta sync，不每次全量同步。
- mutation queue 批次上傳。
- 壓縮 payload。
- 音檔不保存也不上傳。
- 圖片若需要辨識，優先在本地辨識成文字；是否保存照片需另行設計。
- 報告 PDF 可按需生成，不一定永久保存。

資料保存策略：

- 原始音檔不保存。
- 雲端只保存結構化紀錄與必要報告 metadata。
- 飲食照片第一版最好辨識成文字，再送進本地 LLM；照片是否保存需另行設計，預設不把 PHI 傳到非合規服務。
- 大檔案走 S3 lifecycle。
- 舊報告可重新生成時，不必永久保存 PDF。

## 7. 降低 AWS 成本

第一版 AWS 建議：

- API Gateway + Lambda 處理低流量 API。
- DynamoDB on-demand 或 Aurora Serverless v2 依需求選。
- S3 + CloudFront 放模型與報告。
- SQS 削峰。
- CloudWatch log 設 retention。
- WAF rate limit 防濫用。

成本控制：

- 每個 user / tenant / device 有 quota。
- 第一版沒有雲端 fallback 額度。
- 報告匯出有方案限制。
- 模型下載走 CloudFront cache。
- audit log 做合理保留與歸檔。
- 非 production 環境自動休眠或縮小。

## 8. 家庭方案成本控制

家庭方案會提高黏著度，但也可能提高使用量。

要抽象化控制：

- household_member_limit
- managed_profile_limit
- future_cloud_fallback_quota
- report_export_quota
- lab_scan_quota
- model_download_limit

家庭方案重點：

- 共享訂閱權益。
- 不共享健康資料。
- 多 profile 記錄仍要有使用量統計。
- 高成本功能依 household quota 控制。

## 9. 需要追蹤的成本指標

每個版本都要看：

- cost_per_active_user
- cost_per_paid_user
- cost_per_trial_user
- local_failure_rate
- cloud_ai_cost_per_user
- sync_cost_per_user
- storage_cost_per_user
- report_export_cost
- model_download_bandwidth_cost
- support_cost_signal

如果 local_failure_rate 太高，代表：

- 本地 STT 不夠準。
- 本地 LLM 不夠穩。
- 模型選型不適合 2022 左右手機。
- UX 讓使用者太常需要修改或重新錄音。

## 10. 我還需要問的問題

目前最需要釐清：

1. 家庭方案第一版是否公開販售，還是先作為 beta / 隱藏方案？
2. 報告 PDF 是否每次即時生成，還是生成後保存一段時間？
3. 飲食照片辨識第一版要用本地 OCR / vision model，還是先用裝置端系統能力可用的部分？
4. 美國與台灣未來若需要資料區域隔離，第一版是否先把 tenant region 欄位預留？
