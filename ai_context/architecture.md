# 糖錄錄 v1 技術架構整理

## 1. 專案定位

專案暫定名稱：糖錄錄

副標暫定：AI 語音血糖日記

一句話定位：

用說的記錄血糖、飲食、運動與用藥，AI 自動幫使用者整理成可確認、可追蹤的紀錄。

糖錄錄長期目標是慢病管理平台加上個人健康資料平台，最終要比智抗糖更全面；但第一版不能用複雜入口拖慢驗證。第一版應定位為：

- 可擴充的 AI 語音慢病紀錄入口
- 健康紀錄與生活管理工具
- 使用者確認後才儲存的個人紀錄 App

核心差異不是第一天功能比競品多，而是用更簡單的輸入方式承接更完整的資料類型。首頁應讓使用者一打開就知道可以按住說話，不需要先理解複雜分類；底層資料模型則要能擴充到血糖、生活型態、飲食、運動、用藥、血壓、體重、檢驗值、CGM、報告、家人共享與診所共享。

最大產品原則：

- 簡單操作優先。
- 能自動同步就不手動輸入。
- 能用拍照就用拍照。
- 能用語音就用語音。
- 手動輸入保留作為兜底。
- 所有新功能都要服務長期 retention 與使用黏著度。

輸入優先序：

```text
device sync / automatic import
-> camera capture
-> voice input
-> text input
-> manual form
```

不同資料類型可有不同優先入口：

- 血糖：裝置同步優先，其次語音 / 手動。
- 飲食：拍照與語音優先，其次文字 / 手動。
- 運動：手機健康資料同步優先，其次語音 / 手動。
- 用藥：語音與提醒確認優先，其次手動。
- 檢驗報告：拍照 / PDF 掃描優先，其次手動。
- 生活型態：語音優先，其次文字。

## 2. 架構決策總結

第一版架構方向應定為：

第一版本地 AI 完成，雲端 AI 未來補救。

也就是：

- 一般語音轉文字在手機本地完成。
- 一般文字解析在手機本地完成。
- 第一版一般紀錄必須能完全在本地完成。
- 不假設存在「簡單句」可跳過 LLM。
- 規則只用於欄位正規化、schema validation、防錯與 confidence 檢查。
- 第一版先不提供雲端 fallback；模型失敗時走重新錄音、修改文字或手動輸入。
- 所有 AI 整理結果都必須經使用者確認後才寫入資料庫。

核心流程：

```text
audio
-> local STT
-> text
-> local LLM parser
-> validation / normalization rules
-> structured records
-> user confirm
-> local SQLite save
-> optional cloud sync
```

這個方向的目標是長期壓低雲端推論成本。第一版不提供雲端 fallback；未來可在高級版或企業版中加入合規的雲端 fallback。

## 3. 建議技術選型

### App Framework

建議使用：

- React Native
- Expo Prebuild
- Custom native modules

原因：

- 一套程式碼支援 iOS / Android。
- Expo Prebuild 可保留 Expo 開發效率，同時允許整合原生 AI 模組。
- 適合「大部分跨平台、少部分本地推論模組」的產品。

### 本地語音轉文字

建議使用：

- whisper.rn
- 底層為 whisper.cpp

用途：

- 將使用者錄音在手機端轉成文字。
- 優先處理一般血糖、飲食、運動、用藥語音紀錄。

模型策略：

- MVP 先測 multilingual tiny / base 量化模型。
- 不使用 tiny.en，因為產品需要中文辨識。
- 若中文準確度不足，再測較大的量化模型。
- 需要在準確度、速度、電量、App 體積之間取平衡。

### 本地文字解析

建議使用：

- llama.rn
- 底層為 llama.cpp

用途：

- 將轉錄文字整理為結構化紀錄。
- 不做醫療診斷或用藥建議。
- 只做資訊抽取與分類。

模型策略：

- 優先測 0.5B 到 1.5B 級別的小型中文能力模型。
- 使用 GGUF / 量化模型。
- 優先選擇能在中高階手機上穩定運行的模型。
- 使用 JSON schema / grammar constrained output 限制輸出格式。

