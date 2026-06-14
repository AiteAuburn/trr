# 糖錄錄訂閱與家庭共享抽象模型

## 1. 設計目標

訂閱機制需要能支援：

- 個人訂閱。
- 家庭共享訂閱。
- 高級版 OpenAI access。
- KOL / 推薦碼方案。
- 未來 B2B2C 診所或企業方案。
- 未來價格、人數、權限調整時不用大改資料模型。

核心原則：

- plan 不等於 entitlement。
- household 不等於資料共享。
- 家庭資料預設不共享。
- 付款者不一定是健康資料本人。
- 家庭成員可以有不同權限。
- 健康資料授權要獨立於訂閱權益。
- 手機端要能快速切換 user_profile，方便照護者幫小孩或長輩記錄。

## 2. 核心概念

### account

登入身份。

可能是：

- 使用者本人
- 家人
- 照護者
- 醫師
- 診所管理者

### user_profile

健康資料主體。

例：

- 媽媽的血糖資料
- 爸爸的血壓資料
- 使用者自己的體重資料

一個 account 可以擁有多個 user_profile，例如子女幫父母記錄。

手機端所有紀錄都必須綁定目前選取的 active_profile_id，避免照護者幫別人記錄時寫到自己的資料。

### household

家庭群組。

用途：

- 管理家庭方案。
- 管理家庭成員。
- 管理照護關係。

### household_membership

account 在 household 中的角色。

角色範例：

- owner
- admin
- caregiver
- viewer
- patient

### subscription

付費訂閱本體。

欄位不應寫死人數與功能，而是連到 plan 與 entitlement。

### plan

商業方案。

例：

- individual_basic
- individual_premium
- family_basic
- family_premium
- clinic_starter
- clinic_pro

### entitlement

實際權益。

例：

- local_ai_parse
- cloud_fallback_quota
- openai_premium_access
- pdf_report_export
- family_member_slots
- caregiver_view
- doctor_share_link
- device_sync
- lab_report_scan

### care_permission

健康資料存取授權。

訂閱有家庭共享，不代表自動可以看所有家人的 PHI。資料存取必須由 care_permission 控制。

### managed_profile

由某個 account 協助管理的 user_profile。

常見情境：

- 子女幫老人記錄血糖與用藥。
- 父母幫小孩記錄健康資料。
- 照護者同時管理自己的資料與被照顧者資料。

managed_profile 的重點是「可快速切換紀錄對象」，不是「家庭成員互看資料」。

## 3. 建議資料表

```text
accounts
user_profiles
households
household_memberships
plans
subscriptions
subscription_items
entitlements
plan_entitlements
account_entitlements
care_permissions
profile_memberships
usage_counters
referral_codes
billing_events
```

## 4. 權益判斷流程

App 或 backend 判斷功能是否可用時，不直接看 plan name。

流程：

```text
account
-> active subscription
-> plan_entitlements
-> account_entitlements override
-> usage counters
-> feature allowed / denied
```

範例：

```text
使用者要產生 PDF 報告
-> 檢查 pdf_report_export entitlement
-> 檢查本月匯出次數
-> 檢查報告資料權限
-> 允許或拒絕
```

## 5. 家庭共享權限模型

家庭共享分成兩件事，必須嚴格分開：

### 訂閱權益共享，可以共享

例如：

- 家庭成員可使用本地 AI。
- 家庭成員可產生基本報告。
- 家庭方案共享雲端同步。

### 健康資料，不預設共享

家庭方案不代表可以看到其他成員資料。

若要讓照護者幫被照顧者記錄，不是開放整個家庭資料共享，而是建立特定 user_profile 的 profile_membership / care_permission。

可允許的照護情境：

- 女兒可以替媽媽新增血糖紀錄。
- 父母可以替小孩新增健康紀錄。
- 照護者可以在手機端切換到被照顧者 profile 記錄。

仍需限制：

- 不自動讓所有家庭成員看到資料。
- 不自動產生家庭總覽健康頁。
- 不自動分享報告。
- 每個 profile 的讀取、寫入、匯出都要有權限控制。

## 6. 手機端快速切換 Profile

目標：

