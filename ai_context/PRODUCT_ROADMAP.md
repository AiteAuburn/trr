# 糖錄錄產品與路線圖

文件定位：唯一的產品方向與路線圖（取代 MASTER_ROADMAP、long_term_product_roadmap、ENGINEERING_BLUEPRINT_V1、product_planning_questions、efficiency_cost_strategy）。工程規則以根目錄 `skills.md` 為準；上線缺口見 `PRODUCTION_READINESS.md`；目前在做什麼見 `TASK_QUEUE.md`。

## 1. 北極星

從「講一句話就記好血糖」切入，長期做成慢病管理與個人健康資料平台。

產品原則：

- 能語音就語音，能拍照就拍照，能自動就自動；手動輸入只做兜底。
- 操作要簡單，讓中老年人與照護者能長期使用（retention 是核心指標）。
- 每次 AI 整理結果都要使用者確認後才儲存。
- 不做診斷、不給治療建議。
- 家庭方案只共享訂閱權益，不預設共享健康資料。
- 介面至少支援繁體中文；英文為後續目標（目前 UI 只有中文）。

## 2. 目前產品狀態（2026-11）

| 項目 | 狀態 |
|---|---|
| Android App（Expo SDK 57） | 語音優先：首頁大麥克風，點一下開始／再點一下結束，停頓 3 秒自動停止，單次上限 60 秒 |
| 語音轉文字 | 手機系統語音辨識（`expo-speech-recognition`，通常是 Google 雲端服務）；使用者下載 Whisper 模型後，Android 13+ 會先用 `whisper.rn` 在本機重轉 |
| AI 整理 | 後端 `/ai/parse-preview`；有設定時預設用 DeepSeek（雲端），Ollama / Gemma 只是開發用 |
| 確認與儲存 | 單一確認頁 → 存起來 → 「存好了」；可取消整理、改文字、重說 |
| 檢視 | 今天時間軸、歷史、基本分析、年度回顧 |
| 帳號 | Email／密碼登入；Apple / Google 尚未接 |
| 資料存放 | 伺服器 PostgreSQL；手機端沒有本機資料庫 |
| 部署 | 只有一台 Lightsail staging（`infra/lightsail/`），給內部 APK 測試，不可放真實使用者資料 |
| Web | Vite 模擬器（同一套流程）＋ 管理後台（用量、營運事件、使用者與解析紀錄） |

已移除（2026-11）：商城 / store、食物社群 / community、排行榜、成就。DB 資料表為了 migration 相容先保留，不再有 API 與畫面。

保留為 flag 預留（預設關閉）：食物拍照辨識（`food_photo_analysis`）、健康平台串接（`health_integrations`）。

## 3. 路線圖（唯一的 Phase 編號）

| Phase | 名稱 | 狀態 | 內容 |
|---|---|---|---|
| 0 | 開發基礎 | 完成 | Docker Compose、FastAPI + Postgres、Alembic、web 模擬器、`make check` 本機品質檢查 |
| 1 | 語音紀錄 MVP | 大致完成，待真機驗收 | 語音／文字輸入 → AI 整理 → 確認 → 儲存；今天、歷史、基本分析；語音額度；年度回顧 |
| 2 | 可給真實使用者用 | 進行中 | 先解決第 4 節的未決事項；正式簽章、伺服器設定、備份還原演練、真機端到端測試（見 `PRODUCTION_READINESS.md`） |
| 3 | 報告與回診 | 未開始 | 7/14/30 天趨勢、空腹／飯前／飯後分組、回診摘要、PDF（不保存）、限時可撤銷的醫師分享 |
| 4 | 家人與照護者 | 後端基礎已有 | 一個帳號管理多個 profile、`profile_access_grants` 授權已存在；缺邀請流程、照護提醒、每週摘要、家庭方案 |
| 5 | 更多資料類型與裝置 | 預留 | 血壓、體重、檢驗值（後端 record type 已支援）；食物拍照、Health Connect / Apple Health、血糖機、CGM |
| 6 | 診所／醫療人員入口 | 未開始 | 授權唯讀檢視、患者列表、回診前摘要；所有查看與匯出寫 audit log |
| 7 | 多慢病與資料交換 | 長期 | 高血壓、高血脂、腎病；FHIR 相容、EHR 整合、tenant 隔離。前提是合規（HIPAA／台灣個資）、BAA、法務流程到位 |

