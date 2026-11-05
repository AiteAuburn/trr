# 訂閱、權益與家庭共享

文件定位：訂閱與權益的現況，以及家庭／照護者模型（取代 subscription_family_model、SUBSCRIPTION_ENTITLEMENT_SCHEMA）。語音額度細節見 `VOICE_INPUT.md`；資料授權見 `PERMISSIONS_AND_RECORD_SCHEMA.md`。

## 1. 核心原則

- plan ≠ entitlement：程式只讀 entitlement，不依方案名稱分支。
- 訂閱權益共享 ≠ 健康資料共享。家庭方案不代表能看到其他成員的資料。
- 付款者不一定是健康資料本人；每筆紀錄都綁 `profile_id`。
- 健康資料授權一律走 `profile_access_grants`，與訂閱無關。

## 2. 目前實作

| 資料表 | 用途 |
|---|---|
| `plans` | 方案定義 |
| `plan_entitlements` | 方案權益與上限（`value_json`） |
| `subscriptions` | 帳號層級訂閱：狀態、試用起訖、取消、推薦碼、保留早鳥價 |
| `usage_counters` | 帳號層級用量，依 key 與期間（`uq_usage_counter_account_key_period`） |

預設方案（`services/entitlements.py` 的 `ensure_default_plans`，第一次使用時建立）：

| code | 名稱 | 價格 | `voice.daily_seconds` |
|---|---|---|---|
| `trial` | 7 天免費試用 | 0 | 300 |
| `annual` | 年費方案 | 1490 TWD（存為 149000 cents） | 600 |

行為與缺口：

- 沒有訂閱的帳號會自動建立 7 天試用。
- **試用到期沒有強制**：查詢只看 `trialing` / `active`，不檢查 `trial_ends_at`。
- 沒有金流供應商、webhook、升降級流程；App 的方案頁只是展示。
- 唯一的 entitlement 是 `voice.daily_seconds`。
- API：`GET /subscriptions/voice-quota`。

## 3. 家庭與照護者模型

現況：

- 一個 `account` 可以擁有多個 `user_profiles`（自己、家人），手機可以切換 active profile。
- `profile_access_grants` 讓另一個帳號取得特定 profile 的 scope（`profile:read`、`profile:write`、`profile:export`、`profile:share`），可設期限、可撤銷，grant type 為 caregiver / doctor / share。
- 沒有 household、household_membership、家庭方案資料表；家庭共享訂閱尚未實作。

設計方向（未實作）：

- 家庭方案共享的是權益（語音額度、報告、同步），不是健康資料。
- 照護者幫家人記錄：建立該 profile 的 grant，而不是開放整個家庭的資料。
- 不自動產生家庭總覽健康頁，不自動分享報告。
- 防止記錯人：確認頁顯示「儲存到：媽媽」；最近一次記錄對象與目前 profile 不同時給輕量提醒。
- 可調參數放 plan config，不寫死：成員上限、受管 profile 上限、照護者上限、報告匯出額度、醫師分享開關等。
- 家庭方案第一版先做隱藏方案（舊決定）。

## 4. 未決

- 付費主軸、金流供應商、試用到期後的行為（`PRODUCT_ROADMAP.md` D7）。
- 高級版雲端 AI 是否成為 entitlement（雲端解析本身依 `PRODUCT_ROADMAP.md` D1 已決定）。