### 本機資料庫

建議使用：

- SQLite
- React Native / Expo 環境可用 expo-sqlite 或相容方案

用途：

- 本機優先儲存。
- 離線可用。
- 後續再同步到雲端。

### 雲端

雲端不作為主流程成本中心，只保留：

- 帳號登入
- 訂閱驗證
- 資料備份
- 多裝置同步
- 未來高難度 STT fallback
- 未來高難度 LLM fallback
- 匿名錯誤回報
- 模型下載與版本管理

雲端架構原則：

- 一鍵 CI/CD。
- AWS managed service 優先。
- Auto scaling 優先。
- 小客戶低成本啟動。
- 大客戶可升級成獨立租戶、獨立資料庫或獨立環境。
- 不把主要 AI 成本放在雲端。
- 高級版會員未來可開啟 OpenAI fallback / enhanced AI access。
- OpenAI API key 不放在 App 端，必須由後端代理與控管。

### AWS 後端建議架構

第一版雲端應保持薄後端：

```text
Mobile App
-> API Gateway / CloudFront
-> Auth / Subscription / Sync / Fallback APIs
-> Database / Object Storage / Queue
-> Observability / Billing / Admin
```

建議 AWS 組件：

- Amazon Cognito：帳號登入、社群登入、使用者身份。
- API Gateway：對 App 暴露 HTTPS API。
- AWS Lambda：低流量與事件型 API，例如訂閱驗證、同步 job、模型版本查詢。
- ECS Fargate：需要較長執行時間或較穩定 runtime 的服務，例如 fallback broker、批次摘要產生。
- DynamoDB 或 Aurora Serverless v2：使用者資料、同步狀態、訂閱狀態。
- S3：備份、匯出報告、模型檔案、匿名錯誤樣本。
- CloudFront：模型下載與靜態資源 CDN。
- SQS：同步任務、錯誤回報、fallback 任務排隊。
- EventBridge：排程任務、訂閱狀態檢查、資料保留策略。
- Secrets Manager / KMS：OpenAI key、付款 webhook secret、敏感設定。
- CloudWatch / X-Ray：log、metrics、trace。
- WAF / Shield：基本防濫用與攻擊防護。

資料庫選型：

- 如果第一版同步模型簡單，可先用 DynamoDB，成本低、auto scaling 簡單。
- 如果後續需要複雜查詢、報表、多租戶分析，可用 Aurora Serverless v2 PostgreSQL。
- App 端仍以 SQLite 為主，雲端資料庫是同步與備份，不是每次操作的必要依賴。

### CI/CD 與一鍵部署

通用 CI/CD gate、環境隔離、approval、rollback 與 migration 原則以根目錄 `skills.md` 為準。

本架構文件只保留部署方向：

- IaC：AWS CDK 或 Terraform。
- Backend CI/CD：GitHub Actions 或 AWS CodePipeline。
- Mobile CI/CD：EAS Build / EAS Submit。
- 目標是讓 app build、backend deploy、migration、test 都可自動化。

部署流程草案：

```text
git push
-> CI tests
-> build backend
-> deploy infra
-> run migrations
-> deploy APIs
-> smoke test
-> notify
```

Mobile 發版流程草案：

```text
git tag release
-> EAS Build iOS / Android
-> internal testing
-> submit to stores
-> phased rollout
```

### Auto Scaling 策略

雲端服務要支援從小流量到大客戶：

- API Gateway / Lambda 天然 auto scaling。
- Fargate 用 target tracking scaling，例如 CPU、memory、queue depth。
- SQS 削峰，供未來 fallback、報告與同步任務排隊，避免瞬間流量打爆服務。
- DynamoDB 使用 on-demand 或 auto scaling capacity。
- Aurora Serverless v2 依負載自動擴縮。
- CloudFront 快取模型與靜態資源，避免所有下載打到 origin。

成本控制：

