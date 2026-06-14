# 糖錄錄 Master Roadmap

文件定位：本文件描述產品長期路線。AI / engineering 執行規範以根目錄 `skills.md` 為準。

MVP 必做架構、未來擴充架構、頁面功能樹與 task 對齊見 `ai_context/ENGINEERING_BLUEPRINT_V1.md`。

正式環境 Kubernetes / autoscaling / managed database / CI/CD 架構見 `ai_context/PRODUCTION_DEPLOYMENT_ARCHITECTURE.md`。

## 1. 北極星

糖錄錄長期要做成：

慢病管理平台 + 個人健康資料平台。

第一個切入點是：

使用者用語音、拍照或自動同步，以最少操作完成血糖、飲食、運動、用藥與生活型態紀錄，並產生可理解、可分享、可回診使用的趨勢與報告。

## 2. 最大產品原則

```text
能自動就自動
能拍照就拍照
能語音就語音
手動輸入只做兜底
```

所有功能都要服務：

- 簡單操作
- 長期 retention
- 使用黏著度
- 本地優先
- 低雲端成本
- 可合規擴展

## 3. 技術北極星

第一版：

- 本地 STT
- 本地 LLM
- 本地 SQLite
- 無雲端 AI fallback
- 原始音檔不保存
- 飲食拍照先辨識成文字，再送本地 LLM
- 本地處理等待時間目標 5 到 10 秒

雲端只做：

- auth
- subscription
- sync
- backup
- report sharing
- audit log
- model versioning
- CI/CD

## 4. Phase 0：開發基礎設施

目標：

讓專案可以一行啟 backend、一行啟 web 模擬前端，並具備 production-grade 的 CI/CD 基礎。

交付：

- monorepo skeleton
- Docker Compose
- backend service
- web service
- database service
- local env template
- health check
- lint / typecheck / test command
- GitHub Actions pipeline
- security scan baseline

目標命令：

```bash
docker compose up backend
docker compose up web
```

或：

```bash
make backend
make web
```

## 5. Phase 1：MVP Core

目標：

先做可用的核心紀錄產品，不先做完整平台。

交付：

- account / auth 基礎
- active profile switching
- blood glucose record
- meal record
- medication record
- exercise record
- lifestyle note
- local-first record flow mock
- user confirmation before save
- basic report
- basic trend
- sync API skeleton
- encrypted local DB 設計文件

Web 模擬前端先支援：

- 登入 mock
- profile 切換
- 文字輸入模擬語音轉錄結果
- AI parse mock / local parser placeholder
- 確認儲存
- 今日紀錄
- 基本報告

## 6. Phase 2：Local AI Pipeline

目標：

把 MVP mock parser 換成本地 AI 流程。

交付：

- local STT integration plan
- local LLM integration plan
- JSON schema constrained output
- local_model_playbook integration
- model benchmark harness
- 2022 phone benchmark plan
- local failure handling
- no raw audio persistence

Web 模擬：

- 先用文字輸入替代 audio
- food photo OCR / vision 先用 placeholder
- 保留同一個 parse contract

## 7. Phase 3：Report Engine

目標：

報告 MVP 必做，但底層抽象化，未來血壓、體重、檢驗值、CGM 都能接。

交付：

- report data providers
- metrics calculators
- report templates
- app/web renderer
- PDF renderer interface
- report export policy
- no persistent PDF by default
- audit event hooks

## 8. Phase 4：Sync、Security、Subscription

目標：

建立可上線的帳號、同步、訂閱、家庭隱藏方案與安全基礎。

交付：

- sync_jobs
- mutation queue
- conflict detection
- household / entitlement / subscription schema
- hidden family plan
- profile_membership
- care_permission
- audit log
- log redaction
- secret management
- backup / restore test

## 9. Phase 5：Staging / Production

目標：

建立能部署、能回滾、能掃描、能隔離環境的 production-grade workflow。

交付：

- dev / staging / production config
- separate DB / bucket / keys
- Docker image build
- staging deploy
- smoke test
- manual approval
- production deploy
- rollback
- blue-green or canary design
- feature flags

## 10. Phase 6：Mobile App

目標：

把 web 模擬流程遷移到 React Native + Expo Prebuild。

交付：

- Expo app shell
- push-to-talk recording
- local STT integration
- local LLM integration
- encrypted SQLite
- biometric auth
- screenshot protection
- profile switcher
- offline mode
- sync after reconnect

## 11. Phase 7：Platform Expansion

目標：

補齊智抗糖已有能力，並往慢病管理與個人健康資料平台前進。

交付方向：

- blood pressure
- weight
- lab results
- CGM
- Apple Health / Health Connect
- device sync
- doctor sharing
- clinic portal
- FHIR-compatible model
- B2B2C partner workflows
