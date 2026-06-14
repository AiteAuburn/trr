# 糖錄錄工程架構藍圖 v1

文件定位：本文件是把現有 markdown、目前 repo 狀態與新產品藍圖整理成同一份工程規劃。更細的技術背景仍以既有文件為準：

- `ai_context/architecture.md`：技術架構與產品原則。
- `ai_context/UI_UX_SPEC.md`：完整 UI / UX 設計系統、頁面規格、navigation 與動畫規範。
- `ai_context/MASTER_ROADMAP.md`：長期 phase。
- `ai_context/IMPLEMENTATION_PLAN.md`：工程落地順序。
- `ai_context/generic_health_record_abstraction.md`：健康紀錄資料抽象。
- `ai_context/subscription_family_model.md`：訂閱、家庭權益與 profile 權限。
- `ai_context/security_compliance.md`：PHI、audit、合規與安全底線。
- `ai_context/TASK_QUEUE.md`：實作任務隊列。

## 0. 目前架構校正

這份藍圖採用以下決策，避免文件之間互相打架。

### MVP 預設 local-first

第一版核心紀錄流程預設在本地完成：

```text
voice / text
-> local STT or text input
-> local LLM parser
-> validation / normalization
-> user confirmation
-> local record save
-> optional cloud sync
```

雲端在 MVP 可做：

- account / auth
- subscription / entitlement
- backup / sync skeleton
- model manifest / model download
- audit / observability

雲端在 MVP 不做為主要 AI 成本中心。OpenAI / cloud model cascade 保留為 future premium fallback 或 enterprise workflow，實作前必須重新確認合規、BAA、quota、成本與當時可用模型。

### 規則不是繞過 LLM

MVP 不再把「簡單句」設計成純 regex / rule-only parser。規則負責：

- schema validation
- 欄位正規化
- 日期、單位、數值合理性檢查
- profile_id / permission 檢查
- confidence / risk checks
- schema repair fallback

文字理解與事件抽取仍走統一 parser pipeline，避免日後使用者句子變複雜時出現兩套邏輯。

### 使用者確認不可省

任何 AI parse、voice command、photo recognition、device import 轉成健康紀錄前，都要有明確的使用者確認或可追溯的授權策略。MVP 的 write action 一律不由 AI 直接寫 DB。

## 1. 整體產品分層

糖錄錄分成 5 個大層。

### A. 使用者前台

目標：讓使用者用最低摩擦完成紀錄與查看。

MVP：

- 首頁 Home
- 錄音 / 文字輸入
- 轉錄確認
- AI 整理確認
- 今日紀錄
- 歷史紀錄
- 基本分析 / 基本報告
- 帳號 / 設定
- 訂閱方案入口

Future：

- 食物拍照
- HealthKit / Health Connect / 血糖機匯入
- 醫師分享
- 成就 / 年度回顧
- 社群 / 商城

### B. AI 處理層

目標：把自然語言或未來圖片、裝置資料轉成可確認的候選紀錄。

MVP：

- local STT adapter
- local LLM parser adapter
- transcript processing pipeline
- segment / rejected event
- schema validation
- confidence / risk checks
- user confirmation handoff

Future：

- OpenAI / cloud fallback broker
- advanced report generation
- food image recognition
- doctor-facing summary generation
- model A/B and rollout management

### C. 資料層

目標：健康資料本地優先、可同步、可授權、可擴充。

MVP source of truth：

- generic `records` abstraction
- `accounts`
- `user_profiles`
- `profile_memberships`
- `audit_logs`
- `reports`
- `sync_jobs`

MVP record types：

- glucose
- meal
- exercise
- medication
- lifestyle
- note

Future reserved types：

- vital / blood_pressure
- body_measurement / weight
- lab_result
- cgm_reading
- symptom
- device_sync
- photo_food

### D. 商業層

目標：讓會員、試用、價格與 KOL 導流不綁死在硬編碼方案名稱。

MVP：

- account identity
- plan
- subscription
- entitlement
- usage_counter
- referral_code / KOL code placeholder
- billing_event placeholder

Future：

- family plan
- hidden family subscription sharing
- premium AI fallback quota
- clinic / B2B2C plan
- coupon / reward / marketplace

### E. 未來擴充層

目標：現在不做完整功能，但資料模型、權限、報告和入口不能封死。

Future modules：

- doctor / clinic sharing
- community
- achievements / badges
- leaderboard
- yearly review
- shop / coupon
- food photo recognition
- meter / health platform integrations

## 2. MVP 必做架構

### 2.1 帳號與會員系統

MVP 必做：