- 預設本地模型處理。
- 第一版不提供雲端 fallback。
- 未來 fallback 要有每日額度、租戶額度、會員等級額度。
- 針對 IP、device、user、tenant 做 rate limit。
- 未來高級版才開啟更高階 OpenAI 模型或更多 fallback 次數。

### 多租戶與客戶分級

糖錄錄要同時支援小客戶與大客戶，所以後端應從第一天就有 tenant 概念。

基本資料模型：

- user_id
- tenant_id
- subscription_plan
- device_id
- sync_scope
- household_id
- membership_role

小客戶 / 個人版：

- 多租戶共用 API。
- 共用資料庫。
- 用 tenant_id / user_id 做資料隔離。
- 成本最低。

KOL / 社群合作版：

- 可增加 referral_code、partner_id、campaign_id。
- 報表與分潤資料獨立計算。
- 仍使用共用基礎設施。

企業 / 診所 / 大客戶版：

- 可升級為獨立 tenant。
- 可選獨立資料庫、獨立 S3 bucket、獨立 KMS key。
- 可選 dedicated fallback quota。
- 可選資料匯出、管理後台、稽核紀錄。

這樣可以做到：

- 小客戶不用承擔大架構成本。
- 大客戶來時不需要重寫核心架構。
- 隱私、資安、報表與用量控管可以逐步升級。

### 高級版 OpenAI Access

初步仍以 local models 為主。高級版 OpenAI access 先擱置，未來再設計。

高級版會員未來可以支援：

- 更高 fallback 額度。
- 更準確的雲端 STT fallback。
- 更強的雲端 LLM 解析 fallback。
- 回診摘要強化。
- 長文字整理。
- 跨日期趨勢摘要。

安全原則：

- OpenAI API key 不放在手機 App。
- App 只呼叫自家 backend。
- backend 負責 OpenAI request、quota、rate limit、log redaction、成本控管。
- 若未來支援 BYO key，也應存在後端並用 KMS 加密，不直接存在 App。
- 高風險醫療內容仍然不能輸出診斷、調藥或胰島素建議。

## 4. 模型打包與下載策略

使用者希望模型打包進手機，讓使用者可以快速使用：

```text
audio -> text -> llm -> add records
```

建議採取混合策略：

### 內建最小可用模型

App 內建最小可用 STT 與 LLM 模型。

優點：

- 首次安裝後可快速使用。
- 離線也能完成基本紀錄。
- 不完全依賴雲端。

缺點：

- App 體積增加。
- App Store / Play Store 下載與更新成本變高。
- 模型更新可能需要重新發版。

### 首次啟動下載較佳模型

首次啟動或設定頁可提供下載較佳模型。

例如：

- 基礎模型：內建，立即可用。
- 準確模型：使用者同意後下載。
- 高效模型：針對高階手機提供。

這樣可以兼顧：

- 快速啟動
- 可離線
- App 初始體積不爆炸
- 依手機能力分流
- 模型可獨立更新

### 裝置分級

裝置可分成：

- 高階 iPhone / 高階 Android：本地 STT + 本地 LLM。
- 中階手機：小模型為主。
- 舊手機 / 低階 Android：本地小模型嘗試，失敗時走使用者修正或手動輸入；第一版不送雲端 fallback。

### 2022 左右手機支援目標

模型選型應盡量符合 2022 左右的主流手機，而不是只服務最新旗艦機。

初步目標：

- iOS：優先支援 2022 左右仍常見的 iPhone，例如 iPhone 12 / 13 世代以上。
- Android：優先支援 2022 左右中階以上 ARM64 手機。
- RAM：以 4GB 作為最低可嘗試門檻，6GB 以上體驗較穩。
- 儲存空間：基礎模型包要控制在使用者可接受範圍。
- 推論時間：一般一句紀錄應在可接受等待時間內完成。
- 離線：基本紀錄流程可離線完成。

模型策略：

- STT 優先 tiny / base multilingual quantized。
- LLM 優先 0.5B 到 1.5B quantized。
- context window 不追求大，先控制在血糖紀錄場景需要的短上下文。
- output token 限制要小，避免本地生成太慢。
- 先 benchmark，再依裝置能力切換模型。

