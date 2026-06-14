# 糖錄錄 AI / Engineering Skills

用途：這份文件是糖錄錄專案給 AI 開發工具、工程師與產品規劃協作者使用的最高層工作規範。其他 `ai_context` 與 `agents` 文件若與本文件衝突，以本文件為準；細節文件只補充領域內容，不重複定義通用工程規則。

## 1. 文件優先順序

1. `skills.md`：AI 與工程執行總規範。
2. `ai_context/TASK_QUEUE.md`：目前正在做什麼，一次只做一個 active task。
3. `ai_context/MASTER_ROADMAP.md`：長期產品與階段路線。
4. `ai_context/IMPLEMENTATION_PLAN.md`：工程落地順序。
5. `ai_context/security_compliance.md`：安全、同步、HIPAA 導向細節。
6. `ai_context/local_model_playbook.md`：本地模型輸入、輸出與解析規則。
7. `agents/*.md`：agent 角色分工與入口指標，不保存權威產品或工程規範。

## 2. 產品北極星

糖錄錄先從血糖控制切入，長期往慢病管理平台與個人健康資料平台擴展。

核心原則：
- 支援多國語言，至少有英文和中文。
- 能自動就自動。
- 能拍照就拍照。
- 能語音就語音。
- 手動輸入只做兜底。
- 操作必須簡單，降低中老年人與照顧者長期使用負擔。
- 家庭方案只共享訂閱權益，不預設共享健康資料。
- 每次 AI 整理結果都必須讓使用者確認後才儲存。

## 3. 技術北極星

第一版以 local-first 為主：

- 一般紀錄必須能在本地完成 `audio -> text -> local LLM -> structured records`。
- 原始音檔預設不保存。
- 雲端不做第一版 AI 主流程。
- 未來 OpenAI access 只能作為高級版或合規 fallback，且預設關閉。
- 本地處理等待時間目標為 5 到 10 秒。
- 不假設有所謂「簡單句」可以跳過本地 LLM；第一版核心解析主流程以本地 LLM 產生固定 JSON。
- 可以用字典、schema、validator 輔助，但不要讓規則系統取代主解析流程。

## 4. AI 輸出規範

本地 LLM 必須輸出固定 JSON，不輸出自由文字作為儲存來源。

要求：

- 使用 JSON schema / grammar constrained output。
- 每筆候選紀錄都要包含 `record_type`、`occurred_at`、`payload_json`、`metadata_json`、`source`、`confidence`。
- 日期、數值、餐別、用藥、運動與模糊欄位都要標示是否需要使用者確認。
- 不要求、不顯示、不保存完整 chain-of-thought。
- 若需要稽核，只保存短版 `decision_trace`，內容限於可檢查的摘要理由，例如「辨識到空腹與 138，因此建立 glucose record」。
- `decision_trace` 不可包含長篇內部推理、PHI 以外的推測、醫療建議或模型自我描述。

## 5. 資料與安全底線

所有健康資料都先視為 sensitive health data。

禁止：

- 把 PHI 傳到非 HIPAA compliant API。
- 把語音轉錄、血糖值、飲食照片、用藥紀錄、報告或 prompt 寫入一般 log。
- 用 production data 做 staging 測試。
- 把 API key、DB password、OpenAI key、signing key 放進 repo。
- token plaintext 儲存在 App 一般 storage。

必做：

- local DB 加密。
- biometric auth 保護敏感頁面。
- token 存 Keychain / Keystore 或等效安全儲存。
- 敏感頁面支援防截圖或背景遮罩。
- server side sync 要做 access control、audit log、data integrity、backup / recovery。
- log redaction 預設開啟。

## 6. 工程執行規範

優先順序：

1. 先做能跑的 Docker-first 骨架。
2. 再做 profile、records、report、sync、安全基礎。
3. 再接 local AI pipeline。
4. 最後才進 mobile native integration 與醫院平台。

工作方式：

- 一次只處理 `ai_context/TASK_QUEUE.md` 的一個 active task。
- 完成後把 task 移到 Done，下一個 task 才改成 active。
- 一般生成文件放 `ai_context/`。
- 使用者提供或外部參考資料放 `references/`。
- `skills.md` 是本次允許例外，固定放在 repo root。
- `agents/` 只放 agent 角色提示與 pointer，不複製 roadmap、architecture、security、task queue 的完整內容。
- 不做 Kubernetes、microservices、multi-region、always-on GPU，除非已經有明確需求與成本理由。
- 新功能必須有對應測試。
- 有資料庫 schema 變更必須有 migration。
- 不做和當前 task 無關的大型重構。

## 7. Docker 與本機開發

目標：

- 一行啟 backend。
- 一行啟 web 模擬前端。
- 本機開發與未來 staging / production Docker image 路徑一致。

基本命令：

```bash
docker compose up -d backend
docker compose up -d web
docker compose run --rm backend pytest -q
docker compose run --rm web npm test -- --run
```

## 8. CI/CD 底線

Pull request 必跑：

- lint
- type check
- unit test
- integration test
- Docker build
- dependency scan
- secret scan
- container image scan
- SAST
- API auth test
- permission test

Production deployment：

- staging 與 production 必須分開 DB、bucket、API key、LLM key、logging level。
- merge to main 後先 deploy staging。
- staging smoke test 通過後 manual approval。
- production deploy 後 health check。
- 必須可 rollback。
- migration 前先備份。
- 早期 production 不做完全自動部署。

## 9. AWS 與可擴展性方向

原則：

- managed service 優先。
- 小客戶與早期版本用低成本 serverless / container。
- 大客戶以 tenant、KMS key、資料隔離層級、SLA、audit workflow 升級。
- 不為了「未來可能很大」而提前導入高維運成本架構。

優先候選：

- ECS Fargate 或 Lambda container 作為 backend runtime。
- RDS / Aurora 或 DynamoDB 視資料模型成熟度決定。
- S3 + KMS 作為檔案與備份。
- Cognito / OIDC 作為 authentication 基礎。
- CloudWatch / managed logs 作為初期 observability。
- GitHub Actions OIDC assume AWS role，不使用長期 AWS access key。

## 10. Definition Of Done

功能完成必須符合：

- code implemented。
- tests added / updated。
- lint / typecheck / tests pass。
- API contract 或文件更新。
- migration added if needed。
- auth / permission impact checked。
- logs do not leak sensitive data。
- Docker local flow works。
- rollback path clear for deployable changes。
- `ai_context/TASK_QUEUE.md` 狀態更新。