- dev login / production auth contract
- account
- user_profile
- active_profile_id
- profile switching
- subscription status model
- plan / entitlement model
- trial / expiry / cancellation fields
- referral_code placeholder

注意：

- profile 是健康資料主體，account 是登入身份。
- 家庭方案只共享訂閱權益，不預設共享 PHI。
- 每筆健康紀錄必須有 `profile_id`。
- 功能開關看 entitlement，不直接看 plan name。

### 2.2 首頁 Home

MVP 必做：

- App 名稱：糖錄錄。
- active profile 顯示，例如「正在記錄：自己」。
- 右上角功能選單。
- 一句提示文。
- 大型按住錄音按鈕。
- 文字輸入框。
- 整理送出按鈕。
- 今日已記錄幾筆。

注意：

- 首頁極簡，只服務快速記錄。
- 不放完整圖表。
- 不放太多分類入口。
- 進階功能收在右上角或下層頁面。

### 2.3 錄音輸入模組

MVP 必做：

- 按住錄音。
- 放開結束。
- 單次錄音上限。
- 試用 / 付費每日語音額度。
- 剩餘 2 分鐘或接近上限才提醒。
- 本地端靜音裁切。
- 裁掉開頭 / 結尾空白。
- 幾乎無聲音檔不進 STT。
- 錄音中、計時、放開結束、整理中狀態。

注意：

- 第一版不要做點一下開始、點一下結束。
- VAD 不自動中斷中間停頓。
- 原始音檔不持久保存。

### 2.4 文字輸入模組

MVP 必做：

- 自然語言輸入。
- 支援今天 / 昨天 / 指定日期。
- 支援一整段多事件。
- 與語音轉錄後共用同一條 parse pipeline。

注意：

- 文字輸入不是次等功能，是 STT 失敗或使用者不方便講話時的主要 fallback。
- 不分出另一套資料邏輯。

### 2.5 轉錄與 AI 解析模組

MVP 必做：

- STT model selection contract。
- LLM parser model selection contract。
- parser output JSON schema。
- atomic segment contract。
- rejected event contract。
- schema validation。
- normalization rules。
- low-confidence / risk warning。
- parser provenance metadata。

MVP 預設模型策略：

- Mobile production：local STT + local LLM。
- Web simulator：browser STT / Transformers.js / Ollama candidate 可用於開發驗證。
- Cloud AI：不作為 MVP 預設主流程。

Future cloud cascade：

- 低成本雲端 model：處理本地失敗或低信心案例。
- 中階 model：處理多事件、修正語、模糊日期。
- 高階 model：極少數複雜案例。
- 所有 cloud path 都要經 backend broker、quota、redaction、audit、BAA / compliance review。

注意：

- 不把 OpenAI key 放在 App。
- 不把 PHI 寫進一般 log。
- AI 只產生候選紀錄或 action proposal，不直接寫 DB。

### 2.6 使用者確認模組

MVP 必做：

- 轉錄確認頁。
- 顯示「我聽到的文字」。
- 可修改文字。
- 可重新錄音。
- 可下一步整理。
- AI 整理確認頁。
- 顯示分類結果。
- 顯示 source_text。
- 顯示「儲存到：active profile」。
- 可修改。
- 可確認儲存。

注意：

- 醫療紀錄不能完全自動亂存。
- 確認流程是安全、信任與除錯的重要界面。

### 2.7 紀錄資料模組