裝置首次啟動時可做輕量能力檢測：

- RAM 檢查。
- CPU / chipset 粗略分級。
- 是否支援可用加速路徑。
- 小段測試推論耗時。
- 依結果選擇 tiny / base / 較小 LLM / 手動兜底策略。

### 模型版本與回滾

模型不應只靠 App 更新發版。

建議：

- App 內建基礎模型。
- S3 / CloudFront 提供可下載模型。
- 每個模型有 model_id、version、checksum、min_app_version、device_profile。
- 後端可下發推薦模型版本。
- 若新模型出問題，可遠端回滾推薦版本。
- App 端保留上一個可用模型，避免更新失敗後無法使用。

## 5. 核心產品流程

第一版核心流程：

1. 使用者按住錄音。
2. 使用者講一整段話。
3. 放開後結束錄音。
4. 手機端做簡單靜音處理。
5. 本地 STT 將語音轉文字。
6. 顯示轉錄文字給使用者確認。
7. 使用者可修改文字。
8. 本地 LLM 做結構化解析。
9. 規則做 schema validation、欄位正規化與防錯。
10. 顯示整理後的分類卡片。
11. 使用者確認後才儲存到 SQLite。
12. 背景排程同步到雲端。

核心精神：

```text
語音 -> 文字 -> AI 整理 -> 使用者確認 -> 儲存
```

## 6. 本地 LLM 主流程與驗證規則

第一版不要假設有「簡單句」。使用者即使只講「空腹 132」，實際產品仍需要判斷日期、profile、測量情境、單位、是否要補記、是否與前文修正有關。因此主流程統一使用本地 LLM 做結構化。

規則仍然需要，但角色不是取代 LLM，而是做：

- schema validation
- 欄位正規化
- 日期與單位檢查
- 數值合理範圍檢查
- profile_id 檢查
- 輸出 JSON 修復
- confidence 檢查
- 高風險關鍵詞檢查

處理方式：

```text
input text
-> local LLM structured extraction
-> schema validation
-> normalization rules
-> user confirmation
```

若本地模型失敗：

- 顯示可編輯文字。
- 讓使用者重新錄音。
- 讓使用者手動修正欄位。
- 第一版不送雲端 fallback。

### 高風險句

例如：

- 血糖 58，頭暈冒冷汗，不知道怎麼辦。

處理方式：

- 只做紀錄。
- 顯示一般安全提醒。
- 不提供診斷、調藥、胰島素劑量或個人化醫療處置建議。
- 必要時提醒使用者聯絡醫療人員或緊急服務。

## 7. 錄音互動

第一版建議採用：

按住錄音，放開送出。

原因：

- 類似 LINE 語音，直覺。
- 使用者知道正在錄音。
- 降低忘記停止錄音的風險。
- 控制單次錄音長度。
- 降低雲端 fallback 成本與本地處理負擔。

不建議第一版使用：

- 點一下開始錄音，再點一下停止。

因為目標客群包含中老年人，可能忘記停止錄音。

## 8. VAD 與靜音處理

第一版 VAD 不應用來自動結束錄音。

VAD 用途：

- 裁掉開頭明顯空白。
- 裁掉結尾明顯空白。
- 判斷整段是否幾乎無聲。
- 幾乎無聲音檔不進入 STT。
- 中間短暫停頓保留。

錄音結束條件：

- 使用者放開手。
- 達到單次最大時間。

不要因為使用者中間想一下、停幾秒，就提早結束錄音。

## 9. 錄音限制與成本控制

即使採本地 AI，也仍然需要錄音限制。

原因：

- 防止誤用。
- 控制本地運算耗電。
- 避免長音檔造成等待過久。
- 降低 fallback 雲端成本。

建議：

- 單次錄音上限：45 到 60 秒。
- 試用戶每日語音上限：3 到 5 分鐘。
- 付費用戶每日語音上限：5 到 10 分鐘。

首頁不主動顯示完整剩餘語音額度。