原則：不要因為長期願景大，就提前把後面 Phase 做完整；但資料模型（generic record、permission service、schema registry）要能一路擴充。

## 4. 未決事項（Open decisions）

已決定：

- **D1 雲端 AI 解析**（2026-11-05）：維持後端送 DeepSeek 解析。App 內不設 AI 同意步驟；使用者介面不顯示供應商名稱，統一稱「AI 智慧整理」。隱私權政策與 Google Play 資料安全表單仍需揭露「由第三方 AI 服務處理」（可不寫廠商名）。

以下尚未決定，文件與程式碼都不可假裝已解決：

| # | 議題 | 現況 | 選項 |
|---|---|---|---|
| D2 | 原始逐字稿保存 | `ai_parse_audits.transcript_text` 與 `daily_records.transcript_entries_json` 無期限保存，管理後台看得到 | 訂保存期限與清除 job；或不保存原文 |
| D3 | 手機語音辨識走雲端 | 系統辨識未要求 on-device，可能送 Google | 說明並取得同意；或要求 on-device／改以 Whisper 為主 |
| D4 | Release 簽章 | release APK 仍用 debug keystore 簽 | 建立正式 keystore 與保管流程 |
| D5 | 語音額度信任來源 | `voice_seconds` 由 client 回報，伺服器不量音檔 | 接受（成本風險低）；或伺服器端估算／收音檔長度 |
| D6 | Staging dev 登入 | 程式已拒絕 staging 開 `ALLOW_DEV_AUTH`；主機 `.env` 仍需人工改成 false | 運維動作，待執行 |
| D7 | 試用期 | 試用 7 天但到期未強制；沒有金流 | 決定付費主軸與金流供應商 |

產品問題（沿用舊規劃問題，仍未回答）：

- 第一版核心成功指標（每日記錄率、7 天留存、試用轉付費…）與最優先的使用族群。
- 付費主軸是「語音紀錄」還是「報告與醫師分享」；分享報告是否收費。
- 趨勢圖第一版最重要的形式；報告偏使用者自己看還是醫師看。
- 醫師分享是否從第一版就做一次性連結／QR code；醫療端是否一律唯讀。
- 使用者資料刪除政策（帳號刪除、匯出、保存期限）。
- 高級版雲端 AI（OpenAI 等）要提供什麼價值；目前完全沒有 OpenAI 整合，`openai-fallback-disabled` 只是停用的選項。
- 未來 B2B2C（診所、KOL 邀請碼）與第一個 B2B 客戶；美國與台灣是否需要資料區域隔離。
- 資料模型是否現在就對齊 FHIR。

已回答、仍有效的舊決定：原始音檔不保存；報告 PDF 不保存；家庭方案先做隱藏方案；飲食拍照要先辨識成文字再送 LLM。

## 5. 成本原則

- 主機：Lightsail 單機，AWS Budget 每月 USD 10（`infra/lightsail/create-budget.ps1`）。
- AI：每次解析有分段、token 與密度上限（見 `AI_PARSING_AND_MODELS.md`），由 `scripts/verify_backend_ai_cost_boundaries.py` 守住。
- 語音：每日額度（試用 300 秒、年費 600 秒）＋ 單次 60 秒。
- 不做 Kubernetes、microservices、multi-region、常駐 GPU，除非有明確需求與成本理由。
- 要追蹤：每位使用者每日 token 用量、解析失敗率、每日 API 量（管理後台已有）。