- 一個登入 account 可以快速切換「我自己」與「我照顧的人」。
- 適合子女照顧老人、父母照顧小孩、照護者同時管理多個 profile。
- 避免每次記錄都重新登入。

UX 建議：

- 首頁頂部顯示目前 active profile，例如「正在記錄：媽媽」。
- 點擊 profile chip 可切換使用者。
- 錄音按鈕附近要明確顯示目前記錄對象。
- 切換後首頁、趨勢、報告都讀取該 profile 的資料。
- 敏感頁面切換 profile 時可要求 biometric auth。
- 長時間閒置後回到預設 profile 或要求確認 active profile。

防錯設計：

- 儲存前確認卡片顯示「儲存到：媽媽」。
- 若偵測語音中出現「我媽」、「我爸」、「小孩」等字眼，可提醒是否切換 profile。
- 最近一次記錄對象與目前 profile 不同時，顯示輕量提醒。
- 每筆 entries / records 都必須寫入 profile_id。

本地資料：

- encrypted SQLite 中所有健康資料都帶 profile_id。
- active_profile_id 存在安全但可快速讀取的位置。
- 不同 profile 的報告、趨勢、sync status 分開。

同步：

- server sync 以 profile_id 為資料主體。
- 同一 account 可同步多個有權限的 profile。
- 權限撤銷後，App 要停止同步該 profile，並依政策刪除或封存本機資料。

## 7. profile_membership 範例

```json
{
  "profile_id": "profile_mom",
  "account_id": "acct_daughter",
  "role": "caregiver",
  "permissions": ["record:create", "record:read_own_created", "report:create"],
  "created_by": "profile_mom",
  "expires_at": null,
  "revoked_at": null
}
```

權限設計可分層：

- record:create：可以新增紀錄。
- record:read_own_created：只能看自己幫忙新增的紀錄。
- record:read_all：可看該 profile 全部紀錄。
- report:create：可產生報告。
- report:share：可分享報告。
- permission:manage：可管理 profile 權限。

## 8. care_permission 範例

```json
{
  "permission_id": "perm_123",
  "profile_id": "profile_mom",
  "grantee_account_id": "acct_daughter",
  "scope": ["glucose:read", "meal:read", "medication:write"],
  "date_range": {
    "from": "2026-01-01",
    "to": null
  },
  "expires_at": null,
  "revoked_at": null,
  "created_by": "profile_mom",
  "audit_required": true
}
```

## 9. 家庭方案可調參數

不要寫死在程式碼，應放在 plan config：

- household_member_limit
- managed_profile_limit
- caregiver_limit
- cloud_fallback_quota
- report_export_quota
- device_sync_enabled
- openai_access_enabled
- doctor_share_enabled
- lab_scan_quota
- managed_profile_limit
- profile_switch_enabled

## 10. 高級版 OpenAI Access

高級版可以作為 entitlement：

```text
openai_premium_access
```

可能包含：

- 更高 fallback 額度。
- 複雜語句解析。
- 回診摘要。
- 長期趨勢解讀。
- 醫師版報告。
- 飲食血糖關聯分析。

限制：

- PHI 只能傳到已簽 BAA 且符合合規設定的 API。
- OpenAI key 不放 App。
- backend 代理與記錄 audit log。

## 11. Retention 設計方向

家庭共享提高 retention 的方式：

- 家人協助長輩記錄。
- 家人收到摘要，不需要每天打開 App。
- 異常值提醒。
- 每週家庭健康摘要。
- 回診前提醒產生報告。
- 家人協助訂閱續費。

但要避免：

- 家庭成員過度監控造成壓力。
- 未經授權看到 PHI。
- 分享權限太複雜導致中老年人不會用。
- 快速切換 profile 時誤記到錯的人。

## 12. MVP 建議

第一版可以先做抽象資料模型，不一定完整開放家庭方案。

MVP 可做：

- plans / subscriptions / entitlements。
- household / household_membership。
- care_permission 基礎表。
- user_profiles / profile_memberships。
- active profile 概念。
- 個人方案與家庭方案都能被資料模型表示。

第一版 UI 可先做：

- 個人訂閱。
- 家庭方案預留，不一定公開。
- 手機端快速切換 profile。
- 家人協助記錄可做 invite beta。