建議策略：

- 平常不顯示剩餘時間。
- 接近上限才提醒。
- 達上限後提示改用文字輸入。

這樣不會把額度變成使用目標，也能避免誘導過度使用。

## 10. 使用者確認流程

每次語音或文字輸入後，不直接存入。

### 第一段：轉錄確認

顯示：

```text
我聽到的是：
今天早上空腹血糖 138，早餐吃蛋餅，下午走路 30 分鐘。
```

使用者可選：

- 修改文字
- 重新錄音
- 下一步整理

### 第二段：AI 整理確認

顯示分類卡片：

- 血糖：早上空腹 138
- 飲食：早餐，蛋餅
- 運動：下午走路 30 分鐘
- 用藥：若有則列出
- 日期：今天 / 指定日期

使用者可選：

- 修改
- 確認儲存

這個流程可降低 AI 誤判風險，也讓使用者知道資料不是被偷偷自動寫入。

## 11. JSON 輸出格式草案

本地 LLM 不應自由發揮，必須輸出固定格式 JSON。

草案：

```json
{
  "records": [
    {
      "type": "glucose",
      "date": "2026-04-30",
      "time_hint": "morning",
      "meal_timing": "fasting",
      "glucose_value": 138,
      "unit": "mg/dL",
      "source_text": "今天早上空腹血糖 138",
      "confidence": 0.92
    },
    {
      "type": "meal",
      "date": "2026-04-30",
      "meal_type": "breakfast",
      "food_items": ["蛋餅", "無糖豆漿"],
      "source_text": "早餐吃蛋餅跟無糖豆漿",
      "confidence": 0.86
    }
  ],
  "needs_user_confirmation": true,
  "warnings": []
}
```

第一版紀錄類型：

- glucose
- meal
- exercise
- medication
- note

第一版資料模型需預留擴充類型：

- blood_pressure
- weight
- body_fat
- lab_result
- cgm_reading
- symptom
- lifestyle
- sleep
- report
- care_team_access
- device_sync

這些不一定都要在第一版做到完整 UX，但 schema、sync、report、permission 設計不可封死，避免未來接近智抗糖功能範圍時重寫。

## 12. 內建模型操作說明文件

使用者希望模型內建一個 md，讓模型能依照固定步驟完成事件操作。

建議做法：

- 在 App asset 內放一份 `local_model_playbook.md`。
- 內容包含任務定義、欄位說明、抽取規則、日期規則、風險規則、輸出 JSON schema。
- 本地 LLM 每次解析時載入精簡版 system instruction。
- AI 輸出規範與 chain-of-thought 限制以根目錄 `skills.md` 為準。

`local_model_playbook.md` 應包含：

- 角色：只做健康紀錄整理，不做醫療建議。
- 輸入：使用者修改後文字、目前日期、語言、使用者時區。
- 輸出：固定 JSON。
- 日期解析優先級。
- 血糖數值規則。
- 飲食、運動、用藥關鍵詞。
- 修正語句處理，例如「不是 132，是 152」。
- 低信心處理。
- 高風險內容處理。
- 不可輸出項目，例如診斷、調藥、胰島素建議。

輸出可包含：

```json
{
  "records": [],
  "needs_user_confirmation": true,
  "decision_trace": [
    "偵測到日期詞：今天",
    "偵測到血糖值：138",
    "偵測到餐別：空腹"
  ],
  "warnings": []
}
```

## 13. SQLite 資料表方向

第一版建議資料表：

- entries
- glucose_records
- meal_records
- exercise_records
- medication_records
- lifestyle_records
- generic_health_records
- reports
- report_templates
- report_exports
- sync_jobs

### entries

用途：

- 一次語音或文字輸入的原始事件。
- 保存原始文字、轉錄文字、解析狀態、使用者確認狀態。

### glucose_records

用途：

- 血糖數值紀錄。
- 包含日期、時間提示、飯前飯後、血糖值、單位。

### meal_records

用途：

- 飲食紀錄。
- 包含餐別、食物項目、備註。

### exercise_records