MVP 必做：

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
```

必備 metadata：

- raw_text or transcript
- source_text
- stt_model_id
- parser_model_id
- confidence
- parse warnings
- confirmation status

主要 payload：

- glucose：value, unit, meal_timing, context, note
- meal：meal_type, food_items, amount / description, note
- exercise：type, duration_minutes, intensity_hint, note
- medication：name_or_description, dose_text, note
- lifestyle / note：tags, description

注意：

- MVP 以 generic records 為主，不急著拆很多專用表。
- 未來熱路徑可加 read-optimized table。
- source 要預留 voice / text / manual / photo / meter / healthkit / health_connect / import。

### 2.8 今日紀錄 / 歷史紀錄頁

MVP 必做：

- 今日所有紀錄列表。
- 依時間排序。
- record detail。
- 編輯 / 刪除。
- 指定日期查詢。
- 近 7 天 / 近 30 天。

注意：

- 第一版篩選保持簡單。
- 所有查詢都綁 active profile。
- 刪除要保留 audit / soft delete 策略。

### 2.9 基本分析頁

MVP 必做：

- 近 7 天 / 30 天血糖趨勢。
- 基本平均值。
- 空腹平均。
- 飯後平均。
- 記錄次數。
- 基本報告 API / view。

注意：

- 不做治療建議。
- 不做診斷。
- 報告 engine 要抽象化，未來醫師版 / PDF / 年度回顧不用重寫。

### 2.10 右上角功能選單

MVP 入口：

- 今日紀錄
- 歷史紀錄
- 基本分析
- 訂閱方案
- 使用教學
- 帳號設定

Future 入口：

- 回診摘要
- 醫師分享
- 拍照辨識
- 裝置串接
- 成就 / 年度回顧
- 商城

注意：

- 可擴充成九宮格或大圖示選單。
- 不干擾首頁主要輸入。

## 3. 未來擴充架構

### A. 醫師 / 醫院合作

Future：

- 使用者產生授權碼 / QR code。
- 醫師端網站輸入授權碼。
- 查看使用者授權範圍內紀錄摘要。
- 回診前報表。
- 醫療端 read-only view。

現在預留：

- share token / authorization grant。
- report export structure。
- doctor-view-compatible report template。
- audit log。
- care_permission。
- read-only access control。

### B. 社群模組

Future：

- 糖友交流。
- 留言 / 討論。
- 小型社群互動。

現在預留：

- display_name。
- public/private data boundary。
- community permission concept。
- PHI 不預設公開。

### C. 成就榜 / 徽章

Future：

- 連續記錄 7 / 30 / 100 天。
- 連續運動成就。
- 特殊里程碑徽章。

現在預留：

- streak stats。
- achievement records。
- badge definitions。
- audit-friendly event stream。

### D. 排行榜

Future：

- 連續記錄排行榜。
- 社群競賽。

現在預留：

- public ranking opt-in。
- ranking stats。
- no PHI ranking policy。

### E. 年度回顧

Future：

- 年度血糖總結。
- 最長連續記錄天數。
- 運動統計。
- 成就回顧。

現在預留：

- yearly aggregate job。
- report template section。
- summary generation interface。

### F. 商城

Future：

- 書籍。
- 保健食品。
- 健康商品。
- 折價券 / 優惠券。

現在預留：

- coupon / reward structure。
- achievement reward mapping。
- product module boundary。
- affiliate / KOL attribution。

### G. 食物拍照辨識

Future：

- 拍照辨識食物。
- 粗估熱量 / 碳水 / 糖分。
- 使用者確認修正。

現在預留：

- source = photo。
- image storage interface。
- nutrition estimation interface。
- same confirmation flow。

### H. 血糖機 / 健康平台串接

Future：

- Apple HealthKit。
- Google Health Connect。
- 血糖機資料匯入。
- BLE 直連。

現在預留：

- source = meter / healthkit / health_connect。
- external integration layer。
- import batch id。
- sync status。
- duplicate detection。

## 4. 頁面 / 功能分支圖

```text
糖錄錄 App
├─ 1. 首頁 Home
│  ├─ Active profile chip
│  ├─ App 名稱
│  ├─ 提示文
│  ├─ 按住錄音按鈕
│  │  ├─ 錄音中畫面
│  │  ├─ 計時 / 單次上限
│  │  ├─ 放開結束
│  │  ├─ 靜音裁切 / 無聲檢查
│  │  ├─ 語音轉文字
│  │  ├─ 顯示文字稿
│  │  ├─ 使用者修改
│  │  ├─ AI 整理
│  │  ├─ 顯示分類結果
│  │  ├─ 使用者確認
│  │  └─ 儲存成功
│  ├─ 文字輸入框
│  │  ├─ 輸入自然語言
│  │  ├─ AI 整理
│  │  ├─ 顯示分類結果
│  │  ├─ 使用者確認
│  │  └─ 儲存成功
│  └─ 右上角功能選單
│
├─ 2. 今日紀錄
│  ├─ 今日所有紀錄列表
│  ├─ 血糖紀錄詳情
│  ├─ 飲食紀錄詳情
│  ├─ 運動紀錄詳情
│  ├─ 用藥紀錄詳情
│  ├─ 備註 / 症狀詳情
│  └─ 編輯 / 刪除
│
├─ 3. 歷史紀錄
│  ├─ 日期查詢
│  ├─ 指定日期紀錄
│  ├─ 近 7 天
│  ├─ 近 30 天
│  └─ 未來：搜尋 / 篩選
│
├─ 4. 基本分析
│  ├─ 血糖趨勢圖
│  ├─ 空腹平均
│  ├─ 飯後平均
│  ├─ 記錄次數
│  ├─ 基本報告
│  └─ 未來：食物分析 / 進階分析 / 年度回顧
│
├─ 5. 會員 / 訂閱
│  ├─ 7 天試用狀態
│  ├─ 年費方案
│  ├─ 優惠資格
│  ├─ 自動續訂資訊
│  ├─ 語音額度 / entitlement
│  └─ 訂閱管理
│
├─ 6. 帳號 / 設定
│  ├─ 個人資料
│  ├─ Profile 切換 / 管理
│  ├─ 提醒設定
│  ├─ 錄音設定
│  ├─ 語音額度狀態
│  ├─ 使用教學
│  └─ 登出
│
└─ 7. 未來擴充
   ├─ 醫師 / 醫院合作
   ├─ 社群
   ├─ 成就榜 / 徽章
   ├─ 排行榜
   ├─ 年度回顧
   ├─ 商城
   ├─ 食物拍照辨識
   └─ 血糖機 / HealthKit / Health Connect 串接