用途：

- 運動紀錄。
- 包含運動類型、時間長度、強度提示。

### medication_records

用途：

- 用藥紀錄。
- 只記錄使用者說了什麼藥與時間。
- 不提供調藥建議。

### lifestyle_records

用途：

- 生活型態紀錄。
- 可放睡眠、壓力、症狀、喝酒、抽菸、作息、特殊事件。
- 第一版可先用簡單 note + tags，後續再拆細。

### generic_health_records

用途：

- 預留血壓、體重、體脂、檢驗值、CGM 等資料類型。
- 在特定表成熟前，先用 type + JSON payload 保存。
- 後續可逐步 migrate 到專用表。

### reports / report_templates / report_exports

用途：

- 報告功能 MVP 必做，但底層要抽象化。
- reports 保存一次報告生成結果與 metadata。
- report_templates 定義報告版型。
- report_exports 保存 PDF / 分享連結 / 匯出狀態。

### sync_jobs

用途：

- 管理本機資料同步狀態。
- 離線時先排隊，網路恢復後同步。

## 14. 首頁 UX 方向

首頁要像 Google 一樣簡單。

首頁核心元素：

- App 名稱：糖錄錄
- 右上角功能選單
- 一句提示：可以說今天、昨天或指定日期，AI 會幫你整理。
- 大型錄音按鈕：按住說話
- 小字提示：放開即結束
- 文字輸入框：也可以直接輸入
- 整理按鈕
- 範例句
- 今日已記錄幾筆

首頁不放：

- 複雜圖表
- 一堆功能入口
- 長篇說明
- 過度醫療化內容

首頁精神：

用說的記，不用找功能。

### 趨勢視覺化與報告

首頁保持簡單，但產品必須有足夠好的視覺化與報告體驗，否則使用者會覺得只是語音輸入工具。

趨勢與報告集中在獨立頁面：

- 7 / 14 / 30 天血糖趨勢。
- 空腹、飯前、飯後、睡前分組。
- 飲食、運動、用藥事件標記。
- 每日紀錄熱度。
- 期間報告。
- PDF 匯出。
- 授權分享連結。

設計原則：

- 首頁簡單。
- 趨勢頁清楚。
- 報告頁美觀。
- 不做醫療診斷。
- 不用圖表製造焦慮。

詳細內容見：

- `ai_context/ux_visualization_report.md`

報告功能要從 MVP 就做，但第一版可以簡單。工程上要抽象化為：

- data providers：提供血糖、飲食、運動、用藥、生活型態等資料。
- metrics calculators：計算平均、最高、最低、記錄天數、分組統計。
- report templates：控制 App 內報告、PDF、醫師版、使用者版。
- renderers：App view、PDF、分享頁。
- export policies：控制下載、授權、有效期、audit log。

這樣未來新增血壓、體重、CGM、檢驗值、醫院版報告時，不需要重寫整個報告系統。

## 15. 右上角功能選單

進階功能收在右上角。

可做成大圖示九宮格，不做一長串小字。

可能功能：

- 今日紀錄
- 歷史紀錄
- 血糖趨勢
- 回診摘要
- 飲食紀錄
- 運動紀錄
- 用藥紀錄
- 提醒設定
- 訂閱方案
- 使用教學
- 個人設定

設計原則：

- 圖示大
- 字少
- 容易點
- 想探索的人再進去
- 不干擾首頁主功能

## 16. 日期與補記

語音與文字都要支援自然語言日期。

使用者可以說：

- 今天早上空腹血糖 138。
- 昨天晚餐後兩小時血糖 168。
- 前天中午吃便當，飯後走路 20 分鐘。
- 4 月 18 號早上空腹 150。
- 上週三晚餐後血糖 170。

系統要解析：

- 今天
- 昨天
- 前天
- 指定日期
- 上週幾
- 早上 / 中午 / 晚上
- 飯前 / 飯後 / 睡前

日期解析後一定要給使用者確認。

## 17. 醫療與法規邊界

糖錄錄 MVP 應定位為：

- 健康紀錄工具
- 生活管理工具
- 回診摘要輔助工具

可以做：

- 血糖紀錄
- 飲食紀錄
- 運動紀錄
- 用藥紀錄
- 趨勢整理
- 回診摘要
- 一般生活觀察

避免做：

- 診斷病情
- 建議調藥
- 建議胰島素劑量
- 判斷是否需要就醫
- 個人化醫療處置
- 宣稱取代醫師

高風險內容只做安全提醒與就醫建議，不做具體醫療指令。

### HIPAA 導向安全要求

若未來支援醫院、診所、醫師存取或美國市場，系統需要以 HIPAA 導向方式設計。

核心要求：

- local DB 加密，SQLite 使用 encrypted SQLite。
- FaceID / 指紋保護敏感頁面。
- token 不存 plaintext。
- 敏感頁面防截圖或背景遮罩。
- PHI 不傳給非 HIPAA compliant API。
- 不把健康資料寫入一般 analytics、debug log、crash log。
- server side sync 要檢查資料差異並確保正確。
- backend 需要 encryption、access control、authentication、audit log、data integrity、backup & recovery。
- CI/CD security gate 以根目錄 `skills.md` 與 `ai_context/security_compliance.md` 為準。

醫院 / 醫師存取應採使用者授權模型：

- 使用者產生單次授權。
- 限定資料範圍。
- 限定有效時間。
- 預設只讀。
- 可隨時撤銷。
- 每次存取寫入 audit log。

詳細內容見：

- `ai_context/security_compliance.md`

目前目標市場明確包含美國與台灣，因此 HIPAA 等級安全架構從 MVP 就要打底；台灣市場也應用同樣的資安基準處理個人健康資料。

## 18. 商業策略與工程的關聯

商業方向暫定：

- 不做長期免費版。
- 採 7 天全功能免費試用。
- 試用後自動轉年費。
- 年費暫估 NT$1,490，可測 NT$1,290。
- 主要靠 KOL / YouTuber 導流。
- 需要預留家庭共享方案。

工程上因此要注意：

- 第一版試用期間不提供雲端 fallback；未來若開放，成本要可控。
- 本地模型優先可以降低長期免費或試用濫用風險。
- 訂閱驗證必須穩定。
- 需記錄模型失敗率、本地處理時間、使用者修正率。
- 不要把首頁語音額度設計成誘導使用者用滿。
- 高級版會員未來可作為 OpenAI fallback 與強化摘要的付費升級點。
- 大客戶未來可用 tenant tier、fallback quota、資料隔離層級做差異化收費。
- 家庭共享要抽象化，不要把人數、價格、權限寫死在程式碼。

### 家庭共享訂閱

家庭共享方案的目標：

- 讓家人可以幫長輩管理健康紀錄。
- 增加留存與黏著度。
- 讓訂閱價值從單人工具擴成家庭照護工具。

抽象概念：

- account：登入身份。
- user_profile：健康資料主體。
- household：家庭群組。
- membership：某個 account 在 household 中的角色。
- subscription: 付費權益。
- entitlement：實際可用功能。
- care_permission：健康資料存取權限。
- profile_membership：某個 account 對某個 user_profile 的記錄或讀取權限。

角色範例：

- owner：付款者 / 家庭方案管理者。
- patient：健康資料主體。
- caregiver：家人照護者。
- viewer：只讀成員。
- child_account：受管理成員。

權限原則：

- 家庭方案只共享訂閱權益，不共享健康資料。
- 家庭資料預設不共享。
- 每個健康資料主體都要能控制授權範圍。
- 預設最小權限。
- 敏感資料存取要 audit log。
- 家庭方案與醫師授權要分開，不混用。

手機端 profile 切換：

- 一個 account 可有多個 user_profile。
- 使用者可快速切換「自己」與「被照顧者」。
- 常見情境是子女幫老人記錄、父母幫小孩記錄、照護者同時管理自己與被照顧者。
- 首頁、錄音、儲存確認、趨勢、報告都必須明確顯示 active profile。
- 每筆紀錄必須寫入 profile_id，避免記到錯的人。
- 儲存前確認卡片要顯示「儲存到：某某」。