```

## 5. 每個模組的特色與備註

### 首頁

- 極簡。
- 只服務快速記錄。
- 顯示 active profile 防止照護者記錯人。
- 其他功能不要搶戲。

### 錄音流程

- 按住錄音。
- 放開結束。
- 單次時間上限。
- 接近每日上限才提醒。
- 靜音裁切但不亂中斷。
- 原始音檔不持久保存。

### AI 解析

- 統一 parser pipeline。
- local model 優先。
- schema constrained output。
- segment_id / source_text 可追溯。
- 規則做 validation，不做主 parser 分叉。
- cloud fallback 是 future premium / enterprise path。

### 儲存前確認

- 不可省。
- 顯示原文、分類結果、profile。
- 所有 write action 需確認。
- 這是醫療紀錄信任與安全保險。

### 資料模型

- MVP 用 generic records。
- payload_json 放健康細節。
- metadata_json 放 parser provenance 和 operational metadata。
- `source` 預留 voice / text / manual / photo / meter / import。
- `profile_id` 必填。

### 分析 / 報告

- MVP 先做基本趨勢與平均。
- 不碰診療建議。
- report engine 從第一版抽象化。
- 分享、PDF、醫師 view 必須有 audit。

### 訂閱 / 商業

- plan 不等於 entitlement。
- 試用、年費、優惠資格、KOL code 都走 entitlement / billing event。
- 家庭方案不等於健康資料共享。
- 語音額度、future cloud fallback quota 都應由 usage_counter 控制。

### 安全 / 合規

- PHI 不進一般 log / analytics / crash report。
- OpenAI / cloud PHI path 需要 backend broker、redaction、audit 與合規審查。
- 醫師或家庭存取健康資料要走 care_permission。
- sync / export / doctor share 都要有 audit trail。

## 6. Task 規劃

以下是接下來的 blueprint-aligned 任務。實際隊列以 `ai_context/TASK_QUEUE.md` 為準。

### P0：文件與範圍對齊

- BP001：新增本文件並更新 README / roadmap index。
- BP002：把 MVP / future / not-now boundaries 寫進 task queue。
- BP003：確認 cloud AI fallback 只作 future，不進 MVP default path。

### P1：App Information Architecture

- BP010：建立 Home / Today / History / Basic Analysis / Subscription / Settings 的 route map。
- BP011：右上角功能選單改成可擴充 menu model。
- BP012：所有頁面顯示或繼承 active_profile_id。

### P2：核心輸入流程

- BP020：Home 極簡 UX polish。
- BP021：push-to-talk state machine。
- BP022：voice quota / single-recording limit state。
- BP023：silence trim / silent-audio rejection adapter。
- BP024：text input and voice transcript share the same parse request。

### P3：確認與紀錄

- BP030：兩階段確認 flow。
- BP031：confirmation card 顯示 source_text、confidence、profile。
- BP032：edit parsed candidate before save。
- BP033：record update / soft delete / audit。

### P4：紀錄查看與分析

- BP040：今日紀錄頁。
- BP041：歷史紀錄日期查詢。
- BP042：7 / 30 天基本血糖趨勢。
- BP043：空腹 / 飯後平均與記錄次數。

### P5：訂閱與額度

- BP050：plans / subscriptions / entitlements / usage_counters migration。
- BP051：7 天 trial 狀態與到期欄位。
- BP052：語音每日額度檢查。
- BP053：KOL referral_code placeholder。

### P6：Mobile local AI

- BP060：Expo Dev Client native spike。
- BP061：whisper.rn local STT adapter。
- BP062：llama.rn local parser adapter。
- BP063：model download / checksum / storage。
- BP064：device benchmark harness。

### P7：Future hooks

- BP070：doctor share token schema placeholder。
- BP071：report export interface。
- BP072：photo food source placeholder。
- BP073：external integration source / import batch placeholder。
- BP074：achievement / yearly aggregate event hooks。