詳細內容見：

- `ai_context/subscription_family_model.md`

## 19. MVP 不做事項

第一版不建議做：

- 醫療院所後台
- 胰島素劑量建議
- 用藥調整建議
- 複雜社群功能
- 長期免費版
- 對所有舊 Android 保證本地模型流暢
- 一開始就為每個客戶建獨立雲端環境
- 把 OpenAI key 直接放進 App
- 把完整 chain-of-thought 顯示或保存

說明：

- 智抗糖有的能力長期都要納入規劃。
- MVP 不做完整成熟版本，不代表資料模型與架構不預留。
- CGM、拍照食物辨識、完整營養素估算、醫療院所後台可放後續階段。

第一版要先驗證：

- 使用者是否願意用語音記錄血糖。
- 本地 STT 中文辨識是否夠用。
- 本地 LLM 是否能穩定拆出紀錄。
- 使用者確認流程是否順。
- KOL 導流後是否能轉付費。
- 2022 左右手機是否能接受本地 STT + 本地 LLM 的速度。
- 本地模型失敗率與使用者修正率是否足夠低，能支撐 retention。

## 20. 下一步文件

建議接著產出：

1. MVP 功能範圍文件
2. JSON schema 詳細版
3. SQLite schema 詳細版
4. 本地模型分流規則
5. 未來雲端 fallback API 設計
6. 首頁 UI/UX wireframe 說明
7. 成本模型試算表
8. KOL 合作與試用轉訂閱流程
9. AWS IaC / CI/CD 設計稿
10. local_model_playbook.md
11. 2022 手機模型 benchmark 計畫
12. UX visualization / report 設計稿
13. Security / HIPAA compliance 設計稿

## 21. 相關產品規劃文件

目前已建立：

- `ai_context/ENGINEERING_BLUEPRINT_V1.md`：MVP 必做架構、未來擴充架構、頁面功能樹與 blueprint tasks。
- `ai_context/UI_UX_SPEC.md`：完整 UI / UX 設計系統、頁面規格、navigation、動畫與實作 guardrails。
- `ai_context/MINIMAL_PRODUCTION_STACK.md`：最小 self-hosted Docker Compose production stack、安全清單、備份、token 最佳化與 Kubernetes 遷移路徑。
- `ai_context/PRODUCTION_GRADE_DESIGN_AUDIT.md`：production-grade 設計審查、已修風險、剩餘風險與擴展建議。
- `ai_context/PRODUCTION_DEPLOYMENT_ARCHITECTURE.md`：Kubernetes、自動擴展、managed database、Redis、CI/CD、observability 與 security 部署藍圖。
- `ai_context/competitor_health2sync_reference.md`：智抗糖 / Health2Sync 競品參考。
- `ai_context/product_planning_questions.md`：產品規劃問題紀錄。
- `ai_context/long_term_product_roadmap.md`：從血糖控制到醫療平台的長期路線。
- `ai_context/ux_visualization_report.md`：趨勢圖、報告與醫師分享 UX。
- `ai_context/security_compliance.md`：安全、同步與 HIPAA 導向架構。
- `ai_context/subscription_family_model.md`：訂閱、權益與家庭共享抽象模型。
- `ai_context/efficiency_cost_strategy.md`：效率與雲端成本策略。
- `skills.md`：AI / engineering 執行總規範，其他文件若衝突以此為準。
- `ai_context/PRODUCTION_AI_INSTRUCTIONS.md`：薄引用文件，供需要固定檔名的 AI 工具讀取。
- `ai_context/MASTER_ROADMAP.md`：整理後的總 roadmap。
- `ai_context/IMPLEMENTATION_PLAN.md`：工程 implementation plan。
- `ai_context/TASK_QUEUE.md`：一個接一個執行的任務隊列。
- `ai_context/DOCKER_DEV_PLAN.md`：Docker-first 本地開發與一行啟動計畫。

